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
    console.log("🛠️ Kusursuz Klonlama ve 20 Ders Entegrasyonu Başlıyor...");
    const db = mongoose.connection.db;

    // 1. Çalışan Referansları Al (Bu sayede UI'ın beklediği tüm gizli alanlar kopyalanır)
    const refPath = await db.collection('learningpaths').findOne({ title: { $regex: /Foundations/i } });
    if (!refPath) { console.log("❌ Foundations referansı bulunamadı!"); process.exit(1); }

    let pathKey = 'pathId';
    const refMod = await db.collection('modules').findOne({ $or: [{ pathId: refPath._id }, { learningPath: refPath._id }, { course: refPath._id }] }) || {};
    for(let k in refMod) if (refMod[k]?.toString() === refPath._id.toString()) pathKey = k;

    let modKey = 'moduleId';
    const refLes = await db.collection('lessons').findOne({ $or: [{ moduleId: refMod._id }, { module: refMod._id }] }) || {};
    for(let k in refLes) if (refLes[k]?.toString() === refMod._id?.toString()) modKey = k;

    // 2. Önceki Hatalı 1. Yolları Tamamen Temizle
    const oldPaths = await db.collection('learningpaths').find({ $or: [{ slug: { $regex: /kiberxavfsizlik-1-oylik/i } }, { title: { $regex: /Kiberxavfsizlik/i } }] }).toArray();
    for(let op of oldPaths) {
        const mods = await db.collection('modules').find({ [pathKey]: op._id }).toArray();
        const modIds = mods.map(m => m._id);
        const less = await db.collection('lessons').find({ $or: [{ pathId: op._id }, { [modKey]: { $in: modIds } }] }).toArray();
        const lessIds = less.map(l => l._id);
        
        if (lessIds.length > 0) {
            await db.collection('questions').deleteMany({ lessonId: { $in: lessIds } });
            await db.collection('lessons').deleteMany({ _id: { $in: lessIds } });
        }
        if (modIds.length > 0) await db.collection('modules').deleteMany({ _id: { $in: modIds } });
        await db.collection('learningpaths').deleteOne({ _id: op._id });
    }

    // 3. MD Dosyasını Oku ve Ayrıştır
    const mdPath = path.join(__dirname, 'CTF-UZ_Kiberxavfsizlik_1-oy_Kirish_yoli.md');
    if (!fs.existsSync(mdPath)) { console.log("❌ MD dosyası bulunamadı!"); process.exit(1); }
    const mdRaw = fs.readFileSync(mdPath, 'utf-8');
    
    const parts = mdRaw.split(/\n(?=## \d+-MODUL)/);
    const courseIntroMd = parts[0].trim();
    const moduleBlocks = parts.slice(1);

    // 4. Verileri Yeni Nesneler Olarak İnşa Et ve Ekle
    const targetPathId = new mongoose.Types.ObjectId();
    const uniqueTime = Date.now();
    
    const newPath = { 
        ...refPath, 
        _id: targetPathId, 
        title: "CTF.UZ — Kiberxavfsizlik: 1-oylik kirish yo‘li", 
        slug: `kiberxavfsizlik-1-oylik-kirish-yoli-${uniqueTime}`, 
        description: "Boshlang‘ich daraja • 5 modul • 20 dars • nazariya + xavfsiz amaliyot.", 
        overview: courseIntroMd, 
        order: 1 
    };

    let allModIds = [];
    let allLesIds = [];
    let lessonCounter = 1;

    for (let i = 0; i < moduleBlocks.length; i++) {
        const modBlock = moduleBlocks[i];
        const lesSplits = modBlock.split(/\n(?=### \d+-dars)/);
        
        const modTitleLine = lesSplits[0].split('\n')[0].replace(/^##\s*/, '').trim();
        const newModId = new mongoose.Types.ObjectId();
        
        let insertedLesIds = [];

        for (let j = 1; j < lesSplits.length; j++) {
            const lesBody = lesSplits[j].trim();
            const lesTitleLine = lesBody.split('\n')[0].replace(/^###\s*/, '').trim();
            
            const newLesId = new mongoose.Types.ObjectId();
            const newLes = { 
                ...refLes, 
                _id: newLesId, 
                [modKey]: newModId, 
                title: lesTitleLine, 
                slug: `path1-dars-${lessonCounter}-${uniqueTime}-${Math.floor(Math.random()*1000)}`, 
                order: j, 
                content: `### ${lesTitleLine}\n\n${lesBody.split('\n').slice(1).join('\n').trim()}` 
            };
            
            for(let k in refLes) if (refLes[k]?.toString() === refPath._id.toString()) newLes[k] = targetPathId;

            await db.collection('lessons').insertOne(newLes);
            insertedLesIds.push(newLesId);
            allLesIds.push(newLesId);

            const qList = questionsByLesson[lessonCounter] || [];
            if (qList.length > 0) {
                const qDocs = qList.map((q, idx) => ({
                    _id: new mongoose.Types.ObjectId(),
                    lessonId: newLesId, question: q.question, answer: q.answer,
                    order: idx + 1, xp: 20, createdAt: new Date()
                }));
                await db.collection('questions').insertMany(qDocs);
            }
            lessonCounter++;
        }

        const newMod = { 
            ...refMod, 
            _id: newModId, 
            [pathKey]: targetPathId, 
            title: modTitleLine, 
            slug: `path1-modul-${i+1}-${uniqueTime}`, 
            order: i+1 
        };
        
        if (Array.isArray(refMod.lessons)) newMod.lessons = insertedLesIds;
        newMod.totalLessons = insertedLesIds.length;
        newMod.lessonsCount = insertedLesIds.length;
        
        await db.collection('modules').insertOne(newMod);
        allModIds.push(newModId);
    }

    if (Array.isArray(refPath.modules)) newPath.modules = allModIds;
    if (Array.isArray(refPath.lessons)) newPath.lessons = allLesIds;
    newPath.totalModules = allModIds.length;
    newPath.totalLessons = allLesIds.length;
    newPath.lessonsCount = allLesIds.length;
    newPath.modulesCount = allModIds.length;
    
    await db.collection('learningpaths').insertOne(newPath);

    console.log(`✅ KUSURSUZ AKTARIM TAMAMLANDI! ${allModIds.length} modül ve ${allLesIds.length} ders eklendi.`);
    process.exit(0);
});
