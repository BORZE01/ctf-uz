const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'routes', 'battles.js');
if (fs.existsSync(filePath)) {
    let code = fs.readFileSync(filePath, 'utf8');
    
    // Boshlanishi va oxirini bir xil (ikkitalik) qo'shtirnoqqa to'g'rilaymiz
    code = code.replace(/"Parallel so'rov yoki allaqachon yechilgan'/g, '"Parallel so\'rov yoki allaqachon yechilgan"');
    
    fs.writeFileSync(filePath, code, 'utf8');
    console.log("✅ battles.js dagi qo'shtirnoqlar xatosi to'liq tuzatildi!");
}
