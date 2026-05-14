# 留情局搜索功能实施计划

> **For agentic workers:** 使用 executing-plans skill 来执行此计划的任务。

**Goal:** 实现完整的搜索功能，支持用户、帖子、资源、悬赏的即时搜索和完整搜索页

**Architecture:** 基于 SearchService 统一管理搜索逻辑，使用防抖优化，提供即时浮层和完整页面两种访问方式

**Tech Stack:** 原生 JavaScript，localStorage，无外部依赖

---

## 文件结构

```
js/
  ├── search-service.js    # 新建：搜索服务
  └── main.js              # 修改：导航栏搜索框

index.html       # 修改：添加顶部搜索框
forum.html       # 修改：添加顶部搜索框
resources.html   # 修改：添加顶部搜索框
bounty.html      # 修改：添加顶部搜索框
profile.html     # 修改：添加顶部搜索框
search.html      # 新建：完整搜索页面
```

---

## 任务列表

### 任务 1: 创建 search-service.js

**Files:**
- 创建: `js/search-service.js`

- [ ] **Step 1: 创建搜索服务基础结构**

```javascript
const SearchService = {
    debounceTimer: null,

    matchKeyword(text, keyword) {
        if (!text || !keyword) return false;
        return text.toLowerCase().includes(keyword.toLowerCase());
    },

    searchUsers(keyword) {
        if (!keyword) return [];
        const users = AuthService.getUsers();
        return users.filter(user => {
            return this.matchKeyword(user.nickname, keyword) ||
                   this.matchKeyword(user.email, keyword);
        });
    },

    searchPosts(keyword) {
        if (!keyword) return [];
        const posts = ForumService.getPosts();
        return posts.filter(post => {
            return this.matchKeyword(post.title, keyword) ||
                   this.matchKeyword(post.content, keyword);
        });
    },

    searchResources(keyword) {
        if (!keyword) return [];
        const resources = ResourceService.getResources();
        return resources.filter(resource => {
            return this.matchKeyword(resource.title, keyword) ||
                   this.matchKeyword(resource.description, keyword) ||
                   (resource.tags && resource.tags.some(tag => this.matchKeyword(tag, keyword)));
        });
    },

    searchBounties(keyword) {
        if (!keyword) return [];
        const bounties = BountyService.getBounties();
        return bounties.filter(bounty => {
            return this.matchKeyword(bounty.title, keyword) ||
                   this.matchKeyword(bounty.description, keyword);
        });
    },

    searchAll(keyword) {
        return {
            users: this.searchUsers(keyword),
            posts: this.searchPosts(keyword),
            resources: this.searchResources(keyword),
            bounties: this.searchBounties(keyword)
        };
    },

    searchByType(keyword, type) {
        switch (type) {
            case 'user': return { users: this.searchUsers(keyword) };
            case 'post': return { posts: this.searchPosts(keyword) };
            case 'resource': return { resources: this.searchResources(keyword) };
            case 'bounty': return { bounties: this.searchBounties(keyword) };
            default: return this.searchAll(keyword);
        }
    },

    searchWithDebounce(keyword, callback, delay = 300) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            const results = this.searchAll(keyword);
            if (callback) callback(results);
        }, delay);
    },

    cancelSearch() {
        clearTimeout(this.debounceTimer);
    }
};

window.SearchService = SearchService;
```

---

### 任务 2: 在导航栏添加顶部搜索框

**Files:**
- 修改: `index.html`, `forum.html`, `resources.html`, `bounty.html`, `profile.html`

- [ ] **Step 1: 在导航栏 header-right 添加搜索框**

在所有页面的 header-right 中，在登录按钮或用户菜单之前添加搜索框：

```html
<div class="search-container">
    <div class="search-box">
        <i class="fas fa-search search-icon"></i>
        <input type="text" id="search-input" placeholder="搜索用户、帖子、资源、悬赏..." class="search-input">
        <button class="search-clear-btn" id="search-clear-btn" style="display: none;">
            <i class="fas fa-times"></i>
        </button>
    </div>
    <div class="search-dropdown" id="search-dropdown" style="display: none;"></div>
</div>
```

- [ ] **Step 2: 添加搜索框样式**

在 style.css 或各页面的 style 标签中添加：

```css
.search-container {
    position: relative;
    flex: 1;
    max-width: 400px;
    margin: 0 20px;
}

.search-box {
    position: relative;
}

.search-input {
    width: 100%;
    padding: 10px 40px 10px 40px;
    border: 1px solid var(--border-color);
    border-radius: 20px;
    font-size: 14px;
    background: var(--bg-light);
    transition: all 0.3s ease;
}

.search-input:focus {
    outline: none;
    border-color: var(--primary-color);
    background: white;
    box-shadow: 0 0 0 3px rgba(139, 69, 19, 0.1);
}

.search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-light);
    font-size: 14px;
}

.search-clear-btn {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: var(--text-light);
    cursor: pointer;
    padding: 4px;
    font-size: 12px;
    border-radius: 50%;
    transition: all 0.3s ease;
}

.search-clear-btn:hover {
    background: var(--border-color);
    color: var(--text-primary);
}

.search-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border-radius: 12px;
    box-shadow: var(--shadow-lg);
    margin-top: 8px;
    overflow: hidden;
    z-index: 1000;
}

.search-filters {
    display: flex;
    padding: 10px 15px;
    border-bottom: 1px solid var(--border-color);
    gap: 8px;
}

.search-filter-btn {
    padding: 6px 12px;
    border: 1px solid var(--border-color);
    background: white;
    border-radius: 16px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.search-filter-btn:hover,
.search-filter-btn.active {
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
}

.search-results {
    max-height: 400px;
    overflow-y: auto;
}

.search-result-group {
    padding: 10px 15px;
    border-bottom: 1px solid #f5f5f5;
}

.search-result-group:last-child {
    border-bottom: none;
}

.search-group-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.search-group-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-light);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.search-group-view-all {
    font-size: 12px;
    color: var(--primary-color);
    text-decoration: none;
}

.search-group-view-all:hover {
    text-decoration: underline;
}

.search-result-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 0;
    cursor: pointer;
    border-radius: 8px;
    transition: background 0.2s ease;
}

.search-result-item:hover {
    background: var(--bg-light);
}

.search-result-icon {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    flex-shrink: 0;
}

.search-result-icon.user { background: #e6f7ff; color: #1890ff; }
.search-result-icon.post { background: #fff7e6; color: #fa8c16; }
.search-result-icon.resource { background: #f6ffed; color: #52c41a; }
.search-result-icon.bounty { background: #f9f0ff; color: #722ed1; }

.search-result-content {
    flex: 1;
    min-width: 0;
}

.search-result-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
    margin-bottom: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.search-result-desc {
    font-size: 12px;
    color: var(--text-light);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.search-footer {
    padding: 12px 15px;
    border-top: 1px solid var(--border-color);
    text-align: center;
}

.search-footer a {
    font-size: 13px;
    color: var(--primary-color);
    text-decoration: none;
    font-weight: 500;
}

.search-footer a:hover {
    text-decoration: underline;
}

.search-empty {
    padding: 40px 20px;
    text-align: center;
    color: var(--text-light);
}

.search-empty i {
    font-size: 48px;
    margin-bottom: 12px;
    opacity: 0.5;
}
```

- [ ] **Step 3: 添加搜索交互脚本**

在每个页面的 script 标签中添加搜索逻辑：

```javascript
let currentSearchType = 'all';

function initSearch() {
    const searchInput = document.getElementById('search-input');
    const searchClearBtn = document.getElementById('search-clear-btn');
    const searchDropdown = document.getElementById('search-dropdown');
    const filterBtns = document.querySelectorAll('.search-filter-btn');

    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const keyword = e.target.value.trim();
        searchClearBtn.style.display = keyword ? 'block' : 'none';

        if (keyword) {
            SearchService.searchWithDebounce(keyword, renderSearchResults);
        } else {
            SearchService.cancelSearch();
            searchDropdown.style.display = 'none';
        }
    });

    searchClearBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchClearBtn.style.display = 'none';
        searchDropdown.style.display = 'none';
        SearchService.cancelSearch();
    });

    searchInput.addEventListener('focus', () => {
        if (searchInput.value.trim()) {
            SearchService.searchWithDebounce(searchInput.value.trim(), renderSearchResults, 0);
        }
    });

    document.addEventListener('click', (e) => {
        const container = document.querySelector('.search-container');
        if (container && !container.contains(e.target)) {
            searchDropdown.style.display = 'none';
        }
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentSearchType = btn.dataset.type;
            if (searchInput.value.trim()) {
                const results = SearchService.searchByType(searchInput.value.trim(), currentSearchType);
                renderSearchResults(results);
            }
        });
    });
}

function renderSearchResults(results) {
    const searchDropdown = document.getElementById('search-dropdown');
    if (!searchDropdown) return;

    const hasResults = (results.users && results.users.length) ||
                       (results.posts && results.posts.length) ||
                       (results.resources && results.resources.length) ||
                       (results.bounties && results.bounties.length);

    if (!hasResults) {
        searchDropdown.innerHTML = `
            <div class="search-results">
                <div class="search-empty">
                    <i class="fas fa-search"></i>
                    <p>未找到相关结果</p>
                </div>
            </div>
        `;
        searchDropdown.style.display = 'block';
        return;
    }

    let html = `
        <div class="search-filters">
            <button class="search-filter-btn ${currentSearchType === 'all' ? 'active' : ''}" data-type="all">全部</button>
            <button class="search-filter-btn ${currentSearchType === 'user' ? 'active' : ''}" data-type="user">用户</button>
            <button class="search-filter-btn ${currentSearchType === 'post' ? 'active' : ''}" data-type="post">帖子</button>
            <button class="search-filter-btn ${currentSearchType === 'resource' ? 'active' : ''}" data-type="resource">资源</button>
            <button class="search-filter-btn ${currentSearchType === 'bounty' ? 'active' : ''}" data-type="bounty">悬赏</button>
        </div>
        <div class="search-results">
    `;

    const keyword = document.getElementById('search-input').value.trim();

    if (currentSearchType === 'all' || currentSearchType === 'user') {
        const users = results.users || [];
        if (users.length > 0) {
            html += `
                <div class="search-result-group">
                    <div class="search-group-header">
                        <span class="search-group-title">用户</span>
                        <a href="search.html?q=${encodeURIComponent(keyword)}&type=user" class="search-group-view-all">查看全部 (${users.length})</a>
                    </div>
                    ${users.slice(0, 3).map(user => `
                        <div class="search-result-item" onclick="window.location.href='profile.html?user=${user.id}'">
                            <div class="search-result-icon user">
                                <i class="fas fa-user"></i>
                            </div>
                            <div class="search-result-content">
                                <div class="search-result-title">${user.nickname}</div>
                                <div class="search-result-desc">${user.email}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }

    if (currentSearchType === 'all' || currentSearchType === 'post') {
        const posts = results.posts || [];
        if (posts.length > 0) {
            html += `
                <div class="search-result-group">
                    <div class="search-group-header">
                        <span class="search-group-title">帖子</span>
                        <a href="search.html?q=${encodeURIComponent(keyword)}&type=post" class="search-group-view-all">查看全部 (${posts.length})</a>
                    </div>
                    ${posts.slice(0, 3).map(post => `
                        <div class="search-result-item" onclick="window.location.href='forum.html?post=${post.id}'">
                            <div class="search-result-icon post">
                                <i class="fas fa-file-alt"></i>
                            </div>
                            <div class="search-result-content">
                                <div class="search-result-title">${post.title}</div>
                                <div class="search-result-desc">作者: ${post.author?.nickname || '匿名'}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }

    if (currentSearchType === 'all' || currentSearchType === 'resource') {
        const resources = results.resources || [];
        if (resources.length > 0) {
            html += `
                <div class="search-result-group">
                    <div class="search-group-header">
                        <span class="search-group-title">资源</span>
                        <a href="search.html?q=${encodeURIComponent(keyword)}&type=resource" class="search-group-view-all">查看全部 (${resources.length})</a>
                    </div>
                    ${resources.slice(0, 3).map(resource => `
                        <div class="search-result-item" onclick="window.location.href='resources.html?resource=${resource.id}'">
                            <div class="search-result-icon resource">
                                <i class="fas fa-book"></i>
                            </div>
                            <div class="search-result-content">
                                <div class="search-result-title">${resource.title}</div>
                                <div class="search-result-desc">${resource.description?.substring(0, 50) || ''}...</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }

    if (currentSearchType === 'all' || currentSearchType === 'bounty') {
        const bounties = results.bounties || [];
        if (bounties.length > 0) {
            html += `
                <div class="search-result-group">
                    <div class="search-group-header">
                        <span class="search-group-title">悬赏</span>
                        <a href="search.html?q=${encodeURIComponent(keyword)}&type=bounty" class="search-group-view-all">查看全部 (${bounties.length})</a>
                    </div>
                    ${bounties.slice(0, 3).map(bounty => `
                        <div class="search-result-item" onclick="window.location.href='bounty.html?bounty=${bounty.id}'">
                            <div class="search-result-icon bounty">
                                <i class="fas fa-trophy"></i>
                            </div>
                            <div class="search-result-content">
                                <div class="search-result-title">${bounty.title}</div>
                                <div class="search-result-desc">悬赏: ${bounty.reward} 积分</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }

    html += `
        </div>
        <div class="search-footer">
            <a href="search.html?q=${encodeURIComponent(keyword)}&type=${currentSearchType}">
                查看完整搜索结果 →
            </a>
        </div>
    `;

    searchDropdown.innerHTML = html;
    searchDropdown.style.display = 'block';

    const filterBtns = searchDropdown.querySelectorAll('.search-filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentSearchType = btn.dataset.type;
            const results = SearchService.searchByType(keyword, currentSearchType);
            renderSearchResults(results);
        });
    });
}

document.addEventListener('DOMContentLoaded', initSearch);
```

---

### 任务 3: 创建完整搜索页面 search.html

**Files:**
- 创建: `search.html`

- [ ] **Step 1: 创建 search.html 基础结构**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>搜索 - 留情局</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>
    <header class="header">
        <div class="container">
            <a href="index.html" class="logo">
                <i class="fas fa-leaf"></i>
                留情局
            </a>
            <nav class="nav">
                <a href="index.html" class="nav-link">首页</a>
                <a href="forum.html" class="nav-link">论坛</a>
                <a href="resources.html" class="nav-link">资源</a>
                <a href="bounty.html" class="nav-link">悬赏</a>
            </nav>
            <div class="header-right">
                <div class="search-container">
                    <div class="search-box">
                        <i class="fas fa-search search-icon"></i>
                        <input type="text" id="search-input" placeholder="搜索用户、帖子、资源、悬赏..." class="search-input">
                        <button class="search-clear-btn" id="search-clear-btn" style="display: none;">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="search-dropdown" id="search-dropdown" style="display: none;"></div>
                </div>
                <div id="user-menu-container"></div>
            </div>
        </div>
    </header>

    <main class="search-page">
        <div class="container">
            <div class="search-page-header">
                <h1 id="search-page-title">搜索结果</h1>
                <p id="search-page-summary"></p>
            </div>

            <div class="search-page-filters">
                <button class="search-page-filter-btn active" data-type="all">全部</button>
                <button class="search-page-filter-btn" data-type="user">用户</button>
                <button class="search-page-filter-btn" data-type="post">帖子</button>
                <button class="search-page-filter-btn" data-type="resource">资源</button>
                <button class="search-page-filter-btn" data-type="bounty">悬赏</button>
            </div>

            <div class="search-page-results" id="search-page-results">
            </div>
        </div>
    </main>

    <footer class="footer">
        <div class="container">
            <div class="footer-content">
                <div class="footer-section">
                    <h3>留情局</h3>
                    <p>留学生交流互助平台</p>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2024 留情局. All rights reserved.</p>
            </div>
        </div>
    </footer>

    <script src="js/auth.js"></script>
    <script src="js/auth-modal.js"></script>
    <script src="js/user-menu.js"></script>
    <script src="js/forum-service.js"></script>
    <script src="js/resource-service.js"></script>
    <script src="js/bounty-service.js"></script>
    <script src="js/search-service.js"></script>

    <script>
        let currentPageType = 'all';
        let currentKeyword = '';

        function parseSearchParams() {
            const params = new URLSearchParams(window.location.search);
            currentKeyword = params.get('q') || '';
            currentPageType = params.get('type') || 'all';
        }

        function initSearchPage() {
            parseSearchParams();
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchInput.value = currentKeyword;
            }

            const filterBtns = document.querySelectorAll('.search-page-filter-btn');
            filterBtns.forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.type === currentPageType) {
                    btn.classList.add('active');
                }
                btn.addEventListener('click', () => {
                    filterBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    currentPageType = btn.dataset.type;
                    updateUrlParams();
                    renderPageResults();
                });
            });

            renderPageResults();

            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    currentKeyword = e.target.value.trim();
                    updateUrlParams();
                    renderPageResults();
                });
            }
        }

        function updateUrlParams() {
            const params = new URLSearchParams();
            if (currentKeyword) params.set('q', currentKeyword);
            if (currentPageType !== 'all') params.set('type', currentPageType);
            window.history.replaceState({}, '', `search.html${params.toString() ? '?' + params.toString() : ''}`);
        }

        function renderPageResults() {
            const container = document.getElementById('search-page-results');
            const titleEl = document.getElementById('search-page-title');
            const summaryEl = document.getElementById('search-page-summary');

            if (!currentKeyword) {
                titleEl.textContent = '搜索';
                summaryEl.textContent = '请输入关键词进行搜索';
                container.innerHTML = `
                    <div class="search-page-empty">
                        <i class="fas fa-search"></i>
                        <h3>开始搜索</h3>
                        <p>输入关键词搜索用户、帖子、资源或悬赏</p>
                    </div>
                `;
                return;
            }

            const results = SearchService.searchByType(currentKeyword, currentPageType);

            let totalCount = 0;
            if (results.users) totalCount += results.users.length;
            if (results.posts) totalCount += results.posts.length;
            if (results.resources) totalCount += results.resources.length;
            if (results.bounties) totalCount += results.bounties.length;

            titleEl.textContent = `搜索: "${currentKeyword}"`;
            summaryEl.textContent = `找到 ${totalCount} 条结果`;

            if (totalCount === 0) {
                container.innerHTML = `
                    <div class="search-page-empty">
                        <i class="fas fa-search"></i>
                        <h3>未找到结果</h3>
                        <p>尝试使用其他关键词进行搜索</p>
                    </div>
                `;
                return;
            }

            let html = '';

            if (results.users && results.users.length > 0) {
                html += `
                    <div class="search-page-group">
                        <h2 class="search-page-group-title">用户 (${results.users.length})</h2>
                        <div class="search-page-grid">
                            ${results.users.map(user => `
                                <a href="profile.html?user=${user.id}" class="search-page-card user-card">
                                    <div class="search-page-card-icon user">
                                        <i class="fas fa-user"></i>
                                    </div>
                                    <div class="search-page-card-content">
                                        <div class="search-page-card-title">${user.nickname}</div>
                                        <div class="search-page-card-desc">${user.email}</div>
                                    </div>
                                </a>
                            `).join('')}
                        </div>
                    </div>
                `;
            }

            if (results.posts && results.posts.length > 0) {
                html += `
                    <div class="search-page-group">
                        <h2 class="search-page-group-title">帖子 (${results.posts.length})</h2>
                        <div class="search-page-grid">
                            ${results.posts.map(post => `
                                <a href="forum.html?post=${post.id}" class="search-page-card post-card">
                                    <div class="search-page-card-icon post">
                                        <i class="fas fa-file-alt"></i>
                                    </div>
                                    <div class="search-page-card-content">
                                        <div class="search-page-card-title">${post.title}</div>
                                        <div class="search-page-card-desc">作者: ${post.author?.nickname || '匿名'}</div>
                                    </div>
                                </a>
                            `).join('')}
                        </div>
                    </div>
                `;
            }

            if (results.resources && results.resources.length > 0) {
                html += `
                    <div class="search-page-group">
                        <h2 class="search-page-group-title">资源 (${results.resources.length})</h2>
                        <div class="search-page-grid">
                            ${results.resources.map(resource => `
                                <a href="resources.html?resource=${resource.id}" class="search-page-card resource-card">
                                    <div class="search-page-card-icon resource">
                                        <i class="fas fa-book"></i>
                                    </div>
                                    <div class="search-page-card-content">
                                        <div class="search-page-card-title">${resource.title}</div>
                                        <div class="search-page-card-desc">${resource.description?.substring(0, 60) || ''}...</div>
                                    </div>
                                </a>
                            `).join('')}
                        </div>
                    </div>
                `;
            }

            if (results.bounties && results.bounties.length > 0) {
                html += `
                    <div class="search-page-group">
                        <h2 class="search-page-group-title">悬赏 (${results.bounties.length})</h2>
                        <div class="search-page-grid">
                            ${results.bounties.map(bounty => `
                                <a href="bounty.html?bounty=${bounty.id}" class="search-page-card bounty-card">
                                    <div class="search-page-card-icon bounty">
                                        <i class="fas fa-trophy"></i>
                                    </div>
                                    <div class="search-page-card-content">
                                        <div class="search-page-card-title">${bounty.title}</div>
                                        <div class="search-page-card-desc">悬赏: ${bounty.reward} 积分</div>
                                    </div>
                                </a>
                            `).join('')}
                        </div>
                    </div>
                `;
            }

            container.innerHTML = html;
        }

        document.addEventListener('DOMContentLoaded', () => {
            initSearchPage();
        });
    </script>

    <style>
        .search-page {
            padding: 40px 0;
        }

        .search-page-header {
            margin-bottom: 30px;
        }

        .search-page-header h1 {
            font-size: 28px;
            font-weight: 700;
            color: var(--text-primary);
            margin-bottom: 8px;
        }

        .search-page-header p {
            font-size: 15px;
            color: var(--text-secondary);
        }

        .search-page-filters {
            display: flex;
            gap: 10px;
            margin-bottom: 30px;
            flex-wrap: wrap;
        }

        .search-page-filter-btn {
            padding: 10px 20px;
            border: 2px solid var(--border-color);
            background: white;
            border-radius: 24px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .search-page-filter-btn:hover,
        .search-page-filter-btn.active {
            background: var(--primary-color);
            color: white;
            border-color: var(--primary-color);
        }

        .search-page-results {
            display: flex;
            flex-direction: column;
            gap: 40px;
        }

        .search-page-group {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .search-page-group-title {
            font-size: 18px;
            font-weight: 600;
            color: var(--text-primary);
            padding-bottom: 12px;
            border-bottom: 2px solid var(--border-color);
        }

        .search-page-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 16px;
        }

        .search-page-card {
            background: white;
            border-radius: 12px;
            padding: 20px;
            display: flex;
            align-items: center;
            gap: 14px;
            text-decoration: none;
            box-shadow: var(--shadow-sm);
            transition: all 0.3s ease;
        }

        .search-page-card:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-md);
        }

        .search-page-card-icon {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            flex-shrink: 0;
        }

        .search-page-card-icon.user { background: #e6f7ff; color: #1890ff; }
        .search-page-card-icon.post { background: #fff7e6; color: #fa8c16; }
        .search-page-card-icon.resource { background: #f6ffed; color: #52c41a; }
        .search-page-card-icon.bounty { background: #f9f0ff; color: #722ed1; }

        .search-page-card-content {
            flex: 1;
            min-width: 0;
        }

        .search-page-card-title {
            font-size: 15px;
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .search-page-card-desc {
            font-size: 13px;
            color: var(--text-secondary);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .search-page-empty {
            text-align: center;
            padding: 80px 20px;
        }

        .search-page-empty i {
            font-size: 72px;
            color: var(--text-light);
            opacity: 0.3;
            margin-bottom: 20px;
        }

        .search-page-empty h3 {
            font-size: 20px;
            font-weight: 600;
            color: var(--text-secondary);
            margin-bottom: 8px;
        }

        .search-page-empty p {
            font-size: 14px;
            color: var(--text-light);
        }
    </style>
</body>
</html>
```

---

## 自我审查清单

- [x] 设计文档中的所有功能都有对应的任务
- [x] 没有 placeholder (TBD/TODO)
- [x] 类型、方法名在所有任务中一致
- [x] 每个任务都是独立的、可测试的

---

**Plan complete!**
