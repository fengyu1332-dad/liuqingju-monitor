const POINTS_KEY = 'liuqingju_points_history';

const POINTS_RULES = {
    daily_login: { amount: 5, description: '每日登录奖励' },
    post_published: { amount: 10, description: '发布帖子' },
    reply_posted: { amount: 3, description: '回复帖子' },
    post_liked: { amount: 1, description: '帖子被点赞' },
    resource_published: { amount: 15, description: '发布资源' },
    resource_downloaded: { amount: 7, description: '资源被下载（已扣除30%运营费）' },
    resource_download_cost: { amount: 10, description: '下载资源消耗' },
    bounty_completed: { amount: 0, description: '完成悬赏' },
    bounty_published: { amount: 0, description: '发布悬赏（消耗）' }
};

const LEVEL_CONFIG = [
    { level: 1, title: '新手', minPoints: 0, maxPoints: 100, icon: '⭐' },
    { level: 2, title: '学徒', minPoints: 101, maxPoints: 500, icon: '⭐⭐' },
    { level: 3, title: '学者', minPoints: 501, maxPoints: 1500, icon: '🌟' },
    { level: 4, title: '精英', minPoints: 1501, maxPoints: 5000, icon: '💎' },
    { level: 5, title: '大师', minPoints: 5001, maxPoints: Infinity, icon: '👑' }
];

const PointsService = {
    generateRecordId() {
        return 'record_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    getHistory(userId) {
        const allHistory = localStorage.getItem(POINTS_KEY);
        if (!allHistory) return [];
        const history = JSON.parse(allHistory);
        return history.filter(r => r.userId === userId).sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
        );
    },

    addHistory(record) {
        const allHistory = localStorage.getItem(POINTS_KEY);
        const history = allHistory ? JSON.parse(allHistory) : [];
        history.push(record);
        localStorage.setItem(POINTS_KEY, JSON.stringify(history));
    },

    addTokens(userId, amount, type, description, relatedId = null) {
        const users = AuthService.getUsers();
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) {
            console.error('User not found:', userId);
            return false;
        }

        if (!users[userIndex].stats) {
            users[userIndex].stats = {
                tokens: 0,
                contributionValue: 0,
                lastLoginDate: '',
                totalPosts: 0,
                totalReplies: 0,
                totalResources: 0,
                totalEarnings: 0
            };
        }

        users[userIndex].stats.tokens += amount;
        users[userIndex].stats.contributionValue += amount;
        users[userIndex].stats.totalEarnings += amount;

        this.addHistory({
            id: this.generateRecordId(),
            userId: userId,
            amount: amount,
            type: type,
            description: description,
            relatedId: relatedId,
            createdAt: new Date().toISOString()
        });

        AuthService.saveUsers(users);

        const currentUser = AuthService.getCurrentUser();
        if (currentUser && currentUser.id === userId) {
            const updatedUser = { ...currentUser };
            updatedUser.stats = { ...users[userIndex].stats };
            localStorage.setItem('liuqingju_user_data', JSON.stringify(updatedUser));
        }

        window.dispatchEvent(new CustomEvent('pointsChanged', {
            detail: { userId, amount, type }
        }));

        if (amount > 1) {
            NotificationService.onPointsChange(userId, {
                amount: amount,
                type: type,
                description: description,
                relatedId: relatedId
            });
        }

        return true;
    },

    deductTokens(userId, amount, type, description, relatedId = null) {
        const users = AuthService.getUsers();
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) {
            console.error('User not found:', userId);
            return false;
        }

        if (!users[userIndex].stats) {
            console.error('User stats not initialized');
            return false;
        }

        if (users[userIndex].stats.tokens < amount) {
            return false;
        }

        users[userIndex].stats.tokens -= amount;

        this.addHistory({
            id: this.generateRecordId(),
            userId: userId,
            amount: -amount,
            type: type,
            description: description,
            relatedId: relatedId,
            createdAt: new Date().toISOString()
        });

        AuthService.saveUsers(users);

        const currentUser = AuthService.getCurrentUser();
        if (currentUser && currentUser.id === userId) {
            const updatedUser = { ...currentUser };
            updatedUser.stats = { ...users[userIndex].stats };
            localStorage.setItem('liuqingju_user_data', JSON.stringify(updatedUser));
        }

        window.dispatchEvent(new CustomEvent('pointsChanged', {
            detail: { userId, amount: -amount, type }
        }));

        NotificationService.onPointsChange(userId, {
            amount: -amount,
            type: type,
            description: description,
            relatedId: relatedId
        });

        return true;
    },

    getBalance(userId) {
        const users = AuthService.getUsers();
        const user = users.find(u => u.id === userId);
        return user && user.stats ? user.stats.tokens : 0;
    },

    getContributionValue(userId) {
        const users = AuthService.getUsers();
        const user = users.find(u => u.id === userId);
        return user && user.stats ? user.stats.contributionValue : 0;
    },

    getLevel(userId) {
        const contributionValue = this.getContributionValue(userId);
        return this.calculateLevel(contributionValue);
    },

    calculateLevel(contributionValue) {
        for (let i = LEVEL_CONFIG.length - 1; i >= 0; i--) {
            if (contributionValue >= LEVEL_CONFIG[i].minPoints) {
                return LEVEL_CONFIG[i];
            }
        }
        return LEVEL_CONFIG[0];
    },

    getLevelConfig() {
        return LEVEL_CONFIG;
    },

    checkDailyLogin(userId) {
        const users = AuthService.getUsers();
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) return false;

        if (!users[userIndex].stats) {
            users[userIndex].stats = {
                tokens: 0,
                contributionValue: 0,
                lastLoginDate: '',
                totalPosts: 0,
                totalReplies: 0,
                totalResources: 0,
                totalEarnings: 0
            };
        }

        const today = new Date().toDateString();
        
        if (users[userIndex].stats.lastLoginDate === today) {
            return false;
        }

        users[userIndex].stats.lastLoginDate = today;
        users[userIndex].stats.tokens += POINTS_RULES.daily_login.amount;
        users[userIndex].stats.contributionValue += POINTS_RULES.daily_login.amount;
        users[userIndex].stats.totalEarnings += POINTS_RULES.daily_login.amount;

        this.addHistory({
            id: this.generateRecordId(),
            userId: userId,
            amount: POINTS_RULES.daily_login.amount,
            type: 'daily_login',
            description: POINTS_RULES.daily_login.description,
            createdAt: new Date().toISOString()
        });

        AuthService.saveUsers(users);

        const currentUser = AuthService.getCurrentUser();
        if (currentUser && currentUser.id === userId) {
            const updatedUser = { ...currentUser };
            updatedUser.stats = { ...users[userIndex].stats };
            localStorage.setItem('liuqingju_user_data', JSON.stringify(updatedUser));
        }

        window.dispatchEvent(new CustomEvent('dailyLoginBonus', {
            detail: { amount: POINTS_RULES.daily_login.amount }
        }));

        return true;
    },

    getHistoryByType(userId, type) {
        const history = this.getHistory(userId);
        return history.filter(r => r.type === type);
    },

    getRecentHistory(userId, limit = 10) {
        const history = this.getHistory(userId);
        return history.slice(0, limit);
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
        return date.toLocaleDateString('zh-CN');
    },

    getStats(userId) {
        const users = AuthService.getUsers();
        const user = users.find(u => u.id === userId);
        if (!user || !user.stats) {
            return {
                tokens: 0,
                contributionValue: 0,
                totalPosts: 0,
                totalReplies: 0,
                totalResources: 0,
                totalEarnings: 0
            };
        }
        return { ...user.stats };
    }
};

window.PointsService = PointsService;
