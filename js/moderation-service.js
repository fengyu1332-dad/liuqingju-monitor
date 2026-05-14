const MODERATION_KEY = 'liuqingju_moderation';
const REPORT_KEY = 'liuqingju_reports';

const SENSITIVE_WORDS = [
    '赌博', '博彩', '彩票', '赌场', '老虎机',
    '毒品', '吸毒', '贩毒', '麻醉', '大麻',
    '枪支', '武器', '刀', '枪', '弹药',
    '色情', '裸照', '援交', '约炮', '一夜情',
    '诈骗', '骗子', '钓鱼', '木马', '病毒',
    '暴力', '恐怖', '血腥', '自残', '自杀'
];

const SPAM_PATTERNS = [
    /\b(免费|送礼|点击)\s*(领|送|拿)\b/,
    /\b(微信|QQ|群)\s*号?\s*\d+/,
    /\b(代理|代考|代写)\b/,
    /\b(秒杀|限时|抢)\b.{0,5}(优惠|特价|折扣)\b/,
    /\b(赚钱|日结|兼职)\b.{0,10}\d+/,
    /https?:\/\/[^\s]*\.(tk|ml|ga|cf|gq)\b/i,
    /\b(刷单|刷粉|刷赞)\b/
];

const REPORT_REASONS = {
    spam: { label: '垃圾广告', icon: '🚫', severity: 'low' },
    inappropriate: { label: '不当内容', icon: '⚠️', severity: 'medium' },
    harassment: { label: '骚扰攻击', icon: '😠', severity: 'high' },
    misinformation: { label: '虚假信息', icon: '❌', severity: 'medium' },
    copyright: { label: '侵权投诉', icon: '©️', severity: 'high' },
    other: { label: '其他问题', icon: '❓', severity: 'low' }
};

class ModerationService {
    constructor() {
        this.cache = new Map();
    }

    checkContent(content, options = {}) {
        const {
            checkSensitive = true,
            checkSpam = true,
            checkLinks = true,
            checkRepeat = true
        } = options;

        const results = {
            passed: true,
            issues: [],
            warnings: [],
            score: 100,
            suggestions: []
        };

        if (!content || typeof content !== 'string') {
            results.passed = false;
            results.issues.push('内容不能为空');
            return results;
        }

        if (checkSensitive) {
            const sensitiveResult = this.checkSensitiveWords(content);
            if (sensitiveResult.found.length > 0) {
                results.warnings.push({
                    type: 'sensitive',
                    message: `发现敏感词：${sensitiveResult.found.join(', ')}`,
                    severity: 'high'
                });
                results.score -= sensitiveResult.found.length * 20;
            }
        }

        if (checkSpam) {
            const spamResult = this.checkSpamPatterns(content);
            if (spamResult.found.length > 0) {
                results.issues.push({
                    type: 'spam',
                    message: '检测到疑似垃圾广告内容',
                    patterns: spamResult.found,
                    severity: 'high'
                });
                results.passed = false;
                results.score -= 50;
            }
        }

        if (checkLinks) {
            const linksResult = this.checkSuspiciousLinks(content);
            if (linksResult.suspicious.length > 0) {
                results.warnings.push({
                    type: 'suspicious_links',
                    message: '发现可疑链接',
                    links: linksResult.suspicious,
                    severity: 'medium'
                });
                results.score -= linksResult.suspicious.length * 15;
            }
        }

        if (checkRepeat) {
            const repeatResult = this.checkRepeatedContent(content);
            if (repeatResult.isRepeated) {
                results.warnings.push({
                    type: 'repeated',
                    message: '内容重复度较高',
                    repeatRate: repeatResult.rate,
                    severity: 'low'
                });
                results.score -= 10;
            }
        }

        if (content.length < 10) {
            results.warnings.push({
                type: 'too_short',
                message: '内容过短，建议至少10个字',
                severity: 'low'
            });
            results.score -= 5;
        }

        if (content.length > 10000) {
            results.warnings.push({
                type: 'too_long',
                message: '内容过长，建议精简到10000字以内',
                severity: 'low'
            });
            results.score -= 5;
        }

        results.score = Math.max(0, Math.min(100, results.score));
        results.passed = results.score >= 60 && results.issues.length === 0;

        if (results.warnings.length > 0 && results.passed) {
            results.suggestions = this.generateSuggestions(results.warnings);
        }

        return results;
    }

    checkSensitiveWords(content) {
        const found = [];
        const lowerContent = content.toLowerCase();

        SENSITIVE_WORDS.forEach(word => {
            if (lowerContent.includes(word.toLowerCase())) {
                found.push(word);
            }
        });

        return {
            found,
            clean: found.length === 0
        };
    }

    checkSpamPatterns(content) {
        const found = [];

        SPAM_PATTERNS.forEach((pattern, index) => {
            if (pattern.test(content)) {
                found.push(`模式${index + 1}`);
            }
        });

        return {
            found,
            isSpam: found.length > 0
        };
    }

    checkSuspiciousLinks(content) {
        const urlRegex = /https?:\/\/[^\s]+/g;
        const links = content.match(urlRegex) || [];
        const suspicious = [];

        const suspiciousDomains = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top', '.pw'];
        const ipRegex = /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/;

        links.forEach(link => {
            if (suspiciousDomains.some(d => link.includes(d))) {
                suspicious.push(link);
            } else if (ipRegex.test(link)) {
                suspicious.push(link);
            }
        });

        return {
            suspicious,
            safe: suspicious.length === 0
        };
    }

    checkRepeatedContent(content) {
        const cleaned = content.replace(/\s+/g, '');
        const chars = cleaned.split('');
        const unique = new Set(chars);
        const repeatRate = 1 - (unique.size / chars.length);

        return {
            isRepeated: repeatRate > 0.7,
            rate: repeatRate,
            uniqueChars: unique.size,
            totalChars: chars.length
        };
    }

    generateSuggestions(warnings) {
        const suggestions = [];

        warnings.forEach(warning => {
            switch (warning.type) {
                case 'sensitive':
                    suggestions.push('请检查并修改敏感词内容');
                    break;
                case 'spam':
                    suggestions.push('请删除广告性质的内容');
                    break;
                case 'suspicious_links':
                    suggestions.push('请移除或验证可疑链接');
                    break;
                case 'repeated':
                    suggestions.push('建议增加内容的原创性');
                    break;
                case 'too_short':
                    suggestions.push('建议补充更多详细内容');
                    break;
                case 'too_long':
                    suggestions.push('建议精简内容，突出重点');
                    break;
            }
        });

        return suggestions;
    }

    autoModerate(content, type = 'post') {
        const checkResult = this.checkContent(content);

        if (!checkResult.passed) {
            return {
                action: 'reject',
                reason: checkResult.issues.map(i => i.message).join('; '),
                score: checkResult.score,
                details: checkResult
            };
        }

        if (checkResult.score < 80) {
            return {
                action: 'review',
                reason: '内容需要人工审核',
                score: checkResult.score,
                details: checkResult
            };
        }

        return {
            action: 'approve',
            reason: '内容审核通过',
            score: checkResult.score,
            details: checkResult
        };
    }

    addCustomWord(word, type = 'sensitive') {
        if (type === 'sensitive' && !SENSITIVE_WORDS.includes(word)) {
            SENSITIVE_WORDS.push(word);
            return true;
        }
        return false;
    }

    removeCustomWord(word, type = 'sensitive') {
        const index = SENSITIVE_WORDS.indexOf(word);
        if (index > -1) {
            SENSITIVE_WORDS.splice(index, 1);
            return true;
        }
        return false;
    }
}

class ReportService {
    constructor() {
        this.storage = this.loadStorage();
    }

    loadStorage() {
        const stored = localStorage.getItem(REPORT_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
        return {
            reports: [],
            stats: {
                total: 0,
                pending: 0,
                resolved: 0,
                byType: {}
            }
        };
    }

    saveStorage() {
        localStorage.setItem(REPORT_KEY, JSON.stringify(this.storage));
    }

    generateId() {
        return 'RPT_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9).toUpperCase();
    }

    submitReport(data) {
        const currentUser = localStorage.getItem('liuqingju_current_user');
        if (!currentUser) {
            throw new Error('请先登录');
        }

        const user = JSON.parse(currentUser);

        if (!data.targetId || !data.targetType || !data.reason) {
            throw new Error('请填写完整的举报信息');
        }

        const existing = this.storage.reports.find(
            r => r.targetId === data.targetId && 
                 r.reporterId === user.id && 
                 r.status === 'pending'
        );

        if (existing) {
            throw new Error('您已经举报过该内容，请等待处理结果');
        }

        const report = {
            id: this.generateId(),
            targetId: data.targetId,
            targetType: data.targetType,
            targetTitle: data.targetTitle || '未指定',
            reason: data.reason,
            details: data.details || '',
            reporterId: user.id,
            reporterName: user.nickname || user.name || '匿名用户',
            status: 'pending',
            createdAt: new Date().toISOString(),
            resolvedAt: null,
            resolvedBy: null,
            resolution: null
        };

        this.storage.reports.unshift(report);
        this.storage.stats.total++;
        this.storage.stats.pending++;

        if (!this.storage.stats.byType[data.reason]) {
            this.storage.stats.byType[data.reason] = 0;
        }
        this.storage.stats.byType[data.reason]++;

        this.saveStorage();

        if (typeof NotificationService !== 'undefined') {
            NotificationService.addNotification({
                type: 'system',
                targetUserId: user.id,
                message: '感谢您的举报，我们会尽快处理'
            });
        }

        return report;
    }

    getReports(filters = {}) {
        let reports = [...this.storage.reports];

        if (filters.status) {
            reports = reports.filter(r => r.status === filters.status);
        }

        if (filters.reason) {
            reports = reports.filter(r => r.reason === filters.reason);
        }

        if (filters.reporterId) {
            reports = reports.filter(r => r.reporterId === filters.reporterId);
        }

        if (filters.targetType) {
            reports = reports.filter(r => r.targetType === filters.targetType);
        }

        if (filters.search) {
            const search = filters.search.toLowerCase();
            reports = reports.filter(r => 
                r.targetTitle.toLowerCase().includes(search) ||
                r.details.toLowerCase().includes(search)
            );
        }

        return reports.sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
        );
    }

    resolveReport(reportId, resolution, note = '') {
        const report = this.storage.reports.find(r => r.id === reportId);

        if (!report) {
            throw new Error('举报记录不存在');
        }

        if (report.status !== 'pending') {
            throw new Error('该举报已经处理过');
        }

        const currentUser = localStorage.getItem('liuqingju_current_user');
        const user = currentUser ? JSON.parse(currentUser) : { name: '系统' };

        report.status = 'resolved';
        report.resolvedAt = new Date().toISOString();
        report.resolvedBy = user.nickname || user.name || '系统';
        report.resolution = resolution;
        report.note = note;

        this.storage.stats.pending--;
        this.storage.stats.resolved++;

        this.saveStorage();

        if (resolution === 'delete' && typeof ResourceService !== 'undefined') {
            ResourceService.deleteResource(report.targetId);
        }

        return report;
    }

    getStats() {
        return {
            ...this.storage.stats,
            reports: this.storage.reports.length
        };
    }

    getMyReports() {
        const currentUser = localStorage.getItem('liuqingju_current_user');
        if (!currentUser) return [];

        const user = JSON.parse(currentUser);
        return this.getReports({ reporterId: user.id });
    }
}

window.ModerationService = new ModerationService();
window.ReportService = new ReportService();
window.SENSITIVE_WORDS = SENSITIVE_WORDS;
window.REPORT_REASONS = REPORT_REASONS;
