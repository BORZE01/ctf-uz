const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Challenge = require('../models/Challenge');
const User = require('../models/User');
const Submission = require('../models/Submission');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');
const { calculateSkillScores } = require('../utils/scoring');
const { sendSolveToAdmin } = require('../utils/telegram');
const { checkAchievements } = require('../utils/achievements');

// ══════════════════════════════════════════
// BARCHA CHALLENGES (MongoDB)
// ══════════════════════════════════════════
router.get('/', async (req, res) => {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ success: false, message: "Kirish kerak" });
        }

        const user = await User.findById(req.session.user.id);

        // FAQAT MongoDB dan
        const challenges = await Challenge.find({ status: 'live' })
            .select('title category difficulty points story solves avgRating')
            .sort({ points: 1 })
            .lean();

        const solvedIds = (user?.solvedChallenges || []).map(id => id.toString());

        const result = challenges.map(c => ({
            id: c._id.toString(),  // ObjectId string
            title: c.title,
            category: c.category,
            difficulty: c.difficulty,
            points: c.points,
            story: c.story,
            solves: c.solves || 0,
            avgRating: c.avgRating || 0,
            solved: solvedIds.includes(c._id.toString())
        }));

        res.json({ success: true, challenges: result });
    } catch (e) {
        console.error('GET /challenges xatosi:', e.message);
        res.status(500).json({ success: false, message: e.message });
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

        // ID validatsiya
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Challenge topilmadi (eski ID)' 
            });
        }

        const challenge = await Challenge.findById(req.params.id).lean();
        if (!challenge) {
            return res.status(404).json({ success: false, message: 'Challenge topilmadi' });
        }

        const user = await User.findById(req.session.user.id);
        const solvedIds = (user?.solvedChallenges || []).map(id => id.toString());

        res.json({
            success: true,
            challenge: {
                id: challenge._id.toString(),
                title: challenge.title,
                story: challenge.story,
                objective: challenge.objective,
                category: challenge.category,
                difficulty: challenge.difficulty,
                points: challenge.points,
                solves: challenge.solves || 0,
                hints: (challenge.hints || []).map(h => h.text || h),
                evidence: challenge.evidence || [],
                file: challenge.file,
                fileName: challenge.fileName,
                author: challenge.authorName || challenge.author || 'admin',
                solved: solvedIds.includes(challenge._id.toString()),
                createdAt: challenge.createdAt
            }
        });
    } catch (e) {
        console.error('GET /:id xatosi:', e.message);
        res.status(500).json({ success: false, message: e.message });
    }
});

// ══════════════════════════════════════════
// FLAG SUBMIT
// ══════════════════════════════════════════
router.post('/:id/submit', async (req, res) => {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ success: false, message: "Kirish kerak" });
        }

        // ═══ ID VALIDATSIYA ═══
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Challenge topilmadi. Sahifani yangilang va Arena orqali qayta kiring.' 
            });
        }

        const { flag } = req.body;
        if (!flag || !flag.trim()) {
            return res.status(400).json({ success: false, message: 'Flag kiritilmadi' });
        }

        const challenge = await Challenge.findById(req.params.id);
        if (!challenge) {
            return res.status(404).json({ success: false, message: 'Challenge topilmadi' });
        }

        const user = await User.findById(req.session.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Foydalanuvchi topilmadi' });
        }

        // Allaqachon yechilganmi?
        const alreadySolved = (user.solvedChallenges || [])
            .some(id => id.toString() === challenge._id.toString());

        if (alreadySolved) {
            return res.json({ 
                success: false, 
                message: 'Siz bu challengeni allaqachon yechgansiz',
                correct: false 
            });
        }

        // Flag tekshirish
        const isCorrect = flag.trim() === challenge.flag;

        // Submission yozish
        await Submission.create({
            userId: user._id,
            challengeId: challenge._id,
            flag: flag.trim(),
            correct: isCorrect,
            timestamp: new Date()
        });

        if (isCorrect) {
            // Ball qo'shish
            user.score = (user.score || 0) + challenge.points;
            user.xp = (user.xp || 0) + challenge.points;
            user.solvedChallenges = user.solvedChallenges || [];
            user.solvedChallenges.push(challenge._id);

            // Level hisoblash
            user.cyberLevel = Math.floor(user.xp / 500) + 1;

            await user.save();

            // Challenge solves
            challenge.solves = (challenge.solves || 0) + 1;
            await challenge.save();

            // Activity
            try {
                await Activity.create({
                    userId: user._id,
                    type: 'solve',
                    title: `Challengeni yechdi: ${challenge.title}`,
                    points: challenge.points,
                    timestamp: new Date()
                });
            } catch (e) {}

            // Telegram admin
            try {
                await sendSolveToAdmin(user.username, challenge.title, challenge.points);
            } catch (e) {}

            res.json({
                success: true,
                correct: true,
                message: `To'g'ri! +${challenge.points} ball`,
                points: challenge.points,
                newScore: user.score,
                newLevel: user.cyberLevel
            });
        } else {
            res.json({
                success: true,
                correct: false,
                message: 'Noto\'g\'ri flag'
            });
        }
    } catch (e) {
        console.error('Submit xatosi:', e.message);
        res.status(500).json({ success: false, message: e.message });
    }
});


// Hint sotib olish API
router.post('/:id/hints/buy', protect, async (req, res) => {
    try {
        const { hintIndex } = req.body;
        const challenge = await Challenge.findById(req.params.id);
        if (!challenge || !challenge.hints || !challenge.hints[hintIndex]) {
            return res.status(404).json({ success: false, message: 'Hint topilmadi' });
        }

        const user = await User.findById(req.user.id);
        
        // Oldin sotib olinganmi?
        const alreadyUnlocked = user.unlockedHints.some(uh => uh.challengeId.toString() === challenge._id.toString() && uh.hintIndex === parseInt(hintIndex));
        if (alreadyUnlocked) {
            return res.json({ success: true, text: challenge.hints[hintIndex].text });
        }

        // Narxni hisoblash (Challenge points ning foizi)
        // 0-hint (1-hint) = 20%, 1-hint (2-hint) = 40% 
        const percentage = hintIndex === 0 ? 0.20 : 0.40;
        const cost = Math.floor(challenge.points * percentage);

        if (user.score < cost) {
            return res.status(400).json({ success: false, message: `Yeterli ball yo'q. Hint narxi: ${cost} ball` });
        }

        // Ballni yechish va hintni ochish
        user.score -= cost;
        user.unlockedHints.push({ challengeId: challenge._id, hintIndex: parseInt(hintIndex) });
        await user.save();

        res.json({ success: true, text: challenge.hints[hintIndex].text, newScore: user.score });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});

module.exports = router;
