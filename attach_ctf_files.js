const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Challenge = require('./models/Challenge');
require('dotenv').config();

const SOURCE_DIR = path.join(require('os').homedir(), 'Downloads', 'ctf_objects');
const DEST_DIR = path.join(__dirname, 'public', 'uploads', 'challenges');

// Agar uploads/challenges papkasi yo'q bo'lsa yaratamiz
if (!fs.existsSync(DEST_DIR)) {
    fs.mkdirSync(DEST_DIR, { recursive: true });
}

async function attachFiles() {
    // MongoDB ga ulanish (Sizning Render bazangiz)
    const ATLAS_URI = process.env.MONGO_URI || "mongodb+srv://ctfuz_admin:AKKSAVDON137@ctf-uz-cluster.vtjol3t.mongodb.net/ctf-uz?retryWrites=true&w=majority";
    await mongoose.connect(ATLAS_URI);
    console.log("🔗 MongoDB ga ulandi. Fayllar biriktirilmoqda...");

    // Kompyuterdagi fayllarni ro'yxatini olamiz
    if (!fs.existsSync(SOURCE_DIR)) {
        console.error(`❌ XATOLIK: ${SOURCE_DIR} papkasi topilmadi!`);
        process.exit(1);
    }
    const files = fs.readdirSync(SOURCE_DIR).filter(f => fs.lstatSync(path.join(SOURCE_DIR, f)).isFile());
    console.log(`📂 Jami ${files.length} ta fayl topildi.`);

    let matchedCount = 0;

    // Bazadan barcha chellenjlarni olamiz
    const challenges = await Challenge.find({});

    for (const challenge of challenges) {
        // Fayl nomlari 01_secret.txt, 48_config.env kabi.
        // Saytdagi nomlar esa "01_secret.txt" yoki "48_config.env" yoki shunchaki ichidagi so'z bo'lishi mumkin.
        // Biz chellenjning title'i yoki slugiga qarab mos faylni qidiramiz
        
        // 1. To'g'ridan-to'g'ri nom (masalan: "46_matryoshka.txt")
        let matchedFile = files.find(f => f.toLowerCase() === challenge.title.toLowerCase());
        
        // 2. Agar topilmasa, chellenj sarlavhasi fayl nomining ichida qisman qatnashganini tekshiramiz
        if (!matchedFile) {
            matchedFile = files.find(f => {
                // "01_secret.txt" dan "01_secret" ni ajratish
                const noExt = f.replace(/\.[^/.]+$/, "").toLowerCase(); 
                // "01_secret" dan "secret" ni ajratish
                const wordOnly = noExt.replace(/^\d+_/, ""); 
                
                const t = challenge.title.toLowerCase();
                return t.includes(f.toLowerCase()) || t.includes(noExt) || t.includes(wordOnly);
            });
        }

        if (matchedFile) {
            const sourcePath = path.join(SOURCE_DIR, matchedFile);
            
            // Vaqt yorlig'i qo'shilgan takrorlanmas nom bilan server papkasiga nusxalash
            const uniqueFileName = `${Date.now()}_${matchedFile}`;
            const destPath = path.join(DEST_DIR, uniqueFileName);
            
            fs.copyFileSync(sourcePath, destPath);

            // Mongoose orqali bazani yangilash
            const fileUrl = `/uploads/challenges/${uniqueFileName}`;
            challenge.file = fileUrl;
            challenge.fileName = matchedFile;
            await challenge.save();

            console.log(`✅ ULASHDILDI: "${challenge.title}" <==> ${matchedFile}`);
            matchedCount++;
            
            // Xavfsizlik uchun qidiruvdan olib tashlaymiz (bitta fayl ikkita joyga ketmasligi uchun)
            files.splice(files.indexOf(matchedFile), 1); 
        }
    }

    console.log(`\n🎉 BAZA YANGILANDI! Jami ${matchedCount} ta chellenjga muvaffaqiyatli fayl biriktirildi.`);
    await mongoose.disconnect();
}

attachFiles().catch(err => {
    console.error("Xatolik yuz berdi:", err);
    process.exit(1);
});
