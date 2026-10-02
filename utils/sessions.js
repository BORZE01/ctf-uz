// { userId: [{ sessionId, ip, userAgent, createdAt, lastActive }] }
const userSessions = {};

// ══════════════════════════════════════════
// SESSIONNI RO'YXATGA OLISH
// ══════════════════════════════════════════
function registerSession(userId, sessionId, req) {
    if (!userSessions[userId]) userSessions[userId] = [];

    // Eski sessiya bo'lsa yangilash
    const existing = userSessions[userId].find(s => s.sessionId === sessionId);
    if (existing) {
        existing.lastActive = new Date();
        return;
    }

    userSessions[userId].push({
        sessionId,
        ip: req.ip || req.connection?.remoteAddress || 'N/A',
        userAgent: (req.headers['user-agent'] || '').slice(0, 200),
        createdAt: new Date(),
        lastActive: new Date()
    });

    // Maksimum 10 ta sessiya
    if (userSessions[userId].length > 10) {
        userSessions[userId].shift();
    }
}

// ══════════════════════════════════════════
// FOYDALANUVCHI SESSIYALARINI OLISH
// ══════════════════════════════════════════
function getUserSessions(userId) {
    return userSessions[userId] || [];
}

// ══════════════════════════════════════════
// SESSIYANI O'CHIRISH
// ══════════════════════════════════════════
function removeSession(userId, sessionId) {
    if (!userSessions[userId]) return false;
    const idx = userSessions[userId].findIndex(s => s.sessionId === sessionId);
    if (idx === -1) return false;
    userSessions[userId].splice(idx, 1);
    return true;
}

// ══════════════════════════════════════════
// BARCHA SESSIYALARNI O'CHIRISH
// ══════════════════════════════════════════
function removeAllSessions(userId, exceptSessionId = null) {
    if (!userSessions[userId]) return 0;
    const before = userSessions[userId].length;

    if (exceptSessionId) {
        userSessions[userId] = userSessions[userId].filter(
            s => s.sessionId === exceptSessionId
        );
    } else {
        userSessions[userId] = [];
    }

    return before - userSessions[userId].length;
}

module.exports = {
    registerSession,
    getUserSessions,
    removeSession,
    removeAllSessions,
    userSessions
};