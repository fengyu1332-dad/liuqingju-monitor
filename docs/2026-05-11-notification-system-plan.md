# 留情局消息通知系统实施计划

> **For agentic workers:** 使用 executing-plans skill 来执行此计划的任务。

**Goal:** 实现消息通知系统，包括通知服务、UI入口和业务集成

**Architecture:** 基于 localStorage 的轻量级通知系统，通过 NotificationService 统一管理消息的发送、读取和展示

**Tech Stack:** 原生 JavaScript，localStorage，无外部依赖

---

## 文件结构

```
js/
  ├── notification-service.js    # 新建：通知服务
  ├── user-menu.js               # 修改：添加通知入口
  ├── forum-service.js           # 修改：集成帖子回复通知
  ├── resource-service.js         # 修改：集成资源下载通知
  ├── bounty-service.js           # 修改：集成悬赏通知
  └── points-service.js           # 修改：集成积分变动通知

index.html, forum.html, resources.html, bounty.html  # 修改：添加通知入口
```

---

## 任务列表

### 任务 1: 创建 notification-service.js

**Files:**
- 创建: `js/notification-service.js`

- [ ] **Step 1: 创建通知服务基础结构**

```javascript
const NOTIFICATION_KEY = 'liuqingju_notifications';

const NOTIFICATION_TYPES = {
    post_reply: { title: '新回复通知', icon: 'fa-comment' },
    resource_download: { title: '资源下载通知', icon: 'fa-download' },
    bounty_response: { title: '悬赏响应通知', icon: 'fa-hand-paper' },
    bounty_accepted: { title: '悬赏采纳通知', icon: 'fa-check-circle' },
    bounty_completed: { title: '悬赏完成通知', icon: 'fa-flag-checkered' },
    points_change: { title: '积分变动通知', icon: 'fa-coins' },
    level_up: { title: '等级提升通知', icon: 'fa-arrow-up' }
};

const NotificationService = {
    generateId() {
        return 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    getNotifications(userId) {
        const data = localStorage.getItem(NOTIFICATION_KEY);
        if (!data) return [];
        const notifications = JSON.parse(data);
        return notifications.filter(n => n.userId === userId)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    send(userId, type, title, content, relatedId = null, relatedType = null) {
        const data = localStorage.getItem(NOTIFICATION_KEY);
        const notifications = data ? JSON.parse(data) : [];

        const notification = {
            id: this.generateId(),
            userId,
            type,
            title,
            content,
            relatedId,
            relatedType,
            isRead: false,
            createdAt: new Date().toISOString()
        };

        notifications.push(notification);

        // 只保留最近100条
        const userNotifications = notifications.filter(n => n.userId === userId);
        if (userNotifications.length > 100) {
            userNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            const toDelete = userNotifications.slice(100);
            toDelete.forEach(n => {
                const idx = notifications.findIndex(x => x.id === n.id);
                if (idx > -1) notifications.splice(idx, 1);
            });
        }

        localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(notifications));

        window.dispatchEvent(new CustomEvent('notificationUpdated', {
            detail: { userId }
        }));

        return notification;
    },

    getUnreadCount(userId) {
        const notifications = this.getNotifications(userId);
        return notifications.filter(n => !n.isRead).length;
    },

    markAsRead(notificationId) {
        const data = localStorage.getItem(NOTIFICATION_KEY);
        if (!data) return;
        const notifications = JSON.parse(data);
        const index = notifications.findIndex(n => n.id === notificationId);
        if (index > -1) {
            notifications[index].isRead = true;
            localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(notifications));
        }
    },

    markAllAsRead(userId) {
        const data = localStorage.getItem(NOTIFICATION_KEY);
        if (!data) return;
        const notifications = JSON.parse(data);
        notifications.forEach(n => {
            if (n.userId === userId) n.isRead = true;
        });
        localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(notifications));
    },

    deleteNotification(notificationId) {
        const data = localStorage.getItem(NOTIFICATION_KEY);
        if (!data) return;
        const notifications = JSON.parse(data);
        const index = notifications.findIndex(n => n.id === notificationId);
        if (index > -1) {
            notifications.splice(index, 1);
            localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(notifications));
        }
    },

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (minutes < 1) return '刚刚';
        if (minutes < 60) return minutes + '分钟前';
        if (hours < 24) return hours + '小时前';
        if (days < 7) return days + '天前';
        return date.toLocaleDateString('zh-CN');
    }
};

window.NotificationService = NotificationService;
```

- [ ] **Step 2: 添加便捷触发方法**

在 NotificationService 中添加以下方法（放在 generateId 方法之前）：

```javascript
    onPostReply(postAuthorId, replierName, postTitle, postId) {
        const type = NOTIFICATION_TYPES.post_reply;
        this.send(
            postAuthorId,
            'post_reply',
            type.title,
            `${replierName} 回复了你的帖子《${postTitle}》`,
            postId,
            'post'
        );
    },

    onResourceDownload(authorId, downloaderName, resourceTitle, resourceId) {
        const type = NOTIFICATION_TYPES.resource_download;
        this.send(
            authorId,
            'resource_download',
            type.title,
            `${downloaderName} 下载了你的资源《${resourceTitle}》`,
            resourceId,
            'resource'
        );
    },

    onBountyResponse(bountyOwnerId, responderName, bountyTitle, bountyId) {
        const type = NOTIFICATION_TYPES.bounty_response;
        this.send(
            bountyOwnerId,
            'bounty_response',
            type.title,
            `${responderName} 响应了你的悬赏《${bountyTitle}》`,
            bountyId,
            'bounty'
        );
    },

    onBountyAccepted(responderId, bountyTitle, reward) {
        const type = NOTIFICATION_TYPES.bounty_accepted;
        this.send(
            responderId,
            'bounty_accepted',
            type.title,
            `恭喜！你的响应被悬赏者采纳，获得 ${reward} 积分`,
            null,
            'bounty'
        );
    },

    onBountyCompleted(bountyOwnerId, bountyTitle, bountyId) {
        const type = NOTIFICATION_TYPES.bounty_completed;
        this.send(
            bountyOwnerId,
            'bounty_completed',
            type.title,
            `你的悬赏《${bountyTitle}》已被完成`,
            bountyId,
            'bounty'
        );
    },

    onPointsChange(userId, amount, description) {
        const type = NOTIFICATION_TYPES.points_change;
        const sign = amount > 0 ? '+' : '';
        this.send(
            userId,
            'points_change',
            type.title,
            `${description}：${sign}${amount} 积分`,
            null,
            'points'
        );
    },

    onLevelUp(userId, level, title) {
        const type = NOTIFICATION_TYPES.level_up;
        this.send(
            userId,
            'level_up',
            type.title,
            `恭喜！你已升级为 Lv.${level} ${title}`,
            null,
            'user'
        );
    },
```

---

### 任务 2: 修改 user-menu.js，添加通知入口

**Files:**
- 修改: `js/user-menu.js`

- [ ] **Step 1: 添加通知按钮到导航栏**

在 renderLoggedIn() 方法的 this.container.innerHTML 中，在用户菜单按钮之前添加通知按钮：

```javascript
// 在 '<div class="user-menu-wrapper">' 之前添加
let unreadCount = 0;
if (typeof NotificationService !== 'undefined') {
    unreadCount = NotificationService.getUnreadCount(this.user.id);
}

this.container.innerHTML = `
    <div class="notification-btn" id="notification-btn" style="position: relative; cursor: pointer; margin-right: 15px;">
        <i class="fas fa-bell" style="font-size: 18px; color: var(--text-color);"></i>
        ${unreadCount > 0 ? `<span class="notification-badge">${unreadCount > 99 ? '99+' : unreadCount}</span>` : ''}
    </div>
    <div class="user-menu-wrapper">
        ...现有的用户菜单代码...
    </div>
    <div class="notification-dropdown" id="notification-dropdown" style="display: none; position: absolute; top: 100%; right: 0; background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); width: 320px; max-height: 400px; overflow-y: auto; z-index: 1000;">
        <div style="padding: 12px 16px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
            <strong>消息中心</strong>
            <button id="mark-all-read" style="background: none; border: none; color: var(--primary-color); cursor: pointer; font-size: 12px;">全部已读</button>
        </div>
        <div id="notification-list" style="max-height: 340px; overflow-y: auto;"></div>
    </div>
`;
```

- [ ] **Step 2: 添加 CSS 样式**

在 user-menu.js 文件顶部添加样式：

```javascript
// 在 class UserMenu 之前添加
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    .notification-badge {
        position: absolute;
        top: -6px;
        right: -6px;
        background: #ff4d4f;
        color: white;
        font-size: 10px;
        border-radius: 50%;
        min-width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
    }
    .notification-item {
        padding: 12px 16px;
        border-bottom: 1px solid #f0f0f0;
        cursor: pointer;
        transition: background 0.2s;
    }
    .notification-item:hover {
        background: #fafafa;
    }
    .notification-item.unread {
        background: #fff7e6;
    }
    .notification-item.unread:hover {
        background: #fff3cc;
    }
    .notification-title {
        font-size: 13px;
        font-weight: 600;
        color: #333;
        margin-bottom: 4px;
    }
    .notification-content {
        font-size: 12px;
        color: #666;
        margin-bottom: 4px;
    }
    .notification-time {
        font-size: 11px;
        color: #999;
    }
    .notification-empty {
        padding: 40px 20px;
        text-align: center;
        color: #999;
    }
    .notification-icon {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-right: 8px;
        font-size: 12px;
    }
`;
document.head.appendChild(notificationStyles);
```

- [ ] **Step 3: 添加通知事件绑定**

在 bindLoggedInEvents() 方法中添加通知相关事件：

```javascript
bindLoggedInEvents() {
    const notificationBtn = document.getElementById('notification-btn');
    const notificationDropdown = document.getElementById('notification-dropdown');
    const markAllReadBtn = document.getElementById('mark-all-read');

    if (notificationBtn && notificationDropdown) {
        notificationBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleNotificationDropdown();
        });

        document.addEventListener('click', (e) => {
            if (!notificationDropdown.contains(e.target) && e.target !== notificationBtn) {
                notificationDropdown.style.display = 'none';
            }
        });
    }

    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', () => {
            if (typeof NotificationService !== 'undefined') {
                NotificationService.markAllAsRead(this.user.id);
                this.updateNotificationBadge();
                this.renderNotificationList();
            }
        });
    }

    // 监听通知更新
    window.addEventListener('notificationUpdated', () => {
        this.updateNotificationBadge();
        this.renderNotificationList();
    });

    // 现有的登出等事件...
}
```

- [ ] **Step 4: 添加通知相关方法**

在 renderLoggedOut() 方法之前添加：

```javascript
toggleNotificationDropdown() {
    const dropdown = document.getElementById('notification-dropdown');
    if (dropdown.style.display === 'none') {
        this.renderNotificationList();
        dropdown.style.display = 'block';
    } else {
        dropdown.style.display = 'none';
    }
}

updateNotificationBadge() {
    const badge = document.querySelector('.notification-badge');
    if (typeof NotificationService !== 'undefined' && this.user) {
        const unreadCount = NotificationService.getUnreadCount(this.user.id);
        if (badge) {
            if (unreadCount > 0) {
                badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        } else {
            const btn = document.getElementById('notification-btn');
            if (btn && unreadCount > 0) {
                const newBadge = document.createElement('span');
                newBadge.className = 'notification-badge';
                newBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
                btn.appendChild(newBadge);
            }
        }
    }
}

renderNotificationList() {
    const list = document.getElementById('notification-list');
    if (!list || !this.user) return;

    if (typeof NotificationService === 'undefined') {
        list.innerHTML = '<div class="notification-empty">通知服务加载中...</div>';
        return;
    }

    const notifications = NotificationService.getNotifications(this.user.id);

    if (notifications.length === 0) {
        list.innerHTML = '<div class="notification-empty"><i class="fas fa-bell-slash" style="font-size: 32px; margin-bottom: 10px;"></i><br>暂无通知</div>';
        return;
    }

    const typeIcons = {
        post_reply: { icon: 'fa-comment', bg: '#1890ff' },
        resource_download: { icon: 'fa-download', bg: '#52c41a' },
        bounty_response: { icon: 'fa-hand-paper', bg: '#faad14' },
        bounty_accepted: { icon: 'fa-check-circle', bg: '#52c41a' },
        bounty_completed: { icon: 'fa-flag-checkered', bg: '#722ed1' },
        points_change: { icon: 'fa-coins', bg: '#D4A574' },
        level_up: { icon: 'fa-arrow-up', bg: '#ff4d4f' }
    };

    list.innerHTML = notifications.map(n => {
        const typeInfo = typeIcons[n.type] || { icon: 'fa-bell', bg: '#999' };
        return `
            <div class="notification-item ${n.isRead ? '' : 'unread'}" 
                 onclick="handleNotificationClick('${n.id}', '${n.relatedType}', '${n.relatedId}')">
                <div style="display: flex; align-items: center; margin-bottom: 6px;">
                    <span class="notification-icon" style="background: ${typeInfo.bg}; color: white;">
                        <i class="fas ${typeInfo.icon}"></i>
                    </span>
                    <span class="notification-title">${n.title}</span>
                </div>
                <div class="notification-content">${n.content}</div>
                <div class="notification-time">${NotificationService.formatDate(n.createdAt)}</div>
            </div>
        `;
    }).join('');
}
```

- [ ] **Step 5: 添加全局点击处理函数**

在文件末尾（window.UserMenu = UserMenu; 之前）添加：

```javascript
window.handleNotificationClick = function(notificationId, relatedType, relatedId) {
    if (typeof NotificationService !== 'undefined') {
        NotificationService.markAsRead(notificationId);
    }
    
    const dropdown = document.getElementById('notification-dropdown');
    if (dropdown) dropdown.style.display = 'none';

    if (relatedType && relatedId) {
        let targetUrl = '';
        switch (relatedType) {
            case 'post':
                targetUrl = `forum.html?post=${relatedId}`;
                break;
            case 'resource':
                targetUrl = `resources.html?resource=${relatedId}`;
                break;
            case 'bounty':
                targetUrl = `bounty.html?bounty=${relatedId}`;
                break;
            default:
                return;
        }
        window.location.href = targetUrl;
    }
};
```

---

### 任务 3: 在 forum-service.js 集成帖子回复通知

**Files:**
- 修改: `js/forum-service.js`

- [ ] **Step 1: 在 addReply 方法中添加通知**

找到 addReply 方法，在保存回复后添加通知发送：

```javascript
addReply(postId, replyData) {
    // ... 现有的保存回复代码 ...
    
    const newReply = { /* ... */ };
    replies.push(newReply);
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(allComments));

    // 新增：发送帖子作者通知
    if (post.author && post.author.id && replyData.author.id !== post.author.id) {
        if (typeof NotificationService !== 'undefined') {
            NotificationService.onPostReply(
                post.author.id,
                replyData.author.nickname,
                post.title,
                postId
            );
        }
    }

    return newReply;
}
```

---

### 任务 4: 在 resource-service.js 集成资源下载通知

**Files:**
- 修改: `js/resource-service.js`

- [ ] **Step 1: 在 downloadResource 方法中添加通知**

找到 downloadResource 方法，在给作者增加积分后添加通知：

```javascript
// 在 resources[index].author.id 的判断内，PointsService.addTokens 之后添加：
if (resources[index].author && resources[index].author.id) {
    const authorReward = Math.floor(10 * 0.7);
    PointsService.addTokens(
        resources[index].author.id,
        authorReward,
        'resource_downloaded',
        `资源被下载：${resources[index].title}（已扣除30%运营费）`,
        id
    );
    
    // 新增：发送下载通知给作者
    if (downloaderId !== resources[index].author.id) {
        if (typeof NotificationService !== 'undefined') {
            NotificationService.onResourceDownload(
                resources[index].author.id,
                currentUser?.nickname || '某用户',
                resources[index].title,
                id
            );
        }
    }
}
```

注意：需要同时修改 downloadResource 方法签名，添加 currentUser 参数：

```javascript
downloadResource(downloaderId, id) {
    // 方法开头获取 currentUser
    const currentUser = AuthService.getCurrentUser();
    // ... 其余代码 ...
}
```

然后在 resources.html 的 viewResource 中传入 currentUser：

```javascript
// resources.html 中的修改
const currentUser = AuthService.getCurrentUser();
// ...
const result = ResourceService.downloadResource(currentUser.id, id);
// ...
```

---

### 任务 5: 在 bounty-service.js 集成悬赏通知

**Files:**
- 修改: `js/bounty-service.js`

- [ ] **Step 1: 添加 addResponse 方法中的通知**

找到或创建 addResponse 方法，添加响应通知：

```javascript
addResponse(bountyId, response) {
    const bounties = this.getBounties();
    const index = bounties.findIndex(b => b.id === bountyId);
    if (index === -1) return false;

    if (!bounties[index].responses) {
        bounties[index].responses = [];
    }
    bounties[index].responses.push(response);
    localStorage.setItem(BOUNTIES_KEY, JSON.stringify(bounties));

    // 新增：发送响应通知给悬赏发布者
    if (bounties[index].poster && bounties[index].poster.id) {
        if (typeof NotificationService !== 'undefined') {
            NotificationService.onBountyResponse(
                bounties[index].poster.id,
                response.author.nickname,
                bounties[index].title,
                bountyId
            );
        }
    }

    return true;
}
```

---

### 任务 6: 在 bounty.html 集成悬赏采纳通知

**Files:**
- 修改: `bounty.html`

- [ ] **Step 1: 在 acceptResponse 函数中添加通知**

找到 acceptResponse 函数，在完成悬赏后添加通知：

```javascript
function acceptResponse(bountyId, responseId) {
    // ... 现有的完成悬赏代码 ...

    if (typeof PointsService !== 'undefined') {
        PointsService.addTokens(
            response.author.id,
            bounty.reward,
            'bounty_completed',
            `完成悬赏：${bounty.title}`,
            bountyId
        );
        
        // 新增：发送采纳通知给响应者
        if (typeof NotificationService !== 'undefined') {
            NotificationService.onBountyAccepted(
                response.author.id,
                bounty.title,
                bounty.reward
            );
        }
    }

    BountyService.acceptResponse(bountyId, responseId);
    // ...
}
```

---

### 任务 7: 在 points-service.js 集成积分变动通知

**Files:**
- 修改: `js/points-service.js`

- [ ] **Step 1: 在 addTokens 方法中添加通知**

找到 addTokens 方法，在成功添加积分后添加通知：

```javascript
addTokens(userId, amount, type, description, relatedId = null) {
    // ... 现有的添加积分代码 ...
    
    AuthService.saveUsers(users);

    // 新增：发送积分变动通知（忽略点赞等小额变动）
    if (amount > 0 && !['post_liked'].includes(type)) {
        if (typeof NotificationService !== 'undefined') {
            NotificationService.onPointsChange(userId, amount, description);
        }
    }

    // ... 其余代码 ...
}
```

- [ ] **Step 2: 在 deductTokens 方法中添加通知**

找到 deductTokens 方法，在成功扣除积分后添加通知：

```javascript
deductTokens(userId, amount, type, description, relatedId = null) {
    // ... 现有的扣除积分代码 ...
    
    AuthService.saveUsers(users);

    // 新增：发送积分扣除通知
    if (typeof NotificationService !== 'undefined') {
        NotificationService.onPointsChange(userId, -amount, description);
    }

    // ... 其余代码 ...
}
```

---

### 任务 8: 测试验证

**Files:**
- 测试文件: `index.html`, `forum.html`, `resources.html`, `bounty.html`

- [ ] **Step 1: 测试通知服务**

1. 打开 index.html，确保通知按钮显示正常
2. 登录账号，确认未读数为 0
3. 在其他账号发布帖子，用当前账号回复，确认收到通知
4. 检查通知列表是否正确显示

- [ ] **Step 2: 测试积分通知**

1. 每日登录，检查是否有积分变动通知
2. 发布帖子，检查是否有积分通知
3. 下载资源，检查积分通知

- [ ] **Step 3: 测试悬赏通知**

1. 发布悬赏，检查是否正常
2. 用另一账号响应悬赏
3. 采纳响应，检查通知

---

## 自我审查清单

- [x] 设计文档中的所有功能都有对应的任务
- [x] 没有 placeholder (TBD/TODO)
- [x] 类型、方法名在所有任务中一致
- [x] 每个任务都是独立的、可测试的

---

**Plan complete!**
