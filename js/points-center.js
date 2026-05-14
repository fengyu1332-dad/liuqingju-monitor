const POINTS_CENTER_CONFIG = {
    dailyTasks: [
        {
            id: 'daily_login',
            name: '每日登录',
            desc: '每天登录留情局',
            icon: 'login',
            reward: 5,
            maxProgress: 1,
            check: (userId) => {
                const history = PointsService.getHistory(userId);
                const today = new Date().toDateString();
                return history.some(r => 
                    r.type === 'daily_login' && 
                    new Date(r.createdAt).toDateString() === today
                );
            }
        },
        {
            id: 'daily_post',
            name: '发布帖子',
            desc: '在论坛发布一个新帖子',
            icon: 'post',
            reward: 10,
            maxProgress: 1,
            check: (userId) => {
                const history = PointsService.getHistory(userId);
                const today = new Date().toDateString();
                return history.some(r => 
                    r.type === 'post_published' && 
                    new Date(r.createdAt).toDateString() === today
                );
            }
        },
        {
            id: 'daily_reply',
            name: '回复帖子',
            desc: '在论坛回复一个帖子',
            icon: 'reply',
            reward: 3,
            maxProgress: 3,
            check: (userId) => {
                const history = PointsService.getHistory(userId);
                const today = new Date().toDateString();
                return history.filter(r => 
                    r.type === 'reply_posted' && 
                    new Date(r.createdAt).toDateString() === today
                ).length;
            }
        },
        {
            id: 'daily_like',
            name: '点赞互动',
            desc: '点赞3个帖子或资源',
            icon: 'share',
            reward: 3,
            maxProgress: 3,
            check: (userId) => {
                const history = PointsService.getHistory(userId);
                const today = new Date().toDateString();
                return history.filter(r => 
                    r.type === 'post_liked' && 
                    new Date(r.createdAt).toDateString() === today
                ).length;
            }
        },
        {
            id: 'daily_share',
            name: '分享资源',
            desc: '分享一个资源到社交媒体',
            icon: 'share',
            reward: 5,
            maxProgress: 1,
            check: (userId) => {
                const history = PointsService.getHistory(userId);
                const today = new Date().toDateString();
                return history.some(r => 
                    r.type === 'resource_shared' && 
                    new Date(r.createdAt).toDateString() === today
                );
            }
        }
    ],
    
    weeklyTasks: [
        {
            id: 'weekly_post',
            name: '发帖达人',
            desc: '本周发布5个帖子',
            icon: 'post',
            reward: 50,
            maxProgress: 5,
            check: (userId) => {
                const history = PointsService.getHistory(userId);
                const weekStart = getWeekStart();
                return history.filter(r => 
                    r.type === 'post_published' && 
                    new Date(r.createdAt) >= weekStart
                ).length;
            }
        },
        {
            id: 'weekly_reply',
            name: '活跃回复',
            desc: '本周回复20个帖子',
            icon: 'reply',
            reward: 30,
            maxProgress: 20,
            check: (userId) => {
                const history = PointsService.getHistory(userId);
                const weekStart = getWeekStart();
                return history.filter(r => 
                    r.type === 'reply_posted' && 
                    new Date(r.createdAt) >= weekStart
                ).length;
            }
        },
        {
            id: 'weekly_resource',
            name: '资源共享',
            desc: '本周上传2个资源',
            icon: 'resource',
            reward: 40,
            maxProgress: 2,
            check: (userId) => {
                const history = PointsService.getHistory(userId);
                const weekStart = getWeekStart();
                return history.filter(r => 
                    r.type === 'resource_published' && 
                    new Date(r.createdAt) >= weekStart
                ).length;
            }
        },
        {
            id: 'weekly_invite',
            name: '邀请好友',
            desc: '本周邀请3个新用户',
            icon: 'invite',
            reward: 60,
            maxProgress: 3,
            check: (userId) => {
                const history = PointsService.getHistory(userId);
                const weekStart = getWeekStart();
                return history.filter(r => 
                    r.type === 'user_invited' && 
                    new Date(r.createdAt) >= weekStart
                ).length;
            }
        }
    ],
    
    achievementTasks: [
        {
            id: 'first_post',
            name: '初次发言',
            desc: '发布你的第一个帖子',
            icon: 'post',
            reward: 20,
            maxProgress: 1,
            check: (userId) => {
                const history = PointsService.getHistory(userId);
                return history.some(r => r.type === 'post_published');
            }
        },
        {
            id: 'first_resource',
            name: '资源贡献者',
            desc: '上传你的第一个资源',
            icon: 'resource',
            reward: 30,
            maxProgress: 1,
            check: (userId) => {
                const history = PointsService.getHistory(userId);
                return history.some(r => r.type === 'resource_published');
            }
        },
        {
            id: 'ten_posts',
            name: '内容创作者',
            desc: '累计发布10个帖子',
            icon: 'post',
            reward: 100,
            maxProgress: 10,
            check: (userId) => {
                const history = PointsService.getHistory(userId);
                return history.filter(r => r.type === 'post_published').length;
            }
        },
        {
            id: 'ten_resources',
            name: '资源大户',
            desc: '累计上传10个资源',
            icon: 'resource',
            reward: 150,
            maxProgress: 10,
            check: (userId) => {
                const history = PointsService.getHistory(userId);
                return history.filter(r => r.type === 'resource_published').length;
            }
        },
        {
            id: 'hundred_likes',
            name: '人气达人',
            desc: '帖子累计获得100个赞',
            icon: 'share',
            reward: 80,
            maxProgress: 100,
            check: (userId) => {
                const history = PointsService.getHistory(userId);
                return history.filter(r => r.type === 'post_liked').length;
            }
        }
    ]
};

function getWeekStart() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dayOfWeek);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
}

function getMonthStart() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
}

class PointsCenter {
    constructor() {
        this.currentTab = 'daily';
        this.currentRankingPeriod = 'all';
        this.taskStates = this.loadTaskStates();
        this.init();
    }

    init() {
        this.renderTasks('daily');
        this.refreshRanking('all');
        this.refreshHistory();
    }

    loadTaskStates() {
        const stored = localStorage.getItem('liuqingju_task_states');
        if (stored) {
            return JSON.parse(stored);
        }
        return {};
    }

    saveTaskStates() {
        localStorage.setItem('liuqingju_task_states', JSON.stringify(this.taskStates));
    }

    renderTasks(tab) {
        const taskList = document.getElementById('task-list');
        let tasks = [];

        switch(tab) {
            case 'daily':
                tasks = POINTS_CENTER_CONFIG.dailyTasks;
                break;
            case 'weekly':
                tasks = POINTS_CENTER_CONFIG.weeklyTasks;
                break;
            case 'achievement':
                tasks = POINTS_CENTER_CONFIG.achievementTasks;
                break;
        }

        const currentUser = AuthService.getCurrentUser();
        if (!currentUser) {
            taskList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <i class="fas fa-lock" style="font-size: 48px; margin-bottom: 15px;"></i>
                    <p>请先登录后查看任务</p>
                </div>
            `;
            return;
        }

        taskList.innerHTML = tasks.map(task => {
            const progress = task.check(currentUser.id);
            const isCompleted = progress >= task.maxProgress;
            const isClaimed = this.taskStates[task.id]?.claimed || false;
            const progressPercent = Math.min((progress / task.maxProgress) * 100, 100);

            let actionHtml = '';
            if (isCompleted && !isClaimed) {
                actionHtml = `<button class="task-btn do" onclick="pointsCenter.claimTask('${task.id}')">领取</button>`;
            } else if (isClaimed) {
                actionHtml = `<button class="task-btn claimed"><i class="fas fa-check"></i> 已领取</button>`;
            } else {
                actionHtml = `<button class="task-btn done" disabled>去完成</button>`;
            }

            return `
                <div class="task-item">
                    <div class="task-icon ${task.icon}">
                        <i class="fas fa-${this.getTaskIcon(task.icon)}"></i>
                    </div>
                    <div class="task-info">
                        <div class="task-name">${task.name}</div>
                        <div class="task-desc">${task.desc}</div>
                        <div class="task-progress">
                            <div class="task-progress-bar">
                                <div class="task-progress-fill" style="width: ${progressPercent}%"></div>
                            </div>
                            <span class="task-progress-text">${progress}/${task.maxProgress}</span>
                        </div>
                    </div>
                    <div class="task-reward">
                        <div class="task-reward-value">+${task.reward}</div>
                        <div class="task-reward-label">积分</div>
                    </div>
                    <div class="task-action">
                        ${actionHtml}
                    </div>
                </div>
            `;
        }).join('');
    }

    getTaskIcon(icon) {
        const icons = {
            login: 'sun',
            post: 'edit',
            reply: 'comment',
            share: 'heart',
            invite: 'user-plus',
            resource: 'cloud-upload-alt'
        };
        return icons[icon] || 'star';
    }

    claimTask(taskId) {
        const currentUser = AuthService.getCurrentUser();
        if (!currentUser) {
            alert('请先登录');
            return;
        }

        let task = null;
        const allTasks = [...POINTS_CENTER_CONFIG.dailyTasks, ...POINTS_CENTER_CONFIG.weeklyTasks, ...POINTS_CENTER_CONFIG.achievementTasks];
        task = allTasks.find(t => t.id === taskId);

        if (!task) {
            console.error('Task not found:', taskId);
            return;
        }

        if (this.taskStates[taskId]?.claimed) {
            alert('已领取过该任务奖励');
            return;
        }

        if (!task.check(currentUser.id)) {
            alert('任务未完成，无法领取');
            return;
        }

        const success = PointsService.addTokens(
            currentUser.id,
            task.reward,
            `task_${taskId}`,
            `完成任务: ${task.name}`,
            taskId
        );

        if (success) {
            this.taskStates[taskId] = { claimed: true, claimedAt: new Date().toISOString() };
            this.saveTaskStates();
            this.renderTasks(this.currentTab);
            window.dispatchEvent(new CustomEvent('taskClaimed', { detail: { taskId, reward: task.reward } }));
            alert(`🎉 恭喜获得 +${task.reward} 积分！`);
        } else {
            alert('领取失败，请稍后重试');
        }
    }

    refreshTasks() {
        this.renderTasks(this.currentTab);
    }

    refreshRanking(period) {
        const rankingList = document.getElementById('ranking-list');
        const users = AuthService.getUsers();

        let sortedUsers = users.map(user => ({
            id: user.id,
            nickname: user.nickname || '匿名用户',
            avatar: user.avatar || 'https://via.placeholder.com/50x50',
            contribution: user.stats?.contributionValue || 0,
            level: PointsService.calculateLevel(user.stats?.contributionValue || 0)
        }));

        if (period === 'monthly') {
            const monthStart = getMonthStart();
            sortedUsers = sortedUsers.map(user => {
                const history = PointsService.getHistory(user.id);
                const monthlyPoints = history
                    .filter(r => new Date(r.createdAt) >= monthStart)
                    .reduce((sum, r) => sum + r.amount, 0);
                return { ...user, contribution: monthlyPoints };
            });
        } else if (period === 'weekly') {
            const weekStart = getWeekStart();
            sortedUsers = sortedUsers.map(user => {
                const history = PointsService.getHistory(user.id);
                const weeklyPoints = history
                    .filter(r => new Date(r.createdAt) >= weekStart)
                    .reduce((sum, r) => sum + r.amount, 0);
                return { ...user, contribution: weeklyPoints };
            });
        }

        sortedUsers.sort((a, b) => b.contribution - a.contribution);
        const topUsers = sortedUsers.slice(0, 10);

        if (topUsers.length === 0) {
            rankingList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <i class="fas fa-trophy" style="font-size: 48px; margin-bottom: 15px;"></i>
                    <p>暂无排行数据</p>
                </div>
            `;
            return;
        }

        rankingList.innerHTML = topUsers.map((user, index) => {
            const positionClass = index < 3 ? `top-${index + 1}` : '';
            const positionIcon = index < 3 ? this.getPositionIcon(index) : (index + 1);

            return `
                <div class="ranking-item ${positionClass}">
                    <div class="ranking-position ${positionClass}">${positionIcon}</div>
                    <img src="${user.avatar}" alt="${user.nickname}" class="ranking-avatar">
                    <div class="ranking-info">
                        <div class="ranking-name">${user.nickname}</div>
                        <div class="ranking-level">${user.level.icon} ${user.level.title}</div>
                    </div>
                    <div class="ranking-score">
                        <div class="ranking-value">${user.contribution}</div>
                        <div class="ranking-label">贡献值</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    getPositionIcon(position) {
        const icons = ['👑', '🥈', '🥉'];
        return icons[position] || (position + 1);
    }

    refreshHistory() {
        const historyList = document.getElementById('history-list');
        const currentUser = AuthService.getCurrentUser();

        if (!currentUser) {
            historyList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <i class="fas fa-clock" style="font-size: 48px; margin-bottom: 15px;"></i>
                    <p>请先登录后查看记录</p>
                </div>
            `;
            return;
        }

        const history = PointsService.getRecentHistory(currentUser.id, 20);

        if (history.length === 0) {
            historyList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <i class="fas fa-clock" style="font-size: 48px; margin-bottom: 15px;"></i>
                    <p>暂无积分记录</p>
                </div>
            `;
            return;
        }

        historyList.innerHTML = history.map(record => {
            const isIncome = record.amount > 0;
            const iconClass = isIncome ? 'income' : 'expense';
            const icon = this.getHistoryIcon(record.type);

            return `
                <div class="history-item">
                    <div class="history-icon ${iconClass}">
                        <i class="fas fa-${icon}"></i>
                    </div>
                    <div class="history-info">
                        <div class="history-desc">${record.description}</div>
                        <div class="history-time">${PointsService.formatDate(record.createdAt)}</div>
                    </div>
                    <div class="history-amount ${iconClass}">
                        ${isIncome ? '+' : ''}${record.amount}
                    </div>
                </div>
            `;
        }).join('');
    }

    getHistoryIcon(type) {
        const icons = {
            daily_login: 'sun',
            post_published: 'edit',
            reply_posted: 'comment',
            post_liked: 'heart',
            resource_published: 'cloud-upload-alt',
            resource_downloaded: 'download',
            resource_download_cost: 'shopping-cart',
            task: 'tasks',
            bounty_completed: 'gift',
            user_invited: 'user-plus',
            resource_shared: 'share'
        };
        return icons[type] || 'coins';
    }
}

window.PointsCenter = PointsCenter;
