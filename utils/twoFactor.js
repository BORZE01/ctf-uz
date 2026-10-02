const crypto = require('crypto');

// ══════════════════════════════════════════
// 2FA KODLAR SAQLASH
// ══════════════════════════════════════════
const twoFactorCodes = {};  // { userId: { code, expires, attempts } }

// ══════════════════════════════════════════
// KOD GENERATSIYA
// ══════════════════════════════════════════
function generate2FACode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// ══════════════════════════════════════════
// KOD YARATISH
// ══════════════════════════════════════════
function create2FACode(userId) {
    const code = generate2FACode();
    twoFactorCodes[userId] = {
        code,
        expires: Date.now() + 5 * 60 * 1000,  // 5 daqiqa
        attempts: 0,
        createdAt: new Date()
    };
    return code;
}

// ══════════════════════════════════════════
// KODNI TEKSHIRISH
// ══════════════════════════════════════════
function verify2FACode(userId, inputCode) {
    const record = twoFactorCodes[userId];

    if (!record) {
        return { ok: false, message: "Kod topilmadi" };
    }

    if (Date.now() > record.expires) {
        delete twoFactorCodes[userId];
        return { ok: false, message: "Kod muddati tugagan" };
    }

    record.attempts++;

    if (record.attempts > 5) {
        delete twoFactorCodes[userId];
        return { ok: false, message: "Juda ko'p urinish. Qayta kod oling." };
    }

    if (record.code !== inputCode) {
        return { ok: false, message: "Kod noto'g'ri" };
    }

    delete twoFactorCodes[userId];
    return { ok: true };
}

// ══════════════════════════════════════════
// BACKUP KODLAR
// ══════════════════════════════════════════
function generateBackupCodes(count = 8) {
    const codes = [];
    for (let i = 0; i < count; i++) {
        codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
}

// ══════════════════════════════════════════
// BACKUP KODNI TEKSHIRISH
// ══════════════════════════════════════════
function useBackupCode(user, code) {
    if (!user.backupCodes || !user.backupCodes.length) {
        return false;
    }
    const idx = user.backupCodes.indexOf(code.toUpperCase());
    if (idx === -1) return false;

    user.backupCodes.splice(idx, 1);
    return true;
}

module.exports = {
    create2FACode,
    verify2FACode,
    generateBackupCodes,
    useBackupCode,
    twoFactorCodes
};