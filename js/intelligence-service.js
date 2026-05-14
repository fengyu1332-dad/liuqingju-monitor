const INTELLIGENCE_KEY = 'liuqingju_intelligence';
const TIMELINE_KEY = 'liuqingju_timeline';

const IntelligenceService = {
    getMockIntelligence() {
        return [
            {
                id: 'intel_001',
                title: 'UC系统重大政策更新：针对2025届申请者的最新标准化考试要求',
                tag: 'policy',
                tagLabel: 'POLICY',
                time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                views: 1200,
                content: 'UC系统发布重大政策更新，针对2025届申请者的标准化考试要求进行调整。部分学校将恢复标化成绩提交要求。',
                source: 'UC Admissions Office'
            },
            {
                id: 'intel_002',
                title: '【资源下载】常春藤联校最新文书真题题库及教授点评版',
                tag: 'resources',
                tagLabel: 'RESOURCES',
                time: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
                views: 850,
                downloads: 320,
                content: '汇集常春藤联盟学校最新文书题目，邀请校友和教授进行专业点评，提供高质量的写作范例和技巧指导。',
                source: 'Ivy League Alumni Network'
            },
            {
                id: 'intel_003',
                title: '2025赛季学术竞赛路线图：从AMC到USACO的全年备赛建议',
                tag: 'competition',
                tagLabel: 'COMPETITION',
                time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                views: 2400,
                content: '详细规划2025年各类学术竞赛时间表，包括AMC、USACO等热门竞赛，提供完整的备考策略和时间安排。',
                source: 'Competitive Programming Community'
            },
            {
                id: 'intel_004',
                title: '英国G5院校2025年秋季关键时间节点汇总',
                tag: 'deadline',
                tagLabel: 'DEADLINE',
                time: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
                views: 1800,
                content: '牛津、剑桥、帝国理工、UCL、LSE等G5院校2025年秋季研究生申请截止日期汇总，包含各校关键时间节点。',
                source: 'UK University Admissions'
            },
            {
                id: 'intel_005',
                title: 'Common App 2025新版本题目分析与写作技巧',
                tag: 'essay',
                tagLabel: 'ESSAY',
                time: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
                views: 3100,
                content: 'Common App官方发布2025年申请季补充文书题目，对每个题目进行深入分析并提供写作建议。',
                source: 'College Essay Advisors'
            },
            {
                id: 'intel_006',
                title: '加拿大大学2025年奖学金全面汇总',
                tag: 'scholarship',
                tagLabel: 'SCHOLARSHIP',
                time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                views: 1500,
                content: '汇总加拿大主要大学的奖学金项目，涵盖本科生、研究生及专项奖学金信息。',
                source: 'Canada Study Center'
            }
        ];
    },

    getMockMilestones() {
        return [
            { id: 'mile_001', title: 'AMC 10/12 美国数学竞赛报名截止', icon: 'trophy', color: 'purple', date: '2024-10-28', type: 'competition', description: '美国数学竞赛报名截止日期', organization: 'MAA' },
            { id: 'mile_002', title: 'UC Application Deadline', icon: 'graduation-cap', color: 'orange', date: '2024-11-30', type: 'deadline', description: '加州大学申请截止日期', organization: 'University of California' },
            { id: 'mile_003', title: 'Student Visa Early Appointment', icon: 'passport', color: 'green', date: '2025-05-01', type: 'visa', description: '学生签证预约开始时间', organization: 'US Embassy' },
            { id: 'mile_004', title: 'Common App Early Action', icon: 'file-alt', color: 'blue', date: '2024-11-01', type: 'deadline', description: '提前行动申请截止日期', organization: 'Common App' },
            { id: 'mile_005', title: 'USACO December Contest', icon: 'code', color: 'cyan', date: '2024-12-15', type: 'competition', description: '美国计算机奥林匹克竞赛十二月赛', organization: 'USACO' },
            { id: 'mile_006', title: 'UK UCAS Deadline', icon: 'university', color: 'red', date: '2025-01-15', type: 'deadline', description: '英国大学本科申请截止日期', organization: 'UCAS' }
        ];
    },

    getMockTimeline() {
        return [
            { id: 'timeline_001', userId: null, title: '提交文书第一稿 (Common App)', date: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), type: 'task', completed: false },
            { id: 'timeline_002', userId: null, title: '牛剑面试材料上传截止', date: '2024-10-15', type: 'deadline', completed: false },
            { id: 'timeline_003', userId: null, title: 'ED/EA 提前录取申请截止', date: '2024-11-01', type: 'deadline', completed: false },
            { id: 'timeline_004', userId: null, title: '托福成绩提交', date: '2024-10-25', type: 'task', completed: false },
            { id: 'timeline_005', userId: null, title: '联系老师撰写推荐信', date: '2024-11-05', type: 'task', completed: false },
            { id: 'timeline_006', userId: null, title: '模拟面试练习', date: '2024-11-15', type: 'event', completed: false }
        ];
    },

    getIntelligence() {
        const stored = localStorage.getItem(INTELLIGENCE_KEY);
        if (stored) return JSON.parse(stored);
        const mock = this.getMockIntelligence();
        localStorage.setItem(INTELLIGENCE_KEY, JSON.stringify(mock));
        return mock;
    },

    getMilestones() {
        const mock = this.getMockMilestones();
        return mock.sort((a, b) => new Date(a.date) - new Date(b.date));
    },

    getTimelineItems(userId) {
        const stored = localStorage.getItem(TIMELINE_KEY);
        const allTimeline = stored ? JSON.parse(stored) : this.getMockTimeline();
        if (!userId) return allTimeline.slice(0, 5);
        return allTimeline.filter(item => item.userId === userId || !item.userId).slice(0, 5);
    },

    getUpcomingEvents(days = 90) {
        const now = new Date();
        const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
        return this.getMilestones().filter(item => {
            const date = new Date(item.date);
            return date >= now && date <= future;
        }).sort((a, b) => new Date(a.date) - new Date(b.date));
    },

    getCategoryStats() {
        const intel = this.getIntelligence();
        const stats = {};
        intel.forEach(item => { stats[item.tag] = (stats[item.tag] || 0) + 1; });
        return stats;
    },

    formatTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (minutes < 60) return `${minutes} minutes ago`;
        if (hours < 24) return `${hours} hours ago`;
        if (days === 1) return 'Yesterday';
        return `${days} days ago`;
    },

    getCountdown(dateStr) {
        const target = new Date(dateStr);
        const now = new Date();
        const diff = target - now;
        if (diff < 0) return { expired: true, text: '已过期' };
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        if (days > 0) return { expired: false, text: `${days}天 ${hours}小时`, days, hours, minutes };
        if (hours > 0) return { expired: false, text: `${hours}小时 ${minutes}分钟`, days: 0, hours, minutes };
        return { expired: false, text: `${minutes}分钟`, days: 0, hours: 0, minutes };
    },

    getCalendarEvents() {
        return this.getUpcomingEvents(90);
    }
};

window.IntelligenceService = IntelligenceService;