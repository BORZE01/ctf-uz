const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'routes', 'battles.js');
if (fs.existsSync(filePath)) {
    let code = fs.readFileSync(filePath, 'utf8');
    
    // Noto'g'ri so'zidagi xatoni tuzatamiz
    code = code.replace(/message:\s*'Noto'g'ri flag'/g, 'message: "Noto\'g\'ri flag"');
    
    fs.writeFileSync(filePath, code, 'utf8');
    console.log("✅ battles.js dagi 'Noto'g'ri' so'zi bilan bog'liq xato tuzatildi!");
}
