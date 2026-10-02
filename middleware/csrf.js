const crypto = require('crypto');

// ══════════════════════════════════════════
// CSRF TOKEN YARATISH
// ══════════════════════════════════════════
function generateCsrfToken(req) {
    if (!req.session.csrfToken) {
        req.session.csrfToken = crypto.randomBytes(32).toString('hex');
    }
    return req.session.csrfToken;
}

// ══════════════════════════════════════════
// CSRF TEKSHIRISH
// ══════════════════════════════════════════
function csrfProtection(req, res, next) {
    // GET/HEAD/OPTIONS — o'tkazish
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    // ══════════════════════════════════════════
    // EXEMPT ROUTES (faqat session yaratishdan oldin)
    // ══════════════════════════════════════════
    const exemptPaths = [
        '/api/auth/login',
        '/api/auth/register',
        '/api/auth/verify',
        '/api/auth/admin-login',
        '/api/auth/logout',
        '/api/auth/forgot-password',
        '/api/auth/reset-password',
        '/api/auth/resend-code'
    ];

    const path = req.originalUrl.split('?')[0];

    for (const exempt of exemptPaths) {
        if (path === exempt) {
            return next();
        }
    }

    // ══════════════════════════════════════════
    // ADMIN ham CSRF TEKSHIRILADI
    // ══════════════════════════════════════════
    // MUHIM: /api/admin CSRF dan ozod EMAS!

    const token = req.headers['x-csrf-token'] || req.body._csrf;
    const sessionToken = req.session?.csrfToken;

    if (!sessionToken || !token || token !== sessionToken) {
        return res.status(403).json({
            success: false,
            message: "CSRF token noto'g'ri. Sahifani yangilang.",
            code: 'CSRF_INVALID'
        });
    }

    next();
}

// ══════════════════════════════════════════
// TOKEN ENDPOINT
// ══════════════════════════════════════════
function csrfTokenEndpoint(req, res) {
    const token = generateCsrfToken(req);
    res.json({ success: true, csrfToken: token });
}

module.exports = {
    generateCsrfToken,
    csrfProtection,
    csrfTokenEndpoint
};
