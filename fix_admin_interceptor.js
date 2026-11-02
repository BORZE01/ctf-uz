const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

const interceptor = `
// --- ADMIN USER EDIT INTERCEPTOR ---
app.use(async (req, res, next) => {
    if (['PUT', 'POST', 'PATCH'].includes(req.method)) {
        // Frontend qaysi URL ga yuborishidan qatiy nazar ushlab qoladi
        const matchUpdate = req.url.match(/^\\/api\\/(?:admin\\/)?users?\\/([a-fA-F0-9]{24})\\/?(?:\\?.*)?$/);
        const matchPassword = req.url.match(/^\\/api\\/(?:admin\\/)?users?\\/([a-fA-F0-9]{24})\\/password\\/?(?:\\?.*)?$/);
        
        if (matchUpdate || matchPassword) {
            // Admin huquqini tekshirish
            if (!req.session || !req.session.user || !['admin', 'super_admin'].includes(req.session.user.role)) {
                return res.status(403).json({ success: false, message: 'Ruxsat etilmagan' });
            }

            try {
                const User = require('./models/User');
                const userId = matchUpdate ? matchUpdate[1] : matchPassword[1];

                // Parolni yangilash qismi
                if (matchPassword) {
                    const bcrypt = require('bcryptjs');
                    if (!req.body.password || req.body.password.length < 6) {
                        return res.status(400).json({ success: false, message: 'Parol kamida 6 ta belgidan iborat bolishi kerak' });
                    }
                    const hash = await bcrypt.hash(req.body.password, 12);
                    await User.findByIdAndUpdate(userId, { password: hash });
                    return res.json({ success: true, message: 'Parol muvaffaqiyatli yangilandi!' });
                }

                // Ma'lumotlarni yangilash qismi
                if (matchUpdate) {
                    const { name, username, email, phone, location, score, level } = req.body;
                    const updateData = {};
                    if (name !== undefined) updateData.name = name;
                    if (username !== undefined) updateData.username = username;
                    if (email !== undefined) updateData.email = email;
                    if (phone !== undefined) updateData.phone = phone;
                    if (location !== undefined) updateData.location = location;
                    if (score !== undefined) updateData.score = score;
                    if (level !== undefined) updateData.level = level;

                    await User.findByIdAndUpdate(userId, { $set: updateData });
                    return res.json({ success: true, message: 'Malumotlar muvaffaqiyatli saqlandi!' });
                }
            } catch (err) {
                return res.status(500).json({ success: false, message: 'Server xatosi: ' + err.message });
            }
        }
    }
    next();
});
// --- END ADMIN USER EDIT INTERCEPTOR ---
`;

if (!code.includes('ADMIN USER EDIT INTERCEPTOR')) {
    // API marshrutlaridan oldin ushlab qoluvchini joylashtiramiz
    code = code.replace(/(app\.use\(['"\`]\/api\/)/, interceptor + '\n$1');
    fs.writeFileSync('server.js', code, 'utf8');
    console.log('✅ Server.js ga global API interceptor muvaffaqiyatli qoshildi!');
} else {
    console.log('✅ Interceptor allaqachon mavjud.');
}
