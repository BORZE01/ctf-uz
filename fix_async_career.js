const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'routes', 'career.js');
if (fs.existsSync(filePath)) {
    let code = fs.readFileSync(filePath, 'utf8');

    // "async" so'zi tushib qolgan (req, res) funksiyalarini topib to'g'rilash
    code = code.replace(/router\.(get|post|put|delete|patch)\(([^,]+),\s*(requireAuth,\s*)?\(\s*req\s*,\s*res\s*\)\s*=>/g, (match, method, routePath, reqAuth) => {
        return `router.${method}(${routePath}, ${reqAuth || ''}async (req, res) =>`;
    });

    fs.writeFileSync(filePath, code, 'utf8');
    console.log("✅ routes/career.js dagi yetishmayotgan 'async' kalit so'zi qo'shildi!");
}
