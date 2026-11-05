const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'routes', 'career.js');
if (fs.existsSync(filePath)) {
    let code = fs.readFileSync(filePath, 'utf8');
    
    // Agar requireAuth import qilinmagan bo'lsa, uni qo'shamiz
    if (!code.includes('const { requireAuth }')) {
        code = code.replace(/(const\s+router\s*=\s*express\.Router\(\);)/, "$1\nconst { requireAuth } = require('../middleware/auth');");
        fs.writeFileSync(filePath, code, 'utf8');
        console.log("✅ routes/career.js fayliga 'requireAuth' muvaffaqiyatli ulandi!");
    }
}
