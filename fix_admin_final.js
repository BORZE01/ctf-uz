const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'routes', 'admin.js');

if (fs.existsSync(filePath)) {
    let code = fs.readFileSync(filePath, 'utf8');

    // Eski eklemeleri temizle (çakışmayı önlemek için)
    code = code.replace(/\/\/ --- ADMIN USER EDIT ---[\s\S]*?\/\/ --- END ADMIN USER EDIT ---/g, '');

    const newRoutes = `
// --- ADMIN USER EDIT ---
const updateHandler = async (req, res) => {
    try {
        const User = require('../models/User');
        await User.findByIdAndUpdate(req.params.id, req.body);
        res.json({ success: true, message: "Ma'lumotlar muvaffaqiyatli saqlandi!" });
    } catch (e) {
        res.status(500).json({ success: false, message: "Server xatosi" });
    }
};

const passwordHandler = async (req, res) => {
    try {
        if(!req.body.password || req.body.password.length < 6) {
            return res.status(400).json({ success: false, message: "Parol kamida 6 ta belgi bo'lishi kerak" });
        }
        const User = require('../models/User');
        const bcrypt = require('bcryptjs');
        const hash = await bcrypt.hash(req.body.password, 12);
        await User.findByIdAndUpdate(req.params.id, { password: hash });
        res.json({ success: true, message: "Parol muvaffaqiyatli yangilandi!" });
    } catch (e) {
        res.status(500).json({ success: false, message: "Server xatosi" });
    }
};

// Hem tekil (user) hem çoğul (users) ve hem PUT hem POST isteklerini destekle
router.put('/users/:id', updateHandler);
router.put('/user/:id', updateHandler);
router.post('/users/:id', updateHandler);
router.post('/user/:id', updateHandler);

router.put('/users/:id/password', passwordHandler);
router.put('/user/:id/password', passwordHandler);
router.post('/users/:id/password', passwordHandler);
router.post('/user/:id/password', passwordHandler);
// --- END ADMIN USER EDIT ---
`;

    // Kodun en sonuna, export işleminden hemen önce ekle
    code = code.replace('module.exports = router;', newRoutes + '\nmodule.exports = router;');
    fs.writeFileSync(filePath, code, 'utf8');
    console.log('✅ Admin API rotaları her türlü senaryoyu kapsayacak şekilde başarıyla eklendi!');
} else {
    console.log('❌ routes/admin.js bulunamadı.');
}
