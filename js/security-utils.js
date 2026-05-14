
class SecurityUtils {
    static escapeHtml(text) {
        if (typeof text !== 'string') {
            return text;
        }
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    static escapeAttribute(value) {
        if (typeof value !== 'string') {
            return value;
        }
        return value.replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    static sanitizeInput(input, maxLength = 1000) {
        if (typeof input !== 'string') {
            return '';
        }
        const trimmed = input.trim();
        if (trimmed.length > maxLength) {
            console.warn('Input exceeds max length');
            return trimmed.substring(0, maxLength);
        }
        return trimmed;
    }

    static validateEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    static validateUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    static generateCsrfToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }
}

window.SecurityUtils = SecurityUtils;
