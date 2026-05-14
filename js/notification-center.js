class NotificationCenter {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.isOpen = false;
        this.unreadCount = 0;
        this.init();
    }

    init() {
        this.createNotificationUI();
        this.bindEvents();
        this.updateUnreadCount();
    }

    createNotificationUI() {
        const notificationUI = `
            <div class="notification-wrapper">
                <button class="notification-btn" id="notification-btn" title="通知">
                    <i class="fas fa-bell"></i>
                    <span class="notification-badge" id="notification-badge" style="display: none;">0</span>
                </button>
                
                <div class="notification-dropdown" id="notification-dropdown">
                    <div class="notification-header">
                        <h3>通知</h3>
                        <div class="notification-actions">
                            <button class="notification-action-btn" id="mark-all-read" title="全部标为已读">
                                <i class="fas fa-check-double"></i>
                            </button>
                            <button class="notification-action-btn" id="notification-settings" title="通知设置">
                                <i class="fas fa-cog"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="notification-tabs">
                        <button class="notification-tab active" data-tab="all">
                            <i class="fas fa-list"></i>
                            全部
                        </button>
                        <button class="notification-tab" data-tab="互动">
                            <i class="fas fa-heart"></i>
                            互动
                        </button>
                        <button class="notification-tab" data-tab="系统">
                            <i class="fas fa-cog"></i>
                            系统
                        </button>
                    </div>
                    
                    <div class="notification-list" id="notification-list">
                        <div class="notification-loading">
                            <i class="fas fa-spinner fa-spin"></i>
                            加载中...
                        </div>
                    </div>
                    
                    <div class="notification-footer">
                        <a href="notifications.html">查看全部通知</a>
                    </div>
                </div>
            </div>
        `;

        this.container.insertAdjacentHTML('beforeend', notificationUI);
        
        this.notificationBtn = document.getElementById('notification-btn');
        this.notificationBadge = document.getElementById('notification-badge');
        this.notificationDropdown = document.getElementById('notification-dropdown');
        this.notificationList = document.getElementById('notification-list');
    }

    bindEvents() {
        this.notificationBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDropdown();
        });

        document.getElementById('mark-all-read')?.addEventListener('click', () => {
            this.markAllAsRead();
        });

        document.querySelectorAll('.notification-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchTab(tab.dataset.tab);
            });
        });

        document.addEventListener('click', (e) => {
            if (!this.notificationDropdown.contains(e.target)) {
                this.closeDropdown();
            }
        });

        window.addEventListener('notificationAdded', () => {
            this.updateUnreadCount();
            this.refreshNotifications();
        });

        window.addEventListener('allNotificationsRead', () => {
            this.updateUnreadCount();
        });
    }

    toggleDropdown() {
        if (this.isOpen) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }

    openDropdown() {
        this.isOpen = true;
        this.notificationDropdown.classList.add('active');
        this.notificationBtn.classList.add('active');
        this.refreshNotifications();
    }

    closeDropdown() {
        this.isOpen = false;
        this.notificationDropdown.classList.remove('active');
        this.notificationBtn.classList.remove('active');
    }

    updateUnreadCount() {
        const currentUser = AuthService.getCurrentUser();
        if (!currentUser) {
            this.notificationBadge.style.display = 'none';
            return;
        }

        const count = NotificationService.getUnreadCount(currentUser.id);
        this.unreadCount = count;

        if (count > 0) {
            this.notificationBadge.textContent = count > 99 ? '99+' : count;
            this.notificationBadge.style.display = 'inline-block';
            this.notificationBtn.classList.add('has-unread');
        } else {
            this.notificationBadge.style.display = 'none';
            this.notificationBtn.classList.remove('has-unread');
        }
    }

    refreshNotifications() {
        const currentUser = AuthService.getCurrentUser();
        if (!currentUser) {
            this.notificationList.innerHTML = `
                <div class="notification-empty">
                    <i class="fas fa-bell-slash"></i>
                    <p>请先登录</p>
                </div>
            `;
            return;
        }

        const notifications = NotificationService.getNotifications(currentUser.id);
        
        if (notifications.length === 0) {
            this.notificationList.innerHTML = `
                <div class="notification-empty">
                    <i class="fas fa-bell-slash"></i>
                    <p>暂无通知</p>
                </div>
            `;
            return;
        }

        this.notificationList.innerHTML = notifications.slice(0, 20).map(notification => {
            const config = NotificationService.getNotificationConfig(notification.type);
            const timeAgo = NotificationService.formatDate(notification.createdAt);
            const readClass = notification.read ? 'read' : 'unread';

            return `
                <div class="notification-item ${readClass}" data-id="${notification.id}">
                    <div class="notification-icon ${notification.type}">
                        ${config.icon || '🔔'}
                    </div>
                    <div class="notification-content">
                        <p class="notification-message">${notification.message}</p>
                        <span class="notification-time">${timeAgo}</span>
                    </div>
                    <div class="notification-actions">
                        ${!notification.read ? `
                            <button class="notification-mark-read" data-id="${notification.id}" title="标为已读">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                        <button class="notification-delete" data-id="${notification.id}" title="删除">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        this.notificationList.querySelectorAll('.notification-mark-read').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.markAsRead(btn.dataset.id);
            });
        });

        this.notificationList.querySelectorAll('.notification-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteNotification(btn.dataset.id);
            });
        });

        this.notificationList.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', () => {
                this.handleNotificationClick(item.dataset.id);
            });
        });
    }

    switchTab(tab) {
        document.querySelectorAll('.notification-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tab);
        });
        
        const currentUser = AuthService.getCurrentUser();
        if (!currentUser) return;

        let notifications = NotificationService.getNotifications(currentUser.id);

        if (tab !== 'all') {
            const typeMap = {
                '互动': ['post_reply', 'resource_download', 'bounty_response', 'bounty_accepted'],
                '系统': ['points_change', 'level_up', 'system']
            };
            const allowedTypes = typeMap[tab] || [];
            notifications = notifications.filter(n => allowedTypes.includes(n.type));
        }

        if (notifications.length === 0) {
            this.notificationList.innerHTML = `
                <div class="notification-empty">
                    <i class="fas fa-bell-slash"></i>
                    <p>暂无通知</p>
                </div>
            `;
            return;
        }

        this.notificationList.innerHTML = notifications.slice(0, 20).map(notification => {
            const config = NotificationService.getNotificationConfig(notification.type);
            const timeAgo = NotificationService.formatDate(notification.createdAt);
            const readClass = notification.read ? 'read' : 'unread';

            return `
                <div class="notification-item ${readClass}" data-id="${notification.id}">
                    <div class="notification-icon ${notification.type}">
                        ${config.icon || '🔔'}
                    </div>
                    <div class="notification-content">
                        <p class="notification-message">${notification.message}</p>
                        <span class="notification-time">${timeAgo}</span>
                    </div>
                    <div class="notification-actions">
                        ${!notification.read ? `
                            <button class="notification-mark-read" data-id="${notification.id}" title="标为已读">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                        <button class="notification-delete" data-id="${notification.id}" title="删除">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    markAsRead(notificationId) {
        NotificationService.markAsRead(notificationId);
        this.updateUnreadCount();
        this.refreshNotifications();
    }

    markAllAsRead() {
        const currentUser = AuthService.getCurrentUser();
        if (!currentUser) return;

        NotificationService.markAllAsRead(currentUser.id);
        this.updateUnreadCount();
        this.refreshNotifications();
    }

    deleteNotification(notificationId) {
        NotificationService.deleteNotification(notificationId);
        this.updateUnreadCount();
        this.refreshNotifications();
    }

    handleNotificationClick(notificationId) {
        const notifications = NotificationService.getNotifications(AuthService.getCurrentUser()?.id);
        const notification = notifications.find(n => n.id === notificationId);
        
        if (!notification.read) {
            this.markAsRead(notificationId);
        }

        if (notification.data) {
            switch (notification.type) {
                case 'post_reply':
                    if (notification.data.postId) {
                        window.location.href = `forum.html?post=${notification.data.postId}`;
                    }
                    break;
                case 'resource_download':
                    if (notification.data.resourceId) {
                        window.location.href = `resources.html?resource=${notification.data.resourceId}`;
                    }
                    break;
                case 'bounty_response':
                case 'bounty_accepted':
                case 'bounty_completed':
                    if (notification.data.bountyId) {
                        window.location.href = `bounty.html?bounty=${notification.data.bountyId}`;
                    }
                    break;
            }
        }
    }
}

function initNotificationCenter(containerId) {
    if (window.notificationCenterInstance) {
        return window.notificationCenterInstance;
    }
    
    window.notificationCenterInstance = new NotificationCenter(containerId);
    return window.notificationCenterInstance;
}

window.NotificationCenter = NotificationCenter;
window.initNotificationCenter = initNotificationCenter;
