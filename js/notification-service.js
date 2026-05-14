const NOTIFICATIONS_KEY = 'liuqingju_notifications';
const MAX_NOTIFICATIONS = 100;

const NOTIFICATION_TYPES = {
    POST_REPLY: 'post_reply',
    RESOURCE_DOWNLOAD: 'resource_download',
    BOUNTY_RESPONSE: 'bounty_response',
    BOUNTY_ACCEPTED: 'bounty_accepted',
    BOUNTY_COMPLETED: 'bounty_completed',
    POINTS_CHANGE: 'points_change',
    LEVEL_UP: 'level_up'
};

const NOTIFICATION_CONFIG = {
    post_reply: {
        icon: '💬',
        title: '帖子回复'
    },
    resource_download: {
        icon: '📥',
        title: '资源下载'
    },
    bounty_response: {
        icon: '🤝',
        title: '悬赏响应'
    },
    bounty_accepted: {
        icon: '✅',
        title: '悬赏接受'
    },
    bounty_completed: {
        icon: '🏆',
        title: '悬赏完成'
    },
    points_change: {
        icon: '⭐',
        title: '积分变动'
    },
    level_up: {
        icon: '🎊',
        title: '等级提升'
    }
};

const NotificationService = {
    generateId() {
        return 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    getNotifications(userId) {
        const allNotifications = localStorage.getItem(NOTIFICATIONS_KEY);
        if (!allNotifications) return [];
        const notifications = JSON.parse(allNotifications);
        return notifications.filter(n => n.targetUserId === userId).sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
        );
    },

    getUnreadCount(userId) {
        const notifications = this.getNotifications(userId);
        return notifications.filter(n => !n.read).length;
    },

    addNotification(notification) {
        const allNotifications = localStorage.getItem(NOTIFICATIONS_KEY);
        const notifications = allNotifications ? JSON.parse(allNotifications) : [];
        
        const newNotification = {
            id: this.generateId(),
            ...notification,
            read: false,
            createdAt: new Date().toISOString()
        };
        
        notifications.unshift(newNotification);
        
        this.trimNotifications();
        
        localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
        
        window.dispatchEvent(new CustomEvent('notificationAdded', {
            detail: newNotification
        }));
        
        return newNotification;
    },

    trimNotifications() {
        const allNotifications = localStorage.getItem(NOTIFICATIONS_KEY);
        if (!allNotifications) return;
        
        const notifications = JSON.parse(allNotifications);
        
        if (notifications.length > MAX_NOTIFICATIONS) {
            const trimmed = notifications.slice(0, MAX_NOTIFICATIONS);
            localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(trimmed));
        }
    },

    markAsRead(notificationId) {
        const allNotifications = localStorage.getItem(NOTIFICATIONS_KEY);
        if (!allNotifications) return false;
        
        const notifications = JSON.parse(allNotifications);
        const index = notifications.findIndex(n => n.id === notificationId);
        
        if (index !== -1) {
            notifications[index].read = true;
            localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
            return true;
        }
        return false;
    },

    markAllAsRead(userId) {
        const allNotifications = localStorage.getItem(NOTIFICATIONS_KEY);
        if (!allNotifications) return;
        
        const notifications = JSON.parse(allNotifications);
        notifications.forEach(n => {
            if (n.targetUserId === userId) {
                n.read = true;
            }
        });
        
        localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
        
        window.dispatchEvent(new CustomEvent('allNotificationsRead', {
            detail: { userId }
        }));
    },

    deleteNotification(notificationId) {
        const allNotifications = localStorage.getItem(NOTIFICATIONS_KEY);
        if (!allNotifications) return false;
        
        const notifications = JSON.parse(allNotifications);
        const filtered = notifications.filter(n => n.id !== notificationId);
        
        localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(filtered));
        return true;
    },

    deleteAll(userId) {
        const allNotifications = localStorage.getItem(NOTIFICATIONS_KEY);
        if (!allNotifications) return;
        
        const notifications = JSON.parse(allNotifications);
        const filtered = notifications.filter(n => n.targetUserId !== userId);
        
        localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(filtered));
    },

    onPostReply(targetUserId, replyData) {
        return this.addNotification({
            type: NOTIFICATION_TYPES.POST_REPLY,
            targetUserId: targetUserId,
            data: {
                replyId: replyData.id,
                postId: replyData.postId,
                postTitle: replyData.postTitle,
                author: replyData.author,
                content: replyData.content
            },
            message: `${replyData.author.nickname} 回复了你的帖子："${replyData.postTitle}"`
        });
    },

    onResourceDownload(targetUserId, downloadData) {
        return this.addNotification({
            type: NOTIFICATION_TYPES.RESOURCE_DOWNLOAD,
            targetUserId: targetUserId,
            data: {
                resourceId: downloadData.resourceId,
                resourceName: downloadData.resourceName,
                downloader: downloadData.downloader
            },
            message: `${downloadData.downloader.nickname} 下载了你的资源："${downloadData.resourceName}"`
        });
    },

    onBountyResponse(targetUserId, responseData) {
        return this.addNotification({
            type: NOTIFICATION_TYPES.BOUNTY_RESPONSE,
            targetUserId: targetUserId,
            data: {
                bountyId: responseData.bountyId,
                bountyTitle: responseData.bountyTitle,
                responder: responseData.responder,
                responseId: responseData.id
            },
            message: `${responseData.responder.nickname} 响应了你的悬赏："${responseData.bountyTitle}"`
        });
    },

    onBountyAccepted(targetUserId, acceptData) {
        return this.addNotification({
            type: NOTIFICATION_TYPES.BOUNTY_ACCEPTED,
            targetUserId: targetUserId,
            data: {
                bountyId: acceptData.bountyId,
                bountyTitle: acceptData.bountyTitle,
                acceptor: acceptData.acceptor
            },
            message: `${acceptData.acceptor.nickname} 接受了你的响应："${acceptData.bountyTitle}"`
        });
    },

    onBountyCompleted(targetUserId, completedData) {
        return this.addNotification({
            type: NOTIFICATION_TYPES.BOUNTY_COMPLETED,
            targetUserId: targetUserId,
            data: {
                bountyId: completedData.bountyId,
                bountyTitle: completedData.bountyTitle,
                reward: completedData.reward
            },
            message: `悬赏 "${completedData.bountyTitle}" 已完成，获得奖励 ${completedData.reward} 积分`
        });
    },

    onPointsChange(targetUserId, pointsData) {
        const prefix = pointsData.amount > 0 ? '+' : '';
        return this.addNotification({
            type: NOTIFICATION_TYPES.POINTS_CHANGE,
            targetUserId: targetUserId,
            data: {
                amount: pointsData.amount,
                type: pointsData.type,
                description: pointsData.description,
                relatedId: pointsData.relatedId
            },
            message: `${pointsData.description}，积分 ${prefix}${pointsData.amount}`
        });
    },

    onLevelUp(targetUserId, levelData) {
        return this.addNotification({
            type: NOTIFICATION_TYPES.LEVEL_UP,
            targetUserId: targetUserId,
            data: {
                level: levelData.level,
                title: levelData.title,
                icon: levelData.icon
            },
            message: `🎉 恭喜！你已升级为 ${levelData.icon} ${levelData.title}`
        });
    },

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            const hours = Math.floor(diff / (1000 * 60 * 60));
            if (hours === 0) {
                const minutes = Math.floor(diff / (1000 * 60));
                return minutes <= 0 ? '刚刚' : minutes + '分钟前';
            }
            return hours + '小时前';
        }
        if (days === 1) return '昨天';
        if (days < 7) return days + '天前';
        if (days < 30) return Math.floor(days / 7) + '周前';
        return date.toLocaleDateString('zh-CN');
    },

    getNotificationConfig(type) {
        return NOTIFICATION_CONFIG[type] || { icon: '🔔', title: '通知' };
    },

    getTypes() {
        return NOTIFICATION_TYPES;
    }
};

window.NotificationService = NotificationService;