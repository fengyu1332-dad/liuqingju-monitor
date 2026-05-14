const ADMIN_EMAILS = ['admin@liuqingju.com'];
const REVIEW_STORAGE_KEY = 'liuqingju_reviews';
const REPORT_STORAGE_KEY = 'liuqingju_reports';

const AdminService = {
    isAdmin() {
        if (!AuthService || !AuthService.isLoggedIn()) {
            return false;
        }
        const currentUser = AuthService.getCurrentUser();
        return currentUser && ADMIN_EMAILS.includes(currentUser.email);
    },

    isSuperAdmin() {
        return this.isAdmin();
    },

    requireAdmin() {
        if (!this.isAdmin()) {
            throw new Error('需要管理员权限');
        }
    },

    getStats() {
        const users = AuthService.getUsers();
        const posts = ForumService.getPosts();
        const resources = ResourceService.getResources();
        const bounties = BountyService.getBounties();

        const today = new Date().toDateString();
        const todayActive = users.filter(user => {
            if (!user.stats || !user.stats.lastLoginDate) return false;
            return new Date(user.stats.lastLoginDate).toDateString() === today;
        }).length;

        return {
            userCount: users.length,
            postCount: posts.length,
            resourceCount: resources.length,
            bountyCount: bounties.length,
            todayActive: todayActive
        };
    },

    deletePost(postId) {
        this.requireAdmin();
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
        this.requireAdmin();
        const posts = ForumService.getPosts();
        const post = posts.find(p => p.id === postId);
        if (post) {
            post.isPinned = true;
            ForumService.savePosts(posts);
            return true;
        }
        return false;
    },

    unpinPost(postId) {
        this.requireAdmin();
        const posts = ForumService.getPosts();
        const post = posts.find(p => p.id === postId);
        if (post) {
            post.isPinned = false;
            ForumService.savePosts(posts);
            return true;
        }
        return false;
    },

    deleteResource(resourceId) {
        this.requireAdmin();
        const resources = ResourceService.getResources();
        const index = resources.findIndex(r => r.id === resourceId);
        if (index > -1) {
            resources.splice(index, 1);
            localStorage.setItem(RESOURCES_KEY, JSON.stringify(resources));
            return true;
        }
        return false;
    },

    featureResource(resourceId) {
        this.requireAdmin();
        const resources = ResourceService.getResources();
        const resource = resources.find(r => r.id === resourceId);
        if (resource) {
            resource.isFeatured = true;
            localStorage.setItem(RESOURCES_KEY, JSON.stringify(resources));
            return true;
        }
        return false;
    },

    unfeatureResource(resourceId) {
        this.requireAdmin();
        const resources = ResourceService.getResources();
        const resource = resources.find(r => r.id === resourceId);
        if (resource) {
            resource.isFeatured = false;
            localStorage.setItem(RESOURCES_KEY, JSON.stringify(resources));
            return true;
        }
        return false;
    },

    deleteBounty(bountyId) {
        this.requireAdmin();
        const bounties = BountyService.getBounties();
        const index = bounties.findIndex(b => b.id === bountyId);
        if (index > -1) {
            bounties.splice(index, 1);
            localStorage.setItem(BOUNTIES_KEY, JSON.stringify(bounties));
            return true;
        }
        return false;
    },

    closeBounty(bountyId) {
        this.requireAdmin();
        const bounties = BountyService.getBounties();
        const bounty = bounties.find(b => b.id === bountyId);
        if (bounty) {
            bounty.status = 'closed';
            localStorage.setItem(BOUNTIES_KEY, JSON.stringify(bounties));
            return true;
        }
        return false;
    },

    disableUser(userId) {
        this.requireAdmin();
        const users = AuthService.getUsers();
        const user = users.find(u => u.id === userId);
        if (user) {
            user.disabled = true;
            AuthService.saveUsers(users);
            return true;
        }
        return false;
    },

    enableUser(userId) {
        this.requireAdmin();
        const users = AuthService.getUsers();
        const user = users.find(u => u.id === userId);
        if (user) {
            user.disabled = false;
            AuthService.saveUsers(users);
            return true;
        }
        return false;
    },

    getAllUsers() {
        this.requireAdmin();
        return AuthService.getUsers().map(user => {
            const userCopy = { ...user };
            delete userCopy.password;
            return userCopy;
        });
    },

    getUserById(userId) {
        this.requireAdmin();
        const users = AuthService.getUsers();
        const user = users.find(u => u.id === userId);
        if (user) {
            const userCopy = { ...user };
            delete userCopy.password;
            return userCopy;
        }
        return null;
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
        if (days < 365) return Math.floor(days / 30) + '个月前';
        return date.toLocaleDateString('zh-CN');
    },

    getPendingReviews() {
        let reviews = JSON.parse(localStorage.getItem(REVIEW_STORAGE_KEY) || '[]');
        if (reviews.length === 0) {
            reviews = this.initSampleReviews();
        }
        return reviews.sort((a, b) => {
            const statusOrder = { pending: 0, modify: 1, approved: 2, rejected: 2 };
            return (statusOrder[a.status] || 3) - (statusOrder[b.status] || 3);
        });
    },

    initSampleReviews() {
        const sampleReviews = [
            {
                id: 'review_' + Date.now() + '_1',
                title: '2024年QS排名前100大学资料包',
                description: '包含各校录取要求、申请截止日期、学费等详细信息，适合申请季学生参考使用。',
                category: '申请资料',
                uploaderNickname: '留学小助手',
                uploader: 'user_sample_1',
                fileName: 'QS_Top100_Universities_2024.pdf',
                fileSize: 5242880,
                fileType: 'pdf',
                fileUrl: '#',
                status: 'pending',
                submittedAt: new Date(Date.now() - 86400000).toISOString(),
                createdAt: new Date(Date.now() - 86400000).toISOString()
            },
            {
                id: 'review_' + Date.now() + '_2',
                title: '托福备考词汇表（精选2000词）',
                description: '根据历年真题高频词汇整理，附例句和记忆技巧。',
                category: '语言备考',
                uploaderNickname: '英语达人',
                uploader: 'user_sample_2',
                fileName: 'TOEFL_Vocabulary_2000.xlsx',
                fileSize: 1048576,
                fileType: 'xlsx',
                fileUrl: '#',
                status: 'pending',
                submittedAt: new Date(Date.now() - 172800000).toISOString(),
                createdAt: new Date(Date.now() - 172800000).toISOString()
            },
            {
                id: 'review_' + Date.now() + '_3',
                title: 'DIY申请文书模板合集',
                description: '包含Personal Statement、Statement of Purpose、推荐信等模板。',
                category: '文书资料',
                uploaderNickname: '文书专家',
                uploader: 'user_sample_3',
                fileName: 'Application_Essay_Templates.zip',
                fileSize: 2097152,
                fileType: 'zip',
                fileUrl: '#',
                status: 'modify',
                modifyNote: '请补充各模板的具体使用说明，部分模板缺少填写示例。',
                submittedAt: new Date(Date.now() - 259200000).toISOString(),
                createdAt: new Date(Date.now() - 259200000).toISOString()
            }
        ];
        localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(sampleReviews));
        return sampleReviews;
    },

    saveReviews(reviews) {
        localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(reviews));
    },

    approveResource(reviewId) {
        this.requireAdmin();
        const reviews = this.getPendingReviews();
        const review = reviews.find(r => r.id === reviewId);
        if (review) {
            review.status = 'approved';
            review.reviewedAt = new Date().toISOString();
            review.reviewedBy = AuthService.getCurrentUser().id;
            this.saveReviews(reviews);

            if (ResourceService) {
                const resources = ResourceService.getResources();
                resources.unshift({
                    id: 'resource_' + Date.now(),
                    title: review.title,
                    description: review.description,
                    category: review.category,
                    uploader: review.uploader,
                    uploaderNickname: review.uploaderNickname,
                    fileName: review.fileName,
                    fileSize: review.fileSize,
                    fileType: review.fileType,
                    fileUrl: review.fileUrl,
                    downloads: 0,
                    createdAt: new Date().toISOString()
                });
                localStorage.setItem(RESOURCES_KEY, JSON.stringify(resources));
            }
            return true;
        }
        return false;
    },

    rejectResource(reviewId) {
        this.requireAdmin();
        const reviews = this.getPendingReviews();
        const review = reviews.find(r => r.id === reviewId);
        if (review) {
            review.status = 'rejected';
            review.reviewedAt = new Date().toISOString();
            review.reviewedBy = AuthService.getCurrentUser().id;
            this.saveReviews(reviews);
            return true;
        }
        return false;
    },

    requestResourceModify(reviewId, note) {
        this.requireAdmin();
        const reviews = this.getPendingReviews();
        const review = reviews.find(r => r.id === reviewId);
        if (review) {
            review.status = 'modify';
            review.modifyNote = note;
            review.reviewedAt = new Date().toISOString();
            review.reviewedBy = AuthService.getCurrentUser().id;
            this.saveReviews(reviews);
            return true;
        }
        return false;
    },

    getReports() {
        let reports = JSON.parse(localStorage.getItem(REPORT_STORAGE_KEY) || '[]');
        if (reports.length === 0) {
            reports = this.initSampleReports();
        }
        return reports.sort((a, b) => {
            const statusOrder = { pending: 0, resolved: 1, dismissed: 1 };
            return (statusOrder[a.status] || 2) - (statusOrder[b.status] || 2);
        });
    },

    initSampleReports() {
        const sampleReports = [
            {
                id: 'report_' + Date.now() + '_1',
                targetType: 'post',
                targetId: 'post_sample_1',
                targetTitle: '【求助】关于推荐信的撰写问题',
                targetAuthor: 'user_sample_4',
                targetAuthorNickname: '求助者小王',
                reporter: 'user_sample_5',
                reporterNickname: '热心网友',
                reason: '帖子中包含个人联系方式，可能存在隐私泄露风险，建议编辑后重新发布。',
                reportType: '隐私泄露',
                status: 'pending',
                createdAt: new Date(Date.now() - 43200000).toISOString()
            },
            {
                id: 'report_' + Date.now() + '_2',
                targetType: 'resource',
                targetId: 'resource_sample_1',
                targetTitle: '某某大学内部资料（疑似侵权）',
                targetAuthor: 'user_sample_6',
                targetAuthorNickname: '资源分享者',
                reporter: 'user_sample_7',
                reporterNickname: '版权关注者',
                reason: '该资源疑似侵犯某大学版权，文件来源不明，可能涉及法律风险。',
                reportType: '侵权举报',
                status: 'pending',
                createdAt: new Date(Date.now() - 86400000).toISOString()
            },
            {
                id: 'report_' + Date.now() + '_3',
                targetType: 'comment',
                targetId: 'comment_sample_1',
                targetTitle: '某帖子下的评论',
                targetAuthor: 'user_sample_8',
                targetAuthorNickname: '评论者甲',
                reporter: 'user_sample_9',
                reporterNickname: '楼主',
                reason: '该评论包含不当言论，对本人进行人身攻击。',
                reportType: '恶意攻击',
                status: 'resolved',
                adminNote: '已删除不当评论，警告用户注意言行。',
                resolvedAt: new Date(Date.now() - 172800000).toISOString(),
                resolvedBy: 'admin_1',
                createdAt: new Date(Date.now() - 259200000).toISOString()
            }
        ];
        localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(sampleReports));
        return sampleReports;
    },

    saveReports(reports) {
        localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(reports));
    },

    resolveReport(reportId) {
        this.requireAdmin();
        const reports = this.getReports();
        const report = reports.find(r => r.id === reportId);
        if (report) {
            report.status = 'resolved';
            report.resolvedAt = new Date().toISOString();
            report.resolvedBy = AuthService.getCurrentUser().id;

            if (report.targetType === 'post' && ForumService) {
                const posts = ForumService.getPosts();
                const post = posts.find(p => p.id === report.targetId);
                if (post) {
                    post.hidden = true;
                    ForumService.savePosts(posts);
                }
            } else if (report.targetType === 'resource' && ResourceService) {
                const resources = ResourceService.getResources();
                const index = resources.findIndex(r => r.id === report.targetId);
                if (index > -1) {
                    resources.splice(index, 1);
                    localStorage.setItem(RESOURCES_KEY, JSON.stringify(resources));
                }
            }

            this.saveReports(reports);
            return true;
        }
        return false;
    },

    rejectReport(reportId) {
        this.requireAdmin();
        const reports = this.getReports();
        const report = reports.find(r => r.id === reportId);
        if (report) {
            report.status = 'dismissed';
            report.resolvedAt = new Date().toISOString();
            report.resolvedBy = AuthService.getCurrentUser().id;
            this.saveReports(reports);
            return true;
        }
        return false;
    }
};

window.AdminService = AdminService;
