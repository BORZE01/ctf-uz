const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
if (fs.existsSync(publicDir)) {
    const files = fs.readdirSync(publicDir).filter(f => f.endsWith('.html'));

    files.forEach(file => {
        const filePath = path.join(publicDir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        
        // 2-skriptimiz qo'shgan kodni qidirish va o'chirish
        const regex = /<!-- TRYHACKME AI WIDGET -->[\s\S]*?<!-- TRYHACKME AI WIDGET END -->\n?/g;
        
        if (content.match(regex)) {
            content = content.replace(regex, '');
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ ${file}: Ortiqcha AI tugmasi tozalandi!`);
        }
    });
} else {
    console.log("public papkasi topilmadi.");
}
