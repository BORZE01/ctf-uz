const fs = require('fs');
const path = require('path');

const battlesRoutePath = path.join(__dirname, 'routes', 'battles.js');
if (fs.existsSync(battlesRoutePath)) {
    let code = fs.readFileSync(battlesRoutePath, 'utf8');
    
    // Obyekt ichidan funksiyani ajratib oluvchi xavfsiz import
    const robustImport = `
const authModule = require('../middleware/auth');
const auth = typeof authModule === 'function' ? authModule : (authModule.auth || authModule.verifyToken || Object.values(authModule).find(v => typeof v === 'function'));
`;
    
    // Agar umuman import qilinmagan bo'lsa, router dan keyin qo'shamiz
    if (!code.includes("require('../middleware/auth')") && !code.includes('require("../middleware/auth")')) {
        code = code.replace(/(const\s+router\s*=\s*express\.Router\(\);)/, "$1\n" + robustImport.trim());
    } else {
        // Agar xato usulda import qilingan bo'lsa, uni to'g'risiga almashtiramiz
        code = code.replace(/const\s+auth\s*=\s*require\(['"]\.\.\/middleware\/auth['"]\);/g, robustImport.trim());
    }
    
    fs.writeFileSync(battlesRoutePath, code, 'utf8');
    console.log("✅ routes/battles.js fayliga 'auth' xavfsiz tarzda ulandi!");
}
