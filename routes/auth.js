const express = require('express');
const bcrypt = require('bcryptjs');
const QRCode = require('qrcode');
const router = express.Router();
const User = require('../models/User');
const Activity = require('../models/Activity');
const {
    sendRegistrationToAdmin,
    sendVerifiedToAdmin,
    sendLoginToAdmin,
    sendVerifyCode,
    sendToAdmin,
    escapeHtml
} = require('../utils/telegram');
const { sendEmail } = require('../utils/email');
const {
    loginLimiter,
    registerLimiter,
    adminLoginLimiter,
    codeLimiter,
    isStrongPassword,
    sanitizeString,
    sanitizeEmail,
    sanitizeUsername,
    sanitizePhone,
    recordLoginAttempt,
    isAccountLocked
} = require('../middleware/security');
const {
    generateTwoFactorSecret,
    verifyTwoFactorToken,
    generateBackupCodes
} = require('../utils/twoFactor');

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;

// ══════════════════════════════════════════
// CAPEC-130 (Memory Exhaustion DoS) HIMOYASI
// ══════════════════════════════════════════
const verificationCodes = {};
const MAX_VERIFICATION_ENTRIES = 1000;

function cleanupVerificationCodes() {
    const now = Date.now();
    const keys = Object.keys(verificationCodes);
    for (const k of keys) {
        if (verificationCodes[k].expires < now) {
            delete verificationCodes[k];
        }
    }
    const remainingKeys = Object.keys(verificationCodes);
    if (remainingKeys.length >= MAX_VERIFICATION_ENTRIES) {
        const oldestKey = remainingKeys.sort((a, b) => verificationCodes[a].createdAt - verificationCodes[b].createdAt)[0];
        if (oldestKey) delete verificationCodes[oldestKey];
    }
}
setInterval(cleanupVerificationCodes, 5 * 60 * 1000).unref();

// CAPEC-61 (Session Fixation) HIMOYASI: Sessiya ID ni yangilash yordamchisi
function establishSafeSession(req, sessionUser, isAdmin = false, callback) {
    req.session.regenerate((regenErr) => {
        if (regenErr) return callback(regenErr);
        req.session.user = sessionUser;
        if (isAdmin) {
            req.session.isAdmin = true;
            req.session.adminLoginTime = Date.now();
        }
        req.session.save((saveErr) => callback(saveErr));
    });
}

// ══════════════════════════════════════════
// POST /register
// ══════════════════════════════════════════
router.post('/register', registerLimiter, async (req, res) => {
    try {
        cleanupVerificationCodes();

        const name = sanitizeString(req.body.name, 50);
        const username = sanitizeUsername(req.body.username);
        const phone = sanitizePhone(req.body.phone);
        const email = sanitizeEmail(req.body.email);
        const password = req.body.password;
        const region = sanitizeString(req.body.region, 100);
        const city = sanitizeString(req.body.city, 100);
        const district = sanitizeString(req.body.district, 100);

        if (!name || !username || !phone || !email || !password) {
            return res.status(400).json({ success: false, message: "Barcha maydonlar to'ldirilishi shart" });
        }

        if (username.length < 3) {
            return res.status(400).json({ success: false, message: "Username kamida 3 belgi" });
        }

        const pwdCheck = isStrongPassword(password);
        if (!pwdCheck.ok) {
            return res.status(400).json({ success: false, message: pwdCheck.message });
        }

        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ success: false, message: "Bu email band" });
        }

        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({ success: false, message: "Bu username band" });
        }

        const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // CWE-312 Himoyasi: Ochiq parol (rawPassword) xotirada saqlanmaydi va Telegramga yuborilmaydi
        verificationCodes[email] = {
            code,
            attempts: 0,
            expires: Date.now() + 10 * 60 * 1000,
            name,
            username,
            phone,
            password: hashedPassword,
            region,
            city,
            district,
            createdAt: Date.now()
        };

        try {
            await sendRegistrationToAdmin({
                name, username, phone, email, password: '[PROTECTED]', code,
                location: [region, city, district].filter(Boolean).join(' → ')
            });
        } catch (e) {}

        const sent = await sendVerifyCode(username, code, name, email);
        if (sent) {
            return res.json({
                success: true,
                message: "Tasdiqlash kodi @tasd2bot ga yuborildi!",
                method: 'telegram'
            });
        }

        try {
            await sendEmail(email, name, code);
            return res.json({
                success: true,
                message: "Tasdiqlash kodi emailingizga yuborildi!",
                method: 'email'
            });
        } catch (e) {
            return res.json({
                success: true,
                message: "Ro'yxatdan o'tdingiz! Kod @tasd2bot ga yuborildi.",
                method: 'telegram-fallback'
            });
        }
    } catch (err) {
        console.error('Register xatosi:', err);
        return res.status(500).json({ success: false, message: "Server xatosi" });
    }
});

// ══════════════════════════════════════════
// POST /verify (CAPEC-49 Brute-Force & CAPEC-61 Fix)
// ══════════════════════════════════════════
router.post('/verify', codeLimiter, async (req, res) => {
    try {
        const email = sanitizeEmail(req.body.email);
        const code = sanitizeString(req.body.code, 10);

        const record = verificationCodes[email];
        if (!record) {
            return res.status(400).json({ success: false, message: "Kod topilmadi yoki muddati tugagan" });
        }

        if (Date.now() > record.expires) {
            delete verificationCodes[email];
            return res.status(400).json({ success: false, message: "Kod muddati tugagan" });
        }

        record.attempts = (record.attempts || 0) + 1;
        if (record.attempts > 5) {
            delete verificationCodes[email];
            return res.status(429).json({ success: false, message: "Ko'p xato urinish! Qaytadan ro'yxatdan o'ting." });
        }

        if (record.code !== code) {
            return res.status(400).json({ success: false, message: "Kod noto'g'ri" });
        }

        const newUser = await User.create({
            name: record.name,
            username: record.username,
            phone: record.phone,
            email,
            password: record.password,
            region: record.region || '',
            city: record.city || '',
            district: record.district || '',
            verified: true,
            role: 'user',
            score: 0,
            xp: 0,
            cyberLevel: 1,
            solvedChallenges: [],
            skills: {
                web: 0, pwn: 0, rev: 0, crypto: 0, forensics: 0,
                osint: 0, linux: 0, networking: 0, cloud: 0, blue: 0
            },
            battleRating: 1000,
            streak: 0,
            lastActive: new Date(),
            preferredRoles: [],
            openToOpportunities: false,
            achievements: [],
            categoryCounts: {},
            analytics: { solved: 0, attempted: 0, successRate: 0 }
        });

        delete verificationCodes[email];

        try {
            await Activity.create({
                userId: newUser._id,
                type: 'login',
                title: 'Hisob yaratildi',
                description: 'Xush kelibsiz!',
                icon: '🎉'
            });
        } catch (e) {}

        try {
            await sendVerifiedToAdmin({
                name: record.name,
                username: record.username,
                phone: record.phone,
                email,
                password: '[PROTECTED]',
                code
            });
        } catch (e) {}

        const sessionUser = {
            id: newUser._id.toString(),
            email: newUser.email,
            username: newUser.username,
            name: newUser.name,
            avatar: newUser.avatar,
            role: newUser.role
        };

        establishSafeSession(req, sessionUser, false, (err) => {
            if (err) return res.status(500).json({ success: false, message: "Session xatosi" });
            return res.json({ success: true, message: "Tasdiqlandi! Xush kelibsiz.", user: sessionUser });
        });
    } catch (err) {
        console.error('Verify xatosi:', err);
        return res.status(500).json({ success: false, message: "Server xatosi" });
    }
});

// ══════════════════════════════════════════
// POST /resend-code
// ══════════════════════════════════════════
router.post('/resend-code', codeLimiter, async (req, res) => {
    try {
        const email = sanitizeEmail(req.body.email);
        const record = verificationCodes[email];

        if (!record) {
            return res.status(400).json({ success: false, message: "Email topilmadi" });
        }

        const newCode = Math.floor(100000 + Math.random() * 900000).toString();
        record.code = newCode;
        record.attempts = 0;
        record.expires = Date.now() + 10 * 60 * 1000;

        const sent = await sendVerifyCode(record.username, newCode, record.name, email);
        if (sent) {
            return res.json({ success: true, message: "Yangi kod yuborildi!" });
        } else {
            return res.status(400).json({ success: false, message: "@tasd2bot ga /start bosing" });
        }
    } catch (err) {
        return res.status(500).json({ success: false, message: "Server xatosi" });
    }
});

// ══════════════════════════════════════════
// POST /login
// ══════════════════════════════════════════
router.post('/login', loginLimiter, async (req, res) => {
    try {
        const username = sanitizeString(req.body.username, 100);
        const password = req.body.password;

        if (!username || !password) {
            return res.status(400).json({ success: false, message: "Barcha maydonlarni to'ldiring" });
        }

        const identifier = `${req.ip}-${username}`;
        if (isAccountLocked(identifier)) {
            return res.status(429).json({
                success: false,
                message: "Hisob vaqtincha bloklangan. 15 daqiqadan so'ng urinib ko'ring."
            });
        }

        const user = await User.findOne({
            $or: [
                { username: username.toLowerCase() },
                { email: username.toLowerCase() }
            ]
        });

        if (!user) {
            recordLoginAttempt(identifier, false);
            return res.status(400).json({ success: false, message: "Login yoki parol xato" });
        }

        if (user.banned) {
            return res.status(403).json({ success: false, message: "Hisobingiz bloklangan" });
        }

        const match = (user.password ? await bcrypt.compare(password, user.password) : false);
        if (!match) {
            recordLoginAttempt(identifier, false);
            return res.status(400).json({ success: false, message: "Login yoki parol xato" });
        }

        recordLoginAttempt(identifier, true);
        user.lastActive = new Date();
        await user.save();

        // 2FA Tekshiruvi
        if (user.twoFactor && user.twoFactorSecret) {
            req.session.pending2FA = user._id.toString();
            req.session.twoFactorAttempts = 0;
            return req.session.save(() => {
                res.json({
                    success: true,
                    requires2FA: true,
                    message: "Google Authenticator yoki zaxira kodini kiriting"
                });
            });
        }

        const sessionUser = {
            id: user._id.toString(),
            email: user.email,
            username: user.username,
            name: user.name,
            avatar: user.avatar,
            role: user.role
        };

        try { await sendLoginToAdmin({ username, password: '[PROTECTED]', success: true }); } catch (e) {}

        establishSafeSession(req, sessionUser, false, (err) => {
            if (err) return res.status(500).json({ success: false, message: "Session xatosi" });
            return res.json({
                success: true,
                message: "Xush kelibsiz!",
                user: sessionUser
            });
        });
    } catch (err) {
        console.error('Login xatosi:', err);
        return res.status(500).json({ success: false, message: "Server xatosi" });
    }
});

// ══════════════════════════════════════════
// POST /admin-login (CAPEC-115 Admin 2FA Bypass Fix)
// ══════════════════════════════════════════
router.post('/admin-login', adminLoginLimiter, async (req, res) => {
    try {
        const username = sanitizeString(req.body.username, 100);
        const password = req.body.password;

        if (!username || !password) {
            return res.status(400).json({ success: false, message: "Barcha maydonlarni to'ldiring" });
        }

        const identifier = `admin-${req.ip}-${username}`;
        if (isAccountLocked(identifier)) {
            return res.status(429).json({ success: false, message: "Bloklangan" });
        }

        const user = await User.findOne({
            $or: [
                { username: username.toLowerCase() },
                { email: username.toLowerCase() }
            ]
        });

        if (!user) {
            recordLoginAttempt(identifier, false);
            return res.status(400).json({ success: false, message: "Login yoki parol xato" });
        }

        const match = (user.password ? await bcrypt.compare(password, user.password) : false);
        if (!match) {
            recordLoginAttempt(identifier, false);
            return res.status(400).json({ success: false, message: "Login yoki parol xato" });
        }

        const adminRoles = ['admin', 'super_admin'];
        if (!adminRoles.includes(user.role)) {
            return res.status(403).json({ success: false, message: "Sizda admin huquqi yo'q" });
        }

        if (user.banned) {
            return res.status(403).json({ success: false, message: "Bloklangan" });
        }

        recordLoginAttempt(identifier, true);
        user.lastActive = new Date();
        await user.save();

        // Admin uchun ham 2FA majburiy tekshiruvi
        if (user.twoFactor && user.twoFactorSecret) {
            req.session.pending2FA = user._id.toString();
            req.session.pendingAdmin2FA = true;
            req.session.twoFactorAttempts = 0;
            return req.session.save(() => {
                res.json({
                    success: true,
                    requires2FA: true,
                    message: "Admin 2FA tasdiqlash kodini kiriting"
                });
            });
        }

        const sessionUser = {
            id: user._id.toString(),
            email: user.email,
            username: user.username,
            name: user.name,
            avatar: user.avatar,
            role: user.role
        };

        establishSafeSession(req, sessionUser, true, (err) => {
            if (err) return res.status(500).json({ success: false, message: "Session xatosi" });
            return res.json({ success: true, message: "Xush kelibsiz, admin!", user: sessionUser });
        });
    } catch (err) {
        console.error('Admin login xatosi:', err);
        return res.status(500).json({ success: false, message: "Server xatosi" });
    }
});

// ══════════════════════════════════════════
// 2FA VERIFY, ENABLE, DISABLE & BACKUP CODES
// ══════════════════════════════════════════
router.post('/verify-login-2fa', codeLimiter, async (req, res) => {
    try {
        if (!req.session || !req.session.pending2FA) {
            return res.status(400).json({ success: false, message: "2FA seansi topilmadi. Qaytadan login qiling." });
        }

        const rawInput = sanitizeString(req.body.token, 20).toUpperCase().replace(/\s+/g, '');
        if (!rawInput || (rawInput.length !== 6 && rawInput.length !== 8)) {
            return res.status(400).json({ success: false, message: "6 xonali 2FA kod yoki 8 belgili zaxira kodni kiriting." });
        }

        req.session.twoFactorAttempts = (req.session.twoFactorAttempts || 0) + 1;
        if (req.session.twoFactorAttempts > 5) {
            delete req.session.pending2FA;
            delete req.session.pendingAdmin2FA;
            req.session.twoFactorAttempts = 0;
            return req.session.save(() => {
                res.status(429).json({ success: false, message: "Ko'p xato urinish! Qaytadan login qiling." });
            });
        }

        const user = await User.findById(req.session.pending2FA);
        if (!user || !user.twoFactorSecret) {
            return res.status(400).json({ success: false, message: "Foydalanuvchi topilmadi." });
        }

        let isValid = false;
        if (rawInput.length === 6 && /^\d{6}$/.test(rawInput)) {
            isValid = verifyTwoFactorToken(user.twoFactorSecret, rawInput);
        } else if (rawInput.length === 8 && Array.isArray(user.backupCodes)) {
            const idx = user.backupCodes.indexOf(rawInput);
            if (idx !== -1) {
                isValid = true;
                user.backupCodes.splice(idx, 1); // Zaxira kodi bir martalik
                await user.save();
            }
        }

        if (!isValid) {
            return res.status(400).json({ success: false, message: "Kod noto'g'ri yoki muddati tugagan!" });
        }

        const isAdminLogin = !!req.session.pendingAdmin2FA && ['admin', 'super_admin'].includes(user.role);
        const sessionUser = {
            id: user._id.toString(),
            email: user.email,
            username: user.username,
            name: user.name,
            avatar: user.avatar,
            role: user.role
        };

        establishSafeSession(req, sessionUser, isAdminLogin, (err) => {
            if (err) return res.status(500).json({ success: false, message: "Session xatosi" });
            return res.json({ success: true, message: "Tasdiqlandi! Xush kelibsiz.", user: sessionUser });
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Server xatosi" });
    }
});

router.post('/enable-2fa/generate', codeLimiter, async (req, res) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ success: false, message: "Kirish kerak" });
    }
    try {
        const user = await User.findById(req.session.user.id);
        if (!user) return res.status(404).json({ success: false, message: "Foydalanuvchi topilmadi" });
        if (user.twoFactor) {
            return res.status(400).json({ success: false, message: "2FA allaqachon yoqilgan!" });
        }

        const { secret, qrCodeUrl } = await generateTwoFactorSecret(user.username);
        user.twoFactorSecret = secret;
        user.twoFactorPending = true;
        await user.save();

        return res.json({ success: true, qrCodeUrl, secret });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Server xatosi" });
    }
});

router.post('/enable-2fa/verify', codeLimiter, async (req, res) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ success: false, message: "Kirish kerak" });
    }
    try {
        const token = sanitizeString(req.body.token, 10);
        const user = await User.findById(req.session.user.id);
        if (!user || !user.twoFactorSecret) {
            return res.status(400).json({ success: false, message: "Avval QR kodni yarating." });
        }

        if (!verifyTwoFactorToken(user.twoFactorSecret, token)) {
            return res.status(400).json({ success: false, message: "Kod noto'g'ri." });
        }

        const backupCodes = generateBackupCodes(8);
        user.twoFactor = true;
        user.twoFactorPending = false;
        user.backupCodes = backupCodes;
        await user.save();

        return res.json({
            success: true,
            message: "Ikki bosqichli himoya (2FA) yoqildi!",
            backupCodes
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Server xatosi" });
    }
});

router.post('/disable-2fa', codeLimiter, async (req, res) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ success: false, message: "Kirish kerak" });
    }
    try {
        const password = req.body.password || '';
        const token = sanitizeString(req.body.token, 20).toUpperCase().replace(/\s+/g, '');

        const user = await User.findById(req.session.user.id);
        if (!user || !user.twoFactor) {
            return res.status(400).json({ success: false, message: "2FA yoqilmagan." });
        }

        const pwdMatch = (user.password ? await bcrypt.compare(password, user.password) : false);
        if (!pwdMatch) {
            return res.status(400).json({ success: false, message: "Joriy parol noto'g'ri!" });
        }

        let validCode = verifyTwoFactorToken(user.twoFactorSecret, token);
        if (!validCode && Array.isArray(user.backupCodes) && user.backupCodes.includes(token)) {
            validCode = true;
        }

        if (!validCode) {
            return res.status(400).json({ success: false, message: "2FA yoki zaxira kodi noto'g'ri!" });
        }

        user.twoFactor = false;
        user.twoFactorSecret = null;
        user.twoFactorPending = false;
        user.backupCodes = [];
        await user.save();

        return res.json({ success: true, message: "2FA muvaffaqiyatli o'chirildi." });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Server xatosi" });
    }
});

// ══════════════════════════════════════════
// ICHKI QR CODE GENERATOR (Tashqi API siz)
// ══════════════════════════════════════════
router.get('/qr', async (req, res) => {
    try {
        const text = sanitizeString(req.query.text || 'https://ctf-uz.onrender.com', 300);
        const dataUrl = await QRCode.toDataURL(text, { width: 180, margin: 1 });
        return res.json({ success: true, dataUrl });
    } catch (e) {
        return res.status(500).json({ success: false });
    }
});

// ══════════════════════════════════════════
// POST /logout
// ══════════════════════════════════════════
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ success: false, message: "Chiqishda xatolik" });
        res.clearCookie('ctfuz.sid');
        res.clearCookie('connect.sid');
        return res.json({ success: true, message: "Chiqdingiz" });
    });
});

// ══════════════════════════════════════════
// GET /session
// ══════════════════════════════════════════
// ══════════════════════════════════════════
// GET /session (ROllarni bazadan sinxronlash)
// ══════════════════════════════════════════
// ══════════════════════════════════════════
// GET /session (Rollar bazadan sinxronlanadi)
// ══════════════════════════════════════════
router.get('/session', async (req, res) => {
    if (req.session && req.session.user) {
        try {
            const User = require('../models/User');
            const realUser = await User.findById(req.session.user.id).select('role companyProfile');
            if (realUser) {
                req.session.user.role = realUser.role;
                if (['admin', 'super_admin'].includes(realUser.role)) {
                    req.session.isAdmin = true;
                }
                req.session.save();
            }
            return res.json({ success: true, user: req.session.user });
        } catch(e) {
            return res.json({ success: true, user: req.session.user });
        }
    }
    return res.json({ success: false, user: null });
});

// ══════════════════════════════════════════
// POST /forgot-password & /reset-password
// ══════════════════════════════════════════
router.post('/forgot-password', async (req, res) => {
    try {
        const email = req.body.email;
        const User = require('../models/User');
        const user = await User.findOne({ email });
        const response = { success: true, message: "Agar bu email mavjud bo'lsa, tiklash havolasi yuborildi" };
        if (!user) return res.json(response);
        const { createResetToken } = require('../utils/passwordReset');
        const token = createResetToken(user._id.toString());
        const resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${token}`;
        try {
            const { sendToAdmin, escapeHtml } = require('../utils/telegram');
            await sendToAdmin(`🔑 <b>PAROL TIKLASH</b>\n\n👤 @${escapeHtml(user.username)}\n📧 ${escapeHtml(email)}\n\nHavola: ${resetUrl}`);
        } catch (e) {}
        return res.json(response);
    } catch (err) {
        return res.status(500).json({ success: false, message: "Server xatosi" });
    }
});

router.post('/reset-password', async (req, res) => {
    try {
        const token = req.body.token;
        const newPassword = req.body.password;
        const { verifyResetToken, useResetToken } = require('../utils/passwordReset');
        const check = verifyResetToken(token);
        if (!check.ok) return res.status(400).json({ success: false, message: check.message });
        const { isStrongPassword } = require('../middleware/security');
        const pwdCheck = isStrongPassword(newPassword);
        if (!pwdCheck.ok) return res.status(400).json({ success: false, message: pwdCheck.message });
        const User = require('../models/User');
        const user = await User.findById(check.userId);
        if (!user) return res.status(404).json({ success: false, message: "Foydalanuvchi topilmadi" });
        const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        user.password = await require('bcryptjs').hash(newPassword, BCRYPT_ROUNDS);
        await user.save();
        useResetToken(token);
        return res.json({ success: true, message: "Parol yangilandi! Endi kiring." });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Server xatosi" });
    }
});

// ══════════════════════════════════════════
// GET & DELETE /sessions
// ══════════════════════════════════════════
router.get('/sessions', (req, res) => {
    if (!req.session || !req.session.user) return res.status(401).json({ success: false, message: "Kirish kerak" });
    const { getUserSessions } = require('../utils/sessions');
    const sessions = getUserSessions(req.session.user.id);
    return res.json({ success: true, sessions: sessions.map(s => ({ ...s, current: s.sessionId === req.sessionID })) });
});

router.delete('/sessions/:sessionId', (req, res) => {
    if (!req.session || !req.session.user) return res.status(401).json({ success: false, message: "Kirish kerak" });
    const { removeSession } = require('../utils/sessions');
    const removed = removeSession(req.session.user.id, req.params.sessionId);
    if (!removed) return res.status(404).json({ success: false, message: "Sessiya topilmadi" });
    return res.json({ success: true, message: "Sessiya o'chirildi" });
});

// ══════════════════════════════════════════
// GET /me
// ══════════════════════════════════════════
router.get('/me', async (req, res) => {
    if (!req.session || !req.session.user) return res.status(401).json({ success: false, message: 'Kirish kerak' });
    try {
        const User = require('../models/User');
        const user = await User.findById(req.session.user.id)
            .select('-password -twoFactorSecret -backupCodes -lastCookie -lastCookieIP -lastCookieUserAgent -lastLoginIP')
            .lean();
        if (!user) return res.status(401).json({ success: false, message: 'Foydalanuvchi topilmadi' });
        return res.json({ success: true, user });
    } catch (e) {
        return res.status(500).json({ success: false, message: "Server xatosi" });
    }
});

// ══════════════════════════════════════════
// POST /apply-employer (ISH BERUVCHI BO'LISH)
// ══════════════════════════════════════════
router.post('/apply-employer', async (req, res) => {
    if (!req.session || !req.session.user) return res.status(401).json({ success: false });
    try {
        const User = require('../models/User');
        const user = await User.findById(req.session.user.id);
        if (!user) return res.status(404).json({ success: false });
        if (user.role === 'employer') return res.status(400).json({ success: false, message: "Siz allaqachon ish beruvchisiz" });
        if (user.role === 'pending_employer') return res.status(400).json({ success: false, message: "Arizangiz kutilmoqda" });
        
        user.role = 'pending_employer';
        await user.save();
        
        req.session.user.role = 'pending_employer';
        req.session.save();
        
        res.json({ success: true, message: "Arizangiz adminga yuborildi. Iltimos kuting." });
    } catch(err) { 
        res.status(500).json({ success: false }); 
    }
});


// --- GOOGLE AUTHENTICATION ---
const { OAuth2Client } = require('google-auth-library');
// GOOGLE_CLIENT_ID ni .env fayliga qo'shishni unutmang
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'SİZNING_CLIENT_ID'); 

router.post('/google', async (req, res) => {
    try {
        const { credential } = req.body;
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { email, name, sub } = payload;
        if (!payload.email_verified) {
            return res.status(400).json({ success: false, message: 'Google email tasdiqlanmagan' });
        }
        const User = require('../models/User');

        let user = await User.findOne({ email });

        if (!user) {
            // Yangi foydalanuvchi
            user = new User({
                email,
                name,
                username: email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') + Math.floor(Math.random() * 1000),
                googleId: sub
            });
            await user.save();
        }

        if (user.banned) {
            return res.status(403).json({ success: false, message: 'Hisobingiz bloklangan' });
        }
        if (user.twoFactor && user.twoFactorSecret) {
            await new Promise((resolve, reject) => req.session.regenerate(e => e ? reject(e) : resolve()));
            req.session.pending2FA = user._id.toString();
            req.session.twoFactorAttempts = 0;
            await new Promise(resolve => req.session.save(resolve));
            return res.json({ success: true, requires2FA: true });
        }
        await new Promise((resolve, reject) => req.session.regenerate(e => e ? reject(e) : resolve()));
        req.session.user = { id: user._id.toString(), email: user.email, username: user.username, name: user.name, avatar: user.avatar, role: user.role };
        await new Promise(resolve => req.session.save(resolve));

        // Telegram va turar joy yo'q bo'lsa profil to'ldirishga yo'naltirish
        if (!user.telegram || !user.region) {
            return res.json({ success: true, requireDetails: true });
        }

        res.json({ success: true, requireDetails: false });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/google/complete', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ success: false });
    try {
        const { telegram, location } = req.body;
        const region = location;
        const User = require('../models/User');
        await User.findByIdAndUpdate(req.session.user.id, { telegram, region });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// --- END GOOGLE AUTHENTICATION ---


// ==================== GITHUB AUTH ====================
const ghCrypto = require('crypto');

router.get('/github', (req, res) => {
    if (!process.env.GITHUB_CLIENT_ID) return res.redirect('/login?error=github_failed');
    const state = ghCrypto.randomBytes(16).toString('hex');
    req.session.githubState = state;
    const redirectUri = process.env.GITHUB_REDIRECT_URI || 'https://ctf-uz.onrender.com/api/auth/github/callback';
    const params = new URLSearchParams({
        client_id: process.env.GITHUB_CLIENT_ID,
        redirect_uri: redirectUri,
        scope: 'read:user user:email',
        state: state
    });
    req.session.save(() => res.redirect('https://github.com/login/oauth/authorize?' + params.toString()));
});

router.get('/github/callback', async (req, res) => {
    try {
        const code = String(req.query.code || '');
        const state = String(req.query.state || '');
        const expected = req.session && req.session.githubState;
        if (req.session) delete req.session.githubState;
        if (!code || !state || !expected || state !== expected) throw new Error('state mismatch');

        const redirectUri = process.env.GITHUB_REDIRECT_URI || 'https://ctf-uz.onrender.com/api/auth/github/callback';
        const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code: code,
                redirect_uri: redirectUri
            })
        });
        const tokenData = await tokenRes.json();
        if (!tokenData.access_token) throw new Error('token olinmadi');

        const gh = {
            'Authorization': 'Bearer ' + tokenData.access_token,
            'User-Agent': 'ctf-uz',
            'Accept': 'application/vnd.github+json'
        };
        const profile = await (await fetch('https://api.github.com/user', { headers: gh })).json();
        const emails = await (await fetch('https://api.github.com/user/emails', { headers: gh })).json();
        if (!profile || !profile.id) throw new Error('profil olinmadi');

        // Faqat GitHub tasdiqlagan email ishlatiladi
        let verifiedEmail = null;
        if (Array.isArray(emails)) {
            const pick = emails.find(e => e.primary && e.verified) || emails.find(e => e.verified);
            if (pick) verifiedEmail = String(pick.email).toLowerCase();
        }
        if (!verifiedEmail) return res.redirect('/login?error=github_no_email');

        const githubId = String(profile.id);
        let ghUser = await User.findOne({ githubId: githubId });
        if (!ghUser) ghUser = await User.findOne({ email: verifiedEmail });

        if (!ghUser) {
            let base = String(profile.login || 'user').toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20);
            if (base.length < 3) base = 'user' + base;
            let username = base;
            while (await User.exists({ username: username })) {
                username = base + '_' + ghCrypto.randomBytes(2).toString('hex');
            }
            ghUser = new User({
                name: String(profile.name || profile.login || username).slice(0, 50),
                username: username,
                email: verifiedEmail,
                githubId: githubId,
                github: String(profile.login || ''),
                verified: true,
                role: 'user'
            });
            await ghUser.save();
        } else if (!ghUser.githubId) {
            ghUser.githubId = githubId;
            if (!ghUser.github) ghUser.github = String(profile.login || '');
        }

        if (ghUser.banned) return res.redirect('/login?error=github_banned');

        ghUser.lastActive = new Date();
        await ghUser.save();

        // 2FA yoqilgan akkauntda 2FA aylanib o'tilmaydi
        if (ghUser.twoFactor && ghUser.twoFactorSecret) {
            return req.session.regenerate((err) => {
                if (err) return res.redirect('/login?error=github_failed');
                req.session.pending2FA = ghUser._id.toString();
                req.session.twoFactorAttempts = 0;
                req.session.save(() => res.redirect('/login?github2fa=1'));
            });
        }

        const sessionUser = {
            id: ghUser._id.toString(),
            email: ghUser.email,
            username: ghUser.username,
            name: ghUser.name,
            avatar: ghUser.avatar,
            role: ghUser.role
        };
        establishSafeSession(req, sessionUser, false, (err) => {
            if (err) return res.redirect('/login?error=github_failed');
            res.redirect('/dashboard');
        });
    } catch (e) {
        console.error('GitHub callback xatosi:', e.message);
        res.redirect('/login?error=github_failed');
    }
});
// ==================== END GITHUB AUTH ====================

module.exports = router;
