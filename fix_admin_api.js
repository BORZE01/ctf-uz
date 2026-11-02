const fs = require('fs');
let code = fs.readFileSync('routes/admin.js', 'utf8');

// Проверяем, есть ли уже маршрут PUT /users/:id
if (!code.includes("router.put('/users/:id'")) {
    const updateApi = `
// Обновление пользователя из админ-панели
router.put('/users/:id', async (req, res) => {
    try {
        const User = require('../models/User');
        const { name, username, email, phone, location, score, level } = req.body;
        
        const user = await User.findByIdAndUpdate(req.params.id, {
            name, username, email, phone, location, score, level
        }, { new: true });
        
        if (!user) return res.status(404).json({ success: false, message: 'Foydalanuvchi topilmadi' });
        res.json({ success: true, message: 'Foydalanuvchi ma\\'lumotlari yangilandi' });
    } catch (error) {
        console.error('Update user xatosi:', error);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});\n`;
    
    // Вставляем перед экспортом модуля
    code = code.replace('module.exports = router;', updateApi + '\nmodule.exports = router;');
    fs.writeFileSync('routes/admin.js', code, 'utf8');
    console.log('✅ API для обновления пользователей добавлено в routes/admin.js!');
} else {
    console.log('⏭ API уже существует.');
}
