const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'routes', 'battles.js');
if (fs.existsSync(filePath)) {
    let code = fs.readFileSync(filePath, 'utf8');
    
    // Bittalik qo'shtirnoqni ikkitalikka almashtiramiz
    code = code.replace(/message:\s*'Parallel so'rov/g, 'message: "Parallel so\'rov');
    
    fs.writeFileSync(filePath, code, 'utf8');
    console.log("✅ battles.js dagi 'so\'rov' so'zi bilan bog'liq sintaksis xatosi tuzatildi!");
}
