const fs = require('fs');
const path = require('path');

console.log("🛠️ 1-Bosqich: Arxitektura va Fake Userlarni tozalash...");

// 1. Server.js dagi limitlarni to'g'rilash va Fake Userlarni o'chirish
const serverPath = path.join(__dirname, 'server.js');
if (fs.existsSync(serverPath)) {
    let serverCode = fs.readFileSync(serverPath, 'utf8');

    // 50MB limitlarni 2MB ga tushirish (xavfsizlik uchun)
    serverCode = serverCode.replace(/express\.json\(\{ limit: '50mb' \}\)/g, "express.json({ limit: '2mb' })");
    serverCode = serverCode.replace(/express\.urlencoded\(\{ limit: '50mb', extended: true \}\)/g, "express.urlencoded({ limit: '2mb', extended: true })");

    // Fake user chaqiriqlarini butunlay o'chirib tashlash
    serverCode = serverCode.replace(/const \{ seedFakeUsers, startLiveUpdates \} = require\('\.\/utils\/fakeUsers'\);\n?/g, '');
    serverCode = serverCode.replace(/seedFakeUsers\(.*?\);?\n?/g, '');
    serverCode = serverCode.replace(/startLiveUpdates\(.*?\);?\n?/g, '');

    fs.writeFileSync(serverPath, serverCode, 'utf8');
    console.log("✅ Server.js: Limitlar 2MB ga tushirildi va Fake Userlar o'chirildi.");
}

// 2. Bazadan barcha mavjud 'fake' rolli foydalanuvchilarni tozalash scriptini yaratish
const cleanFakeUsersCode = `
const mongoose = require('mongoose');
const uri = 'mongodb+srv://ctfuz_admin:AKKSAVDON137@ctf-uz-cluster.vtjol3t.mongodb.net/ctf-uz?retryWrites=true&w=majority';

mongoose.connect(uri).then(async () => {
    console.log("⏳ Bazaga ulanilmoqda...");
    const UserSchema = new mongoose.Schema({}, { strict: false, collection: 'users' });
    const User = mongoose.models.User || mongoose.model('User', UserSchema);
    
    const result = await User.deleteMany({ role: 'fake' });
    console.log(\`✅ \${result.deletedCount} ta Fake User bazadan butunlay o'chirib tashlandi!\`);
    process.exit(0);
}).catch(err => {
    console.error("Xato:", err);
    process.exit(1);
});
`;
fs.writeFileSync(path.join(__dirname, 'remove_fakes.js'), cleanFakeUsersCode.trim());
console.log("✅ Bazani tozalash skripti (remove_fakes.js) tayyorlandi.");
