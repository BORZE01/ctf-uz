const fs = require('fs');
const path = require('path');

const usersRoutePath = path.join(__dirname, 'routes', 'users.js');
let code = fs.readFileSync(usersRoutePath, 'utf8');

// 1. Qatorlarni o'qiymiz
const lines = code.split('\n');
let newLines = [];
let skip = false;

// 2. /u/:username boshlangan joydan module.exports'gacha hamma xato qatorlarni olib tashlaymiz
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("router.get('/u/:username'")) {
        skip = true;
    }
    if (lines[i].includes("module.exports = router")) {
        skip = false;
        break; 
    }
    
    if (!skip) {
        newLines.push(lines[i]);
    }
}

// 3. Toza va xatosiz kod
const cleanRoute = `
// Public profil marshruti
router.get('/u/:username', async (req, res) => {
    try {
        const targetUser = await User.findOne({ username: req.params.username, role: { $ne: 'fake' } });
        if (!targetUser) return res.status(404).json({ success: false, message: "Foydalanuvchi topilmadi" });

        const safeEscapeHtml = (unsafe) => {
            return (unsafe || '').toString().replace(/[&<>"']/g, m => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'}[m]));
        };

        const userData = {
            username: targetUser.username,
            name: safeEscapeHtml(targetUser.name || targetUser.username),
            bio: safeEscapeHtml(targetUser.bio || ''),
            score: targetUser.score || 0,
            level: Math.floor((targetUser.score || 0) / 1000) || 1,
            cyberLevel: Math.floor((targetUser.score || 0) / 1000) || 1,
            avatar: targetUser.avatar || '',
            skills: targetUser.skills || {},
            solved: targetUser.solved || [],
            streak: targetUser.streak || 0,
            globalRank: targetUser.globalRank || 0,
            region: targetUser.region || targetUser.viloyat || "Toshkent",
            city: targetUser.city || targetUser.shahar || "Noma'lum"
        };

        res.json({ success: true, user: userData, data: userData });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server xatosi" });
    }
});

module.exports = router;
`;

// Tozalangan faylni qayta yig'amiz
const finalCode = newLines.join('\n') + '\n' + cleanRoute;
fs.writeFileSync(usersRoutePath, finalCode, 'utf8');

console.log("✅ routes/users.js faylidagi ortiqcha qavslar tozalandi va xato bartaraf etildi!");
