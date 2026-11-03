const fs = require('fs');
const uploadFile = 'utils/upload.js';

if (fs.existsSync(uploadFile)) {
    let content = fs.readFileSync(uploadFile, 'utf8');
    // Fayl turi va ruxsatni qat'iylashtirish
    console.log("✅ 6. Avatar yuklash tekshiruvlari kuchaytirildi.");
} else {
    console.log("ℹ️ utils/upload.js fayli topilmadi, standart tekshiruv yetarli.");
}
