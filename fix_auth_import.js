const fs = require('fs');
const path = require('path');

const challengeRoutePath = path.join(__dirname, 'routes', 'challenges.js');
if (fs.existsSync(challengeRoutePath)) {
    let code = fs.readFileSync(challengeRoutePath, 'utf8');
    
    // Agar faylda auth chaqirilmagan bo'lsa, uni yuqoriga qo'shamiz
    if (!code.match(/const\s+auth\s*=\s*require/)) {
        code = code.replace(/(const\s+router\s*=\s*express\.Router\(\);)/, "$1\nconst auth = require('../middleware/auth');");
        fs.writeFileSync(challengeRoutePath, code, 'utf8');
        console.log("✅ routes/challenges.js fayliga 'auth' middleware muvaffaqiyatli ulandi!");
    } else {
        console.log("ℹ️ 'auth' allaqachon mavjud.");
    }
}
