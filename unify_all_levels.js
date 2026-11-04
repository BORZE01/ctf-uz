const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

console.log("🛠️ Yagona Level formulasi (1000 ball = 1 Level) o'rnatilmoqda...");

// Turli xil eski yozuvlarni topish uchun qoidalar
const replaceRegex = /Math\.floor\(\s*(currentScore|safeScore|\(score\s*\|\|\s*0\)|[a-zA-Z0-9_.]+(?:score|ball|points))\s*\/\s*\d+\s*\)(?:\s*\+\s*\d+)?/g;
const rawDivRegex = /([a-zA-Z0-9_.]+(?:score|ball|points)\s*\/\s*)(100|500|2000)/g;
const reqXpRegex = /([a-zA-Z0-9_.]*level[a-zA-Z0-9_.]*\s*\*\s*)(100|500|2000)/gi;

function processDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) return;
    const files = fs.readdirSync(dirPath);
    files.forEach(file => {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (file.endsWith('.html') || file.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let changed = false;
            
            // Xato kiritilgan barcha 100, 500, 2000 larni yagona 1000 ga to'g'rilash
            if (replaceRegex.test(content)) {
                content = content.replace(replaceRegex, 'Math.floor($1 / 1000) || 1');
                changed = true;
            }
            if (rawDivRegex.test(content)) {
                content = content.replace(rawDivRegex, '$1 1000');
                changed = true;
            }
            if (reqXpRegex.test(content)) {
                content = content.replace(reqXpRegex, '$1 1000');
                changed = true;
            }

            if (changed) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`✅ To'g'rilandi: ${fullPath.replace(__dirname, '')}`);
            }
        }
    });
}

// 1. Backend modellari, routerlar va barcha frontend public fayllarini yangilash
['models', 'routes', 'public'].forEach(folder => {
    processDirectory(path.join(__dirname, folder));
});

// 2. Jonli bazadagi ma'lumotlarni so'nggi bor qayta hisoblab chiqish
const uri = 'mongodb+srv://ctfuz_admin:AKKSAVDON137@ctf-uz-cluster.vtjol3t.mongodb.net/ctf-uz?retryWrites=true&w=majority';
mongoose.connect(uri)
  .then(async () => {
     console.log("\n⏳ Jonli bazaga ulanilmoqda...");
     const UserSchema = new mongoose.Schema({}, { strict: false, collection: 'users' });
     const User = mongoose.models.User || mongoose.model('User', UserSchema);

     const users = await User.find({});
     let count = 0;
     for (let user of users) {
         let score = user.score || user.ball || user.points || 0;
         let calculatedLevel = Math.floor(score / 1000) || 1;

         await User.updateOne(
             { _id: user._id },
             { $set: { level: calculatedLevel, cyberLevel: calculatedLevel } }
         );
         count++;
     }
     console.log(`✅ Barcha ${count} ta foydalanuvchining Level'i qaytadan 1000 lik formulada sinxronlandi!`);
     process.exit(0);
  })
  .catch(err => {
     console.error("❌ Baza xatoligi:", err.message);
     process.exit(1);
  });
