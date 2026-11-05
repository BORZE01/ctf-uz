const fs = require('fs');
const path = require('path');

const challengeRoutePath = path.join(__dirname, 'routes', 'challenges.js');
if (fs.existsSync(challengeRoutePath)) {
    let code = fs.readFileSync(challengeRoutePath, 'utf8');

    // 1. Submit Flag (Atomik ball qo'shish va takrorlanishni oldini olish)
    const fixedSubmit = `
router.post('/:id/submit', auth, async (req, res) => {
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
`;
    // Eski submit endpointini almashtiramiz
    code = code.replace(/router\.post\('\/:id\/submit'[\s\S]*?(?=\nrouter\.)/, fixedSubmit.trim() + "\n");

    // 2. Hint sotib olishni atomik qilish
    code = code.replace(/req\.user\.score\s*-=\s*hintPrice;[\s\S]*?await\s+req\.user\.save\(\);/, 
    "await User.findByIdAndUpdate(req.user._id, { $inc: { score: -hintPrice }, $push: { unlockedHints: { challengeId: challenge._id.toString(), hintIndex } } });");

    // 3. Yangi masala yaratishda default statusni draft qilish
    code = code.replace(/const\s+newChallenge\s*=\s*new\s+Challenge\(\{([\s\S]*?)\}\);/, 
    "const newChallenge = new Challenge({$1, status: 'draft'});");
    
    // Bitta challenge qidirishda faqat live larni ko'rsatish
    code = code.replace(/await\s+Challenge\.findById\(req\.params\.id\)/g, 
    "await Challenge.findOne({ _id: req.params.id, status: 'live' })");

    fs.writeFileSync(challengeRoutePath, code, 'utf8');
    console.log("✅ routes/challenges.js : Submission takrorlanishi yopildi, Hint sotib olish to'g'rilandi, Default status 'draft' qilib belgilandi.");
}
