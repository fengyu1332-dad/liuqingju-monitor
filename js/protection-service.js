/**
 * 留情局资源保护服务
 * 提供下载限制、积分门槛和防盗链功能
 */

const DOWNLOAD_STATS_KEY = 'liuqingju_download_stats';
const DOWNLOAD_TOKEN_SECRET = 'liuqingju_secret_key_2024';
const MIN_DOWNLOAD_POINTS = 10; // 资源下载最低积分门槛

const ProtectionService = {
    DAILY_LIMIT: 3,
    WEEKLY_LIMIT: 20,
    DOWNLOAD_INTERVAL: 10 * 60 * 1000,

    getDownloadStats() {
        try {
            const stored = localStorage.getItem(DOWNLOAD_STATS_KEY);
            if (!stored) return this.getDefaultStats();

            const stats = JSON.parse(stored);
            this.checkAndResetCounters(stats);
            return stats;
        } catch (error) {
            console.error('获取下载统计失败:', error);
            return this.getDefaultStats();
        }
    },

    getDefaultStats() {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());

        return {
            dailyCount: 0,
            weeklyCount: 0,
            dailyResetTime: today.toISOString(),
            weeklyResetTime: weekStart.toISOString(),
            recentDownloads: []
        };
    },

    checkAndResetCounters(stats) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());

        const dailyResetTime = new Date(stats.dailyResetTime);
        const weeklyResetTime = new Date(stats.weeklyResetTime);

        if (now >= today && dailyResetTime < today) {
            stats.dailyCount = 0;
            stats.dailyResetTime = today.toISOString();
        }

        if (now >= weekStart && weeklyResetTime < weekStart) {
            stats.weeklyCount = 0;
            stats.weeklyResetTime = weekStart.toISOString();
        }

        stats.recentDownloads = stats.recentDownloads.filter(download => {
            return now - new Date(download.downloadedAt) < this.DOWNLOAD_INTERVAL * 10;
        });

        localStorage.setItem(DOWNLOAD_STATS_KEY, JSON.stringify(stats));
    },

    checkDownloadLimit() {
        const stats = this.getDownloadStats();

        if (stats.dailyCount >= this.DAILY_LIMIT) {
            return {
                allowed: false,
                reason: 'daily_limit',
                message: `今日下载次数已用完（${stats.dailyCount}/${this.DAILY_LIMIT}）`,
                remainingDaily: 0,
                remainingWeekly: Math.max(0, this.WEEKLY_LIMIT - stats.weeklyCount),
                resetTime: stats.dailyResetTime
            };
        }

        if (stats.weeklyCount >= this.WEEKLY_LIMIT) {
            return {
                allowed: false,
                reason: 'weekly_limit',
                message: `本周下载次数已用完（${stats.weeklyCount}/${this.WEEKLY_LIMIT}）`,
                remainingDaily: Math.max(0, this.DAILY_LIMIT - stats.dailyCount),
                remainingWeekly: 0,
                resetTime: stats.weeklyResetTime
            };
        }

        return {
            allowed: true,
            remainingDaily: this.DAILY_LIMIT - stats.dailyCount,
            remainingWeekly: this.WEEKLY_LIMIT - stats.weeklyCount,
            message: ''
        };
    },

    checkResourceInterval(resourceId) {
        const stats = this.getDownloadStats();
        const now = new Date();

        const recentDownload = stats.recentDownloads.find(
            d => d.resourceId === resourceId && (now - new Date(d.downloadedAt)) < this.DOWNLOAD_INTERVAL
        );

        if (recentDownload) {
            const timeLeft = Math.ceil((this.DOWNLOAD_INTERVAL - (now - new Date(recentDownload.downloadedAt))) / 1000 / 60);
            return {
                allowed: false,
                reason: 'interval',
                message: `请 ${timeLeft} 分钟后再试`,
                waitTime: timeLeft
            };
        }

        return { allowed: true };
    },

    recordDownload(resourceId) {
        const stats = this.getDownloadStats();
        const now = new Date();

        stats.dailyCount++;
        stats.weeklyCount++;
        stats.recentDownloads.push({
            resourceId,
            downloadedAt: now.toISOString()
        });

        if (stats.recentDownloads.length > 100) {
            stats.recentDownloads = stats.recentDownloads.slice(-50);
        }

        localStorage.setItem(DOWNLOAD_STATS_KEY, JSON.stringify(stats));

        return {
            success: true,
            dailyCount: stats.dailyCount,
            weeklyCount: stats.weeklyCount,
            remainingDaily: this.DAILY_LIMIT - stats.dailyCount,
            remainingWeekly: this.WEEKLY_LIMIT - stats.weeklyCount
        };
    },

    getAccessLevel(resource) {
        // 兼容旧版数据，同时支持新的 downloadPoints 字段
        let minPoints = 0;
        
        if (resource.downloadPoints !== undefined) {
            minPoints = resource.downloadPoints;
        } else if (resource.accessLevel && resource.accessLevel.minPoints !== undefined) {
            minPoints = resource.accessLevel.minPoints;
        }
        
        return {
            minPoints,
            level: minPoints === 0 ? 'basic' : minPoints <= 5 ? 'premium' : 'rare',
            levelName: minPoints === 0 ? '免费资源' : `需要 ${minPoints} 积分`
        };
    },

    getDownloadPoints(resource) {
        // 获取资源作者设定的下载积分，强制最低10积分
        const authorPoints = resource.downloadPoints || 0;
        const points = Math.max(authorPoints, MIN_DOWNLOAD_POINTS);
        return {
            points,
            authorPoints,
            effectivePoints: points,
            isFree: points === 0,
            isMinimum: points === MIN_DOWNLOAD_POINTS && authorPoints < MIN_DOWNLOAD_POINTS
        };
    },

    checkAccessLevel(userPoints, resource) {
        const downloadInfo = this.getDownloadPoints(resource);
        const requiredPoints = downloadInfo.effectivePoints;

        if (userPoints >= requiredPoints) {
            return {
                allowed: true,
                currentPoints: userPoints,
                requiredPoints,
                message: ''
            };
        }

        return {
            allowed: false,
            reason: 'insufficient_points',
            currentPoints: userPoints,
            requiredPoints,
            shortPoints: requiredPoints - userPoints,
            message: `需要 ${requiredPoints} 积分才能下载，当前积分: ${userPoints}，还差 ${requiredPoints - userPoints} 积分`
        };
    },

    generateDownloadToken(resourceId, userId) {
        const timestamp = Date.now();
        const expires = timestamp + 30 * 60 * 1000;
        const data = `${resourceId}:${userId}:${expires}`;
        const token = this.hashString(data);

        return {
            token,
            timestamp,
            expires,
            downloadUrl: `/download/${resourceId}/${timestamp}/${token}`
        };
    },

    validateDownloadToken(resourceId, timestamp, token) {
        const expires = parseInt(timestamp) + 30 * 60 * 1000;

        if (Date.now() > expires) {
            return {
                valid: false,
                reason: 'expired',
                message: '下载链接已过期，请重新获取'
            };
        }

        const data = `${resourceId}:anonymous:${expires}`;
        const expectedToken = this.hashString(data);

        if (token !== expectedToken) {
            return {
                valid: false,
                reason: 'invalid',
                message: '下载链接无效'
            };
        }

        return {
            valid: true,
            expires,
            remainingTime: Math.ceil((expires - Date.now()) / 1000 / 60)
        };
    },

    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        const secret = DOWNLOAD_TOKEN_SECRET;
        let secretHash = 0;
        for (let i = 0; i < secret.length; i++) {
            secretHash = ((secretHash << 5) - secretHash) + secret.charCodeAt(i);
        }
        return Math.abs(hash + secretHash).toString(36);
    },

    addWatermark(content, userId) {
        const watermark = `\n\n--- 留情局版权保护 ---\n下载用户: ${userId}\n下载时间: ${new Date().toLocaleString('zh-CN')}\n请尊重版权，未经授权不得传播\n`;
        return content + watermark;
    },

    canDownload(userId, resource, userPoints) {
        const downloadLimit = this.checkDownloadLimit();
        if (!downloadLimit.allowed) {
            return downloadLimit;
        }

        const intervalCheck = this.checkResourceInterval(resource.id);
        if (!intervalCheck.allowed) {
            return intervalCheck;
        }

        const accessCheck = this.checkAccessLevel(userPoints, resource);
        if (!accessCheck.allowed) {
            return accessCheck;
        }

        return {
            allowed: true,
            message: '可以下载',
            remainingDaily: downloadLimit.remainingDaily,
            remainingWeekly: downloadLimit.remainingWeekly,
            currentPoints: userPoints,
            requiredPoints: 0
        };
    },

    executeDownload(resourceId, resource, userId, userPoints) {
        const canDownload = this.canDownload(userId, resource, userPoints);

        if (!canDownload.allowed) {
            return canDownload;
        }

        const downloadResult = this.recordDownload(resourceId);
        const tokenData = this.generateDownloadToken(resourceId, userId);

        return {
            allowed: true,
            success: true,
            downloadToken: tokenData,
            remainingDaily: downloadResult.remainingDaily,
            remainingWeekly: downloadResult.remainingWeekly,
            message: '下载已准备就绪'
        };
    },

    getAllStats() {
        const stats = this.getDownloadStats();
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());

        const nextDailyReset = new Date(today);
        nextDailyReset.setDate(today.getDate() + 1);

        const nextWeeklyReset = new Date(weekStart);
        nextWeeklyReset.setDate(weekStart.getDate() + 7);

        return {
            ...stats,
            limits: {
                daily: this.DAILY_LIMIT,
                weekly: this.WEEKLY_LIMIT
            },
            usage: {
                daily: {
                    used: stats.dailyCount,
                    remaining: this.DAILY_LIMIT - stats.dailyCount,
                    percent: Math.round((stats.dailyCount / this.DAILY_LIMIT) * 100)
                },
                weekly: {
                    used: stats.weeklyCount,
                    remaining: this.WEEKLY_LIMIT - stats.weeklyCount,
                    percent: Math.round((stats.weeklyCount / this.WEEKLY_LIMIT) * 100)
                }
            },
            nextReset: {
                daily: nextDailyReset.toISOString(),
                weekly: nextWeeklyReset.toISOString()
            }
        };
    },

    resetStats() {
        localStorage.removeItem(DOWNLOAD_STATS_KEY);
        return this.getDefaultStats();
    }
};

window.ProtectionService = ProtectionService;