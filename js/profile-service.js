const ProfileService = {
    KEY_BOOKMARKS: 'liuqingju_bookmarks',
    KEY_RESOURCE_BOOKMARKS: 'liuqingju_resource_bookmarks',
    KEY_BOUNTY_BOOKMARKS: 'liuqingju_bounty_bookmarks',
    KEY_BOUNTIES: 'liuqingju_bounties',

    getBookmarks() {
        const bookmarks = localStorage.getItem(this.KEY_BOOKMARKS);
        return bookmarks ? JSON.parse(bookmarks) : [];
    },

    saveBookmarks(bookmarks) {
        localStorage.setItem(this.KEY_BOOKMARKS, JSON.stringify(bookmarks));
    },

    addBookmark(postId) {
        const bookmarks = this.getBookmarks();
        if (!bookmarks.includes(postId)) {
            bookmarks.push(postId);
            this.saveBookmarks(bookmarks);
        }
    },

    removeBookmark(postId) {
        const bookmarks = this.getBookmarks();
        const index = bookmarks.indexOf(postId);
        if (index > -1) {
            bookmarks.splice(index, 1);
            this.saveBookmarks(bookmarks);
        }
    },

    isBookmarked(postId) {
        const bookmarks = this.getBookmarks();
        return bookmarks.includes(postId);
    },

    getBounties() {
        const bounties = localStorage.getItem(this.KEY_BOUNTIES);
        if (bounties) {
            return JSON.parse(bounties);
        }
        return this.getDefaultBounties();
    },

    saveBounties(bounties) {
        localStorage.setItem(this.KEY_BOUNTIES, JSON.stringify(bounties));
    },

    addBounty(bounty) {
        const bounties = this.getBounties();
        const newBounty = {
            id: 'bounty_' + Date.now(),
            ...bounty,
            createdAt: new Date().toISOString(),
            status: 'open'
        };
        bounties.unshift(newBounty);
        this.saveBounties(bounties);
        return newBounty;
    },

    getUserPosts(userId) {
        const posts = ForumService.getPosts();
        return posts.filter(post => post.author?.id === userId);
    },

    getUserResources(userId) {
        const resources = ResourceService.getResources();
        return resources.filter(resource => resource.uploader?.id === userId);
    },

    getBookmarkedPosts() {
        const bookmarkIds = this.getBookmarks();
        const posts = ForumService.getPosts();
        return posts.filter(post => bookmarkIds.includes(post.id));
    },

    getBookmarkedResources() {
        const resourceBookmarks = this.getResourceBookmarks();
        const resources = ResourceService.getResources();
        return resources.filter(resource => resourceBookmarks.includes(resource.id));
    },

    getBookmarkedBounties() {
        const bountyBookmarks = this.getBountyBookmarks();
        const bounties = this.getBounties();
        return bounties.filter(bounty => bountyBookmarks.includes(bounty.id));
    },

    getAllBookmarks() {
        const bookmarks = [];

        const posts = this.getBookmarkedPosts();
        posts.forEach(post => {
            bookmarks.push({
                id: `post_${post.id}`,
                originalId: post.id,
                type: 'post',
                title: post.title,
                bookmarkedAt: post.bookmarkedAt || post.createdAt,
                url: `forum.html?post=${post.id}`
            });
        });

        const resources = this.getBookmarkedResources();
        resources.forEach(resource => {
            bookmarks.push({
                id: `resource_${resource.id}`,
                originalId: resource.id,
                type: 'resource',
                title: resource.title,
                bookmarkedAt: resource.bookmarkedAt || resource.createdAt,
                url: `resources.html?resource=${resource.id}`
            });
        });

        const bounties = this.getBookmarkedBounties();
        bounties.forEach(bounty => {
            bookmarks.push({
                id: `bounty_${bounty.id}`,
                originalId: bounty.id,
                type: 'bounty',
                title: bounty.title,
                bookmarkedAt: bounty.bookmarkedAt || bounty.createdAt,
                url: `bounty.html?id=${bounty.id}`
            });
        });

        return bookmarks.sort((a, b) => new Date(b.bookmarkedAt) - new Date(a.bookmarkedAt));
    },

    getResourceBookmarks() {
        const bookmarks = localStorage.getItem(this.KEY_RESOURCE_BOOKMARKS);
        return bookmarks ? JSON.parse(bookmarks) : [];
    },

    saveResourceBookmarks(bookmarks) {
        localStorage.setItem(this.KEY_RESOURCE_BOOKMARKS, JSON.stringify(bookmarks));
    },

    addResourceBookmark(resourceId) {
        const bookmarks = this.getResourceBookmarks();
        if (!bookmarks.includes(resourceId)) {
            bookmarks.push(resourceId);
            this.saveResourceBookmarks(bookmarks);
        }
    },

    removeResourceBookmark(resourceId) {
        const bookmarks = this.getResourceBookmarks();
        const index = bookmarks.indexOf(resourceId);
        if (index > -1) {
            bookmarks.splice(index, 1);
            this.saveResourceBookmarks(bookmarks);
        }
    },

    isResourceBookmarked(resourceId) {
        const bookmarks = this.getResourceBookmarks();
        return bookmarks.includes(resourceId);
    },

    getBountyBookmarks() {
        const bookmarks = localStorage.getItem(this.KEY_BOUNTY_BOOKMARKS);
        return bookmarks ? JSON.parse(bookmarks) : [];
    },

    saveBountyBookmarks(bookmarks) {
        localStorage.setItem(this.KEY_BOUNTY_BOOKMARKS, JSON.stringify(bookmarks));
    },

    addBountyBookmark(bountyId) {
        const bookmarks = this.getBountyBookmarks();
        if (!bookmarks.includes(bountyId)) {
            bookmarks.push(bountyId);
            this.saveBountyBookmarks(bookmarks);
        }
    },

    removeBountyBookmark(bountyId) {
        const bookmarks = this.getBountyBookmarks();
        const index = bookmarks.indexOf(bountyId);
        if (index > -1) {
            bookmarks.splice(index, 1);
            this.saveBountyBookmarks(bookmarks);
        }
    },

    isBountyBookmarked(bountyId) {
        const bookmarks = this.getBountyBookmarks();
        return bookmarks.includes(bountyId);
    },

    removeBookmark(bookmarkId) {
        if (bookmarkId.startsWith('post_')) {
            this.removePostBookmark(bookmarkId.replace('post_', ''));
        } else if (bookmarkId.startsWith('resource_')) {
            this.removeResourceBookmark(bookmarkId.replace('resource_', ''));
        } else if (bookmarkId.startsWith('bounty_')) {
            this.removeBountyBookmark(bookmarkId.replace('bounty_', ''));
        }
    },

    removePostBookmark(postId) {
        const bookmarks = this.getBookmarks();
        const index = bookmarks.indexOf(postId);
        if (index > -1) {
            bookmarks.splice(index, 1);
            this.saveBookmarks(bookmarks);
        }
    },

    getUserBounties(userId) {
        const bounties = this.getBounties();
        return bounties.filter(bounty => bounty.poster?.id === userId);
    },

    getDefaultBounties() {
        return [
            {
                id: 'bounty_1',
                title: 'IB物理IA题目求助',
                description: '需要一个适合IB物理SL的IA题目，最好是实验性较强的主题，希望学长学姐分享一下自己的IA题目或者提供一些建议。',
                reward: 200,
                category: 'ib',
                poster: {
                    id: 'user_default_3',
                    nickname: '纠结的留学生',
                    avatar: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=professional%20female%20student%20portrait&image_size=square'
                },
                status: 'open',
                createdAt: '2024-10-04T14:30:00Z'
            },
            {
                id: 'bounty_2',
                title: 'SAT真题资料寻找',
                description: '需要2023年和2024年的SAT真题，需要完整版带答案和解析的，最好是PDF格式。',
                reward: 150,
                category: 'sat',
                poster: {
                    id: 'user_default_3',
                    nickname: '纠结的留学生',
                    avatar: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=professional%20female%20student%20portrait&image_size=square'
                },
                status: 'completed',
                createdAt: '2024-09-30T10:15:00Z'
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
        return date.toLocaleDateString('zh-CN');
    }
};

window.ProfileService = ProfileService;
