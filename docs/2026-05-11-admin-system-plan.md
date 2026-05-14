# 留情局管理员后台实施计划

> **For agentic workers:** 使用 executing-plans skill 来执行此计划的任务。

**Goal:** 实现完整的管理员后台，包括权限控制、数据统计、内容管理和用户管理

**Architecture:** 基于 AdminService 统一管理权限和管理操作，改造现有 admin.html 页面

**Tech Stack:** 原生 JavaScript，localStorage，修改现有 admin.html

---

## 文件结构

```
js/
  ├── admin-service.js    # 新建：管理员服务
  └── user-menu.js       # 修改：添加管理入口

admin.html   # 修改：完整管理后台页面
```

---

## 任务列表

### 任务 1: 创建 admin-service.js

**Files:**
- 创建: `js/admin-service.js`

- [ ] **Step 1: 创建管理员服务基础结构**

```javascript
const ADMIN_KEY = 'liuqingju_admin';
const ADMIN_USERS = [
    'admin@liuqingju.com'
];

const AdminService = {
    isAdmin() {
        const user = AuthService.getCurrentUser();
        return user && ADMIN_USERS.includes(user.email);
    },

    isSuperAdmin() {
        const user = AuthService.getCurrentUser();
        return user && user.email === 'admin@liuqingju.com';
    },

    getStats() {
        const users = AuthService.getUsers();
        const posts = ForumService.getPosts();
        const resources = ResourceService.getResources();
        const bounties = BountyService.getBounties();

        const today = new Date().toDateString();
        const todayActive = users.filter(u => u.lastLoginDate === today).length;

        return {
            totalUsers: users.length,
            totalPosts: posts.length,
            totalResources: resources.length,
            totalBounties: bounties.length,
            activeUsers: todayActive
        };
    },

    getAllUsers() {
        return AuthService.getUsers();
    },

    getUserById(userId) {
        const users = this.getAllUsers();
        return users.find(u => u.id === userId);
    },

    disableUser(userId) {
        const users = AuthService.getUsers();
        const index = users.findIndex(u => u.id === userId);
        if (index > -1) {
            users[index].disabled = true;
            AuthService.saveUsers(users);
            return true;
        }
        return false;
    },

    enableUser(userId) {
        const users = AuthService.getUsers();
        const index = users.findIndex(u => u.id === userId);
        if (index > -1) {
            users[index].disabled = false;
            AuthService.saveUsers(users);
            return true;
        }
        return false;
    },

    setAdmin(userId) {
        const users = AuthService.getUsers();
        const index = users.findIndex(u => u.id === userId);
        if (index > -1 && !ADMIN_USERS.includes(users[index].email)) {
            ADMIN_USERS.push(users[index].email);
            return true;
        }
        return false;
    },

    removeAdmin(userId) {
        const user = this.getUserById(userId);
        if (user && user.email === 'admin@liuqingju.com') {
            return false;
        }
        const index = ADMIN_USERS.indexOf(user?.email);
        if (index > -1) {
            ADMIN_USERS.splice(index, 1);
            return true;
        }
        return false;
    },

    deletePost(postId) {
        const posts = ForumService.getPosts();
        const index = posts.findIndex(p => p.id === postId);
        if (index > -1) {
            posts.splice(index, 1);
            ForumService.savePosts(posts);
            return true;
        }
        return false;
    },

    pinPost(postId) {
        const posts = ForumService.getPosts();
        const index = posts.findIndex(p => p.id === postId);
        if (index > -1) {
            posts[index].pinned = true;
            ForumService.savePosts(posts);
            return true;
        }
        return false;
    },

    unpinPost(postId) {
        const posts = ForumService.getPosts();
        const index = posts.findIndex(p => p.id === postId);
        if (index > -1) {
            posts[index].pinned = false;
            ForumService.savePosts(posts);
            return true;
        }
        return false;
    },

    deleteResource(resourceId) {
        const resources = ResourceService.getResources();
        const index = resources.findIndex(r => r.id === resourceId);
        if (index > -1) {
            resources.splice(index, 1);
            ResourceService.saveResources(resources);
            return true;
        }
        return false;
    },

    featureResource(resourceId) {
        const resources = ResourceService.getResources();
        const index = resources.findIndex(r => r.id === resourceId);
        if (index > -1) {
            resources[index].featured = true;
            ResourceService.saveResources(resources);
            return true;
        }
        return false;
    },

    unfeatureResource(resourceId) {
        const resources = ResourceService.getResources();
        const index = resources.findIndex(r => r.id === resourceId);
        if (index > -1) {
            resources[index].featured = false;
            ResourceService.saveResources(resources);
            return true;
        }
        return false;
    },

    deleteBounty(bountyId) {
        const bounties = BountyService.getBounties();
        const index = bounties.findIndex(b => b.id === bountyId);
        if (index > -1) {
            bounties.splice(index, 1);
            BountyService.saveBounties(bounties);
            return true;
        }
        return false;
    },

    closeBounty(bountyId) {
        const bounties = BountyService.getBounties();
        const index = bounties.findIndex(b => b.id === bountyId);
        if (index > -1) {
            bounties[index].status = 'closed';
            BountyService.saveBounties(bounties);
            return true;
        }
        return false;
    },

    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN');
    }
};

window.AdminService = AdminService;
```

---

### 任务 2: 改造 admin.html 页面

**Files:**
- 修改: `admin.html`

- [ ] **Step 1: 添加引用和服务初始化**

在 `<script>` 标签中添加：

```html
<script src="js/admin-service.js"></script>
<script src="js/forum-service.js"></script>
<script src="js/resource-service.js"></script>
<script src="js/bounty-service.js"></script>
```

- [ ] **Step 2: 添加权限检查**

在 script 开头添加：

```javascript
document.addEventListener('DOMContentLoaded', function() {
    if (!AdminService.isAdmin()) {
        alert('您没有权限访问此页面');
        window.location.href = 'index.html';
        return;
    }
    initAdmin();
});

function initAdmin() {
    renderSidebar();
    switchTab('dashboard');
}
```

- [ ] **Step 3: 添加侧边栏切换逻辑**

```javascript
function renderSidebar() {
    const navItems = document.querySelectorAll('.admin-nav li');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            const tab = item.dataset.tab;
            switchTab(tab);
        });
    });
}

function switchTab(tab) {
    const header = document.querySelector('.admin-header h1');
    const content = document.querySelector('.admin-content');

    switch (tab) {
        case 'dashboard':
            header.textContent = '数据总览';
            renderDashboard();
            break;
        case 'posts':
            header.textContent = '帖子管理';
            renderPosts();
            break;
        case 'resources':
            header.textContent = '资源管理';
            renderResources();
            break;
        case 'bounties':
            header.textContent = '悬赏管理';
            renderBounties();
            break;
        case 'users':
            header.textContent = '用户管理';
            renderUsers();
            break;
    }
}
```

- [ ] **Step 4: 添加数据统计模块**

```javascript
function renderDashboard() {
    const stats = AdminService.getStats();
    const content = document.querySelector('.admin-content');

    content.innerHTML = `
        <div class="admin-stats-grid">
            <div class="admin-stat-card">
                <div class="stat-icon blue">
                    <i class="fas fa-users"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-value">${stats.totalUsers}</div>
                    <div class="stat-label">用户总数</div>
                </div>
            </div>
            <div class="admin-stat-card">
                <div class="stat-icon orange">
                    <i class="fas fa-comments"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-value">${stats.totalPosts}</div>
                    <div class="stat-label">帖子总数</div>
                </div>
            </div>
            <div class="admin-stat-card">
                <div class="stat-icon green">
                    <i class="fas fa-book"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-value">${stats.totalResources}</div>
                    <div class="stat-label">资源总数</div>
                </div>
            </div>
            <div class="admin-stat-card">
                <div class="stat-icon purple">
                    <i class="fas fa-coins"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-value">${stats.totalBounties}</div>
                    <div class="stat-label">悬赏总数</div>
                </div>
            </div>
            <div class="admin-stat-card">
                <div class="stat-icon red">
                    <i class="fas fa-user-check"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-value">${stats.activeUsers}</div>
                    <div class="stat-label">今日活跃</div>
                </div>
            </div>
        </div>
    `;
}
```

- [ ] **Step 5: 添加帖子管理模块**

```javascript
function renderPosts() {
    const posts = ForumService.getPosts();
    const content = document.querySelector('.admin-content');

    if (posts.length === 0) {
        content.innerHTML = '<div class="admin-empty">暂无帖子</div>';
        return;
    }

    content.innerHTML = `
        <div class="admin-table-container">
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>标题</th>
                        <th>作者</th>
                        <th>发布时间</th>
                        <th>点赞</th>
                        <th>回复</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${posts.map(post => `
                        <tr>
                            <td>
                                <a href="forum.html?post=${post.id}" target="_blank">${post.title}</a>
                            </td>
                            <td>${post.author?.nickname || '匿名'}</td>
                            <td>${AdminService.formatDate(post.createdAt)}</td>
                            <td>${post.likes || 0}</td>
                            <td>${post.replies?.length || 0}</td>
                            <td>
                                <button class="admin-btn ${post.pinned ? 'active' : ''}" onclick="togglePinPost('${post.id}')">
                                    <i class="fas fa-thumbtack"></i> ${post.pinned ? '取消置顶' : '置顶'}
                                </button>
                                <button class="admin-btn danger" onclick="deletePost('${post.id}')">
                                    <i class="fas fa-trash"></i> 删除
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function togglePinPost(postId) {
    const posts = ForumService.getPosts();
    const post = posts.find(p => p.id === postId);
    if (post) {
        if (post.pinned) {
            AdminService.unpinPost(postId);
        } else {
            AdminService.pinPost(postId);
        }
        renderPosts();
    }
}

function deletePost(postId) {
    if (confirm('确定要删除这篇帖子吗？')) {
        AdminService.deletePost(postId);
        renderPosts();
    }
}
```

- [ ] **Step 6: 添加资源管理模块**

```javascript
function renderResources() {
    const resources = ResourceService.getResources();
    const content = document.querySelector('.admin-content');

    if (resources.length === 0) {
        content.innerHTML = '<div class="admin-empty">暂无资源</div>';
        return;
    }

    content.innerHTML = `
        <div class="admin-table-container">
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>标题</th>
                        <th>作者</th>
                        <th>类型</th>
                        <th>下载量</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${resources.map(resource => `
                        <tr>
                            <td>
                                <a href="resources.html?resource=${resource.id}" target="_blank">${resource.title}</a>
                            </td>
                            <td>${resource.author?.nickname || '匿名'}</td>
                            <td>${resource.type || '-'}</td>
                            <td>${resource.downloads || 0}</td>
                            <td>
                                <button class="admin-btn ${resource.featured ? 'active' : ''}" onclick="toggleFeatureResource('${resource.id}')">
                                    <i class="fas fa-star"></i> ${resource.featured ? '取消精选' : '设为精选'}
                                </button>
                                <button class="admin-btn danger" onclick="deleteResource('${resource.id}')">
                                    <i class="fas fa-trash"></i> 删除
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function toggleFeatureResource(resourceId) {
    const resources = ResourceService.getResources();
    const resource = resources.find(r => r.id === resourceId);
    if (resource) {
        if (resource.featured) {
            AdminService.unfeatureResource(resourceId);
        } else {
            AdminService.featureResource(resourceId);
        }
        renderResources();
    }
}

function deleteResource(resourceId) {
    if (confirm('确定要删除这个资源吗？')) {
        AdminService.deleteResource(resourceId);
        renderResources();
    }
}
```

- [ ] **Step 7: 添加悬赏管理模块**

```javascript
function renderBounties() {
    const bounties = BountyService.getBounties();
    const content = document.querySelector('.admin-content');

    if (bounties.length === 0) {
        content.innerHTML = '<div class="admin-empty">暂无悬赏</div>';
        return;
    }

    content.innerHTML = `
        <div class="admin-table-container">
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>标题</th>
                        <th>发布者</th>
                        <th>奖励积分</th>
                        <th>状态</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${bounties.map(bounty => `
                        <tr>
                            <td>
                                <a href="bounty.html?bounty=${bounty.id}" target="_blank">${bounty.title}</a>
                            </td>
                            <td>${bounty.poster?.nickname || bounty.author?.nickname || '匿名'}</td>
                            <td>${bounty.reward}</td>
                            <td>
                                <span class="status-badge ${bounty.status}">${getStatusText(bounty.status)}</span>
                            </td>
                            <td>
                                ${bounty.status === 'open' ? `
                                    <button class="admin-btn" onclick="closeBounty('${bounty.id}')">
                                        <i class="fas fa-times"></i> 关闭
                                    </button>
                                ` : ''}
                                <button class="admin-btn danger" onclick="deleteBounty('${bounty.id}')">
                                    <i class="fas fa-trash"></i> 删除
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function getStatusText(status) {
    const map = {
        'open': '进行中',
        'completed': '已完成',
        'closed': '已关闭'
    };
    return map[status] || status;
}

function closeBounty(bountyId) {
    if (confirm('确定要关闭这个悬赏吗？')) {
        AdminService.closeBounty(bountyId);
        renderBounties();
    }
}

function deleteBounty(bountyId) {
    if (confirm('确定要删除这个悬赏吗？')) {
        AdminService.deleteBounty(bountyId);
        renderBounties();
    }
}
```

- [ ] **Step 8: 添加用户管理模块**

```javascript
function renderUsers() {
    const users = AdminService.getAllUsers();
    const content = document.querySelector('.admin-content');

    if (users.length === 0) {
        content.innerHTML = '<div class="admin-empty">暂无用户</div>';
        return;
    }

    content.innerHTML = `
        <div class="admin-table-container">
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>用户</th>
                        <th>邮箱</th>
                        <th>等级</th>
                        <th>积分</th>
                        <th>注册时间</th>
                        <th>状态</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => {
                        const isAdmin = AdminService.isAdmin() && user.email === 'admin@liuqingju.com';
                        const level = typeof PointsService !== 'undefined' ? PointsService.getLevel(user.id) : { level: 1 };
                        const tokens = typeof PointsService !== 'undefined' ? PointsService.getBalance(user.id) : 0;
                        return `
                            <tr>
                                <td>
                                    <div class="user-cell">
                                        <img src="${user.avatar}" alt="${user.nickname}" class="user-avatar-sm">
                                        <span>${user.nickname}</span>
                                    </div>
                                </td>
                                <td>${user.email}</td>
                                <td>Lv.${level.level}</td>
                                <td>${tokens}</td>
                                <td>${AdminService.formatDate(user.createdAt)}</td>
                                <td>
                                    <span class="status-badge ${user.disabled ? 'disabled' : 'normal'}">
                                        ${user.disabled ? '禁用' : '正常'}
                                    </span>
                                </td>
                                <td>
                                    ${!isAdmin ? `
                                        ${user.disabled ? `
                                            <button class="admin-btn success" onclick="enableUser('${user.id}')">
                                                <i class="fas fa-check"></i> 启用
                                            </button>
                                        ` : `
                                            <button class="admin-btn warning" onclick="disableUser('${user.id}')">
                                                <i class="fas fa-ban"></i> 禁用
                                            </button>
                                        `}
                                    ` : '<span class="admin-tag">超级管理员</span>'}
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function disableUser(userId) {
    if (confirm('确定要禁用这个用户吗？')) {
        AdminService.disableUser(userId);
        renderUsers();
    }
}

function enableUser(userId) {
    AdminService.enableUser(userId);
    renderUsers();
}
```

- [ ] **Step 9: 添加表格样式**

```css
.admin-stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
}

.admin-stat-card {
    background: white;
    border-radius: 12px;
    padding: 24px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: var(--shadow-sm);
}

.stat-icon {
    width: 56px;
    height: 56px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    color: white;
}

.stat-icon.blue { background: linear-gradient(135deg, #1890ff, #69c0ff); }
.stat-icon.orange { background: linear-gradient(135deg, #fa8c16, #ffad42); }
.stat-icon.green { background: linear-gradient(135deg, #52c41a, #95de64); }
.stat-icon.purple { background: linear-gradient(135deg, #722ed1, #b37feb); }
.stat-icon.red { background: linear-gradient(135deg, #f5222d, #ff7875); }

.stat-value {
    font-size: 28px;
    font-weight: 700;
    color: var(--text-primary);
}

.stat-label {
    font-size: 14px;
    color: var(--text-secondary);
}

.admin-table-container {
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: var(--shadow-sm);
}

.admin-table {
    width: 100%;
    border-collapse: collapse;
}

.admin-table th {
    background: var(--bg-light);
    padding: 14px 16px;
    text-align: left;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-secondary);
}

.admin-table td {
    padding: 14px 16px;
    border-bottom: 1px solid #f0f0f0;
    font-size: 14px;
}

.admin-table tr:last-child td {
    border-bottom: none;
}

.admin-table a {
    color: var(--primary-color);
    text-decoration: none;
}

.admin-table a:hover {
    text-decoration: underline;
}

.user-cell {
    display: flex;
    align-items: center;
    gap: 10px;
}

.user-avatar-sm {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
}

.status-badge {
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
}

.status-badge.open,
.status-badge.normal {
    background: #f6ffed;
    color: #52c41a;
}

.status-badge.completed {
    background: #e6f7ff;
    color: #1890ff;
}

.status-badge.closed,
.status-badge.disabled {
    background: #fff1f0;
    color: #ff4d4f;
}

.admin-btn {
    padding: 6px 12px;
    border: none;
    border-radius: 6px;
    font-size: 12px;
    cursor: pointer;
    background: var(--bg-light);
    color: var(--text-secondary);
    margin-right: 6px;
    transition: all 0.2s ease;
}

.admin-btn:hover {
    background: var(--border-color);
}

.admin-btn.danger {
    background: #fff1f0;
    color: #ff4d4f;
}

.admin-btn.danger:hover {
    background: #ff4d4f;
    color: white;
}

.admin-btn.success {
    background: #f6ffed;
    color: #52c41a;
}

.admin-btn.success:hover {
    background: #52c41a;
    color: white;
}

.admin-btn.warning {
    background: #fff7e6;
    color: #fa8c16;
}

.admin-btn.active {
    background: var(--primary-color);
    color: white;
}

.admin-tag {
    font-size: 12px;
    color: var(--primary-color);
    font-weight: 500;
}

.admin-empty {
    text-align: center;
    padding: 60px 20px;
    color: var(--text-light);
    font-size: 15px;
}

.admin-nav li {
    cursor: pointer;
}
```

---

### 任务 3: 添加用户菜单管理入口

**Files:**
- 修改: `js/user-menu.js`

- [ ] **Step 1: 添加管理入口到下拉菜单**

在 renderLoggedIn() 方法中，在"退出登录"之前添加：

```javascript
// 检查是否是管理员
if (typeof AdminService !== 'undefined' && AdminService.isAdmin()) {
    // 在 dropdown-divider 后、logout-btn 前添加
    const divider = dropdown.querySelector('.dropdown-divider');
    const adminLink = document.createElement('a');
    adminLink.href = 'admin.html';
    adminLink.className = 'dropdown-item';
    adminLink.innerHTML = '<i class="fas fa-cog"></i> 管理后台';
    divider.after(adminLink);
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
