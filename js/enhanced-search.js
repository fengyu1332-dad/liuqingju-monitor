const SEARCH_HISTORY_KEY = 'liuqingju_search_history';
const HOT_SEARCHES_KEY = 'liuqingju_hot_searches';
const SEARCH_SETTINGS_KEY = 'liuqingju_search_settings';

const MAX_HISTORY_ITEMS = 50;
const MAX_HOT_ITEMS = 10;

const DEFAULT_SEARCH_SETTINGS = {
    enableHistory: true,
    enableSuggestions: true,
    enableHotSearch: true,
    caseSensitive: false,
    fuzzyMatch: true,
    suggestionsLimit: 8,
    historyLimit: 10
};

class SearchHistoryService {
    constructor() {
        this.history = this.loadHistory();
        this.hotSearches = this.loadHotSearches();
        this.settings = this.loadSettings();
    }

    loadHistory() {
        const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
        return stored ? JSON.parse(stored) : [];
    }

    loadHotSearches() {
        const stored = localStorage.getItem(HOT_SEARCHES_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
        return this.getDefaultHotSearches();
    }

    loadSettings() {
        const stored = localStorage.getItem(SEARCH_SETTINGS_KEY);
        return stored ? { ...DEFAULT_SEARCH_SETTINGS, ...JSON.parse(stored) } : { ...DEFAULT_SEARCH_SETTINGS };
    }

    saveHistory() {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(this.history));
    }

    saveHotSearches() {
        localStorage.setItem(HOT_SEARCHES_KEY, JSON.stringify(this.hotSearches));
    }

    saveSettings() {
        localStorage.setItem(SEARCH_SETTINGS_KEY, JSON.stringify(this.settings));
    }

    getDefaultHotSearches() {
        return [
            { keyword: 'IB课程', count: 1234 },
            { keyword: 'AP考试', count: 1156 },
            { keyword: 'SAT备考', count: 987 },
            { keyword: '留学申请', count: 876 },
            { keyword: '申请文书', count: 765 },
            { keyword: '托福备考', count: 654 },
            { keyword: 'A-Level', count: 543 },
            { keyword: 'GRE考试', count: 432 },
            { keyword: 'GMAT备考', count: 321 },
            { keyword: '面试技巧', count: 210 }
        ].map((item, index) => ({
            ...item,
            rank: index + 1,
            trend: 'stable'
        }));
    }

    addToHistory(keyword) {
        if (!keyword || keyword.trim().length === 0) return;

        keyword = keyword.trim();

        this.history = this.history.filter(item => item.keyword !== keyword);

        this.history.unshift({
            keyword,
            timestamp: Date.now(),
            searchCount: 1
        });

        if (this.history.length > MAX_HISTORY_ITEMS) {
            this.history = this.history.slice(0, MAX_HISTORY_ITEMS);
        }

        this.saveHistory();

        this.updateHotSearch(keyword);

        return this.history;
    }

    incrementSearchCount(keyword) {
        const item = this.history.find(h => h.keyword === keyword);
        if (item) {
            item.searchCount++;
            item.timestamp = Date.now();
            this.saveHistory();
        }
    }

    getHistory(limit = null) {
        if (limit) {
            return this.history.slice(0, limit);
        }
        return this.history;
    }

    clearHistory() {
        this.history = [];
        this.saveHistory();
        return true;
    }

    removeFromHistory(keyword) {
        this.history = this.history.filter(item => item.keyword !== keyword);
        this.saveHistory();
        return this.history;
    }

    getHistoryByType(type) {
        return this.history.filter(item => item.type === type);
    }

    updateHotSearch(keyword) {
        const existing = this.hotSearches.find(item => item.keyword === keyword);

        if (existing) {
            existing.count++;
            existing.trend = 'up';
        } else {
            this.hotSearches.push({
                keyword,
                count: 1,
                rank: this.hotSearches.length + 1,
                trend: 'new'
            });
        }

        this.hotSearches.sort((a, b) => b.count - a.count);

        if (this.hotSearches.length > MAX_HOT_ITEMS) {
            this.hotSearches = this.hotSearches.slice(0, MAX_HOT_ITEMS);
        }

        this.hotSearches.forEach((item, index) => {
            item.rank = index + 1;
        });

        this.saveHotSearches();
    }

    getHotSearches(limit = null) {
        if (limit) {
            return this.hotSearches.slice(0, limit);
        }
        return this.hotSearches;
    }

    resetHotSearches() {
        this.hotSearches = this.getDefaultHotSearches();
        this.saveHotSearches();
        return this.hotSearches;
    }

    getSetting(key) {
        return this.settings[key];
    }

    setSetting(key, value) {
        this.settings[key] = value;
        this.saveSettings();
    }

    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.saveSettings();
    }

    resetSettings() {
        this.settings = { ...DEFAULT_SEARCH_SETTINGS };
        this.saveSettings();
    }
}

class SearchSuggestionService {
    constructor() {
        this.debounceTimer = null;
        this.debounceDelay = 300;
    }

    getSuggestions(keyword, options = {}) {
        const {
            limit = 8,
            includeHistory = true,
            includeHot = true,
            includeRelated = true
        } = options;

        const results = {
            history: [],
            hot: [],
            related: [],
            typeahead: []
        };

        if (!keyword || keyword.trim().length === 0) {
            return results;
        }

        const searchService = new SearchHistoryService();
        keyword = keyword.trim().toLowerCase();

        if (includeHistory) {
            const history = searchService.getHistory();
            results.history = history
                .filter(item => item.keyword.toLowerCase().includes(keyword))
                .slice(0, 3)
                .map(item => ({
                    type: 'history',
                    keyword: item.keyword,
                    icon: 'history'
                }));
        }

        if (includeHot) {
            const hot = searchService.getHotSearches();
            results.hot = hot
                .filter(item => item.keyword.toLowerCase().includes(keyword))
                .slice(0, 3)
                .map(item => ({
                    type: 'hot',
                    keyword: item.keyword,
                    icon: 'fire',
                    count: item.count,
                    rank: item.rank
                }));
        }

        if (includeRelated) {
            results.related = this.getRelatedKeywords(keyword, limit);
        }

        results.typeahead = this.getTypeahead(keyword, limit);

        return results;
    }

    getRelatedKeywords(keyword, limit = 5) {
        const commonPatterns = [
            { prefix: 'IB', suffix: ['课程', '考试', '备考', '学校', '成绩'] },
            { prefix: 'AP', suffix: ['课程', '考试', '备考', '科目', '难度'] },
            { prefix: 'SAT', suffix: ['考试', '备考', '阅读', '数学', '写作'] },
            { prefix: '托福', suffix: ['备考', '考试', '词汇', '听力', '口语'] },
            { prefix: '雅思', suffix: ['备考', '考试', '口语', '写作', '听力'] },
            { prefix: '留学', suffix: ['申请', '中介', '费用', '国家', '签证'] },
            { prefix: '申请', suffix: ['文书', '材料', '截止', '时间', '攻略'] },
            { prefix: 'A-Level', suffix: ['课程', '考试', '科目', '申请', '难度'] }
        ];

        const suggestions = [];
        const lowerKeyword = keyword.toLowerCase();

        commonPatterns.forEach(pattern => {
            if (lowerKeyword.includes(pattern.prefix.toLowerCase())) {
                pattern.suffix.forEach(suffix => {
                    const suggestion = pattern.prefix + suffix;
                    if (!suggestions.includes(suggestion)) {
                        suggestions.push(suggestion);
                    }
                });
            }
        });

        const generalSuffixes = ['备考', '考试', '技巧', '攻略', '经验', '资料'];
        generalSuffixes.forEach(suffix => {
            const suggestion = keyword + suffix;
            if (!suggestions.includes(suggestion)) {
                suggestions.push(suggestion);
            }
        });

        return suggestions
            .filter(s => s.toLowerCase().includes(lowerKeyword))
            .slice(0, limit)
            .map(keyword => ({
                type: 'related',
                keyword,
                icon: 'lightbulb'
            }));
    }

    getTypeahead(keyword, limit = 5) {
        const dictionary = [
            'IB课程', 'IB考试', 'IB成绩', 'IB学校',
            'AP课程', 'AP考试', 'AP科目', 'AP备考',
            'SAT考试', 'SAT备考', 'SAT阅读', 'SAT数学',
            '托福考试', '托福备考', '托福词汇', '托福口语',
            '雅思考试', '雅思备考', '雅思口语', '雅思写作',
            'A-Level', 'A-Level课程', 'A-Level考试',
            '留学申请', '留学中介', '留学费用', '留学签证',
            '申请文书', '申请材料', '申请截止日期',
            'GRE考试', 'GMAT备考', 'GRE词汇',
            '面试技巧', '面试问题', '面试准备',
            '学校申请', '大学申请', '研究生申请',
            '推荐信', '个人陈述', '简历'
        ];

        const lowerKeyword = keyword.toLowerCase();

        return dictionary
            .filter(word => word.toLowerCase().startsWith(lowerKeyword))
            .slice(0, limit)
            .map(keyword => ({
                type: 'typeahead',
                keyword,
                icon: 'spell-check'
            }));
    }

    getSuggestionsDebounced(keyword, options, callback) {
        clearTimeout(this.debounceTimer);

        this.debounceTimer = setTimeout(() => {
            const results = this.getSuggestions(keyword, options);
            if (callback) {
                callback(results);
            }
        }, this.debounceDelay);
    }

    highlightMatches(text, keyword) {
        if (!keyword || !text) return text;

        const regex = new RegExp(`(${this.escapeRegex(keyword)})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}

class EnhancedSearchService {
    constructor() {
        this.historyService = new SearchHistoryService();
        this.suggestionService = new SearchSuggestionService();
    }

    search(keyword, options = {}) {
        const {
            types = ['posts', 'resources', 'bounties'],
            sortBy = 'relevance',
            limit = 50,
            offset = 0
        } = options;

        if (keyword) {
            this.historyService.addToHistory(keyword);
        }

        let results = {
            keyword,
            total: 0,
            posts: [],
            resources: [],
            bounties: [],
            users: []
        };

        if (types.includes('posts') && typeof ForumService !== 'undefined') {
            results.posts = ForumService.searchPosts(keyword, { limit, offset });
            results.total += results.posts.length;
        }

        if (types.includes('resources') && typeof ResourceService !== 'undefined') {
            results.resources = ResourceService.searchResources(keyword, { limit, offset });
            results.total += results.resources.length;
        }

        if (types.includes('bounties') && typeof BountyService !== 'undefined') {
            results.bounties = BountyService.searchBounties(keyword, { limit, offset });
            results.total += results.bounties.length;
        }

        if (sortBy === 'relevance') {
            results.posts = this.sortByRelevance(results.posts, keyword);
            results.resources = this.sortByRelevance(results.resources, keyword);
            results.bounties = this.sortByRelevance(results.bounties, keyword);
        } else if (sortBy === 'time') {
            results.posts = this.sortByTime(results.posts);
            results.resources = this.sortByTime(results.resources);
            results.bounties = this.sortByTime(results.bounties);
        } else if (sortBy === 'popularity') {
            results.posts = this.sortByPopularity(results.posts);
            results.resources = this.sortByPopularity(results.resources);
            results.bounties = this.sortByPopularity(results.bounties);
        }

        return results;
    }

    sortByRelevance(items, keyword) {
        const kw = keyword.toLowerCase();

        return items.sort((a, b) => {
            const aTitle = (a.title || '').toLowerCase();
            const bTitle = (b.title || '').toLowerCase();

            const aExact = aTitle === kw ? 100 : 0;
            const bExact = bTitle === kw ? 100 : 0;

            const aStarts = aTitle.startsWith(kw) ? 50 : 0;
            const bStarts = bTitle.startsWith(kw) ? 50 : 0;

            const aContains = aTitle.includes(kw) ? 30 : 0;
            const bContains = bTitle.includes(kw) ? 30 : 0;

            const aScore = aExact + aStarts + aContains;
            const bScore = bExact + bStarts + bContains;

            return bScore - aScore;
        });
    }

    sortByTime(items) {
        return items.sort((a, b) => {
            const aTime = new Date(a.createdAt || 0).getTime();
            const bTime = new Date(b.createdAt || 0).getTime();
            return bTime - aTime;
        });
    }

    sortByPopularity(items) {
        return items.sort((a, b) => {
            const aScore = (a.views || 0) + (a.likes || 0) * 2 + (a.replies || 0) * 3;
            const bScore = (b.views || 0) + (b.likes || 0) * 2 + (b.replies || 0) * 3;
            return bScore - aScore;
        });
    }

    getSuggestions(keyword, options) {
        return this.suggestionService.getSuggestions(keyword, options);
    }

    getHistory(limit) {
        return this.historyService.getHistory(limit);
    }

    clearHistory() {
        return this.historyService.clearHistory();
    }

    getHotSearches(limit) {
        return this.historyService.getHotSearches(limit);
    }
}

window.SearchHistoryService = SearchHistoryService;
window.SearchSuggestionService = SearchSuggestionService;
window.EnhancedSearchService = EnhancedSearchService;
