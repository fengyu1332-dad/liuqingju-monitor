# 留情局收藏功能实施计划

> **For agentic workers:** 使用 executing-plans skill 来执行此计划的任务。

**Goal:** 实现完整的收藏功能，支持帖子、资源、悬赏的收藏管理

**Architecture:** 基于 localStorage 的轻量级收藏系统，通过 BookmarkService 统一管理收藏的增删改查

**Tech Stack:** 原生 JavaScript，localStorage，无外部依赖

---

## 文件结构

```
js/
  ├── bookmark-service.js    # 新建：收藏服务
  ├── forum-service.js       # 修改：添加收藏按钮
  ├── resource-service.js    # 修改：添加收藏按钮
  ├── bounty-service.js      # 修改：添加收藏按钮
  └── user-menu.js           # 修改：侧边栏快捷入口

forum.html    # 修改：帖子卡片添加收藏按钮
resources.html # 修改：资源卡片添加收藏按钮
bounty.html   # 修改：悬赏卡片添加收藏按钮
profile.html  # 修改：添加收藏管理页
```

---

## 任务列表

### 任务 1: 创建 bookmark-service.js

**Files:**
- 创建: `js/bookmark-service.js`

- [ ] **Step 1: 创建收藏服务基础结构**

```javascript
const BOOKMARK_KEY = 'liuqingju_bookmarks';

const BookmarkService = {
    generateId() {
        return 'bm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    getUserBookmarks(userId) {
        const data = localStorage.getItem(BOOKMARK_KEY);
        if (!data) return null;
        const bookmarks = JSON.parse(data);
        return bookmarks.userId === userId ? bookmarks : null;
    },

    initUserBookmarks(userId) {
        const data = localStorage.getItem(BOOKMARK_KEY);
        const bookmarks = data ? JSON.parse(data) : { userId: null, bookmarks: [] };
        if (bookmarks.userId !== userId) {
            bookmarks.userId = userId;
            bookmarks.bookmarks = [];
            localStorage.setItem(BOOKMARK_KEY, JSON.stringify(bookmarks));
        }
        return bookmarks;
    },

    saveBookmarks(bookmarks) {
        localStorage.setItem(BOOKMARK_KEY, JSON.stringify(bookmarks));
    },

    getAllBookmarks() {
        const data = localStorage.getItem(BOOKMARK_KEY);
        return data ? JSON.parse(data) : { userId: null, bookmarks: [] };
    },

    isBookmarked(userId, targetId) {
        const data = localStorage.getItem(BOOKMARK_KEY);
        if (!data) return false;
        const bookmarks = JSON.parse(data);
        if (bookmarks.userId !== userId) return false;
        return bookmarks.bookmarks.some(b => b.targetId === targetId);
    },

    addBookmark(userId, type, targetId) {
        const data = localStorage.getItem(BOOKMARK_KEY);
        const bookmarks = data ? JSON.parse(data) : { userId: userId, bookmarks: [] };

        if (bookmarks.userId !== userId) {
            bookmarks.userId = userId;
            bookmarks.bookmarks = [];
        }

        if (bookmarks.bookmarks.some(b => b.targetId === targetId)) {
            return false;
        }

        const newBookmark = {
            id: this.generateId(),
            type: type,
            targetId: targetId,
            createdAt: new Date().toISOString()
        };

        bookmarks.bookmarks.unshift(newBookmark);
        localStorage.setItem(BOOKMARK_KEY, JSON.stringify(bookmarks));

        window.dispatchEvent(new CustomEvent('bookmarkAdded', {
            detail: { userId, type, targetId }
        }));

        return true;
    },

    removeBookmark(userId, targetId) {
        const data = localStorage.getItem(BOOKMARK_KEY);
        if (!data) return false;
        const bookmarks = JSON.parse(data);

        if (bookmarks.userId !== userId) return false;

        const index = bookmarks.bookmarks.findIndex(b => b.targetId === targetId);
        if (index === -1) return false;

        bookmarks.bookmarks.splice(index, 1);
        localStorage.setItem(BOOKMARK_KEY, JSON.stringify(bookmarks));

        window.dispatchEvent(new CustomEvent('bookmarkRemoved', {
            detail: { userId, targetId }
        }));

        return true;
    },

    toggleBookmark(userId, type, targetId) {
        if (this.isBookmarked(userId, targetId)) {
            this.removeBookmark(userId, targetId);
            return false;
        } else {
            this.addBookmark(userId, type, targetId);
            return true;
        }
    },

    getBookmarks(userId, type = null) {
        const data = localStorage.getItem(BOOKMARK_KEY);
        if (!data) return [];
        const bookmarks = JSON.parse(data);
        if (bookmarks.userId !== userId) return [];

        if (type) {
            return bookmarks.bookmarks.filter(b => b.type === type);
        }
        return bookmarks.bookmarks;
    },

    getBookmarksByType(userId, type) {
        return this.getBookmarks(userId, type);
    }
};

window.BookmarkService = BookmarkService;
```

---

### 任务 2: 在 forum.html 添加收藏按钮

**Files:**
- 修改: `forum.html`

- [ ] **Step 1: 在 script 标签中添加 bookmark-service.js 引用**

在 forum.html 的 script 标签中（确保在 forum-service.js 之后）：

```html
<script src="js/bookmark-service.js"></script>
```

- [ ] **Step 2: 添加收藏按钮到帖子卡片**

找到渲染帖子卡片的 renderPosts 函数，添加收藏按钮到操作区域：

```javascript
// 在帖子卡片操作区域添加收藏按钮
const isBookmarked = typeof BookmarkService !== 'undefined' &&
                     BookmarkService.isBookmarked(currentUser.id, post.id);

// 收藏按钮 HTML
const bookmarkBtn = `
    <button class="bookmark-btn ${isBookmarked ? 'active' : ''}"
            onclick="togglePostBookmark('${post.id}', this)"
            title="${isBookmarked ? '取消收藏' : '收藏'}">
        <i class="${isBookmarked ? 'fas' : 'far'} fa-star"></i>
    </button>
`;
```

- [ ] **Step 3: 添加切换收藏函数**

```javascript
function togglePostBookmark(postId, btnElement) {
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser) {
        alert('请先登录');
        return;
    }

    if (typeof BookmarkService === 'undefined') {
        console.error('BookmarkService not loaded');
        return;
    }

    const isNowBookmarked = BookmarkService.toggleBookmark(currentUser.id, 'post', postId);
    const icon = btnElement.querySelector('i');

    if (isNowBookmarked) {
        icon.classList.remove('far');
        icon.classList.add('fas');
        btnElement.classList.add('active');
        btnElement.title = '取消收藏';
    } else {
        icon.classList.remove('fas');
        icon.classList.add('far');
        btnElement.classList.remove('active');
        btnElement.title = '收藏';
    }
}
```

- [ ] **Step 4: 添加收藏按钮样式**

在 CSS 中添加（style.css 或 forum.html 的 style 标签）：

```css
.bookmark-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 6px;
    font-size: 16px;
    color: var(--text-light);
    transition: all 0.3s ease;
    border-radius: 4px;
}

.bookmark-btn:hover {
    color: #faad14;
    background: rgba(250, 173, 20, 0.1);
}

.bookmark-btn.active {
    color: #faad14;
}

.bookmark-btn.active i {
    animation: starPulse 0.3s ease;
}

@keyframes starPulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.3); }
    100% { transform: scale(1); }
}
```

---

### 任务 3: 在 resources.html 添加收藏按钮

**Files:**
- 修改: `resources.html`

- [ ] **Step 1: 确保引用 bookmark-service.js**

检查 resources.html 的 script 标签，确保包含 bookmark-service.js

- [ ] **Step 2: 添加收藏按钮到资源卡片**

找到渲染资源卡片的函数，添加收藏按钮：

```javascript
// 在资源卡片操作区域
const isBookmarked = typeof BookmarkService !== 'undefined' &&
                     BookmarkService.isBookmarked(currentUser.id, resource.id);

const bookmarkBtn = `
    <button class="bookmark-btn ${isBookmarked ? 'active' : ''}"
            onclick="toggleResourceBookmark('${resource.id}', this)"
            title="${isBookmarked ? '取消收藏' : '收藏'}">
        <i class="${isBookmarked ? 'fas' : 'far'} fa-star"></i>
    </button>
`;
```

- [ ] **Step 3: 添加切换收藏函数**

```javascript
function toggleResourceBookmark(resourceId, btnElement) {
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser) {
        alert('请先登录');
        return;
    }

    if (typeof BookmarkService === 'undefined') {
        console.error('BookmarkService not loaded');
        return;
    }

    const isNowBookmarked = BookmarkService.toggleBookmark(currentUser.id, 'resource', resourceId);
    const icon = btnElement.querySelector('i');

    if (isNowBookmarked) {
        icon.classList.remove('far');
        icon.classList.add('fas');
        btnElement.classList.add('active');
    } else {
        icon.classList.remove('fas');
        icon.classList.add('far');
        btnElement.classList.remove('active');
    }
}
```

---

### 任务 4: 在 bounty.html 添加收藏按钮

**Files:**
- 修改: `bounty.html`

- [ ] **Step 1: 确保引用 bookmark-service.js**

检查 bounty.html 的 script 标签

- [ ] **Step 2: 添加收藏按钮到悬赏卡片**

```javascript
// 在悬赏卡片操作区域
const isBookmarked = typeof BookmarkService !== 'undefined' &&
                     BookmarkService.isBookmarked(currentUser.id, bounty.id);

const bookmarkBtn = `
    <button class="bookmark-btn ${isBookmarked ? 'active' : ''}"
            onclick="toggleBountyBookmark('${bounty.id}', this)"
            title="${isBookmarked ? '取消收藏' : '收藏'}">
        <i class="${isBookmarked ? 'fas' : 'far'} fa-star"></i>
    </button>
`;
```

- [ ] **Step 3: 添加切换收藏函数**

```javascript
function toggleBountyBookmark(bountyId, btnElement) {
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser) {
        alert('请先登录');
        return;
    }

    if (typeof BookmarkService === 'undefined') {
        console.error('BookmarkService not loaded');
        return;
    }

    const isNowBookmarked = BookmarkService.toggleBookmark(currentUser.id, 'bounty', bountyId);
    const icon = btnElement.querySelector('i');

    if (isNowBookmarked) {
        icon.classList.remove('far');
        icon.classList.add('fas');
        btnElement.classList.add('active');
    } else {
        icon.classList.remove('fas');
        icon.classList.add('far');
        btnElement.classList.remove('active');
    }
}
```

---

### 任务 5: 在 profile.html 添加收藏管理页

**Files:**
- 修改: `profile.html`

- [ ] **Step 1: 添加收藏标签页链接**

在 profile-tabs 中添加：

```html
<a href="#bookmarks" class="profile-tab" data-tab="bookmarks">
    <i class="fas fa-star"></i> 我的收藏
</a>
```

- [ ] **Step 2: 添加收藏内容区域**

在 profile-content 中添加：

```html
<div class="profile-tab-content" id="bookmarks-content" style="display: none;">
    <div class="bookmarks-header">
        <h2>我的收藏</h2>
        <div class="bookmark-filters">
            <button class="filter-btn active" data-filter="all">全部</button>
            <button class="filter-btn" data-filter="post">帖子</button>
            <button class="filter-btn" data-filter="resource">资源</button>
            <button class="filter-btn" data-filter="bounty">悬赏</button>
        </div>
    </div>
    <div class="bookmarks-list" id="bookmarks-list">
        <!-- 动态加载 -->
    </div>
</div>
```

- [ ] **Step 3: 添加收藏列表渲染函数**

```javascript
function renderBookmarks(filter = 'all') {
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser) return;

    const listContainer = document.getElementById('bookmarks-list');
    let bookmarks = BookmarkService.getBookmarks(currentUser.id);

    if (filter !== 'all') {
        bookmarks = bookmarks.filter(b => b.type === filter);
    }

    if (bookmarks.length === 0) {
        listContainer.innerHTML = '<div class="empty-state">暂无收藏</div>';
        return;
    }

    listContainer.innerHTML = bookmarks.map(bookmark => {
        let icon, typeName, title = '加载中...';

        switch (bookmark.type) {
            case 'post':
                icon = '📝';
                typeName = '帖子';
                const post = ForumService.getPostById(bookmark.targetId);
                title = post ? post.title : '帖子已删除';
                break;
            case 'resource':
                icon = '📚';
                typeName = '资源';
                const resource = ResourceService.getResourceById(bookmark.targetId);
                title = resource ? resource.title : '资源已删除';
                break;
            case 'bounty':
                icon = '💰';
                typeName = '悬赏';
                const bounty = BountyService.getBountyById(bookmark.targetId);
                title = bounty ? bounty.title : '悬赏已删除';
                break;
        }

        return `
            <div class="bookmark-item">
                <span class="bookmark-icon">${icon}</span>
                <div class="bookmark-info">
                    <a href="${getBookmarkLink(bookmark)}" class="bookmark-title">${title}</a>
                    <span class="bookmark-meta">${typeName} · 收藏于 ${formatDate(bookmark.createdAt)}</span>
                </div>
                <button class="remove-bookmark-btn" onclick="removeBookmark('${bookmark.targetId}', this)">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    }).join('');
}

function getBookmarkLink(bookmark) {
    switch (bookmark.type) {
        case 'post': return `forum.html?post=${bookmark.targetId}`;
        case 'resource': return `resources.html?resource=${bookmark.targetId}`;
        case 'bounty': return `bounty.html?bounty=${bookmark.targetId}`;
        default: return '#';
    }
}

function removeBookmark(targetId, btnElement) {
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser) return;

    BookmarkService.removeBookmark(currentUser.id, targetId);

    const item = btnElement.closest('.bookmark-item');
    item.remove();

    if (document.querySelectorAll('.bookmark-item').length === 0) {
        document.getElementById('bookmarks-list').innerHTML = '<div class="empty-state">暂无收藏</div>';
    }
}
```

- [ ] **Step 4: 添加收藏管理页样式**

```css
.bookmarks-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.bookmarks-header h2 {
    font-size: 20px;
    font-weight: 600;
    color: var(--text-primary);
}

.bookmark-filters {
    display: flex;
    gap: 10px;
}

.filter-btn {
    padding: 6px 14px;
    border: 1px solid var(--border-color);
    background: white;
    border-radius: 20px;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.filter-btn:hover,
.filter-btn.active {
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
}

.bookmark-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 15px;
    background: white;
    border-radius: 10px;
    margin-bottom: 10px;
    box-shadow: var(--shadow-sm);
    transition: all 0.3s ease;
}

.bookmark-item:hover {
    box-shadow: var(--shadow-md);
}

.bookmark-icon {
    font-size: 24px;
}

.bookmark-info {
    flex: 1;
}

.bookmark-title {
    font-size: 15px;
    font-weight: 500;
    color: var(--text-primary);
    text-decoration: none;
    display: block;
    margin-bottom: 4px;
}

.bookmark-title:hover {
    color: var(--primary-color);
}

.bookmark-meta {
    font-size: 12px;
    color: var(--text-light);
}

.remove-bookmark-btn {
    background: none;
    border: none;
    padding: 8px;
    cursor: pointer;
    color: var(--text-light);
    border-radius: 4px;
    transition: all 0.3s ease;
}

.remove-bookmark-btn:hover {
    background: #fff1f0;
    color: #ff4d4f;
}
```

- [ ] **Step 5: 添加标签页切换逻辑**

```javascript
// 在 profile.html 的初始化脚本中添加
const filterBtns = document.querySelectorAll('.filter-btn');
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderBookmarks(btn.dataset.filter);
    });
});

// 监听 URL hash 变化
window.addEventListener('hashchange', () => {
    const hash = window.location.hash;
    if (hash === '#bookmarks') {
        showTab('bookmarks');
        renderBookmarks();
    }
});

// 初始化检查
if (window.location.hash === '#bookmarks') {
    showTab('bookmarks');
    renderBookmarks();
}
```

---

### 任务 6: 添加侧边栏快捷入口

**Files:**
- 修改: `forum.html`, `resources.html`, `bounty.html`

- [ ] **Step 1: 在各页面侧边栏添加收藏快捷入口**

在页面侧边栏的适当位置添加：

```html
<div class="sidebar-bookmarks">
    <h3><i class="fas fa-star"></i> 我的收藏</h3>
    <div class="sidebar-bookmark-list" id="sidebar-bookmarks">
        <!-- 动态加载 -->
    </div>
    <a href="profile.html#bookmarks" class="view-all-link">查看全部</a>
</div>
```

- [ ] **Step 2: 添加侧边栏渲染函数**

```javascript
function renderSidebarBookmarks() {
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser) {
        document.getElementById('sidebar-bookmarks').innerHTML =
            '<p class="sidebar-empty">登录后查看收藏</p>';
        return;
    }

    const bookmarks = BookmarkService.getBookmarks(currentUser.id).slice(0, 5);
    const container = document.getElementById('sidebar-bookmarks');

    if (bookmarks.length === 0) {
        container.innerHTML = '<p class="sidebar-empty">暂无收藏</p>';
        return;
    }

    container.innerHTML = bookmarks.map(b => {
        let icon, title, url;
        switch (b.type) {
            case 'post':
                icon = '📝';
                url = `forum.html?post=${b.targetId}`;
                const post = ForumService.getPostById(b.targetId);
                title = post ? post.title : '帖子已删除';
                break;
            case 'resource':
                icon = '📚';
                url = `resources.html?resource=${b.targetId}`;
                const resource = ResourceService.getResourceById(b.targetId);
                title = resource ? resource.title : '资源已删除';
                break;
            case 'bounty':
                icon = '💰';
                url = `bounty.html?bounty=${b.targetId}`;
                const bounty = BountyService.getBountyById(b.targetId);
                title = bounty ? bounty.title : '悬赏已删除';
                break;
        }
        return `<a href="${url}" class="sidebar-bookmark-item">${icon} ${title}</a>`;
    }).join('');
}
```

- [ ] **Step 3: 监听收藏变化事件**

```javascript
window.addEventListener('bookmarkAdded', renderSidebarBookmarks);
window.addEventListener('bookmarkRemoved', renderSidebarBookmarks);
```

- [ ] **Step 4: 添加侧边栏样式**

```css
.sidebar-bookmarks {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: var(--shadow-sm);
}

.sidebar-bookmarks h3 {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 15px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.sidebar-bookmarks h3 i {
    color: #faad14;
}

.sidebar-bookmark-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.sidebar-bookmark-item {
    font-size: 13px;
    color: var(--text-secondary);
    text-decoration: none;
    padding: 6px 0;
    border-bottom: 1px solid #f5f5f5;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: color 0.3s ease;
}

.sidebar-bookmark-item:hover {
    color: var(--primary-color);
}

.sidebar-bookmark-item:last-child {
    border-bottom: none;
}

.sidebar-empty {
    font-size: 13px;
    color: var(--text-light);
    text-align: center;
    padding: 10px 0;
}

.view-all-link {
    display: block;
    text-align: center;
    font-size: 13px;
    color: var(--primary-color);
    text-decoration: none;
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid var(--border-color);
}

.view-all-link:hover {
    text-decoration: underline;
}
```

---

## 自我审查清单

- [x] 设计文档中的所有功能都有对应的任务
- [x] 没有 placeholder (TBD/TODO)
- [x] 类型、方法名在所有任务中一致
- [x] 每个任务都是独立的、可测试的

---

**Plan complete!**
