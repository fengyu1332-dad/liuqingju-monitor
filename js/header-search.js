class HeaderSearch {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.searchBox = null;
        this.searchInput = null;
        this.dropdown = null;
        this.currentType = 'all';
        this.debounceTimer = null;
        this.isExpanded = false;
        this.searchService = null;
        this.suggestionService = null;
        
        this.init();
    }

    init() {
        if (!this.container) return;
        
        if (typeof EnhancedSearchService !== 'undefined') {
            this.searchService = new EnhancedSearchService();
            this.suggestionService = new SearchSuggestionService();
        }
        
        this.createSearchHTML();
        this.cacheElements();
        this.bindEvents();
    }

    createSearchHTML() {
        const searchHTML = `
            <div class="header-search-wrapper">
                <div class="header-search-box" id="search-box">
                    <i class="fas fa-search header-search-icon" id="search-icon"></i>
                    <input type="text" 
                           class="header-search-input" 
                           id="header-search-input"
                           placeholder="搜索帖子、资源、悬赏..."
                           autocomplete="off">
                    <button class="header-search-clear" id="search-clear">
                        <i class="fas fa-times"></i>
                    </button>
                    <div class="search-results-dropdown" id="search-dropdown">
                        <div class="search-dropdown-header">
                            <span class="search-dropdown-title">搜索</span>
                            <button class="search-dropdown-close" id="dropdown-close">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="search-history-section" id="search-history-section" style="display: none;">
                            <div class="search-section-header">
                                <span class="search-section-title">搜索历史</span>
                                <button class="search-section-clear" id="clear-history">
                                    <i class="fas fa-trash"></i> 清空
                                </button>
                            </div>
                            <div class="search-history-list" id="search-history-list"></div>
                        </div>
                        <div class="search-hot-section" id="search-hot-section" style="display: none;">
                            <div class="search-section-header">
                                <span class="search-section-title"><i class="fas fa-fire"></i> 热搜</span>
                            </div>
                            <div class="search-hot-list" id="search-hot-list"></div>
                        </div>
                        <div class="search-suggestions-section" id="search-suggestions-section" style="display: none;">
                            <div class="search-section-header">
                                <span class="search-section-title">搜索建议</span>
                            </div>
                            <div class="search-suggestions-list" id="search-suggestions-list"></div>
                        </div>
                        <div class="search-type-filter" id="search-type-filter">
                            <button class="search-type-btn active" data-type="all">
                                <i class="fas fa-globe"></i> 全部
                            </button>
                            <button class="search-type-btn" data-type="post">
                                <i class="fas fa-comments"></i> 帖子
                            </button>
                            <button class="search-type-btn" data-type="resource">
                                <i class="fas fa-gift"></i> 资源
                            </button>
                            <button class="search-type-btn" data-type="bounty">
                                <i class="fas fa-coins"></i> 悬赏
                            </button>
                        </div>
                        <div class="search-results-list" id="search-results-list">
                            <div class="search-empty-state">
                                <i class="fas fa-search"></i>
                                <p>输入关键词开始搜索</p>
                            </div>
                        </div>
                        <div class="search-dropdown-footer" id="search-dropdown-footer" style="display: none;">
                            <button class="search-view-all" id="view-all-results">
                                查看全部搜索结果
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.container.insertAdjacentHTML('afterbegin', searchHTML);
    }

    cacheElements() {
        this.searchBox = document.getElementById('search-box');
        this.searchInput = document.getElementById('header-search-input');
        this.dropdown = document.getElementById('search-dropdown');
        this.resultsList = document.getElementById('search-results-list');
        this.dropdownFooter = document.getElementById('search-dropdown-footer');
        this.historySection = document.getElementById('search-history-section');
        this.historyList = document.getElementById('search-history-list');
        this.hotSection = document.getElementById('search-hot-section');
        this.hotList = document.getElementById('search-hot-list');
        this.suggestionsSection = document.getElementById('search-suggestions-section');
        this.suggestionsList = document.getElementById('search-suggestions-list');
    }

    bindEvents() {
        const searchIcon = document.getElementById('search-icon');
        const searchClear = document.getElementById('search-clear');
        const dropdownClose = document.getElementById('dropdown-close');
        const viewAllBtn = document.getElementById('view-all-results');
        const typeFilterBtns = document.querySelectorAll('.search-type-btn');
        const clearHistoryBtn = document.getElementById('clear-history');

        searchIcon.addEventListener('click', () => this.toggleSearch());

        this.searchInput.addEventListener('focus', () => {
            if (!this.isExpanded) {
                this.expandSearch();
            }
            this.showInitialState();
        });

        this.searchInput.addEventListener('input', (e) => {
            const value = e.target.value;
            
            searchClear.classList.toggle('visible', value.length > 0);
            
            if (value.trim()) {
                this.hideInitialState();
                this.debounceSearch(value);
            } else {
                this.showInitialState();
            }
        });

        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                if (this.searchInput.value.trim()) {
                    if (this.searchService) {
                        this.searchService.historyService.addToHistory(this.searchInput.value.trim());
                    }
                    this.performSearch(this.searchInput.value.trim());
                }
            } else if (e.key === 'Escape') {
                this.collapseSearch();
                this.hideDropdown();
                this.searchInput.blur();
            }
        });

        searchClear.addEventListener('click', () => {
            this.clearSearch();
        });

        dropdownClose.addEventListener('click', () => {
            this.hideDropdown();
        });

        viewAllBtn?.addEventListener('click', () => {
            this.navigateToSearchPage();
        });

        clearHistoryBtn?.addEventListener('click', () => {
            if (this.searchService) {
                this.searchService.historyService.clearHistory();
                this.showInitialState();
            }
        });

        typeFilterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                this.setSearchType(type);
            });
        });

        document.addEventListener('click', (e) => {
            if (!this.searchBox.contains(e.target)) {
                if (this.isExpanded && !this.searchInput.value.trim()) {
                    this.collapseSearch();
                }
                if (!this.dropdown.contains(e.target)) {
                    this.hideDropdown();
                }
            }
        });
    }

    showInitialState() {
        if (!this.searchService) return;
        
        const history = this.searchService.historyService.getHistory(5);
        const hotSearches = this.searchService.historyService.getHotSearches(5);
        
        if (history.length > 0) {
            this.historySection.style.display = 'block';
            this.historyList.innerHTML = history.map(item => `
                <div class="search-history-item" data-keyword="${item.keyword}">
                    <i class="fas fa-history"></i>
                    <span>${item.keyword}</span>
                </div>
            `).join('');
            
            this.historyList.querySelectorAll('.search-history-item').forEach(item => {
                item.addEventListener('click', () => {
                    this.searchInput.value = item.dataset.keyword;
                    this.performSearch(item.dataset.keyword);
                });
            });
        } else {
            this.historySection.style.display = 'none';
        }
        
        if (hotSearches.length > 0) {
            this.hotSection.style.display = 'block';
            this.hotList.innerHTML = hotSearches.map((item, index) => `
                <div class="search-hot-item ${index < 3 ? 'top' : ''}" data-keyword="${item.keyword}">
                    <span class="hot-rank">${item.rank}</span>
                    <span class="hot-keyword">${item.keyword}</span>
                    <i class="fas fa-arrow-up hot-trend"></i>
                </div>
            `).join('');
            
            this.hotList.querySelectorAll('.search-hot-item').forEach(item => {
                item.addEventListener('click', () => {
                    this.searchInput.value = item.dataset.keyword;
                    if (this.searchService) {
                        this.searchService.historyService.addToHistory(item.dataset.keyword);
                    }
                    this.performSearch(item.dataset.keyword);
                });
            });
        } else {
            this.hotSection.style.display = 'none';
        }
        
        this.suggestionsSection.style.display = 'none';
        this.resultsList.innerHTML = '';
        this.dropdownFooter.style.display = 'none';
        this.showDropdown();
    }

    hideInitialState() {
        if (this.historySection) this.historySection.style.display = 'none';
        if (this.hotSection) this.hotSection.style.display = 'none';
        if (this.suggestionsSection) this.suggestionsSection.style.display = 'none';
    }

    showSuggestions(keyword) {
        if (!this.suggestionService) return;
        
        const suggestions = this.suggestionService.getSuggestions(keyword, {
            includeHistory: false,
            includeHot: false,
            includeRelated: true,
            limit: 6
        });
        
        if (suggestions.related && suggestions.related.length > 0) {
            this.suggestionsSection.style.display = 'block';
            this.suggestionsList.innerHTML = suggestions.related.map(item => `
                <div class="search-suggestion-item" data-keyword="${item.keyword}">
                    <i class="fas fa-lightbulb"></i>
                    <span>${item.keyword}</span>
                </div>
            `).join('');
            
            this.suggestionsList.querySelectorAll('.search-suggestion-item').forEach(item => {
                item.addEventListener('click', () => {
                    this.searchInput.value = item.dataset.keyword;
                    if (this.searchService) {
                        this.searchService.historyService.addToHistory(item.dataset.keyword);
                    }
                    this.performSearch(item.dataset.keyword);
                });
            });
        } else {
            this.suggestionsSection.style.display = 'none';
        }
    }

    toggleSearch() {
        if (this.isExpanded) {
            if (this.searchInput.value.trim()) {
                this.hideDropdown();
                this.clearSearch();
                this.collapseSearch();
            } else {
                this.collapseSearch();
            }
        } else {
            this.expandSearch();
            this.searchInput.focus();
        }
    }

    expandSearch() {
        this.isExpanded = true;
        this.searchBox.classList.add('expanded');
    }

    collapseSearch() {
        this.isExpanded = false;
        this.searchBox.classList.remove('expanded');
    }

    clearSearch() {
        this.searchInput.value = '';
        document.getElementById('search-clear').classList.remove('visible');
        this.hideDropdown();
        this.showEmptyState();
    }

    debounceSearch(value, delay = 300) {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        if (!value.trim()) {
            this.showInitialState();
            return;
        }

        this.debounceTimer = setTimeout(() => {
            this.showSuggestions(value);
            this.performSearch(value);
        }, delay);
    }

    performSearch(keyword) {
        this.showLoading();

        if (this.searchService) {
            const results = this.searchService.search(keyword, { types: [this.currentType === 'all' ? 'posts' : this.currentType] });
            const resultList = results.posts || results.resources || results.bounties || [];
            this.renderSearchResults(resultList, keyword);
        } else {
            const results = SearchService.searchByType(keyword, this.currentType);
            this.renderSearchResults(results, keyword);
        }
    }

    renderSearchResults(results, keyword) {
        if (!results || results.length === 0) {
            this.showNoResults();
            return;
        }

        const html = results.slice(0, 10).map(item => {
            const highlightedTitle = SearchService.highlightMatches(item.title, keyword);
            const iconClass = this.getIconClass(item.type);
            const icon = this.getIcon(item.type);
            const typeLabel = SearchService.getTypeLabel(item.type);
            
            return `
                <div class="search-result-item" data-type="${item.type}" data-id="${item.id}">
                    <div class="search-result-icon ${item.type}">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="search-result-content">
                        <div class="search-result-title">${highlightedTitle}</div>
                        <div class="search-result-meta">
                            <span class="search-result-type ${item.type}">${typeLabel}</span>
                            ${item.author ? `<span>${item.author.nickname || '匿名'}</span>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        this.resultsList.innerHTML = html;
        
        this.resultsList.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                this.handleResultClick(item.dataset.type, item.dataset.id);
            });
        });

        if (results.length > 10) {
            this.dropdownFooter.style.display = 'block';
        } else {
            this.dropdownFooter.style.display = 'none';
        }

        this.showDropdown();
    }

    showEmptyState() {
        this.resultsList.innerHTML = `
            <div class="search-empty-state">
                <i class="fas fa-search"></i>
                <p>输入关键词开始搜索</p>
            </div>
        `;
        this.dropdownFooter.style.display = 'none';
    }

    showNoResults() {
        this.resultsList.innerHTML = `
            <div class="search-empty-state">
                <i class="fas fa-frown"></i>
                <p>未找到相关结果</p>
            </div>
        `;
        this.dropdownFooter.style.display = 'none';
        this.showDropdown();
    }

    showLoading() {
        this.resultsList.innerHTML = `
            <div class="search-loading">
                <div class="search-spinner"></div>
            </div>
        `;
        this.showDropdown();
    }

    showDropdown() {
        this.dropdown.classList.add('active');
    }

    hideDropdown() {
        this.dropdown.classList.remove('active');
    }

    setSearchType(type) {
        this.currentType = type;
        
        document.querySelectorAll('.search-type-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === type);
        });

        if (this.searchInput.value.trim()) {
            this.performSearch(this.searchInput.value);
        }
    }

    handleResultClick(type, id) {
        this.hideDropdown();
        
        switch (type) {
            case 'post':
                window.location.href = `forum.html?post=${id}`;
                break;
            case 'resource':
                window.location.href = `resources.html?resource=${id}`;
                break;
            case 'bounty':
                window.location.href = `bounty.html?bounty=${id}`;
                break;
            case 'user':
                window.location.href = `profile.html?user=${id}`;
                break;
            default:
                console.warn('Unknown result type:', type);
        }
    }

    navigateToSearchPage() {
        const keyword = this.searchInput.value.trim();
        if (keyword) {
            window.location.href = `search.html?q=${encodeURIComponent(keyword)}&type=${this.currentType}`;
        }
    }

    getIconClass(type) {
        const icons = {
            post: 'fa-comments',
            resource: 'fa-gift',
            bounty: 'fa-coins',
            user: 'fa-user'
        };
        return icons[type] || 'fa-file';
    }

    getIcon(type) {
        return this.getIconClass(type);
    }
}

function initSearch(containerId = 'auth-container') {
    if (window.headerSearchInstance) {
        return window.headerSearchInstance;
    }
    
    window.headerSearchInstance = new HeaderSearch(containerId);
    return window.headerSearchInstance;
}

window.HeaderSearch = HeaderSearch;
window.initSearch = initSearch;
