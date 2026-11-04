const fs = require('fs');
const path = require('path');

const usersRoutePath = path.join(__dirname, 'routes', 'users.js');
if (fs.existsSync(usersRoutePath)) {
    let code = fs.readFileSync(usersRoutePath, 'utf8');
    
    const fixCode = `
// API endpoint for public profile (Fixed JSON & XSS)
router.get('/u/:username', async (req, res) => {
    try {
        const targetUser = await User.findOne({ username: req.params.username, role: { $ne: 'fake' } });
        if (!targetUser) return res.status(404).json({ success: false, message: "Foydalanuvchi topilmadi" });

        // Встроенная защита от XSS (AUD-005)
        const escapeHtml = (unsafe) => {
            return (unsafe || '').toString()
                 .replace(/&/g, "&amp;")
                 .replace(/</g, "&lt;")
                 .replace(/>/g, "&gt;")
                 .replace(/"/g, "&quot;")
                 .replace(/'/g, "&#039;");
        };

        const safeName = escapeHtml(targetUser.name || targetUser.username);
        const safeBio = escapeHtml(targetUser.bio || '');
        const unifiedLevel = Math.floor((targetUser.score || 0) / 1000) || 1;
        
        // Возвращаем безопасный JSON
        res.json({
            success: true,
            user: {
                username: targetUser.username,
                name: safeName,
                bio: safeBio,
                score: targetUser.score || 0,
                level: unifiedLevel,
                cyberLevel: unifiedLevel,
                avatar: targetUser.avatar,
                skills: targetUser.skills,
                solved: targetUser.solved,
                streak: targetUser.streak || 0,
                globalRank: targetUser.globalRank
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server xatosi" });
    }
});
`;
    
    // Заменяем сломанный маршрут /u/:username
    code = code.replace(/router\.get\('\/u\/:username'[\s\S]*?(?=\nrouter\.)/, fixCode);
    fs.writeFileSync(usersRoutePath, code, 'utf8');
    console.log("✅ API профиля (/u/) исправлен: восстановлен JSON-ответ со встроенной защитой от XSS.");
}
