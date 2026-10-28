const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Activity = require('../models/Activity');
const {
    calculateSkillScores,
    getUserRank,
    getLevelProgress
} = require('../utils/scoring');
const { uploadAvatar, deleteFile } = require('../utils/upload');

// ══════════════════════════════════════════
// HELPER — foydalanuvchini xavfsiz topish
// ══════════════════════════════════════════
async function findCurrentUser(req) {
    if (!req.session || !req.session.user) return null;

    const userId = req.session.user.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        try { req.session.destroy(); } catch (e) {}
        return null;
    }

    return await User.findById(userId);
}

// ══════════════════════════════════════════
// GET /profile — profil ma'lumotlari
// ══════════════════════════════════════════
router.get('/profile', async (req, res) => {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ 
                success: false, 
                message: "Kirish kerak",
                needRelogin: true
            });
        }

        const user = await findCurrentUser(req);
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: "Sessiya eskirgan. Qayta kiring.",
                needRelogin: true
            });
        }

        user.lastActive = new Date();
        await user.save();

        const levelInfo = getLevelProgress(user.xp || 0);
        const rank = getUserRank(user.score || 0);
        const skills = await calculateSkillScores(user);

        const globalRank = await User.countDocuments({
            score: { $gt: user.score },
            verified: true
        }) + 1;

        let regionRank = null;
        if (user.region) {
            regionRank = await User.countDocuments({
                score: { $gt: user.score },
                region: user.region,
                verified: true
            }) + 1;
        }

        let activity = [];
        try {
            activity = await Activity.find({ userId: user._id })
                .sort({ createdAt: -1 })
                .limit(20)
                .lean();
        } catch (e) {
            console.error('Activity yuklash xatosi:', e.message);
        }

        res.json({
            success: true,
            user: {
                id: user._id.toString(),
                name: user.name,
                username: user.username,
                email: user.email,
                phone: user.phone,
                avatar: user.avatar,
                bio: user.bio,
                region: user.region,
                city: user.city,
                district: user.district,
                github: user.github,
                telegram: user.telegram,
                website: user.website,
                title: user.title,
                score: user.score || 0,
                xp: user.xp || 0,
                level: levelInfo.level,
                levelProgress: levelInfo.progress,
                levelStartXP: levelInfo.levelStartXP,
                nextLevelXP: levelInfo.nextLevelXP,
                cyberLevel: user.cyberLevel || 1 || 1,
                rank,
                globalRank,
                regionRank,
                skills,
                solvedChallenges: (user.solvedChallenges || []).map(id => id.toString()),
                solvedCount: (user.solvedChallenges || []).length,
                battleRating: user.battleRating || 1000,
                battleWins: user.battleWins || 0,
                battleLosses: user.battleLosses || 0,
                streak: user.streak || 0,
                achievements: user.achievements || [],
                activity,
                analytics: user.analytics || { solved: 0, attempted: 0, successRate: 0 },
                openToOpportunities: user.openToOpportunities || false,
                preferredRoles: user.preferredRoles || [],
                twoFactor: user.twoFactor || false,
                verified: user.verified || false,
                online: (Date.now() - new Date(user.lastActive).getTime()) < 5 * 60 * 1000,
                createdAt: user.createdAt
            }
        });
    } catch (err) {
        console.error('Profile xatosi:', err);
        res.status(500).json({ 
            success: false, 
            message: "Server xatosi: " + err.message 
        });
    }
});

// ══════════════════════════════════════════
// PUT /profile — profilni yangilash
// ══════════════════════════════════════════
router.put('/profile', async (req, res) => {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ success: false, message: "Kirish kerak" });
        }

        const user = await findCurrentUser(req);
        if (!user) {
            return res.status(401).json({ success: false, message: "Sessiya eskirgan" });
        }

        const {
            name, phone, bio, region, city, district,
            github, telegram, website,
            preferredRoles, openToOpportunities, title
        } = req.body;

        if (name !== undefined) {
            const trimmedName = String(name).trim();
            if (trimmedName.length < 2 || trimmedName.length > 50) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Ism 2-50 belgi orasida bo'lishi kerak" 
                });
            }
            user.name = trimmedName;
        }

        if (phone !== undefined) {
            const cleanPhone = String(phone).replace(/[^0-9]/g, '');
            if (cleanPhone.length !== 12) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Telefon raqam 12 xonali bo'lishi kerak" 
                });
            }
            user.phone = cleanPhone;
        }

        if (bio !== undefined) user.bio = String(bio).slice(0, 500);
        if (region !== undefined) user.region = String(region).slice(0, 100);
        if (city !== undefined) user.city = String(city).slice(0, 100);
        if (district !== undefined) user.district = String(district).slice(0, 100);
        if (github !== undefined) user.github = String(github).slice(0, 100);
        if (telegram !== undefined) user.telegram = String(telegram).slice(0, 100);
        if (website !== undefined) user.website = String(website).slice(0, 200);

        if (preferredRoles !== undefined && Array.isArray(preferredRoles)) {
            user.preferredRoles = preferredRoles.slice(0, 10);
        }

        if (typeof openToOpportunities === 'boolean') {
            user.openToOpportunities = openToOpportunities;
        }

        if (title !== undefined) {
            try {
                const { getAvailableTitles } = require('../utils/titles');
                const available = getAvailableTitles(user);
                if (available.find(t => t.id === title)) {
                    user.title = title;
                }
            } catch (e) {}
        }

        await user.save();

        res.json({ 
            success: true, 
            message: "Profil yangilandi" 
        });
    } catch (err) {
        console.error('PUT /profile xatosi:', err);
        res.status(500).json({ 
            success: false, 
            message: "Server xatosi: " + err.message 
        });
    }
});

// ══════════════════════════════════════════
// POST /avatar
// ══════════════════════════════════════════
router.post('/avatar', uploadAvatar.single('avatar'), async (req, res) => {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ 
                success: false, 
                message: "Kirish kerak",
                needRelogin: true
            });
        }

        const user = await findCurrentUser(req);
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: "Sessiya eskirgan. Qayta kiring."
            });
        }

        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: "Rasm yuklanmadi" 
            });
        }

        if (user.avatar) {
            try { deleteFile(user.avatar); } catch (e) {}
        }

        user.avatar = `/uploads/avatars/${req.file.filename}`;
        await user.save();

        res.json({ 
            success: true, 
            message: "Avatar yangilandi", 
            avatar: user.avatar 
        });
    } catch (err) {
        console.error('Avatar xatosi:', err);
        res.status(500).json({ 
            success: false, 
            message: "Server xatosi: " + err.message 
        });
    }
});

// ══════════════════════════════════════════
// GET /u/:username — Public profil
// ══════════════════════════════════════════
router.get('/u/:username', async (req, res) => {
    try {
        const user = await User.findOne({ 
            username: req.params.username.toLowerCase() 
        });

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: "Foydalanuvchi topilmadi" 
            });
        }

        const levelInfo = getLevelProgress(user.xp || 0);
        const rank = getUserRank(user.score || 0);
        const skills = await calculateSkillScores(user);

        const globalRank = await User.countDocuments({
            score: { $gt: user.score },
            verified: true
        }) + 1;

        res.json({
            success: true,
            profile: {
                username: user.username,
                name: user.name,
                avatar: user.avatar,
                bio: user.bio,
                region: user.region,
                city: user.city,
                title: user.title,
                github: user.github,
                telegram: user.telegram,
                website: user.website,
                score: user.score || 0,
                xp: user.xp || 0,
                level: levelInfo.level,
                levelProgress: levelInfo.progress,
                globalRank,
                skills,
                solvedCount: (user.solvedChallenges || []).length,
                battleRating: user.battleRating || 1000,
                streak: user.streak || 0,
                achievements: user.achievements || [],
                openToOpportunities: user.openToOpportunities || false,
                preferredRoles: user.preferredRoles || [],
                createdAt: user.createdAt
            }
        });
    } catch (err) {
        console.error('Public profil xatosi:', err);
        res.status(500).json({ 
            success: false, 
            message: "Server xatosi: " + err.message 
        });
    }
});

// ══════════════════════════════════════════
// GET /all — Leaderboard uchun (fake userlar ham)
// ══════════════════════════════════════════
router.get('/all', async (req, res) => {
    try {
        const users = await User.find({ verified: true })
            .sort({ score: -1 })
            .limit(100)
            .select('name username avatar score cyberLevel region city isFake')
            .lean();

        const result = users.map(u => ({
            id: u._id.toString(),
            name: u.name,
            username: u.username,
            avatar: u.avatar,
            score: u.score || 0,
            cyberLevel: u.cyberLevel || 1,
            region: u.region,
            city: u.city,
            isFake: u.isFake || false,
            rank: getUserRank(u.score || 0)
        }));

        res.json({ 
            success: true, 
            users: result, 
            total: result.length 
        });
    } catch (err) {
        console.error('GET /all xatosi:', err);
        res.status(500).json({ 
            success: false, 
            message: "Server xatosi: " + err.message 
        });
    }
});

// ══════════════════════════════════════════
// GET /talent — Recruiter uchun
// ══════════════════════════════════════════
router.get('/talent', async (req, res) => {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ 
                success: false, 
                message: "Kirish kerak" 
            });
        }

        const currentUser = await findCurrentUser(req);
        if (!currentUser) {
            return res.status(401).json({ 
                success: false, 
                message: "Sessiya eskirgan" 
            });
        }

        const { role, skill, minLevel } = req.query;

        let query = { 
            openToOpportunities: true, 
            isFake: { $ne: true },
            verified: true
        };

        if (role) query.preferredRoles = role;
        if (minLevel) query.cyberLevel = { $gte: parseInt(minLevel) };

        const users = await User.find(query)
            .limit(50)
            .select('name username avatar cyberLevel region city score solvedChallenges battleRating preferredRoles')
            .lean();

        const results = await Promise.all(users.map(async u => ({
            username: u.username,
            name: u.name,
            avatar: u.avatar,
            cyberLevel: u.cyberLevel,
            region: u.region,
            city: u.city,
            score: u.score,
            skills: await calculateSkillScores(u),
            solvedCount: (u.solvedChallenges || []).length,
            battleRating: u.battleRating,
            preferredRoles: u.preferredRoles
        })));

        let filtered = results;
        if (skill) {
            filtered = results.filter(r => {
                const skillKey = skill.toLowerCase();
                return Object.entries(r.skills).some(([k, v]) =>
                    k.toLowerCase().includes(skillKey) && v >= 30
                );
            });
        }

        res.json({ success: true, talent: filtered });
    } catch (err) {
        console.error('Talent xatosi:', err);
        res.status(500).json({ 
            success: false, 
            message: "Server xatosi: " + err.message 
        });
    }
});

// ══════════════════════════════════════════
// GET /stats/:id — Foydalanuvchi statistikasi
// ══════════════════════════════════════════
router.get('/stats/:id', async (req, res) => {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ 
                success: false, 
                message: "Kirish kerak" 
            });
        }

        const currentUser = await findCurrentUser(req);
        if (!currentUser) {
            return res.status(401).json({ 
                success: false, 
                message: "Sessiya eskirgan" 
            });
        }

        const isAdmin = ['admin', 'super_admin'].includes(currentUser.role);
        const isSelf = currentUser._id.toString() === req.params.id;

        if (!isAdmin && !isSelf) {
            return res.status(403).json({ 
                success: false, 
                message: "Ruxsat yo'q" 
            });
        }

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ 
                success: false, 
                message: "Noto'g'ri ID" 
            });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: "Foydalanuvchi topilmadi" 
            });
        }

        let totalSubmissions = 0;
        let correctSubmissions = 0;
        try {
            const Submission = require('../models/Submission');
            totalSubmissions = await Submission.countDocuments({ userId: user._id });
            correctSubmissions = await Submission.countDocuments({ 
                userId: user._id, 
                correct: true 
            });
        } catch (e) {}

        const skills = await calculateSkillScores(user);
        const levelInfo = getLevelProgress(user.xp || 0);

        res.json({
            success: true,
            stats: {
                userId: user._id.toString(),
                username: user.username,
                name: user.name,
                score: user.score || 0,
                xp: user.xp || 0,
                level: levelInfo.level,
                skills,
                solvedCount: (user.solvedChallenges || []).length,
                totalSubmissions,
                correctSubmissions,
                successRate: totalSubmissions > 0 
                    ? Math.round((correctSubmissions / totalSubmissions) * 100) 
                    : 0,
                achievements: user.achievements || [],
                battleRating: user.battleRating || 1000,
                battleWins: user.battleWins || 0,
                battleLosses: user.battleLosses || 0,
                streak: user.streak || 0,
                createdAt: user.createdAt,
                lastActive: user.lastActive
            }
        });
    } catch (err) {
        console.error('Stats xatosi:', err);
        res.status(500).json({ 
            success: false, 
            message: "Server xatosi: " + err.message 
        });
    }
});

module.exports = router;
