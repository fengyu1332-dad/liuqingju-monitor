/**
 * 留情局监控系统服务
 * 管理监控状态、同步情报数据
 */

const MONITOR_CONFIG_KEY = 'liuqingju_monitor_config';
const MONITOR_STATS_KEY = 'liuqingju_monitor_stats';

class MonitorService {
    constructor(supabaseUrl = null, supabaseKey = null) {
        this.supabaseUrl = supabaseUrl || localStorage.getItem('supabase_url');
        this.supabaseKey = supabaseKey || localStorage.getItem('supabase_key');
    }

    /**
     * 获取配置
     */
    getConfig() {
        try {
            const stored = localStorage.getItem(MONITOR_CONFIG_KEY);
            return stored ? JSON.parse(stored) : this.getDefaultConfig();
        } catch (error) {
            console.error('获取监控配置失败:', error);
            return this.getDefaultConfig();
        }
    }

    /**
     * 获取默认配置
     */
    getDefaultConfig() {
        return {
            universities: [
                { name: 'MIT', country: 'USA', pages: 2, lastCheck: null, status: 'active' },
                { name: 'Stanford', country: 'USA', pages: 1, lastCheck: null, status: 'active' },
                { name: 'Harvard', country: 'USA', pages: 1, lastCheck: null, status: 'active' },
                { name: 'Cambridge', country: 'UK', pages: 1, lastCheck: null, status: 'active' },
                { name: 'Oxford', country: 'UK', pages: 1, lastCheck: null, status: 'active' },
                { name: 'ETH Zurich', country: 'Switzerland', pages: 1, lastCheck: null, status: 'active' },
                { name: 'NUS', country: 'Singapore', pages: 1, lastCheck: null, status: 'active' },
                { name: 'Tsinghua', country: 'China', pages: 1, lastCheck: null, status: 'active' },
                { name: 'Peking', country: 'China', pages: 1, lastCheck: null, status: 'active' },
                { name: 'Tokyo', country: 'Japan', pages: 1, lastCheck: null, status: 'active' }
            ],
            syncSettings: {
                autoSync: true,
                syncInterval: 30, // 分钟
                syncTargets: ['supabase', 'local']
            },
            aiSettings: {
                confidenceThreshold: 0.7,
                autoPublish: true
            }
        };
    }

    /**
     * 保存配置
     */
    saveConfig(config) {
        try {
            localStorage.setItem(MONITOR_CONFIG_KEY, JSON.stringify(config));
            return { success: true };
        } catch (error) {
            console.error('保存监控配置失败:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 获取统计数据
     */
    getStats() {
        try {
            const stored = localStorage.getItem(MONITOR_STATS_KEY);
            return stored ? JSON.parse(stored) : this.getDefaultStats();
        } catch (error) {
            console.error('获取监控统计失败:', error);
            return this.getDefaultStats();
        }
    }

    /**
     * 获取默认统计
     */
    getDefaultStats() {
        return {
            totalUniversities: 10,
            activeUniversities: 10,
            totalPosts: 0,
            todayPosts: 0,
            lastExecution: null,
            lastSync: null,
            universityBreakdown: {},
            dailyTrend: this.getEmptyDailyTrend()
        };
    }

    /**
     * 获取空的每日趋势
     */
    getEmptyDailyTrend() {
        const trend = [];
        const today = new Date();

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            trend.push({
                date: date.toISOString().split('T')[0],
                count: 0
            });
        }

        return trend;
    }

    /**
     * 更新统计数据
     */
    updateStats(updates) {
        try {
            const current = this.getStats();
            const updated = { ...current, ...updates };
            localStorage.setItem(MONITOR_STATS_KEY, JSON.stringify(updated));
            return { success: true };
        } catch (error) {
            console.error('更新监控统计失败:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 记录执行结果
     */
    recordExecution(result) {
        const stats = this.getStats();

        stats.lastExecution = {
            time: new Date().toISOString(),
            universitiesProcessed: result.universities_processed || 0,
            postsPublished: result.posts_published || 0,
            status: result.errors?.length > 0 ? 'partial' : 'success',
            errors: result.errors || []
        };

        // 更新每日统计
        const today = new Date().toISOString().split('T')[0];
        const dailyTrend = stats.dailyTrend.map(day => {
            if (day.date === today) {
                return { ...day, count: day.count + (result.posts_published || 0) };
            }
            return day;
        });
        stats.dailyTrend = dailyTrend;

        // 更新总计
        stats.totalPosts += result.posts_published || 0;
        stats.todayPosts += result.posts_published || 0;

        this.updateStats(stats);
        return { success: true };
    }

    /**
     * 从 Supabase 获取情报数据
     */
    async fetchIntelligence(limit = 50) {
        if (!this.supabaseUrl || !this.supabaseKey) {
            console.warn('Supabase 未配置，使用本地数据');
            return { success: true, data: [], count: 0 };
        }

        try {
            const response = await fetch(`${this.supabaseUrl}/rest/v1/intelligence_posts`, {
                method: 'GET',
                headers: {
                    'apikey': this.supabaseKey,
                    'Authorization': `Bearer ${this.supabaseKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'count=exact'
                },
                params: {
                    select: '*',
                    order: 'published_at.desc',
                    limit: limit,
                    status: 'eq.published'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            // 更新统计
            this.updateStats({
                lastSync: new Date().toISOString(),
                totalPosts: data.length
            });

            return {
                success: true,
                data: data,
                count: data.length
            };

        } catch (error) {
            console.error('获取情报失败:', error);
            return {
                success: false,
                error: error.message,
                data: []
            };
        }
    }

    /**
     * 获取执行日志
     */
    getExecutionLogs(limit = 20) {
        try {
            const stored = localStorage.getItem('liuqingju_execution_logs');
            const logs = stored ? JSON.parse(stored) : [];
            return logs.slice(0, limit);
        } catch (error) {
            console.error('获取执行日志失败:', error);
            return [];
        }
    }

    /**
     * 记录执行日志
     */
    addExecutionLog(log) {
        try {
            const stored = localStorage.getItem('liuqingju_execution_logs');
            const logs = stored ? JSON.parse(stored) : [];

            logs.unshift({
                id: Date.now(),
                time: new Date().toISOString(),
                ...log
            });

            // 只保留最近100条
            const trimmed = logs.slice(0, 100);
            localStorage.setItem('liuqingju_execution_logs', JSON.stringify(trimmed));

            return { success: true };
        } catch (error) {
            console.error('记录执行日志失败:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 触发手动同步
     */
    async triggerSync() {
        const result = {
            startTime: new Date().toISOString(),
            universitiesProcessed: 0,
            postsPublished: 0,
            errors: []
        };

        try {
            // 模拟监控执行（实际应调用后端API或GitHub Actions）
            await this.simulateMonitorRun(result);

            // 记录执行
            this.recordExecution(result);
            this.addExecutionLog(result);

            return {
                success: true,
                result: result
            };

        } catch (error) {
            console.error('触发同步失败:', error);
            result.errors.push(error.message);
            this.addExecutionLog(result);
            return {
                success: false,
                error: error.message,
                result: result
            };
        }
    }

    /**
     * 模拟监控运行（实际应调用真实API）
     */
    async simulateMonitorRun(result) {
        // 模拟延迟
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 模拟处理结果
        const config = this.getConfig();
        result.universitiesProcessed = config.universities.filter(u => u.status === 'active').length;

        // 模拟随机发布
        const shouldPublish = Math.random() > 0.7;
        if (shouldPublish) {
            result.postsPublished = Math.floor(Math.random() * 3) + 1;
        }
    }

    /**
     * 获取监控状态
     */
    getMonitorStatus() {
        const stats = this.getStats();
        const config = this.getConfig();

        const now = new Date();
        const lastExec = stats.lastExecution?.time ? new Date(stats.lastExecution.time) : null;
        const hoursSinceLastRun = lastExec ? (now - lastExec) / (1000 * 60 * 60) : null;

        return {
            isActive: config.syncSettings.autoSync,
            lastRun: lastExec,
            hoursSinceLastRun: hoursSinceLastRun,
            universitiesCount: config.universities.filter(u => u.status === 'active').length,
            nextScheduledRun: this.calculateNextRun(),
            status: this.determineStatus(hoursSinceLastRun)
        };
    }

    /**
     * 计算下次运行时间
     */
    calculateNextRun() {
        const now = new Date();
        const hours = now.getUTCHours();

        // 每天 8:00 和 20:00 北京时间 = 0:00 和 12:00 UTC
        if (hours < 12) {
            return new Date(now.toISOString().split('T')[0] + 'T12:00:00.000Z');
        } else {
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            return new Date(tomorrow.toISOString().split('T')[0] + 'T00:00:00.000Z');
        }
    }

    /**
     * 确定状态
     */
    determineStatus(hoursSinceLastRun) {
        if (hoursSinceLastRun === null) return 'unknown';
        if (hoursSinceLastRun < 1) return 'running';
        if (hoursSinceLastRun < 12) return 'healthy';
        if (hoursSinceLastRun < 24) return 'warning';
        return 'error';
    }

    /**
     * 清除所有监控数据
     */
    clearAllData() {
        try {
            localStorage.removeItem(MONITOR_CONFIG_KEY);
            localStorage.removeItem(MONITOR_STATS_KEY);
            localStorage.removeItem('liuqingju_execution_logs');
            return { success: true };
        } catch (error) {
            console.error('清除监控数据失败:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 导出监控配置
     */
    exportConfig() {
        const config = this.getConfig();
        const stats = this.getStats();
        const logs = this.getExecutionLogs();

        return {
            config: config,
            stats: stats,
            logs: logs,
            exportedAt: new Date().toISOString()
        };
    }

    /**
     * 导入监控配置
     */
    importConfig(data) {
        try {
            if (data.config) {
                this.saveConfig(data.config);
            }
            if (data.stats) {
                this.updateStats(data.stats);
            }
            return { success: true };
        } catch (error) {
            console.error('导入监控配置失败:', error);
            return { success: false, error: error.message };
        }
    }
}

/**
 * 全局监控服务实例
 */
const MonitorSvc = new MonitorService();

window.MonitorService = MonitorService;
window.MonitorSvc = MonitorSvc;
