const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'routes', 'skills.js');
if (fs.existsSync(filePath)) {
    let code = fs.readFileSync(filePath, 'utf8');
    
    // (req, res) => strelkali funksiyalarni async qilish
    code = code.replace(/,\s*\(\s*req\s*,\s*res\s*\)\s*=>/g, ', async (req, res) =>');
    
    // Auth middleware bilan yozilgan bo'lsa
    code = code.replace(/,\s*auth\s*,\s*\(\s*req\s*,\s*res\s*\)\s*=>/g, ', auth, async (req, res) =>');
    
    // Oddiy function(req, res) formatida yozilgan bo'lsa
    code = code.replace(/,\s*function\s*\(\s*req\s*,\s*res\s*\)\s*\{/g, ', async function(req, res) {');
    
    // Tasodifan ikki marta yozilib qolgan 'async async' larni tozalash
    code = code.replace(/async\s+async/g, 'async');

    fs.writeFileSync(filePath, code, 'utf8');
    console.log("✅ routes/skills.js faylidagi async/await xatosi to'g'rilandi!");
} else {
    console.log("⚠️ routes/skills.js fayli topilmadi.");
}
