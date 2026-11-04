const fs = require('fs');

// 1. server.js dan eski interceptorni butunlay olib tashlash
let serverCode = fs.readFileSync('server.js', 'utf8');
serverCode = serverCode.replace(/\/\/ --- ADMIN USER EDIT INTERCEPTOR ---[\s\S]*?\/\/ --- END ADMIN USER EDIT INTERCEPTOR ---/g, '');
fs.writeFileSync('server.js', serverCode, 'utf8');
console.log("✅ Eski interceptor server.js dan olib tashlandi.");

// 2. routes/admin.js faylini xavfsiz usul bilan yangilash
const adminRouteFile = 'routes/admin.js';
if (fs.existsSync(adminRouteFile)) {
    let adminCode = fs.readFileSync(adminRouteFile, 'utf8');
    
    // Agar eski edit route bo'lsa uni almashtiramiz
    const editRouteRegex = /router\.(put|post|patch)\('\/users\/:?id?'[\s\S]*?(?=\nrouter\.)/g;
    
    const newEditRoute = `
router.put('/users/:id?', async (req, res) => {
    try {
        const User = require('../models/User');
        let userId = req.params.id;
        
        let user = userId ? await User.findById(userId) : await User.findOne({ $or: [{username: req.body.username}, {email: req.body.email}] });
        if (!user) return res.status(404).json({ success: false, message: "Foydalanuvchi topilmadi" });

        const { name, username, email, phone, location, score, ball, points, cyberLevel, level, reyting } = req.body;
        
        if (name !== undefined) user.name = name;
        if (username !== undefined) user.username = username;
        if (email !== undefined) user.email = email;
        if (phone !== undefined) user.phone = phone;
        if (location !== undefined) user.location = location;
        
        let newScore = score !== undefined ? score : (ball !== undefined ? ball : points);
        if (newScore !== undefined && newScore !== '') user.score = Number(newScore);
        
        let newLevel = cyberLevel !== undefined ? cyberLevel : (level !== undefined ? level : reyting);
        if (newLevel !== undefined && newLevel !== '') user.level = Number(newLevel);
        
        await user.save();
        return res.json({ success: true, message: "Ma'lumotlar muvaffaqiyatli saqlandi!" });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Server xatosi: " + err.message });
    }
});
`;

    if (adminCode.match(editRouteRegex)) {
        adminCode = adminCode.replace(editRouteRegex, newEditRoute);
    } else {
        // Agar edit route topilmasa oxiriga qo'shamiz
        adminCode = adminCode.replace(/module\.exports = router;/, newEditRoute + '\nmodule.exports = router;');
    }
    
    fs.writeFileSync(adminRouteFile, adminCode, 'utf8');
    console.log("✅ Admin update route muvaffaqiyatli yangilandi va xavfsizlandi!");
} else {
    console.log("⚠️ routes/admin.js fayli topilmadi!");
}
