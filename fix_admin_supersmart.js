const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

// Eski ishlamagan interceptorlarni tozalaymiz
code = code.replace(/\/\/ --- ADMIN USER EDIT INTERCEPTOR ---[\s\S]*?\/\/ --- END ADMIN USER EDIT INTERCEPTOR ---/g, '');

const interceptor = `
// --- ADMIN USER EDIT INTERCEPTOR ---
app.use(async (req, res, next) => {
    // Agar manzil /api/admin/users bilan boshlansa va yozish so'rovi bo'lsa
    if (req.url.includes('/api/admin/users') && ['PUT', 'POST', 'PATCH'].includes(req.method)) {
        try {
            const User = require('./models/User');
            
            // 1. URL ichidan ID ni qidiramiz
            let userId = null;
            const match = req.url.match(/([a-fA-F0-9]{24})/);
            if (match) userId = match[1];

            // 2. Foydalanuvchini qidiramiz (ID orqali, u yo'q bo'lsa Username yoki Email orqali)
            let user = null;
            if (userId) {
                user = await User.findById(userId);
            } else if (req.body.username) {
                user = await User.findOne({ username: req.body.username });
            } else if (req.body.email) {
                user = await User.findOne({ email: req.body.email });
            }

            if (!user) {
                return res.status(404).json({ success: false, message: "Foydalanuvchi topilmadi (ID tushib qolgan)" });
            }

            // 3. Agar parol o'zgarayotgan bo'lsa
            if (req.url.includes('password') || req.body.password) {
                const bcrypt = require('bcryptjs');
                if (!req.body.password || req.body.password.length < 6) {
                    return res.status(400).json({ success: false, message: "Parol kamida 6 ta belgi bo'lishi kerak" });
                }
                user.password = await bcrypt.hash(req.body.password, 12);
                await user.save();
                return res.json({ success: true, message: "Parol muvaffaqiyatli yangilandi!" });
            }

            // 4. Aks holda, oddiy ma'lumotlarni yangilaymiz
            const { name, username, email, phone, location, score, level } = req.body;
            if (name !== undefined) user.name = name;
            if (username !== undefined) user.username = username;
            if (email !== undefined) user.email = email;
            if (phone !== undefined) user.phone = phone;
            if (location !== undefined) user.location = location;
            if (score !== undefined) user.score = score;
            if (level !== undefined) user.level = level;
            
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

// Interceptorni to'g'ri joyga o'rnatamiz
if (code.includes("app.use('/api/")) {
    code = code.replace(/(app\.use\(['"]\/api\/)/, interceptor + '\n$1');
} else {
    const lastAppUse = code.lastIndexOf('app.use(');
    if (lastAppUse !== -1) {
        code = code.substring(0, lastAppUse) + interceptor + '\n' + code.substring(lastAppUse);
    }
}

fs.writeFileSync('server.js', code, 'utf8');
console.log("✅ Super-smart Interceptor o'rnatildi!");
