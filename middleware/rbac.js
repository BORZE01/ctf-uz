// ══════════════════════════════════════════
// ROLE-BASED ACCESS CONTROL MATRIX
// ══════════════════════════════════════════
const PERMISSIONS = {
    super_admin: {
        '*': true
    },

    admin: {
        'users.view': true,
        'users.edit': true,
        'users.ban': true,
        'users.verify': true,
        'challenges.view': true,
        'challenges.create': true,
        'challenges.edit': true,
        'challenges.delete': true,
        'challenges.publish': true,
        'events.view': true,
        'events.create': true,
        'events.edit': true,
        'events.publish': true,
        'submissions.view': true,
        'leaderboard.view': true,
        'leaderboard.manage': true,
        'achievements.view': true,
        'achievements.create': true,
        'titles.view': true,
        'titles.create': true,
        'announcements.view': true,
        'announcements.create': true,
        'reports.view': true,
        'reports.resolve': true,
        'audit.view': true,
        'settings.view': true,

        // YO'Q:
        'users.delete': false,
        'users.changeRole': false,
        'settings.edit': false,
        'audit.delete': false,
        'admin.manage': false
    },

    organizer: {
        'challenges.view': true,
        'challenges.create': true,
        'challenges.edit': true,
        'events.view': true,
        'events.create': true,
        'events.edit': true,
        'events.publish': true,
        'submissions.view': true,
        'leaderboard.view': true,
        'leaderboard.manage': true
    },

    challenge_author: {
        'challenges.view': true,
        'challenges.create': true,
        'challenges.edit': true,  // Faqat o'zi yaratgan
        'submissions.view': true  // Faqat o'z challenge lari
    },

    moderator: {
        'users.view': true,
        'challenges.view': true,
        'submissions.view': true,
        'reports.view': true,
        'reports.resolve': true
    },

    user: {}
};

// ══════════════════════════════════════════
// PERMISSION TEKSHIRISH
// ══════════════════════════════════════════
function hasPermission(role, permission) {
    if (!role || !PERMISSIONS[role]) return false;
    if (PERMISSIONS[role]['*']) return true;
    return PERMISSIONS[role][permission] === true;
}

// ══════════════════════════════════════════
// MIDDLEWARE
// ══════════════════════════════════════════
function requirePermission(permission) {
    return (req, res, next) => {
        const user = req.adminUser || req.currentUser;

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Kirish kerak"
            });
        }

        if (!hasPermission(user.role, permission)) {
            // Audit log
            try {
                const { logAction } = require('../utils/audit');
                logAction(user.username, 'PERMISSION_DENIED', {
                    permission,
                    role: user.role,
                    path: req.path,
                    method: req.method,
                    ip: req.ip
                });
            } catch (e) {}

            return res.status(403).json({
                success: false,
                message: "Ruxsat yo'q",
                code: 'FORBIDDEN',
                required: permission
            });
        }

        next();
    };
}

// ══════════════════════════════════════════
// ROLE HIERARCHY
// ══════════════════════════════════════════
const ROLE_HIERARCHY = {
    super_admin: 100,
    admin: 80,
    organizer: 60,
    challenge_author: 50,
    moderator: 40,
    user: 10
};

function hasHigherRole(userRole, targetRole) {
    return (ROLE_HIERARCHY[userRole] || 0) > (ROLE_HIERARCHY[targetRole] || 0);
}

module.exports = {
    PERMISSIONS,
    ROLE_HIERARCHY,
    hasPermission,
    requirePermission,
    hasHigherRole
};
