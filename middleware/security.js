const rateLimit = require('express-rate-limit');

// ══════════════════════════════════════════
// RATE LIMITERS
// ══════════════════════════════════════════

// Login — qattiq limit
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    skipSuccessfulRequests: true,
    message: { success: false, message: "Juda ko'p login urinish. 15 daqiqadan so'ng qayta urinib ko'ring." }
});

// Register
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: { success: false, message: "Juda ko'p ro'yxatdan o'tish. 1 soatdan so'ng qayta urinib ko'ring." }
});

// Admin login
const adminLoginLimiter = rateLimit({
    windowMs: 30 * 60 * 1000,
    max: 3,
    skipSuccessfulRequests: true,
    message: { success: false, message: "Admin login bloklangan." }
});

// Kod yuborish
const codeLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 3,
    message: { success: false, message: "Juda ko'p kod so'rov." }
});

// Umumiy API
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: { success: false, message: "Juda ko'p so'rov." }
});

// ══════════════════════════════════════════
// PAROL KUCHLILIGI
// ══════════════════════════════════════════
function isStrongPassword(pwd) {
    if (!pwd || pwd.length < 8) return { ok: false, message: "Parol kamida 8 belgi" };
    if (!/[A-Z]/.test(pwd)) return { ok: false, message: "Kamida 1 katta harf" };
    if (!/[a-z]/.test(pwd)) return { ok: false, message: "Kamida 1 kichik harf" };
    if (!/[0-9]/.test(pwd)) return { ok: false, message: "Kamida 1 raqam" };
    return { ok: true };
}

// ══════════════════════════════════════════
// XSS HIMOYA
// ══════════════════════════════════════════
function escapeHtml(text) {
    if (!text && text !== 0) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ══════════════════════════════════════════
// INPUT SANITIZE
// ══════════════════════════════════════════
function sanitizeString(str, maxLen = 500) {
    if (!str) return '';
    return String(str).trim().slice(0, maxLen);
}

function sanitizeEmail(email) {
    if (!email) return '';
    return String(email).trim().toLowerCase().slice(0, 255);
}

function sanitizeUsername(username) {
    if (!username) return '';
    return String(username).trim().replace(/[^a-zA-Z0-9_]/g, '').slice(0, 30);
}

function sanitizePhone(phone) {
    if (!phone) return '';
    return String(phone).replace(/[^0-9]/g, '').slice(0, 15);
}

// ══════════════════════════════════════════
// LOGIN ATTEMPTS (brute-force himoya)
// ══════════════════════════════════════════
const loginAttempts = {};

function recordLoginAttempt(identifier, success) {
    if (success) {
        delete loginAttempts[identifier];
        return;
    }
    if (!loginAttempts[identifier]) {
        loginAttempts[identifier] = { count: 0, firstAttempt: Date.now(), locked: false };
    }
    loginAttempts[identifier].count++;
    loginAttempts[identifier].lastAttempt = Date.now();

    if (loginAttempts[identifier].count >= 5) {
        loginAttempts[identifier].locked = true;
        loginAttempts[identifier].lockedUntil = Date.now() + 15 * 60 * 1000;
    }
}

function isAccountLocked(identifier) {
    const attempt = loginAttempts[identifier];
    if (!attempt || !attempt.locked) return false;
    if (Date.now() > attempt.lockedUntil) {
        delete loginAttempts[identifier];
        return false;
    }
    return true;
}

// ══════════════════════════════════════════
// EXPORTS
// ══════════════════════════════════════════
module.exports = {
    loginLimiter,
    registerLimiter,
    adminLoginLimiter,
    codeLimiter,
    apiLimiter,
    isStrongPassword,
    escapeHtml,
    sanitizeString,
    sanitizeEmail,
    sanitizeUsername,
    sanitizePhone,
    recordLoginAttempt,
    isAccountLocked
};