const BOUNTIES_KEY = 'liuqingju_bounties';

const BountyService = {
    generateId() {
        return 'bty_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    getBounties() {
        const bounties = localStorage.getItem(BOUNTIES_KEY);
        return bounties ? JSON.parse(bounties) : this.getDefaultBounties();
    },

    getBountyById(id) {
        const bounties = this.getBounties();
        return bounties.find(b => b.id === id);
    },

    addBounty(bounty) {
        const bounties = this.getBounties();
        const id = this.generateId();
        const newBounty = {
            id,
            ...bounty,
            createdAt: new Date().toISOString(),
            status: 'open',
            responses: []
        };
        bounties.unshift(newBounty);
        localStorage.setItem(BOUNTIES_KEY, JSON.stringify(bounties));
        return newBounty;
    },

    addResponse(bountyId, response) {
        const bounties = this.getBounties();
        const bounty = bounties.find(b => b.id === bountyId);
        if (bounty) {
            if (!bounty.responses) {
                bounty.responses = [];
            }
            bounty.responses.push(response);
            localStorage.setItem(BOUNTIES_KEY, JSON.stringify(bounties));

            const responderNickname = response.author?.nickname || response.nickname || '匿名用户';
            const authorNickname = bounty.author?.nickname || '匿名用户';
            
            if (responderNickname !== authorNickname && window.NotificationService && bounty.author) {
                NotificationService.onBountyResponse(
                    bounty.author.id,
                    {
                        bountyTitle: bounty.title,
                        responder: response.author,
                        bountyId: bountyId
                    }
                );
            }

            return bounty;
        }
        return null;
    },

    acceptResponse(bountyId, responseId) {
        const bounties = this.getBounties();
        const bounty = bounties.find(b => b.id === bountyId);
        if (bounty && bounty.responses) {
            const response = bounty.responses.find(r => r.id === responseId);
            if (response) {
                response.status = 'accepted';
                bounty.status = 'completed';
                localStorage.setItem(BOUNTIES_KEY, JSON.stringify(bounties));
                return bounty;
            }
        }
        return null;
    },

    getDefaultBounties() {
        return [
            {
                id: 'bty_default_1',
                title: '求IB数学EE选题建议',
                description: '本人IB最后一年，需要写数学Extended Essay，想要一些关于数学建模或者统计方面的选题建议，有相关经验的同学可以联系我。',
                category: '学术咨询',
                reward: 50,
                currency: '¥',
                status: 'open',
                author: {
                    nickname: 'IB_Struggler',
                    avatar: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=professional%20student%20portrait&image_size=square'
                },
                createdAt: '2024-10-15T10:00:00Z',
                responses: [],
                deadline: '2024-11-15',
                tags: ['IB', '数学EE', '选题']
            },
            {
                id: 'bty_default_2',
                title: '寻找SAT1550+备考伙伴',
                description: '目标11月SAT冲1550+，寻找同样目标的同学一起刷题、互相监督。可以线上共享屏幕练习，有意者请私信。',
                category: '学习搭子',
                reward: 0,
                currency: '¥',
                status: 'open',
                author: {
                    nickname: 'SATWarrior',
                    avatar: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=professional%20asian%20student%20portrait&image_size=square'
                },
                createdAt: '2024-10-14T14:30:00Z',
                responses: [],
                deadline: '2024-11-01',
                tags: ['SAT', '备考', '搭子']
            },
            {
                id: 'bty_default_3',
                title: '代写美国本科申请文书',
                description: '需要有人帮忙修改Common App主文书，要求有美国Top30申请经验，英文水平接近母语。有作品集可以参考。',
                category: '文书服务',
                reward: 500,
                currency: '¥',
                status: 'open',
                author: {
                    nickname: 'FutureIvy',
                    avatar: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=professional%20female%20student%20portrait&image_size=square'
                },
                createdAt: '2024-10-13T09:15:00Z',
                responses: 5,
                deadline: '2024-10-30',
                tags: ['申请', '文书', '美国本科']
            },
            {
                id: 'bty_default_4',
                title: 'AP Calculus BC 答疑辅导',
                description: '有没有AP Calculus BC拿5分的大佬？遇到几个积分的难题想找人解答，预算有限，但可以请喝奶茶！',
                category: '课程辅导',
                reward: 30,
                currency: '¥',
                status: 'open',
                author: {
                    nickname: 'CalcNewbie',
                    avatar: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=professional%20male%20student%20portrait&image_size=square'
                },
                createdAt: '2024-10-12T16:45:00Z',
                responses: 8,
                deadline: '2024-10-20',
                tags: ['AP', '微积分', '答疑']
            }
        ];
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

    getStatusText(status) {
        const statusMap = {
            'open': '进行中',
            'closed': '已结束',
            'completed': '已完成'
        };
        return statusMap[status] || status;
    },

    getStatusClass(status) {
        const classMap = {
            'open': 'status-open',
            'closed': 'status-closed',
            'completed': 'status-completed'
        };
        return classMap[status] || 'status-open';
    },

    getUserBounties(userId) {
        const bounties = this.getBounties();
        return bounties.filter(b => b.poster?.id === userId);
    },

    getUserResponses(userId) {
        const bounties = this.getBounties();
        const responses = [];
        
        bounties.forEach(bounty => {
            if (bounty.responses) {
                const userResponses = bounty.responses.filter(r => r.author?.id === userId);
                userResponses.forEach(r => {
                    responses.push({
                        ...r,
                        bounty: {
                            id: bounty.id,
                            title: bounty.title,
                            reward: bounty.reward,
                            status: bounty.status
                        }
                    });
                });
            }
        });
        
        return responses;
    },

    getCategoryLabel(category) {
        const labels = {
            'ib': 'IB',
            'ap': 'AP',
            'alevel': 'A-Level',
            'sat': 'SAT/ACT',
            'competition': '竞赛',
            'application': '申请',
            'interview': '面试',
            '文书服务': '文书服务',
            '学术咨询': '学术咨询',
            '学习搭子': '学习搭子',
            '课程辅导': '课程辅导'
        };
        return labels[category] || category;
    },

    getStatusLabel(status) {
        const labels = {
            'open': '待接单',
            'in_progress': '进行中',
            'completed': '已完成',
            'closed': '已关闭'
        };
        return labels[status] || status;
    },

    incrementViews(bountyId) {
        const bounties = this.getBounties();
        const bounty = bounties.find(b => b.id === bountyId);
        if (bounty) {
            bounty.views = (bounty.views || 0) + 1;
            localStorage.setItem(BOUNTIES_KEY, JSON.stringify(bounties));
            return bounty;
        }
        return null;
    }
};

window.BountyService = BountyService;
