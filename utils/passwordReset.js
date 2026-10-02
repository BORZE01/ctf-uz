const crypto = require('crypto');

// { token: { userId, expires } }
const resetTokens = {};

// ══════════════════════════════════════════
// TOKEN YARATISH
// ══════════════════════════════════════════
function createResetToken(userId) {
    const token = crypto.randomBytes(32).toString('hex');

    resetTokens[token] = {
        userId,
        expires: Date.now() + 30 * 60 * 1000,  // 30 daqiqa
        createdAt: new Date(),
        used: false
    };

    return token;
}

// ══════════════════════════════════════════
// TOKENNI TEKSHIRISH
// ══════════════════════════════════════════
function verifyResetToken(token) {
    const record = resetTokens[token];

    if (!record) {
        return { ok: false, message: "Token topilmadi" };
    }

    if (record.used) {
        return { ok: false, message: "Token allaqachon ishlatilgan" };
    }

    if (Date.now() > record.expires) {
        delete resetTokens[token];
        return { ok: false, message: "Token muddati tugagan" };
    }

    return { ok: true, userId: record.userId };
}

// ══════════════════════════════════════════
// TOKENNI ISHLATISH
// ══════════════════════════════════════════
function useResetToken(token) {
    if (resetTokens[token]) {
        resetTokens[token].used = true;
        delete resetTokens[token];
    }
}

// ══════════════════════════════════════════
// ESKI TOKENLARNI TOZALASH
// ══════════════════════════════════════════
function cleanupExpiredTokens() {
    const now = Date.now();
    for (const token in resetTokens) {
        if (resetTokens[token].expires < now) {
            delete resetTokens[token];
        }
    }
}

// Har 10 daqiqada tozalash
setInterval(cleanupExpiredTokens, 10 * 60 * 1000);

module.exports = {
    createResetToken,
    verifyResetToken,
    useResetToken,
    resetTokens
};