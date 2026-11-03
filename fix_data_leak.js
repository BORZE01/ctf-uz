const fs = require('fs');
const targetFile = 'routes/admin.js';

if (fs.existsSync(targetFile)) {
    let code = fs.readFileSync(targetFile, 'utf8');
    
    // Barcha ma'lumot qidiruvlaridan maxfiy maydonlarni olib tashlash
    code = code.replace(/User\.find\(([^)]*)\)(?!\.select)/g, "User.find($1).select('-password -twoFactorSecret -backupCodes')");
    code = code.replace(/User\.findById\(([^)]*)\)(?!\.select)/g, "User.findById($1).select('-password -twoFactorSecret -backupCodes')");
    
    fs.writeFileSync(targetFile, code, 'utf8');
    console.log("✅ 3. Parol va maxfiy sirlar sizishi to'liq to'xtatildi!");
} else {
    console.log("⚠️ routes/admin.js fayli topilmadi, iltimos fayl manzilini tekshiring.");
}
