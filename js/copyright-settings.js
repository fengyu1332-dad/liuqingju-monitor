const COPYRIGHT_SETTINGS_KEY = 'liuqingju_copyright_settings';

class CopyrightSettings {
  constructor() {
    this.settings = this.loadSettings();
  }

  loadSettings() {
    const stored = localStorage.getItem(COPYRIGHT_SETTINGS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return this.getDefaultSettings();
  }

  saveSettings() {
    localStorage.setItem(COPYRIGHT_SETTINGS_KEY, JSON.stringify(this.settings));
  }

  getDefaultSettings() {
    return {
      defaultLicense: 'original',
      autoWatermark: false,
      watermarkText: '@留情局',
      watermarkPosition: 'bottom-right',
      watermarkOpacity: 0.3,
      watermarkFontSize: 16,
      defaultStatement: '',
      enableProtection: true,
      notifyOnReprint: true,
      requireAttribution: true,
      preferredLicense: 'CC-BY-NC',
      customBranding: false,
      brandingText: '',
      autoGenerateStatement: true,
      protectionLevel: 'standard',
      blockScreenCapture: false,
      disableRightClick: false,
      showDownloadCount: true,
      enableDRM: false
    };
  }

  get(key) {
    return this.settings[key];
  }

  set(key, value) {
    this.settings[key] = value;
    this.saveSettings();
  }

  update(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
  }

  reset() {
    this.settings = this.getDefaultSettings();
    this.saveSettings();
  }

  getAll() {
    return { ...this.settings };
  }
}

class CopyrightProtection {
  constructor(resourceId) {
    this.resourceId = resourceId;
    this.resource = this.loadResource();
    this.protectionLevel = 'standard';
  }

  loadResource() {
    if (typeof ResourceService !== 'undefined') {
      return ResourceService.getResourceById(this.resourceId);
    }
    return null;
  }

  shouldProtect() {
    if (!this.resource) return false;
    
    const settings = new CopyrightSettings().getAll();
    if (!settings.enableProtection) return false;
    
    const copyright = this.resource.copyright || {};
    const protectedTypes = ['original', 'licensed'];
    
    return protectedTypes.includes(copyright.type);
  }

  applyProtection() {
    if (!this.shouldProtect()) return null;

    const protections = [];
    const settings = new CopyrightSettings().getAll();

    if (settings.disableRightClick) {
      protections.push('disable_right_click');
    }

    if (settings.blockScreenCapture) {
      protections.push('block_screenshot');
    }

    if (settings.autoWatermark) {
      protections.push('watermark');
    }

    if (settings.enableDRM) {
      protections.push('drm');
    }

    return protections;
  }

  isReprintAllowed() {
    if (!this.resource) return true;
    
    const copyright = this.resource.copyright || {};
    
    if (copyright.type === 'public_domain') return true;
    
    const ccType = copyright.ccType;
    if (ccType && COPYRIGHT_LICENSES[ccType]) {
      const license = COPYRIGHT_LICENSES[ccType];
      return !license.prohibits.includes('共享');
    }
    
    return true;
  }

  canUseCommercially() {
    if (!this.resource) return true;
    
    const copyright = this.resource.copyright || {};
    
    if (copyright.type === 'public_domain') return true;
    
    const ccType = copyright.ccType;
    if (ccType && COPYRIGHT_LICENSES[ccType]) {
      const license = COPYRIGHT_LICENSES[ccType];
      return !license.prohibits.includes('商业使用');
    }
    
    return false;
  }

  canModify() {
    if (!this.resource) return true;
    
    const copyright = this.resource.copyright || {};
    
    if (copyright.type === 'public_domain') return true;
    
    const ccType = copyright.ccType;
    if (ccType && COPYRIGHT_LICENSES[ccType]) {
      const license = COPYRIGHT_LICENSES[ccType];
      return !license.prohibits.includes('修改');
    }
    
    return false;
  }

  getAttributionRequired() {
    if (!this.resource) return false;
    
    const settings = new CopyrightSettings().getAll();
    if (!settings.requireAttribution) return false;
    
    return true;
  }

  getAttributionText() {
    if (!this.resource) return '';
    
    const author = this.resource.author || {};
    const name = author.nickname || author.name || '原作者';
    
    const settings = new CopyrightSettings().getAll();
    
    return `"${this.resource.title}" by ${name}, available at留情局`;
  }
}

class CopyrightUI {
  static renderSettingsPanel() {
    const settings = new CopyrightSettings().getAll();

    return `
      <div class="copyright-settings-panel">
        <div class="settings-section">
          <h3><i class="fas fa-shield-alt"></i> 默认许可证</h3>
          <div class="form-group">
            <label>默认版权类型</label>
            <select id="default-license" class="form-control">
              <option value="original" ${settings.defaultLicense === 'original' ? 'selected' : ''}>原创</option>
              <option value="reprint" ${settings.defaultLicense === 'reprint' ? 'selected' : ''}>转载</option>
              <option value="licensed" ${settings.defaultLicense === 'licensed' ? 'selected' : ''}>授权</option>
              <option value="cc" ${settings.defaultLicense === 'cc' ? 'selected' : ''}>CC协议</option>
              <option value="public_domain" ${settings.defaultLicense === 'public_domain' ? 'selected' : ''}>公共领域</option>
            </select>
          </div>
        </div>

        <div class="settings-section">
          <h3><i class="fas fa-image"></i> 水印设置</h3>
          <div class="form-group">
            <label>
              <input type="checkbox" id="auto-watermark" ${settings.autoWatermark ? 'checked' : ''}>
              自动添加水印
            </label>
          </div>
          <div class="form-group">
            <label>水印文字</label>
            <input type="text" id="watermark-text" class="form-control" 
                   value="${settings.watermarkText}" placeholder="如水印文字">
          </div>
          <div class="form-group">
            <label>水印位置</label>
            <select id="watermark-position" class="form-control">
              <option value="top-left" ${settings.watermarkPosition === 'top-left' ? 'selected' : ''}>左上</option>
              <option value="top-right" ${settings.watermarkPosition === 'top-right' ? 'selected' : ''}>右上</option>
              <option value="bottom-left" ${settings.watermarkPosition === 'bottom-left' ? 'selected' : ''}>左下</option>
              <option value="bottom-right" ${settings.watermarkPosition === 'bottom-right' ? 'selected' : ''}>右下</option>
              <option value="center" ${settings.watermarkPosition === 'center' ? 'selected' : ''}>居中</option>
            </select>
          </div>
          <div class="form-group">
            <label>水印透明度: <span id="opacity-value">${settings.watermarkOpacity * 100}%</span></label>
            <input type="range" id="watermark-opacity" class="form-range" 
                   min="0.1" max="0.8" step="0.1" value="${settings.watermarkOpacity}">
          </div>
        </div>

        <div class="settings-section">
          <h3><i class="fas fa-lock"></i> 保护设置</h3>
          <div class="form-group">
            <label>
              <input type="checkbox" id="enable-protection" ${settings.enableProtection ? 'checked' : ''}>
              启用版权保护
            </label>
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" id="notify-reprint" ${settings.notifyOnReprint ? 'checked' : ''}>
              转载时通知我
            </label>
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" id="require-attribution" ${settings.requireAttribution ? 'checked' : ''}>
              要求署名
            </label>
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" id="auto-generate-statement" ${settings.autoGenerateStatement ? 'checked' : ''}>
              自动生成版权声明
            </label>
          </div>
        </div>

        <div class="settings-section">
          <h3><i class="fas fa-cog"></i> 高级设置</h3>
          <div class="form-group">
            <label>保护级别</label>
            <select id="protection-level" class="form-control">
              <option value="basic" ${settings.protectionLevel === 'basic' ? 'selected' : ''}>基础</option>
              <option value="standard" ${settings.protectionLevel === 'standard' ? 'selected' : ''}>标准</option>
              <option value="strict" ${settings.protectionLevel === 'strict' ? 'selected' : ''}>严格</option>
            </select>
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" id="disable-right-click" ${settings.disableRightClick ? 'checked' : ''}>
              禁用右键菜单
            </label>
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" id="block-screenshot" ${settings.blockScreenCapture ? 'checked' : ''}>
              阻止截图
            </label>
          </div>
        </div>

        <button onclick="CopyrightUI.saveSettings()" class="btn btn-primary">
          <i class="fas fa-save"></i> 保存设置
        </button>
        <button onclick="CopyrightUI.resetSettings()" class="btn btn-secondary">
          <i class="fas fa-undo"></i> 重置
        </button>
      </div>
    `;
  }

  static saveSettings() {
    const settings = new CopyrightSettings();

    settings.set('defaultLicense', document.getElementById('default-license')?.value || 'original');
    settings.set('autoWatermark', document.getElementById('auto-watermark')?.checked || false);
    settings.set('watermarkText', document.getElementById('watermark-text')?.value || '@留情局');
    settings.set('watermarkPosition', document.getElementById('watermark-position')?.value || 'bottom-right');
    settings.set('watermarkOpacity', parseFloat(document.getElementById('watermark-opacity')?.value || '0.3'));
    settings.set('enableProtection', document.getElementById('enable-protection')?.checked ?? true);
    settings.set('notifyOnReprint', document.getElementById('notify-reprint')?.checked ?? true);
    settings.set('requireAttribution', document.getElementById('require-attribution')?.checked ?? true);
    settings.set('autoGenerateStatement', document.getElementById('auto-generate-statement')?.checked ?? true);
    settings.set('protectionLevel', document.getElementById('protection-level')?.value || 'standard');
    settings.set('disableRightClick', document.getElementById('disable-right-click')?.checked || false);
    settings.set('blockScreenCapture', document.getElementById('block-screenshot')?.checked || false);

    alert('设置已保存！');
  }

  static resetSettings() {
    if (confirm('确定要重置所有版权设置吗？')) {
      const settings = new CopyrightSettings();
      settings.reset();
      alert('设置已重置为默认值！');
      location.reload();
    }
  }

  static renderCopyrightBadge(resource) {
    const copyright = resource.copyright || {};
    const type = copyright.type || 'original';

    const badges = {
      original: { icon: '✍️', label: '原创', color: '#667eea', bgColor: '#e8eaf6' },
      reprint: { icon: '📋', label: '转载', color: '#ff9800', bgColor: '#fff3e0' },
      licensed: { icon: '✅', label: '授权', color: '#4caf50', bgColor: '#e8f5e9' },
      cc: { icon: '🔗', label: 'CC协议', color: '#9c27b0', bgColor: '#f3e5f5' },
      public_domain: { icon: '🌍', label: '公共领域', color: '#00bcd4', bgColor: '#e0f7fa' }
    };

    const badge = badges[type] || badges.original;

    let html = `
      <span class="copyright-badge" style="
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 12px;
        background: ${badge.bgColor};
        color: ${badge.color};
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
      ">
        ${badge.icon} ${badge.label}
    `;

    if (type === 'cc' && copyright.ccType) {
      const license = COPYRIGHT_LICENSES[copyright.ccType];
      if (license) {
        html += `
          <a href="${license.url}" target="_blank" style="
            margin-left: 4px;
            color: ${badge.color};
            text-decoration: none;
          " title="${license.name}">
            ${license.icon} ${license.code}
          </a>
        `;
      }
    }

    html += '</span>';

    return html;
  }

  static renderLicenseSelector() {
    const licenses = Object.entries(COPYRIGHT_LICENSES).map(([key, license]) => ({
      key,
      ...license
    }));

    return `
      <div class="cc-license-selector">
        <div class="license-grid">
          ${licenses.map(license => `
            <div class="license-card" data-license="${license.code}">
              <div class="license-icon">${license.icon}</div>
              <div class="license-name">${license.name}</div>
              <div class="license-desc">${license.description}</div>
              <div class="license-permits">
                ${license.permits.map(p => `<span class="permit-tag">✓ ${p}</span>`).join('')}
              </div>
              ${license.prohibits.length > 0 ? `
                <div class="license-prohibits">
                  ${license.prohibits.map(p => `<span class="prohibit-tag">✗ ${p}</span>`).join('')}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
}

window.CopyrightSettings = CopyrightSettings;
window.CopyrightProtection = CopyrightProtection;
window.CopyrightUI = CopyrightUI;
