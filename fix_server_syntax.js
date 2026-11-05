const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'server.js');
if (fs.existsSync(serverPath)) {
    let code = fs.readFileSync(serverPath, 'utf8');
    
    // 1. Dangling "await" xatosini olib tashlash
    code = code.replace(/await\s+\}\s*catch/g, '} catch');
    
    // 2. Ichida hech narsa qolmagan bo'sh try-catch bloklarini butunlay tozalash
    code = code.replace(/try\s*\{\s*\}\s*catch\s*\([^)]*\)\s*\{[^}]*\}/g, '');
    
    fs.writeFileSync(serverPath, code, 'utf8');
    console.log("✅ server.js faylidagi qoldiq 'await' sintaksis xatosi tozalandi!");
}
