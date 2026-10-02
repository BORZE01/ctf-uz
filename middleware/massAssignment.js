// ══════════════════════════════════════════
// MASS ASSIGNMENT HIMOYA
// ══════════════════════════════════════════
// Foydalanuvchi faqat ruxsat berilgan maydonlarni o'zgartira oladi

const ALLOWLISTS = {
    // User profil
    userProfile: [
        'name', 'phone', 'bio', 'region', 'city', 'district',
        'github', 'telegram', 'website', 'preferredRoles',
        'openToOpportunities', 'title', 'avatar'
    ],

    // Admin - user tahrirlash
    adminUser: [
        'name', 'phone', 'bio', 'region', 'city', 'district',
        'github', 'telegram', 'website', 'preferredRoles',
        'openToOpportunities', 'title', 'avatar',
        'role', 'banned', 'verified', 'score', 'xp'
    ],

    // Challenge
    challenge: [
        'title', 'story', 'objective', 'category', 'difficulty',
        'points', 'initialPoints', 'flag', 'hints', 'evidence',
        'file', 'fileName', 'status', 'dynamicScoring',
        'minPoints', 'decay', 'scheduledAt'
    ],

    // Event
    event: [
        'title', 'description', 'type', 'icon',
        'startDate', 'endDate', 'status',
        'registrationOpen', 'registrationStart', 'registrationEnd',
        'maxParticipants', 'maxTeams', 'rules', 'eligibility',
        'scoreboardFreeze', 'scoreboardVisible', 'awards'
    ],

    // Team
    team: [
        'name', 'description', 'avatar', 'universityId', 'isPublic'
    ],

    // Job
    job: [
        'title', 'description', 'location', 'format', 'level',
        'category', 'requirements', 'niceToHave', 'skills',
        'salary', 'status', 'featured', 'expiresAt'
    ]
};

// ══════════════════════════════════════════
// SANITIZE
// ══════════════════════════════════════════
function sanitizeBody(body, allowlist) {
    if (!body || typeof body !== 'object') return {};
    if (!allowlist || !Array.isArray(allowlist)) return {};

    const clean = {};
    allowlist.forEach(field => {
        if (body.hasOwnProperty(field)) {
            clean[field] = body[field];
        }
    });
    return clean;
}

// ══════════════════════════════════════════
// MIDDLEWARE FACTORY
// ══════════════════════════════════════════
function allowOnly(allowlistKey) {
    return (req, res, next) => {
        const allowlist = ALLOWLISTS[allowlistKey];

        if (!allowlist) {
            return res.status(500).json({
                success: false,
                message: "Server configuration xatosi"
            });
        }

        // Asl body ni saqlab, sanitize qilingan body ni qo'yish
        const original = { ...req.body };
        req.body = sanitizeBody(req.body, allowlist);

        // Xavfli maydonlar urinishini log qilish
        const removed = Object.keys(original).filter(
            k => !allowlist.includes(k)
        );

        if (removed.length > 0 && req.session?.user) {
            try {
                const { logAction } = require('../utils/audit');
                logAction(req.session.user.username, 'MASS_ASSIGNMENT_BLOCKED', {
                    path: req.path,
                    method: req.method,
                    removedFields: removed,
                    ip: req.ip
                });
            } catch (e) {}
        }

        next();
    };
}

module.exports = {
    ALLOWLISTS,
    sanitizeBody,
    allowOnly
};
