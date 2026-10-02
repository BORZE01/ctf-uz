const express = require('express');
const router = express.Router();
const Challenge = require('../models/Challenge');
const User = require('../models/User');
const Submission = require('../models/Submission');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');
const { calculateSkillScores } = require('../utils/scoring');
const { sendSolveToAdmin } = require('../utils/telegram');
const { checkAchievements } = require('../utils/achievements');

// ══════════════════════════════════════════
// BARCHA CHALLENGES
// ══════════════════════════════════════════
router.get('/', async (req, res) => {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ success: false, message: "Kirish kerak" });
        }

        const user = await User.findById(req.session.user.id);

        const challenges = await Challenge.find({ status: 'live' })
            .select('title category difficulty points story solves avgRating')
            .sort({ points: 1 })
            .lean();

        const solvedIds = (user?.solvedChallenges || []).map(id => id.toString());

        const result = challenges.map(c => ({
            id: c._id,
            title: c.title,
            category: c.category,
            difficulty: c.difficulty,
            points: c.points,
            story: c.story,
            avgRating: c.avgRating || 0,
            solved: solvedIds.includes(c._id.toString())
        }));

        res.json({ success: true, challenges: result });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ══════════════════════════════════════════
// LEADERBOARD
// ══════════════════════════════════════════
router.get('/leaderboard', async (req, res) => {
    try {
        const { region } = req.query;

        let query = { verified: true, isFake: false };
        if (region) query.region = { $regex: region, $options: 'i' };

        const users = await User.find(query)
            .sort({ score: -1 })
            .limit(100)
            .select('name username avatar score cyberLevel region city')
            .lean();

        const leaderboard = users.map(u => ({
            username: u.username,
            name: u.name,
            avatar: u.avatar,
            score: u.score,
            cyberLevel: u.cyberLevel,
            region: u.region,
            city: u.city
        }));

        res.json({ success: true, leaderboard });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ══════════════════════════════════════════
// BITTA CHALLENGE
// ══════════════════════════════════════════
router.get('/:id', async (req, res) => {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ success: false, message: "Kirish kerak" });
        }

        const challenge = await Challenge.findById(req.params.id).lean();
        if (!challenge) return res.status(404).json({ success: false, message: "Topilmadi" });

        const user = await User.findById(req.session.user.id);
        const solved = (user?.solvedChallenges || []).some(id => id.toString() === challenge._id.toString());

        res.json({
            success: true,
            challenge: {
                id: challenge._id,
                title: challenge.title,
                story: challenge.story,
                objective: challenge.objective,
                category: challenge.category,
                difficulty: challenge.difficulty,
                points: challenge.points,
                hints: solved
                    ? challenge.hints
                    : (challenge.hints || []).map(h => ({ text: '🔒 Hint', cost: h.cost })),
                evidence: challenge.evidence,
                file: challenge.file,
                fileName: challenge.fileName,
                avgRating: challenge.avgRating || 0,
                solved
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ══════════════════════════════════════════
// HINT OCHISH
// ══════════════════════════════════════════
router.post('/:id/hint/:hintIndex', async (req, res) => {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ success: false, message: "Kirish kerak" });
        }

        const challenge = await Challenge.findById(req.params.id);
        if (!challenge) return res.status(404).json({ success: false, message: "Topilmadi" });

        const idx = parseInt(req.params.hintIndex);
        const hint = challenge.hints[idx];
        if (!hint) return res.status(404).json({ success: false, message: "Hint topilmadi" });

        const user = await User.findById(req.session.user.id);
        const solved = user.solvedChallenges.some(id => id.toString() === challenge._id.toString());

        if (solved) {
            return res.json({ success: true, hint: { text: hint.text, cost: hint.cost } });
        }

        const cost = hint.cost || 20;
        user.score = Math.max(0, user.score - cost);
        await user.save();

        res.json({
            success: true,
            hint: { text: hint.text, cost },
            newScore: user.score,
            penalty: cost
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ══════════════════════════════════════════
// RATING BERISH
// ══════════════════════════════════════════
router.post('/:id/rate', async (req, res) => {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ success: false, message: "Kirish kerak" });
        }

        const rating = parseInt(req.body.rating);
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: "1-5 oralig'ida" });
        }

        const challenge = await Challenge.findById(req.params.id);
        if (!challenge) return res.status(404).json({ success: false, message: "Topilmadi" });

        const user = await User.findById(req.session.user.id);
        if (!user.solvedChallenges.some(id => id.toString() === challenge._id.toString())) {
            return res.status(400).json({ success: false, message: "Avval yeching" });
        }

        const existing = challenge.ratings.find(r => r.userId.toString() === user._id.toString());
        if (existing) {
            existing.rating = rating;
        } else {
            challenge.ratings.push({ userId: user._id, rating });
        }

        challenge.ratingCount = challenge.ratings.length;
        challenge.avgRating = challenge.ratings.reduce((s, r) => s + r.rating, 0) / challenge.ratings.length;

        await challenge.save();

        res.json({ success: true, avgRating: challenge.avgRating, count: challenge.ratingCount });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ══════════════════════════════════════════
// SUBMIT
// ══════════════════════════════════════════
router.post('/:id/submit', async (req, res) => {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ success: false, message: "Kirish kerak" });
        }

        const { flag } = req.body;
        if (!flag) return res.status(400).json({ success: false, message: "Flag kerak" });

        const challenge = await Challenge.findById(req.params.id);
        if (!challenge) return res.status(404).json({ success: false, message: "Topilmadi" });

        const user = await User.findById(req.session.user.id);
        if (!user) return res.status(404).json({ success: false, message: "User topilmadi" });

        // Allaqachon yechilgan?
        if (user.solvedChallenges.some(id => id.toString() === challenge._id.toString())) {
            return res.status(400).json({ success: false, message: "Allaqachon yechilgan" });
        }

        // Analytics
        user.analytics = user.analytics || { solved: 0, attempted: 0, successRate: 0 };
        user.analytics.attempted++;

        // Noto'g'ri
        if (flag.trim() !== challenge.flag) {
            await user.save();

            await Submission.create({
                userId: user._id,
                challengeId: challenge._id,
                flag,
                correct: false,
                ip: req.ip,
                userAgent: req.headers['user-agent']
            });

            return res.status(400).json({ success: false, message: "Flag noto'g'ri" });
        }

        // To'g'ri
        const wasFirst = !challenge.firstBloodUserId;
        if (wasFirst) {
            challenge.firstBloodUserId = user._id;
            challenge.firstBloodAt = new Date();
        }

        const pointsAwarded = challenge.points;

        user.solvedChallenges.push(challenge._id);
        user.score = (user.score || 0) + pointsAwarded;
        user.xp = (user.xp || 0) + pointsAwarded;
        user.cyberLevel = Math.floor(user.xp / 1000) + 1;

        // Kategoriya
        if (!user.categoryCounts) user.categoryCounts = {};
        user.categoryCounts[challenge.category] = (user.categoryCounts[challenge.category] || 0) + 1;

        user.analytics.solved++;
        user.analytics.successRate = Math.round(
            (user.analytics.solved / (user.analytics.solved + user.analytics.attempted)) * 100
        );

        // Streak
        const today = new Date().toDateString();
        const lastSolve = user.lastSolveDate ? new Date(user.lastSolveDate).toDateString() : null;
        if (lastSolve !== today) {
            const yesterday = new Date(Date.now() - 86400000).toDateString();
            user.streak = lastSolve === yesterday ? (user.streak || 0) + 1 : 1;
            user.lastSolveDate = new Date();
        }

        // Skills
        user.skills = await calculateSkillScores(user);
        await user.save();

        challenge.solves = (challenge.solves || 0) + 1;
        await challenge.save();

        // Submission
        await Submission.create({
            userId: user._id,
            challengeId: challenge._id,
            flag,
            correct: true,
            pointsAwarded,
            xpAwarded: pointsAwarded,
            isFirstBlood: wasFirst,
            ip: req.ip,
            userAgent: req.headers['user-agent']
        });

        // Activity
        await Activity.create({
            userId: user._id,
            type: 'solve',
            title: `Yechildi: ${challenge.title}`,
            description: `${challenge.category} • +${pointsAwarded} XP`,
            icon: '⚡'
        });

        // Notification
        await Notification.create({
            userId: user._id,
            type: 'challenge_solved',
            title: `✅ ${challenge.title}`,
            message: `+${pointsAwarded} XP`,
            link: `/challenge?id=${challenge._id}`,
            icon: '⚡'
        });

        // Achievement
        try {
            await checkAchievements(user, 'solve', { challenge, isFirstBlood: wasFirst });
            await user.save();
        } catch (e) {}

        // Admin
        try {
            await sendSolveToAdmin({
                username: user.username,
                challengeTitle: challenge.title,
                category: challenge.category,
                points: pointsAwarded,
                flag
            });
        } catch (e) {}

        res.json({
            success: true,
            message: `To'g'ri! +${pointsAwarded} XP`,
            xp: user.xp,
            cyberLevel: user.cyberLevel,
            streak: user.streak
        });
    } catch (err) {
        console.error('Submit xatosi:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;