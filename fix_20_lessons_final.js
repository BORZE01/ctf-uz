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
    console.log("🔍 Darslarni tozalash va ajratish jarayoni boshlandi...");
    const db = mongoose.connection.db;

    const targetPath = await db.collection('learningpaths').findOne({ slug: "kiberxavfsizlik-1-oylik-kirish-yoli" });
    if (!targetPath) { console.log("❌ Kurs topilmadi!"); process.exit(1); }

    const modules = await db.collection('modules').find({ 
        $or: [{ pathId: targetPath._id }, { learningPath: targetPath._id }] 
    }).sort({ order: 1 }).toArray();

    const modIds = modules.map(m => m._id);

    // ESKI DARSLARNI VA ULARNING SAVOLLARINI QAT'IY TOZALASH
    const oldLessons = await db.collection('lessons').find({ 
        $or: [
            { pathId: targetPath._id }, 
            { learningPath: targetPath._id },
            { moduleId: { $in: modIds } },
            { slug: { $regex: /^path1-dars-/ } } // "path1-dars-" bilan boshlanadigan hamma narsani topish
        ] 
    }).toArray();
    const oldLesIds = oldLessons.map(l => l._id);
    
    if (oldLesIds.length > 0) {
        await db.collection('questions').deleteMany({ lessonId: { $in: oldLesIds } });
        await db.collection('lessons').deleteMany({ _id: { $in: oldLesIds } });
        console.log(`🗑️ ${oldLesIds.length} ta eski ziddiyatli dars tozalandi.`);
    }

    const mdPath = path.join(__dirname, 'CTF-UZ_Kiberxavfsizlik_1-oy_Kirish_yoli.md');
    if (!fs.existsSync(mdPath)) { console.log("❌ MD fayl topilmadi!"); process.exit(1); }
    
    const mdRaw = fs.readFileSync(mdPath, 'utf-8');
    const parts = mdRaw.split(/\n(?=##\s)/);
    const moduleBlocks = parts.slice(1);

    let lessonCounter = 1;
    let allLessonIds = [];

    for (let i = 0; i < modules.length; i++) {
        const mod = modules[i];
        const modBlock = moduleBlocks[i] || "";
        
        const lesSplits = modBlock.split(/\n(?=###\s)/);
        let insertedLesIds = [];
        
        for (let j = 1; j < lesSplits.length; j++) {
            const lesBody = lesSplits[j].trim();
            const lesTitleLine = lesBody.split('\n')[0].replace(/^###\s*/, '').trim();
            
            const newLesId = new mongoose.Types.ObjectId();
            
            // XATONING OLDINI OLUVCHI UNIKAL SLUG YARATISH
            const uniqueSlug = `path1-dars-${lessonCounter}-${Date.now()}-${Math.floor(Math.random()*1000)}`;

            const newLes = {
                _id: newLesId,
                moduleId: mod._id,
                module: mod._id,
                pathId: targetPath._id,
                learningPath: targetPath._id,
                course: targetPath._id,
                title: lesTitleLine,
                slug: uniqueSlug,
                order: j,
                content: `### ${lesTitleLine}\n\n${lesBody.split('\n').slice(1).join('\n').trim()}`,
                status: "published",
                isPublished: true,
                published: true,
                active: true,
                isActive: true,
                deleted: false,
                isDeleted: false,
                visibility: "public"
            };

            await db.collection('lessons').insertOne(newLes);
            insertedLesIds.push(newLesId);
            allLessonIds.push(newLesId);

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

        await db.collection('modules').updateOne({ _id: mod._id }, {
            $set: { lessons: insertedLesIds, totalLessons: insertedLesIds.length, lessonsCount: insertedLesIds.length }
        });
    }

    await db.collection('learningpaths').updateOne({ _id: targetPath._id }, {
        $set: { lessons: allLessonIds, totalLessons: allLessonIds.length, lessonsCount: allLessonIds.length, totalModules: modules.length, modulesCount: modules.length }
    });

    console.log(`✅ AJOYIB! Jami ${modules.length} ta modul ichiga ${allLessonIds.length} ta dars aniq ajratilib joylandi.`);
    process.exit(0);
});
