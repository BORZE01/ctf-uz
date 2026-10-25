const fs = require('fs');
const path = require('path');
const serverPath = path.join(__dirname, 'server.js');
if (fs.existsSync(serverPath)) {
    let content = fs.readFileSync(serverPath, 'utf8');
    content = content.replace(/await seedDatabase\(\);/g, '// await seedDatabase();');
    content = content.replace(/if\s*\(seedLearningPathsSafe\)\s*await\s*seedLearningPathsSafe\(\);/g, '// if (seedLearningPathsSafe) await seedLearningPathsSafe();');
    fs.writeFileSync(serverPath, content, 'utf8');
    console.log("✅ BAŞARILI: Auto-seeder server.js dosyasında kalıcı olarak devre dışı bırakıldı!");
} else {
    console.log("❌ HATA: server.js bulunamadı.");
}
