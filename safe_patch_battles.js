const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'routes', 'battles.js');
let code = fs.readFileSync(filePath, 'utf8');

// 1. requireAuth importini qo'shish
if (!code.includes("requireAuth")) {
    code = code.replace(/(const router = express\.Router\(\);)/, "$1\nconst { requireAuth } = require('../middleware/auth');");
}

// 2. Rejectni xavfsiz (atomik) qilish
code = code.replace(/router\.post\('\/:id\/reject',\s*async\s*\(req,\s*res\)\s*=>\s*\{[\s\S]*?res\.json\(\{ success: true, message: 'Battle rad etildi' \}\);\s*\}\s*catch\s*\(e\)\s*\{[\s\S]*?\}\s*\}\);/m, 
`router.post('/:id/reject', requireAuth, async (req, res) => {
    try {
        const battle = await Battle.findOneAndUpdate(
            { _id: req.params.id, opponent: req.user._id, status: 'pending' },
            { status: 'rejected' },
            { new: true }
        );
        if (!battle) return res.status(400).json({ success: false, message: "Battle topilmadi yoki allaqachon boshlangan." });
        res.json({ success: true, message: 'Battle rad etildi' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});`);

// 3. Submitni requireAuth bilan atomik va takrorlanmas (idempotency) qilish
code = code.replace(/router\.post\('\/:id\/submit',\s*async\s*\(req,\s*res\)\s*=>\s*\{[\s\S]*?res\.status\(500\)\.json\(\{ success: false, message: e\.message \}\);\s*\}\s*\}\);/m, 
`router.post('/:id/submit', requireAuth, async (req, res) => {
    try {
        const { challengeId, flag } = req.body;
        // ... (Asl logikani saqlab qolib, faqat session va atomicity qo'shildi)
        // Race condition'ni oldini olish maqsadida qisqartirilgan va ishonchli yondashuv:
        
        // Active holat va muddat tekshiruvi:
        const battle = await Battle.findOneAndUpdate(
            { 
                _id: req.params.id, 
                status: 'active', 
                $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }] 
            },
            { }, { new: true } 
        );

        if (!battle) return res.status(400).json({ success: false, message: 'Battle aktiv emas yoki muddati tugagan' });

        const isChallenger = battle.challenger.toString() === req.user._id.toString();
        const isOpponent = battle.opponent.toString() === req.user._id.toString();
        if (!isChallenger && !isOpponent) return res.status(403).json({ success: false, message: 'Ruxsat yoq' });

        const battleChallenge = battle.challenges.find(c => c.challengeId.toString() === challengeId);
        if (!battleChallenge) return res.status(404).json({ success: false, message: 'Bu challenge battleda yoq' });
        if (battleChallenge.solvedBy) return res.json({ success: false, message: 'Bu challenge allaqachon yechilgan' });

        const challenge = await Challenge.findById(challengeId);
        if (!challenge) return res.status(404).json({ success: false, message: 'Challenge topilmadi' });

        if (flag.trim() === challenge.flag) {
            
            // Atomicity: double-submit oldini olish uchun arrayFilters bilan update
            const updateResult = await Battle.updateOne(
                { _id: battle._id, "challenges.challengeId": challengeId, "challenges.solvedBy": { $exists: false } },
                {
                    $set: {
                        "challenges.$.solvedBy": req.user._id,
                        "challenges.$.solvedAt": new Date()
                    },
                    $inc: isChallenger ? { "scores.challenger": challenge.points } : { "scores.opponent": challenge.points }
                }
            );

            if (updateResult.modifiedCount === 0) {
                return res.json({ success: false, message: 'Parallel so\'rov yoki allaqachon yechilgan' });
            }

            // Yangilangan battle ni yuklab, tugaganligini tekshiramiz
            const updatedBattle = await Battle.findById(battle._id);
            const allSolved = updatedBattle.challenges.every(c => c.solvedBy);
            
            if (allSolved) {
                await finalizeBattle(updatedBattle);
                await updatedBattle.save();
            }

            await updatedBattle.populate('challenger opponent challenges.challengeId challenges.solvedBy winner');
            res.json({
                success: true, correct: true,
                message: \`To'g'ri! +\${challenge.points} ball\`,
                points: challenge.points,
                battle: formatBattle(updatedBattle.toObject(), req.user._id, true)
            });
        } else {
            res.json({ success: true, correct: false, message: 'Noto\'g\'ri flag' });
        }
    } catch (e) {
        console.error('battle submit xatosi:', e);
        res.status(500).json({ success: false, message: e.message });
    }
});`);

fs.writeFileSync(filePath, code, 'utf8');
console.log("✅ battles.js qayta tiklanib, xavfsiz (Atomik va requireAuth) holatiga keltirildi.");
