// CAPEC-202 Himoyasi: Server-side Route Guard & Security Headers
module.exports = function routeGuard(req, res, next) {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    const protectedPages = [
        '/learn', '/learn.html',
        '/career', '/career.html',
        '/dashboard', '/dashboard.html',
        '/profile', '/profile.html',
        '/arena', '/arena.html',
        '/battle', '/battle.html'
    ];

    const reqPath = req.path.toLowerCase().replace(/\/+$/, '') || '/';
    if (protectedPages.includes(reqPath)) {
        if (!req.session || !req.session.user) {
            return res.redirect('/welcome');
        }
    }
    next();
};
