const NOTIFICATION_SETTINGS_KEY = 'liuqingju_notification_settings';

const DEFAULT_NOTIFICATION_SETTINGS = {
    channels: {
        inApp: true,
        email: false,
        push: false
    },
    
    types: {
        postReply: {
            enabled: true,
            label: '帖子回复',
            description: '有人回复你的帖子时'
        },
        postLike: {
            enabled: true,
            label: '帖子点赞',
            description: '有人点赞你的帖子时'
        },
        postBookmark: {
            enabled: true,
            label: '帖子收藏',
            description: '有人收藏你的帖子时'
        },
        resourceDownload: {
            enabled: true,
            label: '资源下载',
            description: '有人下载你的资源时'
        },
        resourceLike: {
            enabled: true,
            label: '资源点赞',
            description: '有人点赞你的资源时'
        },
        bountyResponse: {
            enabled: true,
            label: '悬赏响应',
            description: '有人响应你的悬赏时'
        },
        bountyAccepted: {
            enabled: true,
            label: '悬赏采纳',
            description: '你的响应被采纳时'
        },
        bountyCompleted: {
            enabled: true,
            label: '悬赏完成',
            description: '悬赏完成并获得积分时'
        },
        pointsEarned: {
            enabled: true,
            label: '积分变动',
            description: '积分增加或减少时'
        },
        levelUp: {
            enabled: true,
            label: '等级提升',
            description: '等级提升时'
        },
        dailyTask: {
            enabled: true,
            label: '每日任务',
            description: '每日任务完成时'
        },
        weeklyTask: {
            enabled: true,
            label: '每周任务',
            description: '每周任务完成时'
        },
        achievement: {
            enabled: true,
            label: '成就解锁',
            description: '解锁新成就时'
        },
        system: {
            enabled: true,
            label: '系统公告',
            description: '平台重要公告和通知'
        }
    },
    
    doNotDisturb: {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00',
        weekends: false
    },
    
    frequency: {
        type: 'realtime',
        options: {
            realtime: '实时推送',
            hourly: '每小时汇总',
            daily: '每天汇总'
        }
    },
    
    emailSettings: {
        enabled: false,
        address: '',
        digestFrequency: 'daily'
    }
};

class NotificationSettingsService {
    constructor() {
        this.settings = this.loadSettings();
    }

    loadSettings() {
        const stored = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                return this.mergeWithDefaults(parsed);
            } catch (e) {
                console.error('加载通知设置失败:', e);
                return { ...DEFAULT_NOTIFICATION_SETTINGS };
            }
        }
        return { ...DEFAULT_NOTIFICATION_SETTINGS };
    }

    mergeWithDefaults(stored) {
        const merged = { ...DEFAULT_NOTIFICATION_SETTINGS };

        Object.keys(stored).forEach(key => {
            if (typeof stored[key] === 'object' && stored[key] !== null) {
                merged[key] = { ...DEFAULT_NOTIFICATION_SETTINGS[key], ...stored[key] };
            } else {
                merged[key] = stored[key];
            }
        });

        return merged;
    }

    saveSettings() {
        localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(this.settings));
    }

    get(key) {
        const keys = key.split('.');
        let value = this.settings;

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return undefined;
            }
        }

        return value;
    }

    set(key, value) {
        const keys = key.split('.');
        let obj = this.settings;

        for (let i = 0; i < keys.length - 1; i++) {
            const k = keys[i];
            if (!(k in obj) || typeof obj[k] !== 'object') {
                obj[k] = {};
            }
            obj = obj[k];
        }

        obj[keys[keys.length - 1]] = value;
        this.saveSettings();
    }

    update(newSettings) {
        this.settings = this.mergeWithDefaults(newSettings);
        this.saveSettings();
    }

    reset() {
        this.settings = { ...DEFAULT_NOTIFICATION_SETTINGS };
        this.saveSettings();
    }

    getAll() {
        return JSON.parse(JSON.stringify(this.settings));
    }

    shouldNotify(type) {
        const typeSettings = this.settings.types[type];
        
        if (!typeSettings || !typeSettings.enabled) {
            return false;
        }

        if (this.isInDoNotDisturbPeriod()) {
            return type === 'system';
        }

        return true;
    }

    isInDoNotDisturbPeriod() {
        if (!this.settings.doNotDisturb.enabled) {
            return false;
        }

        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const currentDay = now.getDay();

        const [startHour, startMin] = this.settings.doNotDisturb.startTime.split(':').map(Number);
        const [endHour, endMin] = this.settings.doNotDisturb.endTime.split(':').map(Number);

        const startTime = startHour * 60 + startMin;
        const endTime = endHour * 60 + endMin;

        let inDndPeriod = false;

        if (startTime < endTime) {
            inDndPeriod = currentTime >= startTime && currentTime < endTime;
        } else {
            inDndPeriod = currentTime >= startTime || currentTime < endTime;
        }

        if (this.settings.doNotDisturb.weekends && (currentDay === 0 || currentDay === 6)) {
            return true;
        }

        return inDndPeriod;
    }

    enableType(type) {
        if (this.settings.types[type]) {
            this.settings.types[type].enabled = true;
            this.saveSettings();
            return true;
        }
        return false;
    }

    disableType(type) {
        if (this.settings.types[type]) {
            this.settings.types[type].enabled = false;
            this.saveSettings();
            return true;
        }
        return false;
    }

    toggleType(type) {
        if (this.settings.types[type]) {
            this.settings.types[type].enabled = !this.settings.types[type].enabled;
            this.saveSettings();
            return this.settings.types[type].enabled;
        }
        return false;
    }

    getEnabledTypes() {
        const enabled = [];
        
        Object.keys(this.settings.types).forEach(type => {
            if (this.settings.types[type].enabled) {
                enabled.push(type);
            }
        });

        return enabled;
    }

    getDisabledTypes() {
        const disabled = [];
        
        Object.keys(this.settings.types).forEach(type => {
            if (!this.settings.types[type].enabled) {
                disabled.push(type);
            }
        });

        return disabled;
    }

    enableChannel(channel) {
        if (channel in this.settings.channels) {
            this.settings.channels[channel] = true;
            this.saveSettings();
            return true;
        }
        return false;
    }

    disableChannel(channel) {
        if (channel in this.settings.channels) {
            this.settings.channels[channel] = false;
            this.saveSettings();
            return true;
        }
        return false;
    }

    setDoNotDisturb(enabled, options = {}) {
        this.settings.doNotDisturb.enabled = enabled;
        
        if (options.startTime) {
            this.settings.doNotDisturb.startTime = options.startTime;
        }
        if (options.endTime) {
            this.settings.doNotDisturb.endTime = options.endTime;
        }
        if (typeof options.weekends === 'boolean') {
            this.settings.doNotDisturb.weekends = options.weekends;
        }

        this.saveSettings();
    }

    getNotificationCount() {
        const types = this.settings.types;
        let enabled = 0;
        let total = 0;

        Object.keys(types).forEach(type => {
            total++;
            if (types[type].enabled) {
                enabled++;
            }
        });

        return { enabled, total, percentage: Math.round((enabled / total) * 100) };
    }

    exportSettings() {
        return JSON.stringify(this.settings, null, 2);
    }

    importSettings(jsonString) {
        try {
            const imported = JSON.parse(jsonString);
            this.update(imported);
            return true;
        } catch (e) {
            console.error('导入设置失败:', e);
            return false;
        }
    }
}

class NotificationSettingsUI {
    static renderSettingsPanel() {
        const settings = new NotificationSettingsService().getAll();

        return `
            <div class="notification-settings-panel">
                <div class="settings-header">
                    <h2>通知设置</h2>
                    <p>管理您希望接收的通知类型和方式</p>
                </div>

                <div class="settings-section">
                    <h3><i class="fas fa-bell"></i> 通知渠道</h3>
                    <div class="channel-toggles">
                        <label class="toggle-item">
                            <input type="checkbox" id="channel-inapp" 
                                   ${settings.channels.inApp ? 'checked' : ''} 
                                   onchange="NotificationSettingsUI.toggleChannel('inApp', this.checked)">
                            <span class="toggle-switch"></span>
                            <span class="toggle-label">
                                <i class="fas fa-bell"></i>
                                应用内通知
                            </span>
                        </label>
                        <label class="toggle-item">
                            <input type="checkbox" id="channel-email" 
                                   ${settings.channels.email ? 'checked' : ''} 
                                   onchange="NotificationSettingsUI.toggleChannel('email', this.checked)">
                            <span class="toggle-switch"></span>
                            <span class="toggle-label">
                                <i class="fas fa-envelope"></i>
                                邮件通知
                            </span>
                        </label>
                    </div>
                </div>

                <div class="settings-section">
                    <h3><i class="fas fa-list"></i> 通知类型</h3>
                    <div class="notification-types-list">
                        ${Object.entries(settings.types).map(([type, config]) => `
                            <div class="notification-type-item" data-type="${type}">
                                <div class="type-info">
                                    <div class="type-header">
                                        <span class="type-label">${config.label}</span>
                                        <label class="type-toggle">
                                            <input type="checkbox" 
                                                   ${config.enabled ? 'checked' : ''} 
                                                   onchange="NotificationSettingsUI.toggleType('${type}', this.checked)">
                                            <span class="toggle-slider"></span>
                                        </label>
                                    </div>
                                    <p class="type-description">${config.description}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="settings-section">
                    <h3><i class="fas fa-moon"></i> 免打扰模式</h3>
                    <div class="dnd-settings">
                        <label class="toggle-item">
                            <input type="checkbox" id="dnd-enabled" 
                                   ${settings.doNotDisturb.enabled ? 'checked' : ''} 
                                   onchange="NotificationSettingsUI.toggleDoNotDisturb(this.checked)">
                            <span class="toggle-switch"></span>
                            <span class="toggle-label">启用免打扰</span>
                        </label>

                        <div class="dnd-options ${settings.doNotDisturb.enabled ? '' : 'disabled'}">
                            <div class="time-range">
                                <label>
                                    <span>开始时间</span>
                                    <input type="time" id="dnd-start" 
                                           value="${settings.doNotDisturb.startTime}"
                                           onchange="NotificationSettingsUI.updateDoNotDisturb('startTime', this.value)">
                                </label>
                                <span class="separator">至</span>
                                <label>
                                    <span>结束时间</span>
                                    <input type="time" id="dnd-end" 
                                           value="${settings.doNotDisturb.endTime}"
                                           onchange="NotificationSettingsUI.updateDoNotDisturb('endTime', this.value)">
                                </label>
                            </div>
                            <label class="toggle-item">
                                <input type="checkbox" id="dnd-weekends" 
                                       ${settings.doNotDisturb.weekends ? 'checked' : ''} 
                                       onchange="NotificationSettingsUI.updateDoNotDisturb('weekends', this.checked)">
                                <span class="toggle-switch"></span>
                                <span class="toggle-label">周末全天免打扰</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div class="settings-section">
                    <h3><i class="fas fa-chart-bar"></i> 统计信息</h3>
                    <div class="stats-summary">
                        ${this.renderStats()}
                    </div>
                </div>

                <div class="settings-actions">
                    <button class="btn-secondary" onclick="NotificationSettingsUI.resetToDefaults()">
                        <i class="fas fa-undo"></i>
                        重置为默认
                    </button>
                    <button class="btn-primary" onclick="NotificationSettingsUI.saveAll()">
                        <i class="fas fa-save"></i>
                        保存设置
                    </button>
                </div>
            </div>
        `;
    }

    static renderStats() {
        const service = new NotificationSettingsService();
        const count = service.getNotificationCount();

        return `
            <div class="stats-card">
                <div class="stat-item">
                    <span class="stat-value">${count.enabled}</span>
                    <span class="stat-label">已开启</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${count.total - count.enabled}</span>
                    <span class="stat-label">已关闭</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${count.percentage}%</span>
                    <span class="stat-label">开启率</span>
                </div>
            </div>
        `;
    }

    static toggleChannel(channel, enabled) {
        const service = new NotificationSettingsService();
        if (enabled) {
            service.enableChannel(channel);
        } else {
            service.disableChannel(channel);
        }
    }

    static toggleType(type, enabled) {
        const service = new NotificationSettingsService();
        if (enabled) {
            service.enableType(type);
        } else {
            service.disableType(type);
        }
    }

    static toggleDoNotDisturb(enabled) {
        const service = new NotificationSettingsService();
        service.setDoNotDisturb(enabled);

        const options = document.querySelector('.dnd-options');
        if (options) {
            options.classList.toggle('disabled', !enabled);
        }
    }

    static updateDoNotDisturb(key, value) {
        const service = new NotificationSettingsService();
        const current = {
            startTime: document.getElementById('dnd-start')?.value,
            endTime: document.getElementById('dnd-end')?.value,
            weekends: document.getElementById('dnd-weekends')?.checked
        };
        current[key] = value;
        service.setDoNotDisturb(true, current);
    }

    static resetToDefaults() {
        if (confirm('确定要重置所有通知设置为默认吗？')) {
            const service = new NotificationSettingsService();
            service.reset();
            alert('设置已重置为默认值');
            location.reload();
        }
    }

    static saveAll() {
        alert('设置已保存！');
        window.dispatchEvent(new CustomEvent('notificationSettingsUpdated'));
    }
}

window.NotificationSettingsService = NotificationSettingsService;
window.NotificationSettingsUI = NotificationSettingsUI;
