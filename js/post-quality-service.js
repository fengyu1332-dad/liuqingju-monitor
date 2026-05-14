const POST_QUALITY_KEY = 'liuqingju_post_quality';

const QUALITY_LEVELS = {
    EXCELLENT: { min: 80, label: '精华', icon: '🏆', color: '#FFD700', bgColor: '#FFF8E1' },
    HIGH: { min: 60, label: '优质', icon: '⭐', color: '#FFA000', bgColor: '#FFF3E0' },
    GOOD: { min: 40, label: '良好', icon: '👍', color: '#4CAF50', bgColor: '#E8F5E9' },
    NORMAL: { min: 0, label: '普通', icon: '📝', color: '#9E9E9E', bgColor: '#F5F5F5' }
};

const QUALITY_WEIGHTS = {
    content: 30,
    engagement: 25,
    helpfulness: 20,
    freshness: 15,
    author: 10
};

class PostQualityService {
    constructor() {
        this.qualityCache = new Map();
    }

    calculateQualityScore(post, engagement) {
        const scores = {
            content: this.calculateContentScore(post),
            engagement: this.calculateEngagementScore(post, engagement),
            helpfulness: this.calculateHelpfulnessScore(post),
            freshness: this.calculateFreshnessScore(post),
            author: this.calculateAuthorScore(post)
        };

        let totalScore = 0;
        Object.keys(scores).forEach(key => {
            totalScore += scores[key] * (QUALITY_WEIGHTS[key] / 100);
        });

        return Math.round(totalScore * 100) / 100;
    }

    calculateContentScore(post) {
        let score = 0;
        
        const titleLength = (post.title || '').length;
        if (titleLength >= 10 && titleLength <= 50) {
            score += 20;
        } else if (titleLength > 0) {
            score += 10;
        }

        const content = post.content || '';
        const contentLength = content.length;
        
        if (contentLength >= 500) {
            score += 30;
        } else if (contentLength >= 200) {
            score += 20;
        } else if (contentLength >= 100) {
            score += 10;
        } else if (contentLength > 0) {
            score += 5;
        }

        const hasCode = /```[\s\S]*?```|```[\s\S]*$/m.test(content);
        if (hasCode) score += 15;

        const hasImage = (post.images && post.images.length > 0) || 
                        (post.screenshots && post.screenshots.length > 0);
        if (hasImage) score += 15;

        const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0);
        if (paragraphs.length >= 3) {
            score += 10;
        } else if (paragraphs.length >= 2) {
            score += 5;
        }

        const links = content.match(/https?:\/\/[^\s]+/g) || [];
        if (links.length > 0 && links.length <= 3) {
            score += 5;
        }

        return Math.min(score, 100);
    }

    calculateEngagementScore(post, engagement) {
        let score = 0;
        
        const views = engagement?.views || post.views || 0;
        if (views >= 1000) {
            score += 30;
        } else if (views >= 500) {
            score += 20;
        } else if (views >= 100) {
            score += 10;
        } else if (views > 0) {
            score += 5;
        }

        const likes = engagement?.likes || post.likes || 0;
        const replyCount = engagement?.replies || post.replies || 0;

        const likeRatio = views > 0 ? (likes / views) * 100 : 0;
        if (likeRatio >= 10) {
            score += 25;
        } else if (likeRatio >= 5) {
            score += 15;
        } else if (likeRatio > 0) {
            score += 10;
        }

        const replyRatio = views > 0 ? (replyCount / views) * 100 : 0;
        if (replyRatio >= 15) {
            score += 25;
        } else if (replyRatio >= 8) {
            score += 15;
        } else if (replyRatio > 0) {
            score += 10;
        }

        if (replyCount >= 50) {
            score += 15;
        } else if (replyCount >= 20) {
            score += 10;
        } else if (replyCount >= 5) {
            score += 5;
        }

        const bookmarks = engagement?.bookmarks || post.bookmarks || 0;
        if (bookmarks >= 20) {
            score += 5;
        } else if (bookmarks > 0) {
            score += 3;
        }

        return Math.min(score, 100);
    }

    calculateHelpfulnessScore(post) {
        let score = 0;
        
        const tags = post.tags || [];
        if (tags.length >= 3) {
            score += 20;
        } else if (tags.length >= 1) {
            score += 10;
        }

        const category = post.category || '';
        if (category && category !== 'general') {
            score += 15;
        }

        const pinCount = post.pinnedCount || 0;
        if (pinCount > 0) {
            score += 20;
        }

        const hasResources = post.attachments && post.attachments.length > 0;
        if (hasResources) {
            score += 25;
        }

        const solvedStatus = post.solved || false;
        if (solvedStatus) {
            score += 20;
        }

        return Math.min(score, 100);
    }

    calculateFreshnessScore(post) {
        const createdAt = new Date(post.createdAt || Date.now());
        const now = new Date();
        const ageInHours = (now - createdAt) / (1000 * 60 * 60);

        let score = 0;
        if (ageInHours <= 1) {
            score = 100;
        } else if (ageInHours <= 24) {
            score = 90 - (ageInHours - 1) * 3;
        } else if (ageInHours <= 168) {
            score = 60 - ((ageInHours - 24) * 0.3);
        } else if (ageInHours <= 720) {
            score = 30 - ((ageInHours - 168) * 0.02);
        } else {
            score = 10;
        }

        return Math.max(0, Math.min(score, 100));
    }

    calculateAuthorScore(post) {
        let score = 0;
        
        const author = post.author;
        if (!author) return 30;

        const postCount = author.stats?.postCount || 0;
        if (postCount >= 100) {
            score += 30;
        } else if (postCount >= 50) {
            score += 20;
        } else if (postCount >= 10) {
            score += 10;
        } else if (postCount > 0) {
            score += 5;
        }

        const reputation = author.stats?.reputation || 0;
        if (reputation >= 1000) {
            score += 35;
        } else if (reputation >= 500) {
            score += 25;
        } else if (reputation >= 100) {
            score += 15;
        } else if (reputation > 0) {
            score += 10;
        }

        const avgQuality = author.stats?.avgQualityScore || 0;
        if (avgQuality >= 80) {
            score += 35;
        } else if (avgQuality >= 60) {
            score += 25;
        } else if (avgQuality >= 40) {
            score += 15;
        } else if (avgQuality > 0) {
            score += 10;
        }

        const verification = author.verified || false;
        if (verification) {
            score += 10;
        }

        const joinDays = author.joinDays || 0;
        if (joinDays >= 365) {
            score += 5;
        } else if (joinDays >= 180) {
            score += 3;
        }

        return Math.min(score, 100);
    }

    getQualityLevel(score) {
        if (score >= QUALITY_LEVELS.EXCELLENT.min) return QUALITY_LEVELS.EXCELLENT;
        if (score >= QUALITY_LEVELS.HIGH.min) return QUALITY_LEVELS.HIGH;
        if (score >= QUALITY_LEVELS.GOOD.min) return QUALITY_LEVELS.GOOD;
        return QUALITY_LEVELS.NORMAL;
    }

    getQualityBreakdown(post, engagement) {
        return {
            content: this.calculateContentScore(post),
            engagement: this.calculateEngagementScore(post, engagement),
            helpfulness: this.calculateHelpfulnessScore(post),
            freshness: this.calculateFreshnessScore(post),
            author: this.calculateAuthorScore(post),
            total: this.calculateQualityScore(post, engagement)
        };
    }

    cacheQualityScore(postId, score) {
        this.qualityCache.set(postId, {
            score,
            timestamp: Date.now()
        });
    }

    getCachedScore(postId) {
        const cached = this.qualityCache.get(postId);
        if (cached && Date.now() - cached.timestamp < 60000) {
            return cached.score;
        }
        return null;
    }

    saveQualityHistory(postId, score, breakdown) {
        const historyKey = `${POST_QUALITY_KEY}_history`;
        const history = JSON.parse(localStorage.getItem(historyKey) || '{}');
        
        if (!history[postId]) {
            history[postId] = [];
        }
        
        history[postId].push({
            score,
            breakdown,
            timestamp: Date.now()
        });
        
        if (history[postId].length > 10) {
            history[postId] = history[postId].slice(-10);
        }
        
        localStorage.setItem(historyKey, JSON.stringify(history));
    }

    getQualityHistory(postId) {
        const historyKey = `${POST_QUALITY_KEY}_history`;
        const history = JSON.parse(localStorage.getItem(historyKey) || '{}');
        return history[postId] || [];
    }

    getTrendingScore(post, engagement) {
        const qualityScore = this.calculateQualityScore(post, engagement);
        const freshness = this.calculateFreshnessScore(post);
        
        const recentEngagement = this.getRecentEngagement(post.id);
        const engagementGrowth = this.calculateEngagementGrowth(recentEngagement);
        
        const trendingScore = (qualityScore * 0.6) + (freshness * 0.2) + (engagementGrowth * 0.2);
        
        return Math.round(trendingScore * 100) / 100;
    }

    getRecentEngagement(postId) {
        const history = this.getQualityHistory(postId);
        if (history.length < 2) return { views: 0, likes: 0, replies: 0 };
        
        const recent = history[history.length - 1];
        const previous = history[history.length - 2];
        
        return {
            views: (recent.breakdown?.views || 0) - (previous.breakdown?.views || 0),
            likes: (recent.breakdown?.likes || 0) - (previous.breakdown?.likes || 0),
            replies: (recent.breakdown?.replies || 0) - (previous.breakdown?.replies || 0)
        };
    }

    calculateEngagementGrowth(engagement) {
        const totalGrowth = engagement.views + (engagement.likes * 3) + (engagement.replies * 5);
        
        if (totalGrowth >= 100) return 100;
        if (totalGrowth >= 50) return 80;
        if (totalGrowth >= 20) return 60;
        if (totalGrowth >= 10) return 40;
        if (totalGrowth > 0) return 20;
        return 0;
    }

    getQualityRecommendations(post) {
        const recommendations = [];
        const breakdown = this.getQualityBreakdown(post, {});

        if (breakdown.content < 50) {
            recommendations.push({
                area: '内容质量',
                message: '建议增加内容长度，添加更多详细信息或相关资源',
                priority: 'high'
            });
        }

        if (!post.tags || post.tags.length < 3) {
            recommendations.push({
                area: '标签完善',
                message: '建议添加更多相关标签，便于其他用户发现',
                priority: 'medium'
            });
        }

        if (!post.category || post.category === 'general') {
            recommendations.push({
                area: '分类优化',
                message: '选择更具体的分类可以获得更多关注',
                priority: 'medium'
            });
        }

        if (!post.images && !post.screenshots) {
            recommendations.push({
                area: '图文并茂',
                message: '添加相关图片可以提高帖子吸引力',
                priority: 'low'
            });
        }

        return recommendations;
    }
}

window.PostQualityService = new PostQualityService();
