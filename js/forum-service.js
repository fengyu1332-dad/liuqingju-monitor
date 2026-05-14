const POSTS_KEY = 'liuqingju_posts';

const ForumService = {
    generateId() {
        return 'post_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    getPosts() {
        const posts = localStorage.getItem(POSTS_KEY);
        return posts ? JSON.parse(posts) : this.getDefaultPosts();
    },

    savePosts(posts) {
        localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
    },

    addPost(postData) {
        const posts = this.getPosts();
        const id = this.generateId();
        const newPost = {
            id,
            ...postData,
            createdAt: new Date().toISOString(),
            views: 0,
            likes: 0,
            replies: 0,
            isPinned: false,
            isHighlighted: false
        };
        posts.unshift(newPost);
        this.savePosts(posts);

        if (postData.author && postData.author.id && typeof PointsService !== 'undefined') {
            PointsService.addTokens(
                postData.author.id,
                POINTS_RULES.post_published.amount,
                'post_published',
                POINTS_RULES.post_published.description,
                id
            );

            const users = AuthService.getUsers();
            const userIndex = users.findIndex(u => u.id === postData.author.id);
            if (userIndex > -1 && users[userIndex].stats) {
                users[userIndex].stats.totalPosts = (users[userIndex].stats.totalPosts || 0) + 1;
                AuthService.saveUsers(users);
            }
        }

        return newPost;
    },

    getPostById(id) {
        const posts = this.getPosts();
        return posts.find(p => p.id === id);
    },

    likePost(id) {
        const posts = this.getPosts();
        const post = posts.find(p => p.id === id);
        if (post) {
            post.likes = (post.likes || 0) + 1;
            this.savePosts(posts);

            if (post.author && post.author.id && typeof PointsService !== 'undefined') {
                PointsService.addTokens(
                    post.author.id,
                    POINTS_RULES.post_liked.amount,
                    'post_liked',
                    POINTS_RULES.post_liked.description,
                    id
                );
            }
        }
    },

    addReply(postId, replyData) {
        const posts = this.getPosts();
        const post = posts.find(p => p.id === postId);
        if (post) {
            if (!post.replyList) {
                post.replyList = [];
            }
            const reply = {
                id: 'reply_' + Date.now(),
                ...replyData,
                createdAt: new Date().toISOString()
            };
            post.replyList.push(reply);
            post.replies = (post.replies || 0) + 1;
            this.savePosts(posts);

            if (replyData.author && replyData.author.id && typeof PointsService !== 'undefined') {
                PointsService.addTokens(
                    replyData.author.id,
                    POINTS_RULES.reply_posted.amount,
                    'reply_posted',
                    POINTS_RULES.reply_posted.description,
                    postId
                );

                const users = AuthService.getUsers();
                const userIndex = users.findIndex(u => u.id === replyData.author.id);
                if (userIndex > -1 && users[userIndex].stats) {
                    users[userIndex].stats.totalReplies = (users[userIndex].stats.totalReplies || 0) + 1;
                    AuthService.saveUsers(users);
                }
            }

            if (typeof NotificationService !== 'undefined' && 
                post.author && post.author.id && 
                replyData.author && replyData.author.id && 
                post.author.id !== replyData.author.id) {
                NotificationService.onPostReply(post.author.id, {
                    id: reply.id,
                    postId: postId,
                    postTitle: post.title,
                    author: replyData.author,
                    content: replyData.content
                });
            }
        }
    },

    getDefaultPosts() {
        return [
            {
                id: 'post_default_1',
                title: '【经验分享】IB数学AA HL 如何拿到7分',
                category: 'experience',
                content: '作为过来人分享一下IB数学AA HL的学习经验。首先，IA非常重要，一定要尽早开始写，选题要结合实际应用。external考试方面，真题练习是关键，我用的是SS腐竹的历年真题。第三个paper最难，建议多做计时练习。关于计算器，FX-CG50很好用，可以画图像检查答案。希望对大家有帮助！',
                tags: ['IB', '数学', 'AA HL', '7分经验'],
                author: {
                    id: 'user_default_1',
                    nickname: 'MathMaster2024',
                    avatar: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=professional%20male%20student%20portrait&image_size=square'
                },
                createdAt: '2024-10-15T14:30:00Z',
                views: 1256,
                likes: 89,
                replies: 23,
                isPinned: true,
                isHighlighted: true,
                replyList: [
                    {
                        id: 'reply_1',
                        author: {
                            nickname: 'IB新人求助',
                            avatar: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=female%20student%20portrait&image_size=square'
                        },
                        content: '请问IA选题有什么推荐的方向吗？',
                        createdAt: '2024-10-15T15:00:00Z'
                    },
                    {
                        id: 'reply_2',
                        author: {
                            nickname: 'MathMaster2024',
                            avatar: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=professional%20male%20student%20portrait&image_size=square'
                        },
                        content: 'IA选题建议选和日常生活相关的，比如流行病传播模型、金融投资回报分析等，容易拿到高分。',
                        createdAt: '2024-10-15T15:30:00Z'
                    }
                ]
            },
            {
                id: 'post_default_2',
                title: '【AP微积分BC】5分备考资料分享',
                category: 'resources',
                content: '整理了一份AP Calculus BC的备考资料，包含：1. Khan Academy 推荐课程清单 2. 真题分类整理 3. 重点公式汇总 4. FRQ答题模板。需要的小伙伴可以私信我领取。备考周期建议2-3个月，每天1-2小时即可。',
                tags: ['AP', '微积分', 'BC', '备考资料'],
                author: {
                    id: 'user_default_2',
                    nickname: 'CalcQueen',
                    avatar: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=professional%20female%20student%20portrait&image_size=square'
                },
                createdAt: '2024-10-14T10:00:00Z',
                views: 892,
                likes: 67,
                replies: 15,
                isPinned: false,
                isHighlighted: true
            },
            {
                id: 'post_default_3',
                title: '【择校求助】NYU vs UCLA 如何选择',
                category: 'school',
                content: '收到了NYU Stern和UCLA的offer，都是商学院方向。NYU金融方向很强，地理位置好，在华尔街旁边。UCLA排名更高，加州气候好，但商科不是强项。家在北方，NYU冬天会不会很难熬？有没有了解这两所学校的学长学姐给点建议？',
                tags: ['择校', 'NYU', 'UCLA', '商学院'],
                author: {
                    id: 'user_default_3',
                    nickname: '纠结的留学生',
                    avatar: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=asian%20student%20portrait&image_size=square'
                },
                createdAt: '2024-10-13T18:00:00Z',
                views: 567,
                likes: 45,
                replies: 32
            },
            {
                id: 'post_default_4',
                title: '【竞赛信息】2024 AMC 12 报名通知',
                category: 'competition',
                content: 'AMC 12报名已经开始！报名截止日期是10月25日，比赛日期是11月6日。报名费大约25美元，通过学校或AMC官方渠道报名。给大家准备了备考资料，需要的可以留言。需要了解报名流程的也可以问我～',
                tags: ['AMC', '数学竞赛', '申请加分'],
                author: {
                    id: 'user_default_4',
                    nickname: 'MathCompetitionFan',
                    avatar: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=professional%20male%20tutor%20portrait&image_size=square'
                },
                createdAt: '2024-10-12T09:00:00Z',
                views: 423,
                likes: 32,
                replies: 8,
                isPinned: true
            },
            {
                id: 'post_default_5',
                title: '【面试经验】MIT面试官问了我这些问题',
                category: 'interview',
                content: '刚完成MIT校友面试，分享一下被问到的问题：1. 为什么想学计算机？2. 介绍一个你做的项目 3. 看过什么技术相关的书？4. 你觉得AI会如何改变未来的教育？面试官人很nice，主要考察沟通能力和对专业的热情。建议准备几个具体例子来说明自己的优势。',
                tags: ['MIT', '面试', '计算机', '经验分享'],
                author: {
                    id: 'user_default_5',
                    nickname: 'CS_Dreamer',
                    avatar: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=professional%20asian%20male%20portrait&image_size=square'
                },
                createdAt: '2024-10-11T20:00:00Z',
                views: 1234,
                likes: 156,
                replies: 45
            }
        ];
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
    }
};

window.ForumService = ForumService;
