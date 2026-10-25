const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const questionsByLesson = {
    1: [{ question: "Kiberxavfsizlik nimani himoya qiladi?", answer: "Qurilma, hisob, ma'lumot va xizmatlarni" }, { question: "Nega antivirusning o'zi yetarli emas?", answer: "qatlamli himoya kerak" }, { question: "Uchinchi bosqich nima?", answer: "tiklanish" }, { question: "Qayta tiklashga yordam beradigan nusxa?", answer: "zaxira nusxa" }, { question: "Aktivlar soni?", answer: "5" }],
    2: [{ question: "CIA nimani anglatadi?", answer: "Maxfiylik, yaxlitlik, mavjudlik" }, { question: "Ruxsatsiz o'zgartirilsa?", answer: "Yaxlitlik" }, { question: "Backup xususiyati?", answer: "Mavjudlik" }, { question: "Ruxsatli ko'rish?", answer: "Maxfiylik" }, { question: "Ochilmasa qaysi xususiyat?", answer: "Mavjudlik" }],
    3: [{ question: "Himoya qiluvchi jamoa?", answer: "Blue Team" }, { question: "Sinovchi jamoa?", answer: "Red Team" }, { question: "Oxirgi qurilmalar xavfsizligi?", answer: "Endpoint" }, { question: "Sayt xavfsizligi?", answer: "Veb xavfsizligi" }, { question: "Red Team sharti?", answer: "Aniq ruxsat, doira va qoidalar" }],
    4: [{ question: "Ochiq sayt ruxsatimi?", answer: "Yo'q" }, { question: "Chegara nima?", answer: "Scope" }, { question: "O'rganish muhiti?", answer: "laboratoriya" }, { question: "Maqsad nima?", answer: "xavfni" }, { question: "Shubha tug'ilsa?", answer: "to'xtatish" }],
    5: [{ question: "Himoya qilinadigan narsa?", answer: "Aktiv" }, { question: "Zarar yetkazuvchi narsa?", answer: "Tahdid" }, { question: "Nuqson nima?", answer: "Zaiflik" }, { question: "Hujum albatta bo'ladimi?", answer: "Yo'q" }, { question: "Ochiq qolgan sessiya?", answer: "Zaiflik" }],
    6: [{ question: "Zaiflikdan foydalanish usuli?", answer: "Eksploit" }, { question: "Muvaffaqiyatsiz urinish muhimmi?", answer: "Ha" }, { question: "Zarar yetkazish harakati?", answer: "Hujum" }, { question: "Natijadagi zarar?", answer: "Oqibat" }, { question: "Tahlilchi nimani ajratadi?", answer: "taxmin" }],
    7: [{ question: "Risk jihatlari?", answer: "Ehtimol va ta'sir" }, { question: "Yuz berish ehtimoli?", answer: "Ehtimol" }, { question: "Zarar miqdori?", answer: "Ta'sir" }, { question: "Katta ball yakuniymi?", answer: "Yo'q" }, { question: "Riskka nima beriladi?", answer: "ustuvorlik" }],
    8: [{ question: "Faqat topishmi?", answer: "Yo'q" }, { question: "Hisobotda yana nima bo'ladi?", answer: "tavsiya" }, { question: "Tuzatilgach nima qilinadi?", answer: "qayta tekshirish" }, { question: "Parol qo'shiladimi?", answer: "Yo'q" }, { question: "Kimlar bilan cheklash?", answer: "zarur foydalanuvchilar" }],
    9: [{ question: "Ishonchdan foydalanish?", answer: "Ijtimoiy muhandislik" }, { question: "Aldov hujumi?", answer: "Phishing" }, { question: "Nom yetarlimi?", answer: "Yo'q" }, { question: "Qayerdan tekshiriladi?", answer: "rasmiy kanal" }, { question: "Ro'yxat necha bandli?", answer: "7" }],
    10: [{ question: "Zararli dasturlar nima?", answer: "Malware" }, { question: "Foydali ko'ringan dastur?", answer: "Troyan" }, { question: "To'lov talab qiluvchi?", answer: "Ransomware" }, { question: "Klaviatura kuzatuvchisi?", answer: "Keylogger" }, { question: "Tarqaluvchi dastur?", answer: "Virus" }],
    11: [{ question: "Qo'shimcha tasdiq qisqartmasi?", answer: "MFA" }, { question: "Kod berish mumkinmi?", answer: "Yo'q" }, { question: "Parol dasturi?", answer: "Parol menejeri" }, { question: "Parolni nima qilish kerak?", answer: "takror ishlatmaslik" }, { question: "Nimalarni tugatish kerak?", answer: "sessiyalarni" }],
    12: [{ question: "Shifrlash protokoli?", answer: "HTTPS" }, { question: "To'liq kafolatmi?", answer: "Yo'q" }, { question: "Internetdagi ma'lumotlar?", answer: "Raqamli iz" }, { question: "Sayt manzili qismi?", answer: "domen" }, { question: "Osonlashtiruvchi hujum?", answer: "ijtimoiy muhandislik" }],
    13: [{ question: "Boshqaruvchi qatlam?", answer: "OT" }, { question: "Eng muhim qism?", answer: "Yadro" }, { question: "Oyna interfeysi?", answer: "GUI" }, { question: "Buyruq interfeysi?", answer: "CLI" }, { question: "Qurilma dasturi?", answer: "Drayverlar" }],
    14: [{ question: "Vakolat tamoyili?", answer: "Eng kam huquq tamoyili" }, { question: "Uchinchi ruxsat?", answer: "bajarish" }, { question: "Doimiy hisob?", answer: "administrator" }, { question: "Kengaytma xavfsizmi?", answer: "Yo'q" }, { question: "Boshqarish vositasi?", answer: "Ruxsatlar" }],
    15: [{ question: "Dastur nusxasi?", answer: "Jarayon" }, { question: "Nuqsonni tuzatish?", answer: "yangilanish" }, { question: "Dastur manbasi?", answer: "rasmiy" }, { question: "Zararlimi?", answer: "Yo'q" }, { question: "Nimalardan foydalanadi?", answer: "xotira" }],
    16: [{ question: "Hodisa yozuvi?", answer: "Log" }, { question: "Alohida nusxa?", answer: "Backup" }, { question: "Nimani sinash kerak?", answer: "tiklashni" }, { question: "Nima bo'lganini tushuntiradi?", answer: "Log" }, { question: "O'zgartirish mumkinmi?", answer: "Yo'q" }],
    17: [{ question: "IP moslashtiruvchi?", answer: "DNS" }, { question: "Trafik bloki?", answer: "Firewall" }, { question: "Barcha xavfni yo'q qiladimi?", answer: "Yo'q" }, { question: "Trafik yo'naltiruvchi?", answer: "Router" }, { question: "Raqamli manzil?", answer: "IP manzil" }],
    18: [{ question: "Qanday himoya?", answer: "qatlamli himoya" }, { question: "Ma'lumot xavfsizligi?", answer: "disk shifrlash" }, { question: "Aniq bilish uchun?", answer: "shaxsiy akkaunt" }, { question: "Nima belgilanadi?", answer: "ustuvorlik" }, { question: "Ro'yxat bandi?", answer: "10" }],
    19: [{ question: "Hujummi?", answer: "Yo'q" }, { question: "Nimani ajratamiz?", answer: "taxmin" }, { question: "Qayerga xabar?", answer: "rasmiy mas'ul kanaliga" }, { question: "Nima ishlatish kerak?", answer: "aniq fakt" }, { question: "Birinchi amal?", answer: "to'xtatish" }],
    20: [{ question: "Audit doirasi?", answer: "belgilangan, ruxsatli va xavfsiz doirani" }, { question: "Qo'shish mumkinmi?", answer: "Yo'q" }, { question: "Aktivlar soni?", answer: "5" }, { question: "Risklar soni?", answer: "3" }, { question: "Tugallash foizi?", answer: "80%" }]
};

const MONGO_URI = "mongodb+srv://ctfuz_admin:AKKSAVDON137@ctf-uz-cluster.vtjol3t.mongodb.net/ctf-uz?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI).then(async () => {
    console.log("🔄 Klonlash jarayoni boshlandi...");
    const db = mongoose.connection.db;

    // 1. Ishlab turgan 'Foundations' strukturasini topish
    const tPath = await db.collection('learningpaths').findOne({ title: { $regex: /Foundations/i } });
    if (!tPath) { console.log("❌ Foundations kursi topilmadi!"); process.exit(1); }

    let pathKey = 'pathId';
    const tMod = await db.collection('modules').findOne({ $or: [{ pathId: tPath._id }, { learningPath: tPath._id }, { course: tPath._id }] }) || {};
    for(let k in tMod) if (tMod[k]?.toString() === tPath._id.toString()) pathKey = k;

    let modKey = 'moduleId';
    const tLes = await db.collection('lessons').findOne({ $or: [{ moduleId: tMod._id }, { module: tMod._id }] }) || {};
    for(let k in tLes) if (tLes[k]?.toString() === tMod._id?.toString()) modKey = k;

    // 2. Mahalliy MD faylni o'qish (matnlarni olish uchun)
    const mdPath = path.join(__dirname, 'CTF-UZ_Kiberxavfsizlik_1-oy_Kirish_yoli.md');
    if (!fs.existsSync(mdPath)) { console.log("❌ MD fayl topilmadi!"); process.exit(1); }
    const mdRaw = fs.readFileSync(mdPath, 'utf-8');
    const parts = mdRaw.split(/\n(?=## \d+-MODUL\.)/);
    const courseIntroMd = parts[0].trim();
    const moduleBlocks = parts.slice(1);

    // 3. Eski xato kurslarni ildizi bilan yo'q qilish
    const oldPaths = await db.collection('learningpaths').find({ $or: [{ order: 1 }, { slug: "kiberxavfsizlik-1-oylik-kirish-yoli" }, { title: { $regex: /1-yo'l|Kiberxavfsizlik/i } }] }).toArray();
    for(let op of oldPaths) {
        await db.collection('modules').deleteMany({ [pathKey]: op._id });
        await db.collection('lessons').deleteMany({ $or: [{ pathId: op._id }, { learningPath: op._id }, { course: op._id }] });
        await db.collection('learningpaths').deleteOne({ _id: op._id });
    }

    // 4. To'liq klonlash va matnlarni almashtirish
    const targetPathId = new mongoose.Types.ObjectId();
    const newPath = { ...tPath, _id: targetPathId, title: "CTF.UZ — Kiberxavfsizlik: 1-oylik kirish yo‘li", slug: "kiberxavfsizlik-1-oylik-kirish-yoli", description: "Boshlang‘ich daraja • 5 modul • 20 dars • nazariya + xavfsiz amaliyot.", overview: courseIntroMd, order: 1, totalModules: 5, totalLessons: 20 };

    const insertedModIds = [];
    let lessonCounter = 1;

    for (let i = 0; i < moduleBlocks.length; i++) {
        const modBlock = moduleBlocks[i];
        const lesSplits = modBlock.split(/\n(?=### \d+-dars\.)/);
        const modTitleLine = lesSplits[0].split('\n')[0].replace(/^##\s*/, '').trim();

        const newModId = new mongoose.Types.ObjectId();
        const newMod = { ...tMod, _id: newModId, [pathKey]: targetPathId, title: modTitleLine, slug: `path1-modul-${i+1}`, order: i+1 };
        
        const insertedLesIds = [];
        for (let j = 1; j < lesSplits.length; j++) {
            const lesBody = lesSplits[j].trim();
            const lesTitleLine = lesBody.split('\n')[0].replace(/^###\s*/, '').trim();
            
            const newLesId = new mongoose.Types.ObjectId();
            const newLes = { ...tLes, _id: newLesId, [modKey]: newModId, title: lesTitleLine, slug: `path1-dars-${lessonCounter}`, order: lessonCounter, content: `### ${lesTitleLine}\n\n${lesBody.split('\n').slice(1).join('\n').trim()}` };
            
            for(let k in tLes) if (tLes[k]?.toString() === tPath._id.toString()) newLes[k] = targetPathId;

            await db.collection('lessons').insertOne(newLes);
            insertedLesIds.push(newLesId);

            const qList = questionsByLesson[lessonCounter] || [];
            const qDocs = qList.map((qItem, idx) => ({
                _id: new mongoose.Types.ObjectId(),
                lessonId: newLesId,
                question: qItem.question,
                answer: qItem.answer,
                order: idx + 1,
                xp: 20,
                createdAt: new Date()
            }));
            if (qDocs.length > 0) await db.collection('questions').insertMany(qDocs);

            lessonCounter++;
        }
        if (Array.isArray(tMod.lessons)) newMod.lessons = insertedLesIds;
        newMod.totalLessons = insertedLesIds.length;
        await db.collection('modules').insertOne(newMod);
        insertedModIds.push(newModId);
    }

    if (Array.isArray(tPath.modules)) newPath.modules = insertedModIds;
    await db.collection('learningpaths').insertOne(newPath);

    console.log(`✅ Klonlash 100% muvaffaqiyatli yakunlandi! Barcha modullar "Foundations" qolipida kiritildi.`);
    process.exit(0);
});
