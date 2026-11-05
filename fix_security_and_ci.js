const fs = require('fs');
const path = require('path');

console.log("🛠️ 1-Bosqich: Xavfsizlik va CI/CD sozlamalari to'g'rilanmoqda...");

// 1. .gitignore dan package-lock.json ni olib tashlash
const gitignorePath = path.join(__dirname, '.gitignore');
if (fs.existsSync(gitignorePath)) {
    let ignoreCode = fs.readFileSync(gitignorePath, 'utf8');
    // package-lock.json qatorini o'chirib tashlaymiz
    ignoreCode = ignoreCode.replace(/^package-lock\.json\r?\n?/gm, '');
    fs.writeFileSync(gitignorePath, ignoreCode, 'utf8');
    console.log("✅ CI/CD: 'package-lock.json' ignor ro'yxatidan chiqarildi. Endi Github Actions qulamaydi.");
}

// 2. server.js da Cookie xavfsizligini ta'minlash (secure: true)
const serverPath = path.join(__dirname, 'server.js');
if (fs.existsSync(serverPath)) {
    let serverCode = fs.readFileSync(serverPath, 'utf8');
    // xavfli secure: false holatini production muhitiga moslashtirish
    serverCode = serverCode.replace(/secure:\s*false/g, "secure: process.env.NODE_ENV === 'production'");
    fs.writeFileSync(serverPath, serverCode, 'utf8');
    console.log("✅ Xavfsizlik: Session cookie 'secure' holati production muhitiga moslashtirildi.");
}
