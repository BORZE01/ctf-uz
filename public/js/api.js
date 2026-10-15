// ══════════════════════════════════════════
// API HELPER (CSRF + /api prefix)
// ══════════════════════════════════════════
let _csrfToken = null;

async function getCsrfToken() {
    if (_csrfToken) return _csrfToken;
    try {
        const res = await fetch('/api/csrf-token', { credentials: 'include' });
        const data = await res.json();
        _csrfToken = data.csrfToken;
        return _csrfToken;
    } catch (e) {
        console.error('CSRF token xatosi:', e);
        return null;
    }
}

const API = {
    async request(url, options = {}) {
        // /api prefiksini qo'shish (agar yo'q bo'lsa)
        if (!url.startsWith('/api')) {
            url = '/api' + url;
        }

        const method = (options.method || 'GET').toUpperCase();
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
            const token = await getCsrfToken();
            if (token) headers['x-csrf-token'] = token;
        }

        const res = await fetch(url, {
            ...options,
            headers,
            credentials: 'include'
        });

        if (res.status === 401) {
            window.location.href = '/login';
            return { success: false };
        }

        if (res.status === 403) {
            _csrfToken = null;
            const text = await res.text();
            try {
                return JSON.parse(text);
            } catch (e) {
                return { success: false, message: 'Ruxsat yo\'q' };
            }
        }

        const text = await res.text();
        try {
            return JSON.parse(text);
        } catch (e) {
            console.error('API JSON emas:', url, text.slice(0, 100));
            return { success: false, message: 'Server xatosi' };
        }
    },

    get(url) { return this.request(url, { method: 'GET' }); },
    post(url, body) { return this.request(url, { method: 'POST', body: JSON.stringify(body) }); },
    put(url, body) { return this.request(url, { method: 'PUT', body: JSON.stringify(body) }); },
    delete(url) { return this.request(url, { method: 'DELETE' }); }
};

window.API = API;
