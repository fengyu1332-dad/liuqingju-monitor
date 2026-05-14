class UserMenu {
    constructor(containerId) {
        this.containerId = containerId;
        this.user = null;
        this.isOpen = false;
        this.isNotificationOpen = false;
        this.container = null;
        this.notifications = [];
        this.unreadCount = 0;
        this.init();
    }

    init() {
        this.container = document.getElementById(this.containerId);
        if (!this.container) {
            console.error('UserMenu: Container not found');
            return;
        }
        this.updateState();
        this.bindEvents();
    }

    bindEvents() {
        window.addEventListener('authSuccess', () => {
            this.updateState();
        });

        window.addEventListener('authChange', () => {
            this.updateState();
        });

        window.addEventListener('notificationAdded', () => {
            if (this.user) {
                this.loadNotifications();
            }
        });

        window.addEventListener('allNotificationsRead', () => {
            if (this.user) {
                this.loadNotifications();
            }
        });

        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target)) {
                this.closeDropdown();
                this.closeNotificationPanel();
            }
        });
    }

    loadNotifications() {
        if (typeof NotificationService !== 'undefined' && this.user) {
            this.notifications = NotificationService.getNotifications(this.user.id);
            this.unreadCount = NotificationService.getUnreadCount(this.user.id);
            this.updateNotificationBadge();
        }
    }

    updateNotificationBadge() {
        const badge = document.getElementById('notification-badge');
        if (badge) {
            if (this.unreadCount > 0) {
                badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
                badge.classList.add('active');
            } else {
                badge.classList.remove('active');
            }
        }
    }

    updateState() {
        this.user = AuthService.getCurrentUser();
        if (this.user) {
            this.loadNotifications();
            this.renderLoggedIn();
        } else {
            this.renderLoggedOut();
        }
    }

    renderLoggedIn() {
        let levelInfo = { level: 1, title: '新手', icon: '⭐' };
        let tokens = 0;
        let contributionValue = 0;

        if (typeof PointsService !== 'undefined') {
            levelInfo = PointsService.getLevel(this.user.id);
            tokens = PointsService.getBalance(this.user.id);
            contributionValue = PointsService.getContributionValue(this.user.id);
        }

        this.container.innerHTML = `
            <div class="user-menu-wrapper">
                <div class="notification-wrapper">
                    <button class="notification-trigger" id="notification-trigger">
                        <i class="fas fa-bell"></i>
                        <span class="notification-badge" id="notification-badge">${this.unreadCount > 0 ? (this.unreadCount > 99 ? '99+' : this.unreadCount) : ''}</span>
                    </button>
                    <div class="notification-panel" id="notification-panel">
                        <div class="notification-header">
                            <h3>通知</h3>
                            <button class="mark-all-read" id="mark-all-read">全部已读</button>
                        </div>
                        <div class="notification-list" id="notification-list">
                            ${this.renderNotificationList()}
                        </div>
                        ${this.notifications.length === 0 ? '<div class="empty-notifications">暂无通知</div>' : ''}
                    </div>
                </div>
                <button class="user-menu-trigger" id="user-menu-trigger">
                    <img src="${this.user.avatar}" alt="${this.user.nickname}" class="user-avatar">
                    <span class="user-name">${this.user.nickname}</span>
                    <span class="user-level-badge">Lv.${levelInfo.level} ${levelInfo.icon}</span>
                    <span class="user-points">积分: ${tokens}</span>
                    <i class="fas fa-chevron-down"></i>
                </button>
                <div class="user-dropdown" id="user-dropdown">
                    <div class="dropdown-header">
                        <img src="${this.user.avatar}" alt="${this.user.nickname}" class="dropdown-avatar">
                        <div class="dropdown-user-info">
                            <span class="dropdown-nickname">${this.user.nickname}</span>
                            <span class="dropdown-email">${this.user.email}</span>
                            <div class="dropdown-level-info">
                                <span class="level-badge">Lv.${levelInfo.level} ${levelInfo.icon} ${levelInfo.title}</span>
                                <span class="points-badge">积分: ${tokens}</span>
                                <span class="contribution-badge">贡献值: ${contributionValue}</span>
                            </div>
                        </div>
                    </div>
                    <div class="dropdown-divider"></div>
                    <a href="profile.html" class="dropdown-item">
                        <i class="fas fa-user"></i>
                        个人资料
                    </a>
                    <a href="profile.html#posts" class="dropdown-item">
                        <i class="fas fa-file-alt"></i>
                        我的发布
                    </a>
                    <a href="profile.html#bookmarks" class="dropdown-item">
                        <i class="fas fa-bookmark"></i>
                        我的收藏
                    </a>
                    <a href="profile.html#bounties" class="dropdown-item">
                        <i class="fas fa-coins"></i>
                        我的悬赏
                    </a>
                    ${this.renderAdminMenu()}
                    <div class="dropdown-divider"></div>
                    <button class="dropdown-item logout-btn" id="logout-btn">
                        <i class="fas fa-sign-out-alt"></i>
                        退出登录
                    </button>
                </div>
            </div>
        `;

        this.bindLoggedInEvents();
    }

    renderNotificationList() {
        if (this.notifications.length === 0) {
            return '';
        }

        return this.notifications.slice(0, 10).map(notification => {
            const config = NotificationService.getNotificationConfig(notification.type);
            const formattedDate = NotificationService.formatDate(notification.createdAt);
            const readClass = notification.read ? 'read' : 'unread';
            const url = this.getNotificationUrl(notification);

            return `
                <div class="notification-item ${readClass}" data-id="${notification.id}" data-url="${url}" data-type="${notification.type}">
                    <div class="notification-icon">${config.icon}</div>
                    <div class="notification-content">
                        <p class="notification-message">${notification.message}</p>
                        <span class="notification-time">${formattedDate}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderAdminMenu() {
        if (typeof AdminService !== 'undefined' && AdminService.isAdmin()) {
            return `
                <a href="admin.html" class="dropdown-item">
                    <i class="fas fa-cog"></i>
                    管理后台
                </a>
            `;
        }
        return '';
    }

    getNotificationUrl(notification) {
        const data = notification.data;
        switch (notification.type) {
            case 'post_reply':
                return `post.html?id=${data.postId}#reply-${data.replyId}`;
            case 'resource_download':
                return `resource.html?id=${data.resourceId}`;
            case 'bounty_response':
            case 'bounty_accepted':
            case 'bounty_completed':
                return `bounty.html?id=${data.bountyId}`;
            case 'points_change':
                if (data.relatedId) {
                    if (data.type === 'bounty') {
                        return `bounty.html?id=${data.relatedId}`;
                    }
                    if (data.type === 'resource') {
                        return `resource.html?id=${data.relatedId}`;
                    }
                }
                return 'profile.html';
            case 'level_up':
                return 'profile.html';
            default:
                return '#';
        }
    }

    bindLoggedInEvents() {
        const trigger = document.getElementById('user-menu-trigger');
        const dropdown = document.getElementById('user-dropdown');
        const logoutBtn = document.getElementById('logout-btn');
        const notificationTrigger = document.getElementById('notification-trigger');
        const notificationPanel = document.getElementById('notification-panel');
        const markAllReadBtn = document.getElementById('mark-all-read');
        const notificationList = document.getElementById('notification-list');

        if (trigger) {
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeNotificationPanel();
                this.toggleDropdown();
            });
        }

        if (notificationTrigger) {
            notificationTrigger.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeDropdown();
                this.toggleNotificationPanel();
            });
        }

        if (markAllReadBtn) {
            markAllReadBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.markAllNotificationsAsRead();
            });
        }

        if (notificationList) {
            notificationList.addEventListener('click', (e) => {
                e.stopPropagation();
                const item = e.target.closest('.notification-item');
                if (item) {
                    const id = item.dataset.id;
                    const url = item.dataset.url;
                    this.handleNotificationClick(id, url);
                }
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
    }

    toggleDropdown() {
        const dropdown = document.getElementById('user-dropdown');
        if (this.isOpen) {
            dropdown.classList.remove('active');
            this.isOpen = false;
        } else {
            dropdown.classList.add('active');
            this.isOpen = true;
        }
    }

    closeDropdown() {
        const dropdown = document.getElementById('user-dropdown');
        if (dropdown) {
            dropdown.classList.remove('active');
            this.isOpen = false;
        }
    }

    toggleNotificationPanel() {
        const panel = document.getElementById('notification-panel');
        if (this.isNotificationOpen) {
            panel.classList.remove('active');
            this.isNotificationOpen = false;
        } else {
            panel.classList.add('active');
            this.isNotificationOpen = true;
        }
    }

    closeNotificationPanel() {
        const panel = document.getElementById('notification-panel');
        if (panel) {
            panel.classList.remove('active');
            this.isNotificationOpen = false;
        }
    }

    handleNotificationClick(notificationId, url) {
        if (typeof NotificationService !== 'undefined') {
            NotificationService.markAsRead(notificationId);
        }
        this.loadNotifications();
        this.closeNotificationPanel();
        
        if (url && url !== '#') {
            window.location.href = url;
        }
    }

    markAllNotificationsAsRead() {
        if (typeof NotificationService !== 'undefined' && this.user) {
            NotificationService.markAllAsRead(this.user.id);
            this.loadNotifications();
        }
    }

    logout() {
        AuthService.logout();
        this.updateState();
        window.location.href = 'index.html';
    }

    renderLoggedOut() {
        this.container.innerHTML = `
            <button class="login-btn" id="login-trigger">
                登录 Login
            </button>
        `;

        const loginBtn = document.getElementById('login-trigger');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                if (typeof authModal !== 'undefined' && authModal) {
                    authModal.open('login');
                }
            });
        }
    }
}

window.UserMenu = UserMenu;