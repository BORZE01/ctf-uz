const fs = require('fs');
const path = require('path');

// 1. Исправляем бэкенд
const usersRoutePath = path.join(__dirname, 'routes', 'users.js');
if (fs.existsSync(usersRoutePath)) {
    let code = fs.readFileSync(usersRoutePath, 'utf8');
    
    const fixCode = `
// API endpoint for public profile (Fixed JSON & XSS)
router.get('/u/:username', async (req, res) => {
    try {
        const targetUser = await User.findOne({ username: req.params.username, role: { $ne: 'fake' } });
        if (!targetUser) return res.status(404).json({ success: false, message: "Foydalanuvchi topilmadi" });

        const escapeHtml = (unsafe) => {
            return (unsafe || '').toString().replace(/[&<>"']/g, m => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'}[m]));
        };

        const userData = {
            username: targetUser.username,
            name: escapeHtml(targetUser.name || targetUser.username),
            bio: escapeHtml(targetUser.bio || ''),
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
        res.status(500).json({ success: false, message: "Server xatosi" });
    }
});
`;
    code = code.replace(/\/\/ API endpoint for public profile[\s\S]*?\}\);/, fixCode.trim());
    fs.writeFileSync(usersRoutePath, code, 'utf8');
    console.log("✅ Бэкенд обновлен.");
}

// 2. Исправляем фронтенд с помощью обратных кавычек
const uHtmlPath = path.join(__dirname, 'public', 'u.html');
if (fs.existsSync(uHtmlPath)) {
    let html = fs.readFileSync(uHtmlPath, 'utf8');
    
    html = html.replace(/([a-zA-Z0-9_]+)\.region/g, `($1 && $1.region ? $1.region : "Noma'lum")`);
    html = html.replace(/([a-zA-Z0-9_]+)\.city/g, `($1 && $1.city ? $1.city : "")`);
    
    fs.writeFileSync(uHtmlPath, html, 'utf8');
    console.log("✅ Фронтенд (u.html) защищен от ошибок TypeError.");
}
