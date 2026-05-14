const RESOURCES_KEY = 'liuqingju_resources';
const USER_RESOURCES_KEY = 'liuqingju_user_resources';

const REVIEW_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected'
};

const COPYRIGHT_TYPES = {
    ORIGINAL: 'original',
    REPRINT: 'reprint',
    AUTHORIZED: 'authorized',
    PUBLIC_DOMAIN: 'public_domain',
    CC: 'cc'
};

const COPYRIGHT_TYPE_LABELS = {
    original: '原创',
    reprint: '转载',
    authorized: '授权使用',
    public_domain: '公共领域',
    cc: 'CC协议'
};

const ResourceService = {
    generateId() {
        return 'res_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    getResources() {
        const resources = localStorage.getItem(RESOURCES_KEY);
        return resources ? JSON.parse(resources) : this.getDefaultResources();
    },

    getUserResources(userId) {
        const key = `${USER_RESOURCES_KEY}_${userId}`;
        const resources = localStorage.getItem(key);
        return resources ? JSON.parse(resources) : [];
    },

    saveUserResources(userId, resources) {
        const key = `${USER_RESOURCES_KEY}_${userId}`;
        localStorage.setItem(key, JSON.stringify(resources));
    },

    addResource(resource) {
        const resources = this.getResources();
        const id = this.generateId();
        const newResource = {
            id,
            ...resource,
            createdAt: new Date().toISOString(),
            views: 0,
            downloads: 0,
            likes: 0
        };
        resources.unshift(newResource);
        localStorage.setItem(RESOURCES_KEY, JSON.stringify(resources));
        return newResource;
    },

    addUserResource(userId, resource) {
        if (!resource.copyright || !resource.copyright.type) {
            return { success: false, error: '版权信息为必填项，请填写版权类型' };
        }

        const userResources = this.getUserResources(userId);
        const id = this.generateId();
        const newResource = {
            id,
            ...resource,
            createdAt: new Date().toISOString(),
            views: 0,
            downloads: 0,
            likes: 0,
            review: {
                status: REVIEW_STATUS.PENDING,
                reviewerId: null,
                reviewerNote: null,
                reviewedAt: null
            },
            rating: {
                adminRating: null,
                userRatings: {},
                ratingCount: 0,
                averageRating: 0
            },
            hidden: false
        };
        userResources.unshift(newResource);
        this.saveUserResources(userId, userResources);

        const allResources = this.getResources();
        allResources.unshift(newResource);
        localStorage.setItem(RESOURCES_KEY, JSON.stringify(allResources));

        if (typeof NotificationService !== 'undefined' && typeof AuthService !== 'undefined') {
            const users = AuthService.getUsers();
            const admins = users.filter(u => u.role === 'admin');
            admins.forEach(admin => {
                NotificationService.onResourceSubmitted(admin.id, {
                    resourceId: id,
                    resourceTitle: resource.title,
                    submitterId: userId,
                    submitterNickname: resource.author?.nickname || '匿名用户'
                });
            });
        }

        if (typeof PointsService !== 'undefined') {
            PointsService.addTokens(
                userId,
                POINTS_RULES.resource_published.amount,
                'resource_published',
                POINTS_RULES.resource_published.description,
                id
            );

            const users = AuthService.getUsers();
            const userIndex = users.findIndex(u => u.id === userId);
            if (userIndex > -1 && users[userIndex].stats) {
                users[userIndex].stats.totalResources = (users[userIndex].stats.totalResources || 0) + 1;
                AuthService.saveUsers(users);
            }
        }

        return newResource;
    },

    getDefaultResources() {
        return [
            {
                id: 'res_default_1',
                title: 'IB数学AA HL 历年真题合集',
                description: '包含2019-2024年所有IB数学AA HL真题，附带完整答案解析。涵盖Analysis & Approaches Higher Level所有Topic。',
                category: 'electronic',
                type: '电子资源',
                author: {
                    nickname: '数学小王子',
                    avatar: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=professional%20male%20student%20portrait&image_size=square'
                },
                price: 0,
                fileSize: '45.2 MB',
                fileType: 'PDF',
                createdAt: '2024-10-01T10:00:00Z',
                views: 1256,
                downloads: 342,
                likes: 89,
                tags: ['IB', '数学', '真题', 'AA HL'],
                copyright: {
                    type: 'original',
                    source: null,
                    author: null,
                    license: null,
                    statement: null
                }
            },
            {
                id: 'res_default_2',
                title: 'AP Calculus BC 满分笔记',
                description: '来自5分学霸的详细笔记，包含所有Unit的核心知识点和典型例题。特别适合考前复习使用。',
                category: 'electronic',
                type: '电子资源',
                author: {
                    nickname: 'CalculusQueen',
                    avatar: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=professional%20female%20student%20portrait&image_size=square'
                },
                price: 0,
                fileSize: '12.8 MB',
                fileType: 'PDF',
                createdAt: '2024-09-28T14:30:00Z',
                views: 892,
                downloads: 215,
                likes: 67,
                tags: ['AP', '微积分', '笔记', 'BC'],
                copyright: {
                    type: 'original',
                    source: null,
                    author: null,
                    license: null,
                    statement: null
                }
            },
            {
                id: 'res_default_3',
                title: 'A-Level Physics 实验操作视频',
                description: '包含AS和A2所有必须掌握的实验操作视频，每个实验都有详细的步骤讲解和评分标准说明。',
                category: 'online',
                type: '线上资源',
                author: {
                    nickname: 'PhysicsPro',
                    avatar: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=professional%20asian%20student%20portrait&image_size=square'
                },
                price: 0,
                link: 'https://example.com/physics-videos',
                createdAt: '2024-09-25T09:15:00Z',
                views: 567,
                downloads: 0,
                likes: 45,
                tags: ['A-Level', '物理', '实验', '视频'],
                copyright: {
                    type: 'original',
                    source: null,
                    author: null,
                    license: null,
                    statement: null
                }
            },
            {
                id: 'res_default_4',
                title: 'SAT Official Guide 纸质版',
                description: 'College Board官方出品的SAT指南，内含8套完整真题。适合模考和考前冲刺。',
                category: 'physical',
                type: '实物资源',
                author: {
                    nickname: 'SATMaster',
                    avatar: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=professional%20male%20tutor%20portrait&image_size=square'
                },
                price: 80,
                location: '北京海淀区',
                contact: '微信: sat_exam2024',
                createdAt: '2024-09-20T16:45:00Z',
                views: 423,
                downloads: 0,
                likes: 32,
                tags: ['SAT', 'Official Guide', '纸质'],
                copyright: {
                    type: 'authorized',
                    source: 'College Board',
                    author: 'College Board',
                    license: null,
                    statement: '已获授权使用'
                }
            }
        ];
    },

    getResourceById(id) {
        const resources = this.getResources();
        return resources.find(r => r.id === id);
    },

    downloadResource(downloaderId, id) {
        const resources = this.getResources();
        const index = resources.findIndex(r => r.id === id);
        
        if (index === -1) {
            console.error('Resource not found:', id);
            return { success: false, error: '资源不存在' };
        }

        if (typeof ProtectionService !== 'undefined') {
            const protectionCheck = ProtectionService.canDownload(downloaderId, id);
            if (!protectionCheck.canDownload) {
                return { success: false, error: protectionCheck.reason, ...protectionCheck };
            }
        }

        if (typeof PointsService !== 'undefined') {
            const downloadCost = 10;
            const currentBalance = PointsService.getBalance(downloaderId);
            
            if (currentBalance < downloadCost) {
                return { success: false, error: `积分不足！当前余额：${currentBalance}，需要：${downloadCost}` };
            }

            PointsService.deductTokens(
                downloaderId,
                downloadCost,
                'resource_downloaded',
                `下载资源：${resources[index].title}`,
                id
            );
        }

        if (typeof ProtectionService !== 'undefined') {
            ProtectionService.recordDownload(downloaderId, id);
        }

        resources[index].downloads = (resources[index].downloads || 0) + 1;
        localStorage.setItem(RESOURCES_KEY, JSON.stringify(resources));

        if (resources[index].author && resources[index].author.id) {
            const authorReward = Math.floor(10 * 0.7);
            PointsService.addTokens(
                resources[index].author.id,
                authorReward,
                'resource_downloaded',
                `资源被下载：${resources[index].title}（已扣除30%运营费）`,
                id
            );

            if (typeof NotificationService !== 'undefined' && typeof AuthService !== 'undefined') {
                const authorId = resources[index].author.id;
                
                if (downloaderId !== authorId) {
                    const users = AuthService.getUsers();
                    const downloader = users.find(u => u.id === downloaderId);
                    
                    if (downloader) {
                        NotificationService.onResourceDownload(authorId, {
                            resourceId: id,
                            resourceName: resources[index].title,
                            downloader: {
                                id: downloader.id,
                                nickname: downloader.nickname,
                                avatar: downloader.avatar
                            }
                        });
                    }
                }
            }
        }

        return { success: true, resource: resources[index] };
    },

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (days === 0) return '今天';
        if (days === 1) return '昨天';
        if (days < 7) return `${days}天前`;
        if (days < 30) return `${Math.floor(days / 7)}周前`;
        return date.toLocaleDateString('zh-CN');
    },

    approveResource(resourceId, reviewerId, reviewerNote = '') {
        const resources = this.getResources();
        const index = resources.findIndex(r => r.id === resourceId);
        
        if (index === -1) {
            return { success: false, error: '资源不存在' };
        }

        resources[index].review = {
            status: REVIEW_STATUS.APPROVED,
            reviewerId: reviewerId,
            reviewerNote: reviewerNote,
            reviewedAt: new Date().toISOString()
        };

        localStorage.setItem(RESOURCES_KEY, JSON.stringify(resources));

        const userResources = this.getUserResources(resources[index].author?.id);
        const userIndex = userResources.findIndex(r => r.id === resourceId);
        if (userIndex > -1) {
            userResources[userIndex] = resources[index];
            this.saveUserResources(resources[index].author.id, userResources);
        }

        if (typeof NotificationService !== 'undefined' && resources[index].author?.id) {
            NotificationService.onResourceApproved(resources[index].author.id, {
                resourceId: resourceId,
                resourceTitle: resources[index].title,
                reviewerNote: reviewerNote
            });
        }

        return { success: true, resource: resources[index] };
    },

    rejectResource(resourceId, reviewerId, reviewerNote = '') {
        const resources = this.getResources();
        const index = resources.findIndex(r => r.id === resourceId);
        
        if (index === -1) {
            return { success: false, error: '资源不存在' };
        }

        resources[index].review = {
            status: REVIEW_STATUS.REJECTED,
            reviewerId: reviewerId,
            reviewerNote: reviewerNote,
            reviewedAt: new Date().toISOString()
        };

        localStorage.setItem(RESOURCES_KEY, JSON.stringify(resources));

        const userResources = this.getUserResources(resources[index].author?.id);
        const userIndex = userResources.findIndex(r => r.id === resourceId);
        if (userIndex > -1) {
            userResources[userIndex] = resources[index];
            this.saveUserResources(resources[index].author.id, userResources);
        }

        if (typeof NotificationService !== 'undefined' && resources[index].author?.id) {
            NotificationService.onResourceRejected(resources[index].author.id, {
                resourceId: resourceId,
                resourceTitle: resources[index].title,
                reviewerNote: reviewerNote
            });
        }

        return { success: true, resource: resources[index] };
    },

    getPendingResources() {
        const resources = this.getResources();
        return resources.filter(r => r.review?.status === REVIEW_STATUS.PENDING);
    },

    setResourceRating(resourceId, rating, userId) {
        if (rating < 1 || rating > 5) {
            return { success: false, error: '评分必须在1-5之间' };
        }

        const resources = this.getResources();
        const index = resources.findIndex(r => r.id === resourceId);
        
        if (index === -1) {
            return { success: false, error: '资源不存在' };
        }

        if (!resources[index].rating) {
            resources[index].rating = {
                adminRating: null,
                userRatings: {},
                ratingCount: 0,
                averageRating: 0
            };
        }

        const previousRating = resources[index].rating.userRatings[userId];
        resources[index].rating.userRatings[userId] = rating;

        let totalRating = 0;
        let count = 0;
        for (const uid in resources[index].rating.userRatings) {
            totalRating += resources[index].rating.userRatings[uid];
            count++;
        }
        resources[index].rating.ratingCount = count;
        resources[index].rating.averageRating = count > 0 ? (totalRating / count).toFixed(1) : 0;

        localStorage.setItem(RESOURCES_KEY, JSON.stringify(resources));

        const userResources = this.getUserResources(resources[index].author?.id);
        const userIndex = userResources.findIndex(r => r.id === resourceId);
        if (userIndex > -1) {
            userResources[userIndex] = resources[index];
            this.saveUserResources(resources[index].author.id, userResources);
        }

        return { success: true, rating: resources[index].rating };
    },

    setAdminRating(resourceId, rating) {
        if (rating < 1 || rating > 5) {
            return { success: false, error: '评分必须在1-5之间' };
        }

        const resources = this.getResources();
        const index = resources.findIndex(r => r.id === resourceId);
        
        if (index === -1) {
            return { success: false, error: '资源不存在' };
        }

        if (!resources[index].rating) {
            resources[index].rating = {
                adminRating: null,
                userRatings: {},
                ratingCount: 0,
                averageRating: 0
            };
        }

        resources[index].rating.adminRating = rating;

        localStorage.setItem(RESOURCES_KEY, JSON.stringify(resources));

        const userResources = this.getUserResources(resources[index].author?.id);
        const userIndex = userResources.findIndex(r => r.id === resourceId);
        if (userIndex > -1) {
            userResources[userIndex] = resources[index];
            this.saveUserResources(resources[index].author.id, userResources);
        }

        return { success: true, rating: resources[index].rating };
    },

    hideResource(resourceId) {
        const resources = this.getResources();
        const index = resources.findIndex(r => r.id === resourceId);
        
        if (index === -1) {
            return { success: false, error: '资源不存在' };
        }

        resources[index].hidden = true;
        localStorage.setItem(RESOURCES_KEY, JSON.stringify(resources));

        const userResources = this.getUserResources(resources[index].author?.id);
        const userIndex = userResources.findIndex(r => r.id === resourceId);
        if (userIndex > -1) {
            userResources[userIndex] = resources[index];
            this.saveUserResources(resources[index].author.id, userResources);
        }

        return { success: true };
    },

    getVisibleResources() {
        const resources = this.getResources();
        return resources.filter(r => !r.hidden && r.review?.status === REVIEW_STATUS.APPROVED);
    },

    getUserRating(resourceId, userId) {
        const resource = this.getResourceById(resourceId);
        if (!resource || !resource.rating) return null;
        return resource.rating.userRatings[userId] || null;
    },

    getResourceRatingInfo(resourceId) {
        const resource = this.getResourceById(resourceId);
        if (!resource || !resource.rating) {
            return {
                adminRating: null,
                averageRating: 0,
                ratingCount: 0,
                userRating: null
            };
        }
        return {
            adminRating: resource.rating.adminRating,
            averageRating: resource.rating.averageRating,
            ratingCount: resource.rating.ratingCount
        };
    },

    getResourceCopyright(resourceId) {
        const resource = this.getResourceById(resourceId);
        if (!resource) {
            return null;
        }
        return resource.copyright || null;
    }
};

window.ResourceService = ResourceService;
