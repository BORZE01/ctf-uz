const fs = require('fs');
const path = require('path');

const challengeRoutePath = path.join(__dirname, 'routes', 'challenges.js');
if (fs.existsSync(challengeRoutePath)) {
    let code = fs.readFileSync(challengeRoutePath, 'utf8');
    
    // Obyekt ichidan funksiyani ajratib (destructure qilib) oluvchi universal va xavfsiz import
    const robustImport = `
const authModule = require('../middleware/auth');
const auth = typeof authModule === 'function' ? authModule : (authModule.auth || authModule.verifyToken || Object.values(authModule).find(v => typeof v === 'function'));
`;
    
    // Eski xato importni yangisiga almashtiramiz
    code = code.replace(/const\s+auth\s*=\s*require\('\.\.\/middleware\/auth'\);/g, robustImport.trim());
    
    fs.writeFileSync(challengeRoutePath, code, 'utf8');
    console.log("✅ 'auth' middleware xatosi tuzatildi: Obyekt ichidan to'g'ri funksiya ajratib olindi.");
}
