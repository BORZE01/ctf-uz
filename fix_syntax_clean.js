const fs = require('fs');
const path = require('path');

const usersRoutePath = path.join(__dirname, 'routes', 'users.js');
if (fs.existsSync(usersRoutePath)) {
    let code = fs.readFileSync(usersRoutePath, 'utf8');
    
    // Toza va mukammal yozilgan marshrut
    const cleanRoute = `
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
`;

    // Eski /u/:username qismini topib, toza variantga almashtiramiz
    const regex = /router\.get\('\/u\/:username'[\s\S]*?\n\}\);\s*/;
    if (regex.test(code)) {
        code = code.replace(regex, cleanRoute);
    } else {
        code += "\n" + cleanRoute;
    }

    fs.writeFileSync(usersRoutePath, code, 'utf8');
    console.log("✅ routes/users.js dagi /u/:username marshruti toza holda qayta yozildi!");
}
