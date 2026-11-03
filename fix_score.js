const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

// Eski interceptorni tozalash
code = code.replace(/\/\/ --- ADMIN USER EDIT INTERCEPTOR ---[\s\S]*?\/\/ --- END ADMIN USER EDIT INTERCEPTOR ---/g, '');

const interceptor = `
// --- ADMIN USER EDIT INTERCEPTOR ---
app.use(async (req, res, next) => {
    if (req.url.includes('/api/admin/users') && ['PUT', 'POST', 'PATCH'].includes(req.method)) {
        try {
            const User = require('./models/User');
            let userId = null;
            const match = req.url.match(/([a-fA-F0-9]{24})/);
            if (match) userId = match[1];

            let user = null;
            if (userId) user = await User.findById(userId);
            else if (req.body.username) user = await User.findOne({ username: req.body.username });
            else if (req.body.email) user = await User.findOne({ email: req.body.email });

            if (!user) return res.status(404).json({ success: false, message: "Foydalanuvchi topilmadi" });

            if (req.url.includes('password') || req.body.password) {
                const bcrypt = require('bcryptjs');
                if (!req.body.password || req.body.password.length < 6) {
                    return res.status(400).json({ success: false, message: "Parol kamida 6 ta belgi bo'lishi kerak" });
                }
                user.password = await bcrypt.hash(req.body.password, 12);
                await user.save();
                return res.json({ success: true, message: "Parol muvaffaqiyatli yangilandi!" });
            }

            const { name, username, email, phone, location, score, ball, points, level, reyting } = req.body;
            if (name !== undefined) user.name = name;
            if (username !== undefined) user.username = username;
            if (email !== undefined) user.email = email;
            if (phone !== undefined) user.phone = phone;
            if (location !== undefined) user.location = location;
            
            // Ball va Reyting uchun aqlli moslashuv (raqamga o'tkazish bilan)
            let newScore = score !== undefined ? score : (ball !== undefined ? ball : points);
            if (newScore !== undefined) user.score = Number(newScore);
            
            let newLevel = level !== undefined ? level : reyting;
            if (newLevel !== undefined) user.level = Number(newLevel);
            
            await user.save();
            return res.json({ success: true, message: "Ma'lumotlar muvaffaqiyatli saqlandi!" });
        } catch (err) {
            return res.status(500).json({ success: false, message: "Server xatosi: " + err.message });
        }
    }
    next();
});
// --- END ADMIN USER EDIT INTERCEPTOR ---
`;

if (code.includes("app.use('/api/")) {
    code = code.replace(/(app\.use\(['"]\/api\/)/, interceptor + '\n$1');
} else {
    const lastAppUse = code.lastIndexOf('app.use(');
    if (lastAppUse !== -1) {
        code = code.substring(0, lastAppUse) + interceptor + '\n' + code.substring(lastAppUse);
    }
}

fs.writeFileSync('server.js', code, 'utf8');
console.log("✅ Super-smart Interceptor yangilandi (Ball va Level muammosi hal qilindi)!");
