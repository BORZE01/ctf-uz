const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'routes', 'admin.js');

let code = fs.readFileSync(filePath, 'utf8');

const apiCode = `
// --- ADMIN USER EDIT API ---
router.put('/users/:id', async (req, res) => {
    try {
        const User = require('../models/User');
        const { name, username, email, phone, location, score, level } = req.body;
        const user = await User.findByIdAndUpdate(req.params.id, {
            $set: { name, username, email, phone, location, score, level }
        }, { new: true });
        if (!user) return res.status(404).json({ success: false, message: 'Foydalanuvchi topilmadi' });
        res.json({ success: true, message: 'Ma\\'lumotlar muvaffaqiyatli saqlandi' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});

router.post('/users/:id', async (req, res) => {
    try {
        const User = require('../models/User');
        const { name, username, email, phone, location, score, level } = req.body;
        const user = await User.findByIdAndUpdate(req.params.id, {
            $set: { name, username, email, phone, location, score, level }
        }, { new: true });
        if (!user) return res.status(404).json({ success: false, message: 'Foydalanuvchi topilmadi' });
        res.json({ success: true, message: 'Ma\\'lumotlar muvaffaqiyatli saqlandi' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});

router.put('/users/:id/password', async (req, res) => {
    try {
        const User = require('../models/User');
        const bcrypt = require('bcryptjs');
        if(!req.body.password || req.body.password.length < 6) {
            return res.status(400).json({ success: false, message: 'Parol kamida 6 ta belgidan iborat bolishi kerak' });
        }
        const hash = await bcrypt.hash(req.body.password, 12);
        await User.findByIdAndUpdate(req.params.id, { password: hash });
        res.json({ success: true, message: 'Parol muvaffaqiyatli yangilandi' });
    } catch(err) {
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});
// --- END ADMIN USER EDIT API ---
`;

// Eski kodlarni tozalash (agar bo'lsa) va yangisini qo'shish
code = code.replace(/\/\/ --- ADMIN USER EDIT API ---[\s\S]*?\/\/ --- END ADMIN USER EDIT API ---/g, '');
code = code.replace('module.exports = router;', apiCode + '\nmodule.exports = router;');

fs.writeFileSync(filePath, code, 'utf8');
console.log('✅ Admin API (Foydalanuvchini tahrirlash) muvaffaqiyatli qoshildi!');
