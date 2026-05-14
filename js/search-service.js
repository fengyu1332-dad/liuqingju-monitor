const SearchService = {
    debounceTimers: {},
    searchCache: new Map(),
    CACHE_EXPIRY: 5 * 60 * 1000,

    matchKeyword(text, keyword) {
        if (!text || !keyword) return false;
        const textLower = String(text).toLowerCase();
        const keywordLower = String(keyword).toLowerCase();
        return textLower.includes(keywordLower);
    },

    calculateRelevanceScore(item, keyword) {
        const kw = keyword.toLowerCase();
        let score = 0;
        const title = (item.title || '').toLowerCase();
        const desc = (item.description || '').toLowerCase();

        if (title === kw) score += 100;
        if (title.startsWith(kw)) score += 50;
        if (title.includes(kw)) score += 30;
        
        const words = kw.split(/\s+/);
        words.forEach(word => {
            if (word.length > 1) {
                if (title.includes(word)) score += 15;
                if (desc.includes(word)) score += 10;
            }
        });

        if (item.stats) {
            score += Math.log((item.stats.views || 0) + 1) * 2;
            score += Math.log((item.stats.likes || 0) + 1) * 3;
            score += Math.log((item.stats.downloads || 0) + 1) * 2;
        }

        return score;
    },

    searchUsers(keyword) {
        const users = AuthService.getUsers();
        const currentUser = AuthService.getCurrentUser();
        
        return users.filter(user => {
            if (currentUser && user.id === currentUser.id) return false;
            
            return (
                this.matchKeyword(user.nickname, keyword) ||
                this.matchKeyword(user.email, keyword) ||
                this.matchKeyword(user.bio, keyword) ||
                (user.tags && user.tags.some(tag => this.matchKeyword(tag, keyword)))
            );
        }).map(user => ({
            type: 'user',
            id: user.id,
            title: user.nickname,
            subtitle: user.email,
            description: user.bio,
            avatar: user.avatar,
            data: user
        }));
    },

    searchPosts(keyword) {
        const posts = ForumService.getPosts();
        
        return posts.filter(post => {
            return (
                this.matchKeyword(post.title, keyword) ||
                this.matchKeyword(post.content, keyword) ||
                this.matchKeyword(post.category, keyword) ||
                (post.tags && post.tags.some(tag => this.matchKeyword(tag, keyword))) ||
                (post.author && this.matchKeyword(post.author.nickname, keyword))
            );
        }).map(post => ({
            type: 'post',
            id: post.id,
            title: post.title,
            subtitle: post.category,
            description: post.content.substring(0, 100) + (post.content.length > 100 ? '...' : ''),
            author: post.author,
            stats: {
                views: post.views,
                likes: post.likes,
                replies: post.replies
            },
            data: post
        }));
    },

    searchResources(keyword) {
        const resources = ResourceService.getResources();
        
        return resources.filter(resource => {
            return (
                this.matchKeyword(resource.title, keyword) ||
                this.matchKeyword(resource.description, keyword) ||
                this.matchKeyword(resource.category, keyword) ||
                this.matchKeyword(resource.type, keyword) ||
                (resource.tags && resource.tags.some(tag => this.matchKeyword(tag, keyword))) ||
                (resource.author && this.matchKeyword(resource.author.nickname, keyword))
            );
        }).map(resource => ({
            type: 'resource',
            id: resource.id,
            title: resource.title,
            subtitle: resource.type,
            description: resource.description.substring(0, 100) + (resource.description.length > 100 ? '...' : ''),
            author: resource.author,
            price: resource.price,
            stats: {
                views: resource.views,
                downloads: resource.downloads,
                likes: resource.likes
            },
            data: resource
        }));
    },

    searchBounties(keyword) {
        if (typeof BountyService === 'undefined') {
            console.warn('BountyService not found');
            return [];
        }
        
        const bounties = BountyService.getBounties();
        
        return bounties.filter(bounty => {
            return (
                this.matchKeyword(bounty.title, keyword) ||
                this.matchKeyword(bounty.description, keyword) ||
                this.matchKeyword(bounty.category, keyword) ||
                (bounty.tags && bounty.tags.some(tag => this.matchKeyword(tag, keyword))) ||
                (bounty.author && this.matchKeyword(bounty.author.nickname, keyword))
            );
        }).map(bounty => ({
            type: 'bounty',
            id: bounty.id,
            title: bounty.title,
            subtitle: bounty.reward + ' 积分',
            description: bounty.description.substring(0, 100) + (bounty.description.length > 100 ? '...' : ''),
            author: bounty.author,
            reward: bounty.reward,
            deadline: bounty.deadline,
            status: bounty.status,
            data: bounty
        }));
    },

    searchAll(keyword) {
        if (!keyword || keyword.trim() === '') {
            return {
                users: [],
                posts: [],
                resources: [],
                bounties: [],
                total: 0
            };
        }

        const keywordTrimmed = keyword.trim();
        
        const results = {
            users: this.searchUsers(keywordTrimmed),
            posts: this.searchPosts(keywordTrimmed),
            resources: this.searchResources(keywordTrimmed),
            bounties: this.searchBounties(keywordTrimmed),
            total: 0
        };

        results.total = results.users.length + results.posts.length + 
                       results.resources.length + results.bounties.length;

        return results;
    },

    searchByType(keyword, type) {
        if (!keyword || keyword.trim() === '') {
            return [];
        }

        const keywordTrimmed = keyword.trim();
        
        switch (type) {
            case 'user':
                return this.searchUsers(keywordTrimmed);
            case 'post':
                return this.searchPosts(keywordTrimmed);
            case 'resource':
                return this.searchResources(keywordTrimmed);
            case 'bounty':
                return this.searchBounties(keywordTrimmed);
            case 'all':
            default:
                const allResults = this.searchAll(keywordTrimmed);
                return [
                    ...allResults.users,
                    ...allResults.posts,
                    ...allResults.resources,
                    ...allResults.bounties
                ];
        }
    },

    searchWithDebounce(keyword, callback, delay, type) {
        delay = delay || 300;
        type = type || 'all';
        const key = type + '_' + Date.now();
        
        if (this.debounceTimers[key]) {
            clearTimeout(this.debounceTimers[key]);
        }

        if (!keyword || keyword.trim() === '') {
            if (callback) {
                callback(type === 'all' ? this.searchAll('') : []);
            }
            return;
        }

        const self = this;
        this.debounceTimers[key] = setTimeout(function() {
            const results = type === 'all' 
                ? self.searchAll(keyword) 
                : self.searchByType(keyword, type);
            
            if (callback) {
                callback(results);
            }
            
            delete self.debounceTimers[key];
        }, delay);
    },

    highlightMatches(text, keyword) {
        if (!text || !keyword) return text;
        
        const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp('(' + escaped + ')', 'gi');
        return String(text).replace(regex, '<mark class="search-highlight">$1</mark>');
    },

    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    },

    getTypeLabel(type) {
        const labels = {
            user: '用户',
            post: '帖子',
            resource: '资源',
            bounty: '悬赏'
        };
        return labels[type] || type;
    },

    clearDebounceTimer(key) {
        if (this.debounceTimers[key]) {
            clearTimeout(this.debounceTimers[key]);
            delete this.debounceTimers[key];
        }
    },

    clearAllDebounceTimers() {
        const self = this;
        Object.keys(this.debounceTimers).forEach(function(key) {
            clearTimeout(self.debounceTimers[key]);
        });
        this.debounceTimers = {};
    }
};

window.SearchService = SearchService;
