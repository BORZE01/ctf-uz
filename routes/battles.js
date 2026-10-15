const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Battle = require('../models/Battle');
const Challenge = require('../models/Challenge');
const Notification = require('../models/Notification');
const { calculateElo } = require('../utils/elo');

// ══════════════════════════════════════════
// HELPER
// ══════════════════════════════════════════
async function getCurrentUser(req) {
    if (!req.session || !req.session.user) return null;
    if (!mongoose.Types.ObjectId.isValid(req.session.user.id)) return null;
    return await User.findById(req.session.user.id);
}

// ══════════════════════════════════════════
// GET /api/battles — mening battle'larim
// ══════════════════════════════════════════
router.get('/', async (req, res) => {
    try {
        const user = await getCurrentUser(req);
        if (!user) return res.status(401).json({ success: false, message: 'Kirish kerak' });

        const battles = await Battle.find({
            $or: [{ challenger: user._id }, { opponent: user._id }],
            status: { $in: ['pending', 'active'] }
        })
            .populate('challenger', 'username name avatar')
            .populate('opponent', 'username name avatar')
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        const result = battles.map(b => formatBattle(b, user._id));
        res.json({ success: true, battles: result });
    } catch (e) {
        console.error('GET /battles xatosi:', e);
        res.status(500).json({ success: false, message: e.message });
    }
});

// ══════════════════════════════════════════
// GET /api/battles/history — tarix
// ══════════════════════════════════════════
router.get('/history', async (req, res) => {
    try {
        const user = await getCurrentUser(req);
        if (!user) return res.status(401).json({ success: false, message: 'Kirish kerak' });

        const battles = await Battle.find({
            $or: [{ challenger: user._id }, { opponent: user._id }],
            status: 'completed'
        })
            .populate('challenger', 'username name avatar')
            .populate('opponent', 'username name avatar')
            .sort({ completedAt: -1 })
            .limit(20)
            .lean();

        const result = battles.map(b => formatBattle(b, user._id));
        res.json({ success: true, battles: result });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// ══════════════════════════════════════════
// GET /api/battles/leaderboard — TOP
// ══════════════════════════════════════════
router.get('/leaderboard', async (req, res) => {
    try {
        const users = await User.find({
            battleRating: { $gt: 0 }
        })
            .sort({ battleRating: -1, battleWins: -1 })
            .limit(20)
            .select('username name avatar battleRating battleWins battleLosses cyberLevel')
            .lean();

        res.json({ success: true, users });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// ══════════════════════════════════════════
// GET /api/battles/:id — bitta battle
// ══════════════════════════════════════════
router.get('/:id', async (req, res) => {
    try {
        const user = await getCurrentUser(req);
        if (!user) return res.status(401).json({ success: false, message: 'Kirish kerak' });
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Xato ID' });
        }

        const battle = await Battle.findById(req.params.id)
            .populate('challenger', 'username name avatar')
            .populate('opponent', 'username name avatar')
            .populate('challenges.challengeId', 'title category difficulty points')
            .populate('challenges.solvedBy', 'username')
            .populate('winner', 'username name')
            .lean();

        if (!battle) return res.status(404).json({ success: false, message: 'Battle topilmadi' });

        // Faqat ishtirokchilar ko'rishi mumkin
        const isParticipant = 
            battle.challenger._id.toString() === user._id.toString() ||
            battle.opponent._id.toString() === user._id.toString();
        
        if (!isParticipant) return res.status(403).json({ success: false, message: 'Ruxsat yo\'q' });

        res.json({ success: true, battle: formatBattle(battle, user._id, true) });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// ══════════════════════════════════════════
// POST /api/battles/create — yangi battle
// ══════════════════════════════════════════
router.post('/create', async (req, res) => {
    try {
        const user = await getCurrentUser(req);
        if (!user) return res.status(401).json({ success: false, message: 'Kirish kerak' });

        const { opponentUsername, challengeCount = 3 } = req.body;

        if (!opponentUsername) {
            return res.status(400).json({ success: false, message: 'Raqib username kerak' });
        }

        // Raqibni topish
        const opponent = await User.findOne({
            username: opponentUsername.toLowerCase().trim()
        });

        if (!opponent) {
            return res.status(404).json({ success: false, message: 'Raqib topilmadi' });
        }

        if (opponent._id.toString() === user._id.toString()) {
            return res.status(400).json({ success: false, message: 'O\'zingizga battle yarata olmaysiz' });
        }

        // Aktiv battle bormi?
        const existingBattle = await Battle.findOne({
            $or: [
                { challenger: user._id, opponent: opponent._id },
                { challenger: opponent._id, opponent: user._id }
            ],
            status: { $in: ['pending', 'active'] }
        });

        if (existingBattle) {
            return res.status(400).json({ 
                success: false, 
                message: 'Bu raqib bilan aktiv battle mavjud' 
            });
        }

        // Tasodifiy challenges tanlash
        const count = Math.min(Math.max(parseInt(challengeCount) || 3, 1), 5);
        const randomChallenges = await Challenge.aggregate([
            { $match: { status: 'live' } },
            { $sample: { size: count } }
        ]);

        if (randomChallenges.length < count) {
            return res.status(400).json({ 
                success: false, 
                message: 'Yetarli challenge yo\'q' 
            });
        }

        // Battle yaratish
        const battle = await Battle.create({
            challenger: user._id,
            opponent: opponent._id,
            challenges: randomChallenges.map(c => ({
                challengeId: c._id,
                solvedBy: null,
                solvedAt: null
            })),
            status: 'pending',
            challengerRatingBefore: user.battleRating || 1000,
            opponentRatingBefore: opponent.battleRating || 1000,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000)
        });

        // Notification yuborish
        try {
            await Notification.create({
                userId: opponent._id,
                type: 'battle_invite',
                title: 'Yangi battle chaqiruvi',
                message: `@${user.username} sizga 1v1 battle taklif qildi!`,
                link: `/battle/${battle._id}`,
                read: false
            });
        } catch (e) { /* ignore */ }

        res.json({ 
            success: true, 
            message: 'Battle yaratildi! Raqib qabul qilishini kuting.',
            battleId: battle._id.toString()
        });
    } catch (e) {
        console.error('create battle xatosi:', e);
        res.status(500).json({ success: false, message: e.message });
    }
});

// ══════════════════════════════════════════
// POST /api/battles/:id/accept — qabul qilish
// ══════════════════════════════════════════
router.post('/:id/accept', async (req, res) => {
    try {
        const user = await getCurrentUser(req);
        if (!user) return res.status(401).json({ success: false, message: 'Kirish kerak' });

        const battle = await Battle.findById(req.params.id);
        if (!battle) return res.status(404).json({ success: false, message: 'Battle topilmadi' });

        if (battle.opponent.toString() !== user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Siz raqib emassiz' });
        }

        if (battle.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Battle allaqachon boshlangan' });
        }

        battle.status = 'active';
        battle.startedAt = new Date();
        await battle.save();

        res.json({ success: true, message: 'Battle boshlandi!' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// ══════════════════════════════════════════
// POST /api/battles/:id/reject — rad etish
// ══════════════════════════════════════════
router.post('/:id/reject', async (req, res) => {
    try {
        const user = await getCurrentUser(req);
        if (!user) return res.status(401).json({ success: false, message: 'Kirish kerak' });

        const battle = await Battle.findById(req.params.id);
        if (!battle) return res.status(404).json({ success: false, message: 'Battle topilmadi' });

        if (battle.opponent.toString() !== user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Ruxsat yo\'q' });
        }

        battle.status = 'rejected';
        await battle.save();

        res.json({ success: true, message: 'Battle rad etildi' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// ══════════════════════════════════════════
// POST /api/battles/:id/submit — flag yuborish
// ══════════════════════════════════════════
router.post('/:id/submit', async (req, res) => {
    try {
        const user = await getCurrentUser(req);
        if (!user) return res.status(401).json({ success: false, message: 'Kirish kerak' });

        const { challengeId, flag } = req.body;
        if (!challengeId || !flag) {
            return res.status(400).json({ success: false, message: 'Challenge ID va flag kerak' });
        }

        const battle = await Battle.findById(req.params.id);
        if (!battle) return res.status(404).json({ success: false, message: 'Battle topilmadi' });

        if (battle.status !== 'active') {
            return res.status(400).json({ success: false, message: 'Battle aktiv emas' });
        }

        // Timeout tekshirish
        if (battle.expiresAt && new Date() > battle.expiresAt) {
            battle.status = 'expired';
            await battle.save();
            return res.status(400).json({ success: false, message: 'Battle muddati tugagan' });
        }

        const isChallenger = battle.challenger.toString() === user._id.toString();
        const isOpponent = battle.opponent.toString() === user._id.toString();

        if (!isChallenger && !isOpponent) {
            return res.status(403).json({ success: false, message: 'Siz ishtirokchi emassiz' });
        }

        // Challenge topish
        const battleChallenge = battle.challenges.find(
            c => c.challengeId.toString() === challengeId
        );

        if (!battleChallenge) {
            return res.status(404).json({ success: false, message: 'Bu challenge battle\'da yo\'q' });
        }

        if (battleChallenge.solvedBy) {
            return res.json({ success: false, message: 'Bu challenge allaqachon yechilgan' });
        }

        // Flag tekshirish
        const challenge = await Challenge.findById(challengeId);
        if (!challenge) {
            return res.status(404).json({ success: false, message: 'Challenge topilmadi' });
        }

        const isCorrect = flag.trim() === challenge.flag;

        if (isCorrect) {
            // Belgilash
            battleChallenge.solvedBy = user._id;
            battleChallenge.solvedAt = new Date();

            // Ball qo'shish
            if (isChallenger) {
                battle.scores.challenger += challenge.points;
            } else {
                battle.scores.opponent += challenge.points;
            }

            // Hamma challenge yechildi?
            const allSolved = battle.challenges.every(c => c.solvedBy);

            if (allSolved) {
                await finalizeBattle(battle);
            }

            await battle.save();
            await battle.populate('challenger opponent challenges.challengeId challenges.solvedBy winner');

            res.json({
                success: true,
                correct: true,
                message: `To'g'ri! +${challenge.points} ball`,
                points: challenge.points,
                battle: formatBattle(battle.toObject(), user._id, true)
            });
        } else {
            res.json({ success: true, correct: false, message: 'Noto\'g\'ri flag' });
        }
    } catch (e) {
        console.error('battle submit xatosi:', e);
        res.status(500).json({ success: false, message: e.message });
    }
});

// ══════════════════════════════════════════
// HELPER — battle tugatish
// ══════════════════════════════════════════
async function finalizeBattle(battle) {
    battle.status = 'completed';
    battle.completedAt = new Date();

    const challengerScore = battle.scores.challenger;
    const opponentScore = battle.scores.opponent;

    let scoreA;  // challenger uchun: 1 win, 0.5 draw, 0 lose
    if (challengerScore > opponentScore) {
        battle.winner = battle.challenger;
        scoreA = 1;
    } else if (opponentScore > challengerScore) {
        battle.winner = battle.opponent;
        scoreA = 0;
    } else {
        battle.winner = null;
        scoreA = 0.5;
    }

    // ELO
    const { newRatingA, newRatingB } = calculateElo(
        battle.challengerRatingBefore,
        battle.opponentRatingBefore,
        scoreA
    );

    battle.challengerRatingAfter = newRatingA;
    battle.opponentRatingAfter = newRatingB;

    // Userlarni yangilash
    await User.findByIdAndUpdate(battle.challenger, {
        battleRating: newRatingA,
        $inc: {
            battleWins: scoreA === 1 ? 1 : 0,
            battleLosses: scoreA === 0 ? 1 : 0
        }
    });

    await User.findByIdAndUpdate(battle.opponent, {
        battleRating: newRatingB,
        $inc: {
            battleWins: scoreA === 0 ? 1 : 0,
            battleLosses: scoreA === 1 ? 1 : 0
        }
    });
}

// ══════════════════════════════════════════
// HELPER — battle formatlash
// ══════════════════════════════════════════
function formatBattle(b, currentUserId, withChallenges = false) {
    const isChallenger = b.challenger._id 
        ? b.challenger._id.toString() === currentUserId.toString()
        : b.challenger.toString() === currentUserId.toString();

    const myScore = isChallenger ? b.scores.challenger : b.scores.opponent;
    const oppScore = isChallenger ? b.scores.opponent : b.scores.challenger;

    const result = {
        id: b._id.toString(),
        status: b.status,
        isChallenger,
        challenger: formatUser(b.challenger),
        opponent: formatUser(b.opponent),
        scores: {
            mine: myScore,
            opponent: oppScore
        },
        winner: b.winner ? (b.winner._id || b.winner).toString() : null,
        createdAt: b.createdAt,
        startedAt: b.startedAt,
        completedAt: b.completedAt,
        expiresAt: b.expiresAt,
        ratingChange: b.status === 'completed' ? {
            before: isChallenger ? b.challengerRatingBefore : b.opponentRatingBefore,
            after: isChallenger ? b.challengerRatingAfter : b.opponentRatingAfter
        } : null
    };

    if (withChallenges) {
        result.challenges = b.challenges.map(c => ({
            id: c.challengeId._id ? c.challengeId._id.toString() : c.challengeId.toString(),
            title: c.challengeId.title || 'Challenge',
            category: c.challengeId.category || 'Web',
            difficulty: c.challengeId.difficulty || 'Easy',
            points: c.challengeId.points || 100,
            solvedBy: c.solvedBy ? (c.solvedBy._id || c.solvedBy).toString() : null,
            solvedByMe: c.solvedBy 
                ? (c.solvedBy._id || c.solvedBy).toString() === currentUserId.toString()
                : false,
            solvedAt: c.solvedAt
        }));
    }

    return result;
}

function formatUser(u) {
    if (!u) return { id: null, username: 'Unknown', name: 'Unknown' };
    return {
        id: (u._id || u).toString(),
        username: u.username || 'unknown',
        name: u.name || u.username || 'Unknown',
        avatar: u.avatar || null
    };
}

module.exports = router;
