const mongoose = require('mongoose');
const User = require('../models/User');
const { hasPermission, hasHigherRole } = require('./rbac');

// ══════════════════════════════════════════
// HELPER
// ══════════════════════════════════════════
async function findUserSafe(req) {
    if (!req.session || !req.session.user) return null;

    const userId = req.session.user.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        try { req.session.destroy(); } catch (e) {}
        return null;
    }

    return await User.findById(userId);
}

// ══════════════════════════════════════════
// SESSION ROTATION
// ══════════════════════════════════════════
function rotateSession(req, user) {
    return new Promise((resolve, reject) => {
        req.session.regenerate((err) => {
            if (err) return reject(err);

            req.session.user = {
                id: user._id.toString(),
                email: user.email,
                username: user.username,
                name: user.name,
                avatar: user.avatar,
                role: user.role
            };

            req.session.save((err) => {
                if (err) return reject(err);
                resolve();
            });
        });
    });
}

// ══════════════════════════════════════════
// REQUIRE AUTH
// ══════════════════════════════════════════
async function requireAuth(req, res, next) {
    try {
        if (!req.session || !req.session.user) {
            if (req.path.startsWith('/api/')) {
                return res.status(401).json({
                    success: false,
                    message: "Avval tizimga kiring",
                    code: 'NOT_AUTHENTICATED'
                });
            }
            return res.redirect('/login');
        }

        const user = await findUserSafe(req);

        if (!user) {
            if (req.path.startsWith('/api/')) {
                return res.status(401).json({
                    success: false,
                    message: "Sessiya eskirgan. Qayta kiring.",
                    needRelogin: true
                });
            }
            return res.redirect('/login');
        }

        if (user.banned) {
            req.session.destroy();
            if (req.path.startsWith('/api/')) {
                return res.status(403).json({
                    success: false,
                    message: "Hisobingiz bloklangan"
                });
            }
            return res.redirect('/login?banned=1');
        }

        req.currentUser = user;
        next();
    } catch (err) {
        console.error('requireAuth xatosi:', err);
        return res.status(500).json({ success: false, message: "Server xatosi" });
    }
}

// ══════════════════════════════════════════
// REQUIRE ADMIN (RBAC bilan)
// ══════════════════════════════════════════
async function requireAdmin(req, res, next) {
    try {
        if (!req.session || !req.session.user) {
            if (req.path.startsWith('/api/')) {
                return res.status(401).json({ success: false, message: "Kirish kerak" });
            }
            return res.redirect('/admin-login');
        }

        const user = await findUserSafe(req);

        if (!user) {
            if (req.path.startsWith('/api/')) {
                return res.status(401).json({
                    success: false,
                    message: "Sessiya eskirgan",
                    needRelogin: true
                });
            }
            return res.redirect('/admin-login');
        }

        if (user.banned) {
            req.session.destroy();
            return res.redirect('/admin-login?banned=1');
        }

        // Admin rol tekshirish
        const adminRoles = ['admin', 'super_admin', 'organizer', 'challenge_author', 'moderator'];
        if (!adminRoles.includes(user.role)) {
            if (req.path.startsWith('/api/')) {
                return res.status(403).json({
                    success: false,
                    message: "Ruxsat yo'q"
                });
            }
            return res.status(403).send(`
                <!DOCTYPE html>
                <html>
                <body style="font-family: monospace; background: #060B18; color: #F1F5F9; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; text-align: center;">
                    <div>
                        <h1 style="font-size: 6rem; color: #EF4444; margin: 0;">403</h1>
                        <p style="color: #94A3B8;">Ruxsat yo'q</p>
                        <a href="/" style="color: #4A7FFF;">← Bosh sahifa</a>
                    </div>
                </body>
                </html>
            `);
        }

        // Admin session timeout
        if (req.session.adminLoginTime) {
            const elapsed = Date.now() - req.session.adminLoginTime;
            const maxAge = (parseInt(process.env.ADMIN_SESSION_HOURS) || 2) * 60 * 60 * 1000;
            if (elapsed > maxAge) {
                req.session.destroy();
                return res.redirect('/admin-login?timeout=1');
            }
        }

        req.adminUser = user;
        next();
    } catch (err) {
        console.error('requireAdmin xatosi:', err);
        return res.status(500).json({ success: false, message: "Server xatosi" });
    }
}

// ══════════════════════════════════════════
// REQUIRE PERMISSION
// ══════════════════════════════════════════
function requirePermission(permission) {
    return async (req, res, next) => {
        await requireAdmin(req, res, () => {
            const user = req.adminUser;
            if (!hasPermission(user.role, permission)) {
                return res.status(403).json({
                    success: false,
                    message: "Ruxsat yo'q",
                    required: permission
                });
            }
            next();
        });
    };
}

// ══════════════════════════════════════════
// REQUIRE SUPER ADMIN
// ══════════════════════════════════════════
function requireSuperAdmin(req, res, next) {
    if (!req.adminUser || req.adminUser.role !== 'super_admin') {
        return res.status(403).json({
            success: false,
            message: "Faqat super admin"
        });
    }
    next();
}

// ══════════════════════════════════════════
// REQUIRE ROLE
// ══════════════════════════════════════════
function requireRole(...roles) {
    return async (req, res, next) => {
        try {
            const user = await findUserSafe(req);
            if (!user || !roles.includes(user.role)) {
                return res.status(403).json({
                    success: false,
                    message: "Ruxsat yo'q"
                });
            }
            req.currentUser = user;
            next();
        } catch (err) {
            return res.status(500).json({ success: false, message: "Server xatosi" });
        }
    };
}

module.exports = {
    requireAuth,
    requireAdmin,
    requirePermission,
    requireSuperAdmin,
    requireRole,
    rotateSession
};
