const fs = require('fs');
const path = require('path');

const usersRoutePath = path.join(__dirname, 'routes', 'users.js');
if (fs.existsSync(usersRoutePath)) {
    let code = fs.readFileSync(usersRoutePath, 'utf8');
    
    // XSS himoyasi va Levelni yagona standartda yuborish
    if (code.includes('/u/') && !code.includes('escapeHtml')) {
        const fixCode = `
const { escapeHtml } = require('../utils/sanitize'); // XSS himoyasi

// Public profil marshrutini xavfsizlantirish
router.get('/u/:username', async (req, res) => {
    try {
        const targetUser = await User.findOne({ username: req.params.username, role: { $ne: 'fake' } });
        if (!targetUser) return res.status(404).send("Foydalanuvchi topilmadi");

        // Yagona Levelni olish va zararli skriptlarni (XSS) zararsizlantirish
        const safeName = escapeHtml(targetUser.name || targetUser.username);
        const safeBio = escapeHtml(targetUser.bio || 'Ma\\'lumot kiritilmagan');
        const unifiedLevel = targetUser.level || targetUser.cyberLevel || 1;
        
        // Agar render funksiyasi ishlatilayotgan bo'lsa
        if (res.render) {
            return res.render('u', { user: targetUser, safeName, safeBio, level: unifiedLevel });
        }
    } catch (err) {
        console.error(err);
    }
});
`;
        // Eski /u/ marshrutini topib xavfsiziga almashtirish
        code = code.replace(/router\.get\('\/u\/:username'[\s\S]*?(?=\nrouter\.)/, fixCode);
        fs.writeFileSync(usersRoutePath, code, 'utf8');
        console.log("✅ Public profil (/u/) XSS hujumlaridan himoyalandi va Level to'g'rilandi!");
    } else {
        console.log("ℹ️ Public profil marshruti allaqachon xavfsiz yoki fayl tuzilishi boshqacha.");
    }
}
