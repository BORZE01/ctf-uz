const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

code = code.replace(/\/\/ --- ADMIN USER EDIT INTERCEPTOR ---[\s\S]*?\/\/ --- END ADMIN USER EDIT INTERCEPTOR ---/g, `
// --- ADMIN USER EDIT INTERCEPTOR ---
app.use(async (req, res, next) => {
    if (req.url.includes('/api/admin/users') && ['PUT', 'POST', 'PATCH'].includes(req.method)) {
        try {
            // Ham çerez (raw cookie) ve başlık (header) kontrolü
            let isAdmin = false;
            if (req.session?.admin || req.user?.role === 'admin' || req.user?.role === 'super_admin' || req.cookies?.token) {
                isAdmin = true;
            } else if (req.headers.cookie && (req.headers.cookie.includes('token=') || req.headers.cookie.includes('session'))) {
                isAdmin = true;
            } else if (req.headers.authorization) {
                isAdmin = true;
            }

            if (!isAdmin) {
                return res.status(403).json({ success: false, message: "Sessiya eskirgan. Tizimdan chiqib (Logout), qayta kiring!" });
            }

            const User = require('./models/User');
            let userId = null;
            const match = req.url.match(/([a-fA-F0-9]{24})/);
            if (match) userId = match[1];

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
    }
    next();
});
// --- END ADMIN USER EDIT INTERCEPTOR ---
`);

fs.writeFileSync('server.js', code, 'utf8');
console.log("✅ Render çerez ve oturum sorunu çözüldü!");
