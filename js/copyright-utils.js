const COPYRIGHT_LICENSES = {
  CC_BY: {
    code: 'CC-BY',
    name: '署名 4.0 国际',
    fullName: 'Creative Commons Attribution 4.0 International',
    description: '允许分享和修改，但必须注明原作者',
    icon: '👤',
    url: 'https://creativecommons.org/licenses/by/4.0/deed.zh',
    requires: ['署名'],
    permits: ['共享', '商业使用', '修改'],
    prohibits: []
  },
  CC_BY_SA: {
    code: 'CC-BY-SA',
    name: '署名-相同方式共享 4.0',
    fullName: 'Attribution-ShareAlike 4.0',
    description: '允许分享和修改，但衍生内容必须使用相同许可证',
    icon: '🔄',
    url: 'https://creativecommons.org/licenses/by-sa/4.0/deed.zh',
    requires: ['署名', '相同方式共享'],
    permits: ['共享', '商业使用', '修改'],
    prohibits: []
  },
  CC_BY_NC: {
    code: 'CC-BY-NC',
    name: '署名-非商业性使用 4.0',
    fullName: 'Attribution-NonCommercial 4.0',
    description: '允许分享和修改，但不得用于商业目的',
    icon: '💰',
    url: 'https://creativecommons.org/licenses/by-nc/4.0/deed.zh',
    requires: ['署名', '非商业性使用'],
    permits: ['共享', '修改'],
    prohibits: ['商业使用']
  },
  CC_BY_ND: {
    code: 'CC-BY-ND',
    name: '署名-禁止演绎 4.0',
    fullName: 'Attribution-NoDerivatives 4.0',
    description: '允许分享，但不得修改或改编',
    icon: '🚫',
    url: 'https://creativecommons.org/licenses/by-nd/4.0/deed.zh',
    requires: ['署名'],
    permits: ['共享'],
    prohibits: ['修改', '改编']
  },
  CC_BY_NC_SA: {
    code: 'CC-BY-NC-SA',
    name: '署名-非商业性使用-相同方式共享 4.0',
    fullName: 'Attribution-NonCommercial-ShareAlike 4.0',
    description: '允许分享，但不得商业使用，且衍生内容必须使用相同许可证',
    icon: '🔄',
    url: 'https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh',
    requires: ['署名', '非商业性使用', '相同方式共享'],
    permits: ['共享', '修改'],
    prohibits: ['商业使用']
  },
  CC_BY_NC_ND: {
    code: 'CC-BY-NC-ND',
    name: '署名-非商业性使用-禁止演绎 4.0',
    fullName: 'Attribution-NonCommercial-NoDerivatives 4.0',
    description: '最严格的CC许可证，仅允许分享',
    icon: '🔒',
    url: 'https://creativecommons.org/licenses/by-nc-nd/4.0/deed.zh',
    requires: ['署名', '非商业性使用'],
    permits: ['共享'],
    prohibits: ['商业使用', '修改', '改编']
  }
};

class CopyrightStatementGenerator {
  static generateStatement(resource, options = {}) {
    const {
      includeTimestamp = true,
      includeAuthor = true,
      language = 'zh',
      format = 'text'
    } = options;

    const author = resource.author || {};
    const copyright = resource.copyright || {};
    
    let statement = '';
    
    if (language === 'zh') {
      statement = this.generateChineseStatement(resource, {
        includeTimestamp,
        includeAuthor,
        author,
        copyright
      });
    } else {
      statement = this.generateEnglishStatement(resource, {
        includeTimestamp,
        includeAuthor,
        author,
        copyright
      });
    }

    if (format === 'html') {
      statement = this.formatAsHTML(statement);
    } else if (format === 'markdown') {
      statement = this.formatAsMarkdown(statement);
    }

    return statement;
  }

  static generateChineseStatement(resource, { includeTimestamp, includeAuthor, author, copyright }) {
    const lines = [];
    const timestamp = includeTimestamp ? new Date().toLocaleString('zh-CN') : '';
    
    const copyrightType = copyright.type || 'original';
    
    switch(copyrightType) {
      case 'original':
        lines.push(`【原创声明】`);
        if (includeAuthor) {
          lines.push(`本作品由 ${author.nickname || '作者'} 原创，`);
        }
        lines.push(`版权所有，保留所有权利。`);
        if (includeTimestamp) {
          lines.push(`创建时间：${timestamp}`);
        }
        if (copyright.statement) {
          lines.push(`\n${copyright.statement}`);
        }
        break;

      case 'reprint':
        lines.push(`【转载声明】`);
        lines.push(`本作品转载自 ${copyright.reprintSource || '网络'}，`);
        if (copyright.reprintAuthor) {
          lines.push(`原作者：${copyright.reprintAuthor}，`);
        }
        if (includeAuthor) {
          lines.push(`由 ${author.nickname || '用户'} 整理分享。`);
        }
        if (includeTimestamp) {
          lines.push(`发布时间：${timestamp}`);
        }
        if (copyright.statement) {
          lines.push(`\n${copyright.statement}`);
        }
        break;

      case 'licensed':
        lines.push(`【授权声明】`);
        lines.push(`本作品已获得合法授权，`);
        if (copyright.licenseProof) {
          lines.push(`授权证明：${copyright.licenseProof}，`);
        }
        if (includeAuthor) {
          lines.push(`由 ${author.nickname || '用户'} 分享。`);
        }
        if (copyright.statement) {
          lines.push(`\n${copyright.statement}`);
        }
        break;

      case 'cc':
        const license = COPYRIGHT_LICENSES[copyright.ccType] || COPYRIGHT_LICENSES.CC_BY;
        lines.push(`【CC协议声明】`);
        lines.push(`本作品采用 ${license.name} 许可证。`);
        lines.push(`许可证链接：${license.url}`);
        lines.push(`\n许可证说明：${license.description}`);
        lines.push(`\n您可以：${license.permits.join('、')}`);
        lines.push(`必须：${license.requires.join('、')}`);
        if (license.prohibits.length > 0) {
          lines.push(`不得：${license.prohibits.join('、')}`);
        }
        if (includeAuthor) {
          lines.push(`\n署名：${author.nickname || '原作者'}`);
        }
        if (includeTimestamp) {
          lines.push(`发布时间：${timestamp}`);
        }
        break;

      case 'public_domain':
        lines.push(`【公共领域声明】`);
        lines.push(`本作品属于公共领域，不保留任何版权。`);
        lines.push(`任何人都可以自由使用、复制、修改和分发。`);
        if (includeAuthor) {
          lines.push(`\n分享者：${author.nickname || '用户'}`);
        }
        if (includeTimestamp) {
          lines.push(`发布时间：${timestamp}`);
        }
        break;

      default:
        lines.push(`【版权声明】`);
        lines.push(`版权所有，保留所有权利。`);
    }

    return lines.join('\n');
  }

  static generateEnglishStatement(resource, { includeTimestamp, includeAuthor, author, copyright }) {
    const lines = [];
    const timestamp = includeTimestamp ? new Date().toLocaleDateString('en-US') : '';
    
    const copyrightType = copyright.type || 'original';

    switch(copyrightType) {
      case 'original':
        lines.push(`【Copyright Notice】`);
        if (includeAuthor) {
          lines.push(`This work is created by ${author.nickname || 'the author'} and is protected by copyright.`);
        } else {
          lines.push(`This work is protected by copyright. All rights reserved.`);
        }
        if (includeTimestamp) {
          lines.push(`Created: ${timestamp}`);
        }
        if (copyright.statement) {
          lines.push(`\n${copyright.statement}`);
        }
        break;

      case 'reprint':
        lines.push(`【Reprint Notice】`);
        lines.push(`This work is reprinted from ${copyright.reprintSource || 'the internet'}.`);
        if (copyright.reprintAuthor) {
          lines.push(`Original author: ${copyright.reprintAuthor}.`);
        }
        if (includeAuthor) {
          lines.push(`Shared by ${author.nickname || 'user'}.`);
        }
        if (includeTimestamp) {
          lines.push(`Published: ${timestamp}`);
        }
        break;

      case 'cc':
        const license = COPYRIGHT_LICENSES[copyright.ccType] || COPYRIGHT_LICENSES.CC_BY;
        lines.push(`【${license.name} License】`);
        lines.push(`This work is licensed under ${license.fullName}.`);
        lines.push(`License URL: ${license.url}`);
        lines.push(`\n${license.description}`);
        lines.push(`\nYou are free to: ${license.permits.join(', ')}`);
        lines.push(`You must: ${license.requires.join(', ')}`);
        if (license.prohibits.length > 0) {
          lines.push(`You cannot: ${license.prohibits.join(', ')}`);
        }
        break;

      default:
        lines.push(`【Copyright】All rights reserved.`);
    }

    return lines.join('\n');
  }

  static formatAsHTML(statement) {
    return `<div class="copyright-statement" style="
      padding: 16px;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      border-left: 4px solid #667eea;
      border-radius: 8px;
      margin: 16px 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">
      <div style="white-space: pre-wrap; line-height: 1.8; color: #333;">
        ${statement.replace(/\n/g, '<br>')}
      </div>
    </div>`;
  }

  static formatAsMarkdown(statement) {
    return `\`\`\`\n${statement}\n\`\`\``;
  }

  static getLicenseBadge(ccType) {
    const license = COPYRIGHT_LICENSES[ccType];
    if (!license) return '';

    return {
      code: license.code,
      name: license.name,
      icon: license.icon,
      url: license.url,
      color: this.getLicenseColor(ccType)
    };
  }

  static getLicenseColor(ccType) {
    const colors = {
      'CC-BY': '#EFB53C',
      'CC-BY-SA': '#EFB53C',
      'CC-BY-NC': '#EFB53C',
      'CC-BY-ND': '#EFB53C',
      'CC-BY-NC-SA': '#EFB53C',
      'CC-BY-NC-ND': '#EFB53C'
    };
    return colors[ccType] || '#667eea';
  }
}

class WatermarkService {
  static addWatermark(imageData, options = {}) {
    const {
      text = '',
      position = 'bottom-right',
      opacity = 0.3,
      fontSize = 16,
      color = '#000000',
      margin = 20
    } = options;

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = img.width;
        canvas.height = img.height;

        ctx.drawImage(img, 0, 0);

        ctx.globalAlpha = opacity;
        ctx.font = `${fontSize}px Arial, sans-serif`;
        ctx.fillStyle = color;

        let x, y;
        const textWidth = ctx.measureText(text).width;

        switch(position) {
          case 'top-left':
            x = margin;
            y = margin + fontSize;
            break;
          case 'top-right':
            x = canvas.width - textWidth - margin;
            y = margin + fontSize;
            break;
          case 'bottom-left':
            x = margin;
            y = canvas.height - margin;
            break;
          case 'bottom-right':
          default:
            x = canvas.width - textWidth - margin;
            y = canvas.height - margin;
            break;
          case 'center':
            x = (canvas.width - textWidth) / 2;
            y = canvas.height / 2;
            break;
        }

        ctx.fillText(text, x, y);

        ctx.globalAlpha = 1;

        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };

      img.onerror = reject;
      img.src = imageData;
    });
  }

  static addTileWatermark(imageData, options = {}) {
    const {
      text = '',
      opacity = 0.1,
      fontSize = 24,
      color = '#cccccc',
      spacing = 100
    } = options;

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = img.width;
        canvas.height = img.height;

        ctx.drawImage(img, 0, 0);

        ctx.globalAlpha = opacity;
        ctx.font = `${fontSize}px Arial, sans-serif`;
        ctx.fillStyle = color;

        ctx.translate(spacing / 2, spacing / 2);
        ctx.rotate(-Math.PI / 6);

        const cols = Math.ceil(canvas.width / spacing) + 2;
        const rows = Math.ceil(canvas.height / spacing) + 2;

        for (let i = -1; i < cols; i++) {
          for (let j = -1; j < rows; j++) {
            ctx.fillText(text, i * spacing, j * spacing);
          }
        }

        ctx.globalAlpha = 1;

        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };

      img.onerror = reject;
      img.src = imageData;
    });
  }

  static addAuthorWatermark(imageData, author) {
    return this.addWatermark(imageData, {
      text: `@${author.nickname || author.name || '留情局'}`,
      position: 'bottom-right',
      opacity: 0.4,
      fontSize: 18,
      color: '#333333'
    });
  }
}

window.CopyrightStatementGenerator = CopyrightStatementGenerator;
window.WatermarkService = WatermarkService;
window.COPYRIGHT_LICENSES = COPYRIGHT_LICENSES;
