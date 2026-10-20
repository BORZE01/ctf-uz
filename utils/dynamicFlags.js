const crypto = require('crypto');

const SECRET = process.env.FLAG_SECRET || process.env.SESSION_SECRET || 'ctf_uz_national_secret_2026';

// Har bir foydalanuvchi va topshiriq uchun unikal dinamik flag yaratish
function generateDynamicFlag(userId, challengeId, prefix = 'CTF') {
    const hmac = crypto.createHmac('sha256', SECRET)
        .update(`${userId}:${challengeId}`)
        .digest('hex')
        .substring(0, 16)
        .toUpperCase();
    return `${prefix}{${hmac}}`;
}

// Dinamik flagni tekshirish va flag sharing (ko'chirish) ni aniqlash
function verifyDynamicFlag(submittedFlag, userId, challengeId, staticFlag = null, prefix = 'CTF') {
    const cleanSubmitted = String(submittedFlag || '').trim();
    if (staticFlag && cleanSubmitted === staticFlag) {
        return { valid: true, type: 'static' };
    }
    const expectedDynamic = generateDynamicFlag(userId, challengeId, prefix);
    if (cleanSubmitted === expectedDynamic) {
        return { valid: true, type: 'dynamic' };
    }
    return { valid: false };
}

module.exports = { generateDynamicFlag, verifyDynamicFlag };
