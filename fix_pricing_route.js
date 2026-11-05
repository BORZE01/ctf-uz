const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'server.js');
let code = fs.readFileSync(serverPath, 'utf8');

// Eski (ishlamay qolgan) ulanish yozuvlarini tozalaymiz
code = code.replace(/const premiumRoute.*?\n/g, '');
code = code.replace(/app\.use\('\/',\s*premiumRoute\);?\n?/g, '');

// Ulash uchun tayyor toza kod
const premiumInject = `const premiumRoute = require('./routes/premium');\napp.use('/', premiumRoute);\n`;

// Eng xavfsiz joy: mavjud users marshruti chaqirilgan joyni topib, o'sha yerga qo'shamiz
if (code.includes("require('./routes/users')")) {
    code = code.replace(/(const\s+[a-zA-Z0-9_]+(?:Route|Router)?\s*=\s*require\('\.\/routes\/users'\);?)/, "$1\n" + premiumInject);
} 
// Yoki challenges marshruti yoniga
else if (code.includes("require('./routes/challenges')")) {
    code = code.replace(/(const\s+[a-zA-Z0-9_]+(?:Route|Router)?\s*=\s*require\('\.\/routes\/challenges'\);?)/, "$1\n" + premiumInject);
}
// Hech qaysi topilmasa, server ishga tushishidan darhol oldinga (fallback)
else {
    code = code.replace(/(app\.listen)/, premiumInject + "\n$1");
}

fs.writeFileSync(serverPath, code, 'utf8');
console.log("✅ Premium marshruti (pricing) server.js fayliga 100% to'g'ri ulandi!");
