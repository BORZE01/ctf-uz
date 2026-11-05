const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
    console.error("❌ 'public' papkasi topilmadi!");
    process.exit(1);
}

const files = fs.readdirSync(publicDir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    const filePath = path.join(publicDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Biz qo'shgan kod blokini qidirib topish va o'chirish
    const regex = /<!-- AI WIDGET BOSHLANISHI -->[\s\S]*?<!-- AI WIDGET TUGASHI -->\n?/g;
    
    if (content.match(regex)) {
        content = content.replace(regex, '');
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ ${file} : Yangi qo'shilgan ortiqcha AI widget tozalandi!`);
    } else {
        console.log(`ℹ️ ${file} : Toza.`);
    }
});
