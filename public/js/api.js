let csrfToken = null;

async function getCsrfToken() {
    if (csrfToken) return csrfToken;
    try {
        const res = await fetch('/api/csrf-token', { credentials: 'include' });
        const data = await res.json();
        csrfToken = data.csrfToken;
        return csrfToken;
    } catch (e) {
        return null;
    }
}

const API = {
    base: '/api',

    async request(endpoint, options = {}) {
        const isForm = options.body instanceof FormData;
        const headers = {};
        if (!isForm) headers['Content-Type'] = 'application/json';

        const method = (options.method || 'GET').toUpperCase();

        // CSRF token faqat state-o'zgartiruvchi uchun
        if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
            const token = await getCsrfToken();
            if (token) headers['x-csrf-token'] = token;
        }

        const res = await fetch(this.base + endpoint, {
            ...options,
            headers: { ...headers, ...(options.headers || {}) },
            credentials: 'include'
        });

        return res.json();
    },

    get(endpoint) { return this.request(endpoint); },
    post(endpoint, data) { return this.request(endpoint, { method: 'POST', body: JSON.stringify(data) }); },
    put(endpoint, data) { return this.request(endpoint, { method: 'PUT', body: JSON.stringify(data) }); },
    delete(endpoint) { return this.request(endpoint, { method: 'DELETE' }); }
};

// ══════════════════════════════════════════
// XSS HIMOYA
// ══════════════════════════════════════════
function esc(text) {
    if (text === null || text === undefined) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ══════════════════════════════════════════
// TOAST NOTIFICATIONS
// ══════════════════════════════════════════
function showToast(message, type = 'info', duration = 3000) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:10px;';
        document.body.appendChild(container);
    }

    const colors = {
        info: '#2563EB',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444'
    };

    const toast = document.createElement('div');
    toast.style.cssText = `
        background: #0F1629;
        border-left: 4px solid ${colors[type] || colors.info};
        color: #F1F5F9;
        padding: 14px 20px;
        border-radius: 8px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        font-family: 'Inter', sans-serif;
        font-size: 0.85rem;
        min-width: 250px;
        max-width: 400px;
        animation: slideInRight 0.3s ease;
        cursor: pointer;
    `;
    toast.textContent = message;
    toast.onclick = () => toast.remove();

    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ══════════════════════════════════════════
// DARK/LIGHT MODE
// ══════════════════════════════════════════
function initTheme() {
    const theme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
}

// Initsializatsiya
initTheme();