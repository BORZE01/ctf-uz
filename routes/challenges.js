const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
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

        const challenge = await Challenge.findOne({ _id: req.params.id, status: 'live' }).lean();
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
                hints: (challenge.hints || []).map((h, i) => {
                    const isUnlocked = user.unlockedHints && user.unlockedHints.some(uh => uh.challengeId.toString() === challenge._id.toString() && uh.hintIndex === i);
                    return isUnlocked ? (h.text || h) : "LOCKED";
                }),
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
router.post('/:id/submit', requireAuth, async (req, res) => {
    try {
        const { flag } = req.body;
        const challenge = await Challenge.findOne({ _id: req.params.id, status: 'live' });

        if (!challenge) return res.status(404).json({ success: false, message: "Masala topilmadi yoki yopiq" });

        // Foydalanuvchi buni oldin yechganmi?
        if (req.user.solved && req.user.solved.includes(challenge._id.toString())) {
            return res.status(400).json({ success: false, message: "Siz bu masalani allaqachon yechgansiz!" });
        }

        if (challenge.flag === flag) {
            // Atomik yangilash (Faqatgina solved ro'yxatida bo'lmasa ball qo'shiladi)
            const updatedUser = await User.findOneAndUpdate(
                { _id: req.user._id, solved: { $ne: challenge._id.toString() } },
                {
                    $push: { solved: challenge._id.toString() },
                    $inc: { score: challenge.points }
                },
                { new: true }
            );

            if (!updatedUser) {
                return res.status(400).json({ success: false, message: "Siz bu masalani allaqachon yechgansiz!" });
            }

            // Challenge solves sonini oshirish
            await Challenge.findByIdAndUpdate(challenge._id, { $inc: { solves: 1 } });

            return res.json({ success: true, message: "Flag to'g'ri!", score: updatedUser.score });
        } else {
            return res.status(400).json({ success: false, message: "Noto'g'ri flag!" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server xatosi" });
    }
});

router.post('/:id/hints/buy', async (req, res) => {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ success: false, message: "Kirish kerak" });
        }

        const { hintIndex } = req.body;
        const index = parseInt(hintIndex);
        const challenge = await Challenge.findOne({ _id: req.params.id, status: 'live' });

        if (!challenge || !challenge.hints || !challenge.hints[index]) {
            return res.status(404).json({ success: false, message: 'Hint topilmadi' });
        }

        const user = await User.findById(req.session.user.id);
        if (!user.unlockedHints) user.unlockedHints = [];

        const alreadyUnlocked = user.unlockedHints.some(uh => uh.challengeId.toString() === challenge._id.toString() && uh.hintIndex === index);
        const rawHint = challenge.hints[index];
        const hintText = typeof rawHint === 'object' ? rawHint.text : rawHint;

        if (alreadyUnlocked) {
            return res.json({ success: true, text: hintText, message: "Allaqachon ochilgan" });
        }

        const percentage = index === 0 ? 0.20 : 0.40;
        const cost = Math.floor((challenge.points || 100) * percentage);

        if ((user.score || 0) < cost) {
            return res.status(400).json({ success: false, message: `Yeterli ball yo'q. Hint narxi: ${cost} XP` });
        }

        user.score -= cost;
        user.unlockedHints.push({ challengeId: challenge._id, hintIndex: index });
        await user.save();

        res.json({ success: true, text: hintText, message: "Muvaffaqiyatli sotib olindi!" });
    } catch (err) {
        console.error('Hint buy xatosi:', err.message);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});

module.exports = router;

