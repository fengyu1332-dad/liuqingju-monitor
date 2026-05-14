const REPORTS_KEY = 'liuqingju_reports';

const REPORT_TYPES = {
    infringement: {
        value: 'infringement',
        label: '侵权',
        icon: '⚖️'
    },
    fake: {
        value: 'fake',
        label: '虚假',
        icon: '🎭'
    },
    lowQuality: {
        value: 'lowQuality',
        label: '低质',
        icon: '📉'
    },
    violation: {
        value: 'violation',
        label: '违规',
        icon: '🚫'
    },
    other: {
        value: 'other',
        label: '其他',
        icon: '❓'
    }
};

const REPORT_RESULTS = {
    ignore: {
        value: 'ignore',
        label: '忽略',
        icon: '👀'
    },
    warn: {
        value: 'warn',
        label: '警告',
        icon: '⚠️'
    },
    hide: {
        value: 'hide',
        label: '下架',
        icon: '🙈'
    },
    delete: {
        value: 'delete',
        label: '删除',
        icon: '🗑️'
    }
};

const REPORT_STATUS = {
    pending: 'pending',
    resolved: 'resolved',
    rejected: 'rejected'
};

const ReportService = {
    generateId() {
        return 'rpt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    getReports(status = null) {
        const reports = localStorage.getItem(REPORTS_KEY);
        const list = reports ? JSON.parse(reports) : [];
        
        if (status) {
            return list.filter(r => r.status === status).sort((a, b) => 
                new Date(b.createdAt) - new Date(a.createdAt)
            );
        }
        
        return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    getReportById(reportId) {
        const reports = this.getReports();
        return reports.find(r => r.id === reportId);
    },

    checkDuplicate(reporterId, targetType, targetId) {
        const reports = this.getReports();
        return reports.some(r => 
            r.reporterId === reporterId && 
            r.targetType === targetType && 
            r.targetId === targetId &&
            r.status === REPORT_STATUS.pending
        );
    },

    submitReport(data) {
        const { reporterId, targetType, targetId, targetTitle, reportType, reason } = data;

        if (!reporterId || !targetType || !targetId || !reportType) {
            return { success: false, error: '缺少必要参数' };
        }

        if (!REPORT_TYPES[reportType]) {
            return { success: false, error: '无效的举报类型' };
        }

        if (this.checkDuplicate(reporterId, targetType, targetId)) {
            return { success: false, error: '您已经举报过该内容，请等待处理结果' };
        }

        const reports = this.getReports();
        const newReport = {
            id: this.generateId(),
            reporterId,
            targetType,
            targetId,
            targetTitle: targetTitle || '',
            reportType,
            reason: reason || '',
            status: REPORT_STATUS.pending,
            createdAt: new Date().toISOString(),
            resolvedAt: null,
            resolvedBy: null,
            result: null,
            note: null
        };

        reports.unshift(newReport);
        localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));

        window.dispatchEvent(new CustomEvent('reportSubmitted', {
            detail: newReport
        }));

        return { success: true, report: newReport };
    },

    resolveReport(reportId, result, note = '') {
        const reports = this.getReports();
        const index = reports.findIndex(r => r.id === reportId);

        if (index === -1) {
            return { success: false, error: '举报记录不存在' };
        }

        if (reports[index].status !== REPORT_STATUS.pending) {
            return { success: false, error: '该举报已被处理' };
        }

        if (!REPORT_RESULTS[result]) {
            return { success: false, error: '无效的处理结果' };
        }

        reports[index].status = REPORT_STATUS.resolved;
        reports[index].result = result;
        reports[index].note = note;
        reports[index].resolvedAt = new Date().toISOString();
        reports[index].resolvedBy = 'admin';

        localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));

        if ([REPORT_RESULTS.hide.value, REPORT_RESULTS.delete.value].includes(result)) {
            this.handleResourceAction(reports[index].targetType, reports[index].targetId, result);
        }

        this.notifyReporter(reports[index], result, note);

        window.dispatchEvent(new CustomEvent('reportResolved', {
            detail: reports[index]
        }));

        return { success: true, report: reports[index] };
    },

    rejectReport(reportId, note = '') {
        const reports = this.getReports();
        const index = reports.findIndex(r => r.id === reportId);

        if (index === -1) {
            return { success: false, error: '举报记录不存在' };
        }

        if (reports[index].status !== REPORT_STATUS.pending) {
            return { success: false, error: '该举报已被处理' };
        }

        reports[index].status = REPORT_STATUS.rejected;
        reports[index].result = REPORT_RESULTS.ignore.value;
        reports[index].note = note || '举报内容经核实无违规问题';
        reports[index].resolvedAt = new Date().toISOString();
        reports[index].resolvedBy = 'admin';

        localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));

        this.notifyReporter(reports[index], REPORT_RESULTS.ignore.value, reports[index].note);

        window.dispatchEvent(new CustomEvent('reportRejected', {
            detail: reports[index]
        }));

        return { success: true, report: reports[index] };
    },

    handleResourceAction(targetType, targetId, result) {
        if (targetType === 'resource') {
            const resources = localStorage.getItem('liuqingju_resources');
            if (resources) {
                const list = JSON.parse(resources);
                const index = list.findIndex(r => r.id === targetId);
                
                if (index !== -1) {
                    if (result === REPORT_RESULTS.delete.value) {
                        list.splice(index, 1);
                    } else if (result === REPORT_RESULTS.hide.value) {
                        list[index].hidden = true;
                        list[index].hiddenAt = new Date().toISOString();
                    }
                    
                    localStorage.setItem('liuqingju_resources', JSON.stringify(list));
                }
            }
        } else if (targetType === 'post') {
            const posts = localStorage.getItem('liuqingju_posts');
            if (posts) {
                const list = JSON.parse(posts);
                const index = list.findIndex(p => p.id === targetId);
                
                if (index !== -1) {
                    if (result === REPORT_RESULTS.delete.value) {
                        list.splice(index, 1);
                    } else if (result === REPORT_RESULTS.hide.value) {
                        list[index].hidden = true;
                        list[index].hiddenAt = new Date().toISOString();
                    }
                    
                    localStorage.setItem('liuqingju_posts', JSON.stringify(list));
                }
            }
        }
    },

    notifyReporter(report, result, note) {
        if (typeof NotificationService !== 'undefined') {
            const reportTypeLabel = REPORT_TYPES[report.reportType]?.label || report.reportType;
            const resultLabel = REPORT_RESULTS[result]?.label || result;
            
            let message = `您对 "${report.targetTitle}" 的 ${reportTypeLabel} 举报已处理，结果：${resultLabel}`;
            if (note) {
                message += `。备注：${note}`;
            }

            NotificationService.addNotification({
                type: 'report_result',
                targetUserId: report.reporterId,
                data: {
                    reportId: report.id,
                    targetType: report.targetType,
                    targetId: report.targetId,
                    result: result
                },
                message
            });
        }
    },

    getReportStats() {
        const reports = this.getReports();
        
        const total = reports.length;
        const pending = reports.filter(r => r.status === REPORT_STATUS.pending).length;
        const resolved = reports.filter(r => r.status === REPORT_STATUS.resolved).length;
        const rejected = reports.filter(r => r.status === REPORT_STATUS.rejected).length;

        const typeStats = {};
        Object.keys(REPORT_TYPES).forEach(type => {
            typeStats[type] = {
                label: REPORT_TYPES[type].label,
                total: reports.filter(r => r.reportType === type).length,
                pending: reports.filter(r => r.reportType === type && r.status === REPORT_STATUS.pending).length,
                resolved: reports.filter(r => r.reportType === type && r.status === REPORT_STATUS.resolved).length
            };
        });

        const resultStats = {};
        Object.keys(REPORT_RESULTS).forEach(result => {
            resultStats[result] = {
                label: REPORT_RESULTS[result].label,
                count: reports.filter(r => r.result === result).length
            };
        });

        const recentActivity = reports
            .slice(0, 10)
            .map(r => ({
                id: r.id,
                reportType: r.reportType,
                typeLabel: REPORT_TYPES[r.reportType]?.label,
                targetTitle: r.targetTitle,
                status: r.status,
                createdAt: r.createdAt,
                resolvedAt: r.resolvedAt
            }));

        return {
            total,
            pending,
            resolved,
            rejected,
            typeStats,
            resultStats,
            recentActivity,
            lastUpdated: new Date().toISOString()
        };
    },

    getReportsByTarget(targetType, targetId) {
        const reports = this.getReports();
        return reports.filter(r => 
            r.targetType === targetType && 
            r.targetId === targetId
        );
    },

    getReportsByReporter(reporterId) {
        const reports = this.getReports();
        return reports.filter(r => r.reporterId === reporterId);
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
    },

    getTypes() {
        return REPORT_TYPES;
    },

    getResults() {
        return REPORT_RESULTS;
    },

    getStatus() {
        return REPORT_STATUS;
    }
};

window.ReportService = ReportService;
