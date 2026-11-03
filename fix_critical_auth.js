const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

// Eski interceptorni xavfsiz versiyaga almashtirish
code = code.replace(/\/\/ --- ADMIN USER EDIT INTERCEPTOR ---[\s\S]*?\/\/ --- END ADMIN USER EDIT INTERCEPTOR ---/g, `
// --- ADMIN USER EDIT INTERCEPTOR ---
app.use(async (req, res, next) => {
    if (req.url.includes('/api/admin/users') && ['PUT', 'POST', 'PATCH'].includes(req.method)) {
        try {
            // 1. QAT'IY AVTORIZATSIYA: Faqat adminlar kira oladi
            if (!req.session?.admin && req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
                return res.status(403).json({ success: false, message: "Kritik xato: Ruxsat etilmagan kirish!" });
            }

            // 2. PRIVILEGIYANI OSHIRISHDAN HIMOYA: Super admin huquqini berishni taqiqlash
            if (req.body.role === 'super_admin' && req.user?.role !== 'super_admin') {
                return res.status(403).json({ success: false, message: "Kritik xato: Super Admin huquqini o'zlashtirish taqiqlangan!" });
            }

            const User = require('./models/User');
            let userId = null;
            const match = req.url.match(/([a-fA-F0-9]{24})/);
            if (match) userId = match[1];

            let user = userId ? await User.findById(userId) : await User.findOne({ $or: [{username: req.body.username}, {email: req.body.email}] });
            if (!user) return res.status(404).json({ success: false, message: "Foydalanuvchi topilmadi" });

            const { name, username, email, phone, location, score, cyberLevel, role } = req.body;
            if (name !== undefined) user.name = name;
            if (username !== undefined) user.username = username;
            if (email !== undefined) user.email = email;
            if (phone !== undefined) user.phone = phone;
            if (location !== undefined) user.location = location;
            if (role !== undefined && req.user?.role === 'super_admin') user.role = role;
            if (score !== undefined && score !== '') user.score = Number(score);
            if (cyberLevel !== undefined && cyberLevel !== '') user.level = Number(cyberLevel);
            
            await user.save();
            return res.json({ success: true, message: "Ma'lumotlar xavfsiz saqlandi!" });
        } catch (err) {
            return res.status(500).json({ success: false, message: "Server xatosi: " + err.message });
        }
    }
    next();
});
// --- END ADMIN USER EDIT INTERCEPTOR ---
`);

fs.writeFileSync('server.js', code, 'utf8');
console.log("✅ 1. Admin avtorizatsiyasi va huquq o'zlashtirish himoyasi o'rnatildi!");
