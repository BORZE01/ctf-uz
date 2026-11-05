const fs = require('fs');
const path = require('path');

console.log("🛠️ 2-Bosqich: Battle tizimida Race Condition va Status xatolari to'g'rilanmoqda...");

const battlesRoutePath = path.join(__dirname, 'routes', 'battles.js');
if (fs.existsSync(battlesRoutePath)) {
    let code = fs.readFileSync(battlesRoutePath, 'utf8');

    // 1. Reject qilishda faqat 'pending' statusini tekshirish va atomik yopish
    const safeReject = `
router.post('/:id/reject', auth, async (req, res) => {
    try {
        // Faqat pending holatdagi battle ni topish va atomik rad etish
        const battle = await Battle.findOneAndUpdate(
            { _id: req.params.id, opponent: req.user._id, status: 'pending' },
            { status: 'rejected' },
            { new: true }
        );

        if (!battle) {
            return res.status(400).json({ success: false, message: "Battle topilmadi yoki u allaqachon boshlangan/rad etilgan." });
        }

        return res.json({ success: true, message: "Jang rad etildi", battle });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server xatosi" });
    }
});
`;
    code = code.replace(/router\.post\('\/:id\/reject'[\s\S]*?(?=\n(?:router\.|module\.exports))/, safeReject.trim() + "\n");

    // 2. Submit qilishda (Battle tugashi) atomik qat'iy tekshiruv
    const safeSubmit = `
router.post('/:id/submit', auth, async (req, res) => {
    try {
        const { flag } = req.body;
        // Faqat active holatdagi battle ni qidiramiz
        const battle = await Battle.findOne({ _id: req.params.id, status: 'active' }).populate('challenge');
        
        if (!battle) return res.status(400).json({ success: false, message: "Battle aktiv emas yoki muddati tugagan" });

        // Ishtirokchilardan biri ekanligini tekshirish
        const isCreator = battle.creator.toString() === req.user._id.toString();
        const isOpponent = battle.opponent.toString() === req.user._id.toString();
        if (!isCreator && !isOpponent) return res.status(403).json({ success: false, message: "Siz bu jangda ishtirok etmayapsiz" });

        if (battle.challenge.flag === flag) {
            // Atomik yangilash (kim birinchi topshirsa, o'sha yutadi va battle yopiladi)
            const updatedBattle = await Battle.findOneAndUpdate(
                { _id: battle._id, status: 'active' },
                { status: 'completed', winner: req.user._id },
                { new: true }
            );

            // Agar parallel double-click qilingan bo'lsa yoki raqib 1 millisekund oldin topshirgan bo'lsa
            if (!updatedBattle) {
                return res.status(400).json({ success: false, message: "Raqibingiz sizdan chaqqonroq chiqdi va jang yakunlandi!" });
            }

            // G'olibga mukofot berish (Ball 2 marta berilib ketishi oldi olindi)
            await User.findByIdAndUpdate(req.user._id, { $inc: { score: battle.challenge.points * 2 } });
            
            return res.json({ success: true, message: "Tabriklaymiz! Siz jangda g'alaba qozondingiz!", winner: true });
        } else {
            return res.status(400).json({ success: false, message: "Noto'g'ri flag!" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server xatosi" });
    }
});
`;
    code = code.replace(/router\.post\('\/:id\/submit'[\s\S]*?(?=\n(?:router\.|module\.exports))/, safeSubmit.trim() + "\n\n");

    fs.writeFileSync(battlesRoutePath, code, 'utf8');
    console.log("✅ routes/battles.js : 'Race condition' yopildi. Statuslarning qat'iy davriyligi o'rnatildi.");
}
