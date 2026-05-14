const STATS_STORAGE_KEY = 'liuqingju_stats';
const STATS_HISTORY_KEY = 'liuqingju_stats_history';

const StatsService = {
    getDailyStats(date = new Date()) {
        const dateStr = date.toISOString().split('T')[0];
        const history = this.getStatsHistory();
        return history[dateStr] || this.generateDailyStats(date);
    },

    getStatsHistory() {
        const data = localStorage.getItem(STATS_HISTORY_KEY);
        return data ? JSON.parse(data) : {};
    },

    saveStatsHistory(history) {
        localStorage.setItem(STATS_HISTORY_KEY, JSON.stringify(history));
    },

    generateDailyStats(date) {
        const users = AuthService.getUsers();
        const posts = ForumService.getPosts();
        const resources = ResourceService.getResources();
        const bounties = BountyService.getBounties();
        const reports = ReportService.getReports();

        const dateStr = date.toISOString().split('T')[0];
        const dateStart = new Date(dateStr);
        const dateEnd = new Date(dateStart);
        dateEnd.setDate(dateEnd.getDate() + 1);

        const newUsers = users.filter(u => {
            const created = new Date(u.createdAt);
            return created >= dateStart && created < dateEnd;
        }).length;

        const activeUsers = users.filter(u => {
            if (!u.stats || !u.stats.lastLoginDate) return false;
            const lastLogin = new Date(u.stats.lastLoginDate);
            return lastLogin >= dateStart && lastLogin < dateEnd;
        }).length;

        const newPosts = posts.filter(p => {
            const created = new Date(p.createdAt);
            return created >= dateStart && created < dateEnd;
        }).length;

        const newResources = resources.filter(r => {
            const created = new Date(r.createdAt);
            return created >= dateStart && created < dateEnd;
        }).length;

        const newBounties = bounties.filter(b => {
            const created = new Date(b.createdAt);
            return created >= dateStart && created < dateEnd;
        }).length;

        const newReports = reports.filter(r => {
            const created = new Date(r.createdAt);
            return created >= dateStart && created < dateEnd;
        }).length;

        const totalDownloads = resources.reduce((sum, r) => sum + (r.downloads || 0), 0);

        const totalPoints = users.reduce((sum, u) => sum + (u.points?.balance || 0), 0);

        return {
            date: dateStr,
            users: {
                total: users.length,
                new: newUsers,
                active: activeUsers
            },
            content: {
                posts: posts.length,
                newPosts: newPosts,
                resources: resources.length,
                newResources: newResources,
                bounties: bounties.length,
                newBounties: newBounties,
                totalDownloads: totalDownloads
            },
            engagement: {
                reports: reports.length,
                newReports: newReports,
                pendingReports: reports.filter(r => r.status === 'pending').length,
                pendingReviews: resources.filter(r => r.review?.status === 'pending').length
            },
            points: {
                total: totalPoints,
                average: users.length > 0 ? Math.round(totalPoints / users.length) : 0
            }
        };
    },

    updateDailyStats() {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const history = this.getStatsHistory();
        
        history[todayStr] = this.generateDailyStats(today);
        this.saveStatsHistory(history);
        
        return history[todayStr];
    },

    getStatsRange(days = 30) {
        const history = this.getStatsHistory();
        const result = [];
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            if (history[dateStr]) {
                result.push(history[dateStr]);
            } else {
                result.push({
                    date: dateStr,
                    users: { total: 0, new: 0, active: 0 },
                    content: { posts: 0, newPosts: 0, resources: 0, newResources: 0, bounties: 0, newBounties: 0, totalDownloads: 0 },
                    engagement: { reports: 0, newReports: 0, pendingReports: 0, pendingReviews: 0 },
                    points: { total: 0, average: 0 }
                });
            }
        }
        
        return result;
    },

    getDetailedStats() {
        const users = AuthService.getUsers();
        const posts = ForumService.getPosts();
        const resources = ResourceService.getResources();
        const bounties = BountyService.getBounties();
        const reports = ReportService.getReports();

        const today = new Date().toDateString();
        const thisWeek = new Date();
        thisWeek.setDate(thisWeek.getDate() - 7);
        const thisMonth = new Date();
        thisMonth.setMonth(thisMonth.getMonth() - 1);

        const studyStageStats = {};
        users.forEach(u => {
            const stage = u.profile?.studyStage || '未设置';
            studyStageStats[stage] = (studyStageStats[stage] || 0) + 1;
        });

        const curriculumStats = {};
        users.forEach(u => {
            const curriculum = u.profile?.curriculum || '未设置';
            curriculumStats[curriculum] = (curriculumStats[curriculum] || 0) + 1;
        });

        const resourceCategoryStats = {};
        resources.forEach(r => {
            const category = r.category || '未分类';
            resourceCategoryStats[category] = (resourceCategoryStats[category] || 0) + 1;
        });

        const topContributors = users
            .map(u => ({
                id: u.id,
                nickname: u.nickname,
                avatar: u.avatar,
                posts: u.stats?.totalPosts || 0,
                resources: u.stats?.totalResources || 0,
                points: u.points?.balance || 0,
                contribution: u.points?.contribution || 0
            }))
            .sort((a, b) => b.contribution - a.contribution)
            .slice(0, 10);

        const topResources = resources
            .map(r => ({
                id: r.id,
                title: r.title,
                downloads: r.downloads || 0,
                views: r.views || 0,
                author: r.author?.nickname || '未知'
            }))
            .sort((a, b) => b.downloads - a.downloads)
            .slice(0, 10);

        const topPosts = posts
            .map(p => ({
                id: p.id,
                title: p.title,
                likes: p.likes || 0,
                replies: p.replies || 0,
                views: p.views || 0,
                author: p.authorNickname || p.author || '未知'
            }))
            .sort((a, b) => (b.likes + b.replies) - (a.likes + a.replies))
            .slice(0, 10);

        return {
            overview: {
                totalUsers: users.length,
                totalPosts: posts.length,
                totalResources: resources.length,
                totalBounties: bounties.length,
                totalReports: reports.length,
                pendingReports: reports.filter(r => r.status === 'pending').length,
                pendingReviews: resources.filter(r => r.review?.status === 'pending').length
            },
            growth: {
                today: {
                    newUsers: users.filter(u => new Date(u.createdAt).toDateString() === today).length,
                    newPosts: posts.filter(p => new Date(p.createdAt).toDateString() === today).length,
                    newResources: resources.filter(r => new Date(r.createdAt).toDateString() === today).length
                },
                thisWeek: {
                    newUsers: users.filter(u => new Date(u.createdAt) >= thisWeek).length,
                    newPosts: posts.filter(p => new Date(p.createdAt) >= thisWeek).length,
                    newResources: resources.filter(r => new Date(r.createdAt) >= thisWeek).length
                },
                thisMonth: {
                    newUsers: users.filter(u => new Date(u.createdAt) >= thisMonth).length,
                    newPosts: posts.filter(p => new Date(p.createdAt) >= thisMonth).length,
                    newResources: resources.filter(r => new Date(r.createdAt) >= thisMonth).length
                }
            },
            demographics: {
                studyStage: studyStageStats,
                curriculum: curriculumStats
            },
            content: {
                resourceCategories: resourceCategoryStats,
                topResources: topResources,
                topPosts: topPosts
            },
            engagement: {
                topContributors: topContributors,
                totalDownloads: resources.reduce((sum, r) => sum + (r.downloads || 0), 0),
                totalLikes: posts.reduce((sum, p) => sum + (p.likes || 0), 0),
                totalBookmarks: 0
            },
            points: {
                totalInCirculation: users.reduce((sum, u) => sum + (u.points?.balance || 0), 0),
                totalContribution: users.reduce((sum, u) => sum + (u.points?.contribution || 0), 0),
                averageBalance: users.length > 0 ? Math.round(users.reduce((sum, u) => sum + (u.points?.balance || 0), 0) / users.length) : 0
            }
        };
    },

    getChartData(type = 'users', days = 30) {
        const range = this.getStatsRange(days);
        
        switch(type) {
            case 'users':
                return {
                    labels: range.map(r => r.date.slice(5)),
                    datasets: [
                        {
                            label: '新增用户',
                            data: range.map(r => r.users.new),
                            color: '#8B4513'
                        },
                        {
                            label: '活跃用户',
                            data: range.map(r => r.users.active),
                            color: '#4CAF50'
                        }
                    ]
                };
            case 'content':
                return {
                    labels: range.map(r => r.date.slice(5)),
                    datasets: [
                        {
                            label: '新帖子',
                            data: range.map(r => r.content.newPosts),
                            color: '#2196F3'
                        },
                        {
                            label: '新资源',
                            data: range.map(r => r.content.newResources),
                            color: '#FF9800'
                        },
                        {
                            label: '新悬赏',
                            data: range.map(r => r.content.newBounties),
                            color: '#9C27B0'
                        }
                    ]
                };
            case 'engagement':
                return {
                    labels: range.map(r => r.date.slice(5)),
                    datasets: [
                        {
                            label: '举报数',
                            data: range.map(r => r.engagement.newReports),
                            color: '#E53935'
                        },
                        {
                            label: '下载量',
                            data: range.map(r => r.content.totalDownloads),
                            color: '#00BCD4'
                        }
                    ]
                };
            default:
                return { labels: [], datasets: [] };
        }
    },

    exportData(format = 'json') {
        const stats = this.getDetailedStats();
        const history = this.getStatsRange(90);
        
        const exportData = {
            exportTime: new Date().toISOString(),
            summary: stats.overview,
            growth: stats.growth,
            demographics: stats.demographics,
            content: stats.content,
            engagement: stats.engagement,
            points: stats.points,
            history: history
        };

        if (format === 'json') {
            return JSON.stringify(exportData, null, 2);
        } else if (format === 'csv') {
            let csv = 'Date,New Users,Active Users,New Posts,New Resources,New Bounties,New Reports\n';
            history.forEach(day => {
                csv += `${day.date},${day.users.new},${day.users.active},${day.content.newPosts},${day.content.newResources},${day.content.newBounties},${day.engagement.newReports}\n`;
            });
            return csv;
        }
        
        return exportData;
    },

    getRealtimeStats() {
        const users = AuthService.getUsers();
        const posts = ForumService.getPosts();
        const resources = ResourceService.getResources();
        
        const now = new Date();
        const fiveMinutesAgo = new Date(now - 5 * 60 * 1000);
        
        return {
            onlineUsers: users.filter(u => {
                if (!u.stats || !u.stats.lastLoginDate) return false;
                return new Date(u.stats.lastLoginDate) >= fiveMinutesAgo;
            }).length,
            recentPosts: posts.filter(p => new Date(p.createdAt) >= fiveMinutesAgo).length,
            recentDownloads: resources.reduce((sum, r) => sum + (r.downloads || 0), 0),
            timestamp: now.toISOString()
        };
    }
};

window.StatsService = StatsService;
