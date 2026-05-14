
class Toast {
    constructor() {
        this.container = null;
        this.init();
    }

    init() {
        const existing = document.getElementById('toast-container');
        if (existing) {
            this.container = existing;
            return;
        }

        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);

        const style = document.createElement('style');
        style.textContent = `
            .toast-container {
                position: fixed;
                bottom: 24px;
                right: 24px;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            
            .toast {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 14px 20px;
                border-radius: 12px;
                background: white;
                box-shadow: 0 4px 24px rgba(0,0,0,0.15);
                animation: slideIn 0.3s ease;
                min-width: 280px;
                max-width: 400px;
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            .toast.success { border-left: 4px solid #4CAF50; }
            .toast.success .toast-icon { color: #4CAF50; }
            
            .toast.error { border-left: 4px solid #E53935; }
            .toast.error .toast-icon { color: #E53935; }
            
            .toast.warning { border-left: 4px solid #FF9800; }
            .toast.warning .toast-icon { color: #FF9800; }
            
            .toast.info { border-left: 4px solid #1976D2; }
            .toast.info .toast-icon { color: #1976D2; }
            
            .toast-icon {
                font-size: 20px;
            }
            
            .toast-content {
                flex: 1;
            }
            
            .toast-title {
                font-size: 14px;
                font-weight: 600;
                color: #1a1a2e;
                margin-bottom: 2px;
            }
            
            .toast-message {
                font-size: 13px;
                color: #666;
            }
            
            .toast-close {
                background: none;
                border: none;
                font-size: 18px;
                color: #999;
                cursor: pointer;
                padding: 4px;
                line-height: 1;
                transition: color 0.2s;
            }
            
            .toast-close:hover {
                color: #333;
            }
            
            @media (max-width: 640px) {
                .toast-container {
                    left: 16px;
                    right: 16px;
                    bottom: 16px;
                }
                .toast {
                    min-width: auto;
                }
            }
        `;
        document.head.appendChild(style);
    }

    show(options) {
        const { type = 'info', title, message, duration = 3000 } = options;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-times-circle',
            warning: 'fa-exclamation-circle',
            info: 'fa-info-circle'
        };
        
        toast.innerHTML = `
            <i class="fas ${icons[type]} toast-icon"></i>
            <div class="toast-content">
                ${title ? `<div class="toast-title">${title}</div>` : ''}
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">&times;</button>
        `;
        
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => this.dismiss(toast));
        
        this.container.appendChild(toast);
        
        if (duration > 0) {
            setTimeout(() => this.dismiss(toast), duration);
        }
        
        return toast;
    }

    dismiss(toast) {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }

    success(message, title) {
        return this.show({ type: 'success', title, message });
    }

    error(message, title) {
        return this.show({ type: 'error', title, message });
    }

    warning(message, title) {
        return this.show({ type: 'warning', title, message });
    }

    info(message, title) {
        return this.show({ type: 'info', title, message });
    }
}

window.Toast = new Toast();
