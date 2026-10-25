const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const questionsByLesson = {
    1: [{ q: "Kiberxavfsizlik nimani himoya qiladi?", a: "Qurilma, hisob, ma'lumot va xizmatlarni" }],
    2: [{ q: "CIA nimani anglatadi?", a: "Maxfiylik, yaxlitlik, mavjudlik" }],
    3: [{ q: "Himoya qiluvchi jamoa?", a: "Blue Team" }],
    4: [{ q: "Ochiq sayt ruxsatimi?", a: "Yo'q" }],
    5: [{ q: "Himoya qilinadigan narsa?", a: "Aktiv" }],
    6: [{ q: "Zaiflikdan foydalanish usuli?", a: "Eksploit" }],
    7: [{ q: "Risk jihatlari?", a: "Ehtimol va ta'sir" }],
    8: [{ q: "Faqat topishmi?", a: "Yo'q" }],
    9: [{ q: "Ishonchdan foydalanish?", a: "Ijtimoiy muhandislik" }],
    10: [{ q: "Zararli dasturlar nima?", a: "Malware" }],
    11: [{ q: "Qo'shimcha tasdiq qisqartmasi?", a: "MFA" }],
    12: [{ q: "Shifrlash protokoli?", a: "HTTPS" }],
    13: [{ q: "Boshqaruvchi qatlam?", a: "OT" }],
    14: [{ q: "Vakolat tamoyili?", a: "Eng kam huquq tamoyili" }],
    15: [{ q: "Dastur nusxasi?", a: "Jarayon" }],
    16: [{ q: "Hodisa yozuvi?", a: "Log" }],
    17: [{ q: "IP moslashtiruvchi?", a: "DNS" }],
    18: [{ q: "Qanday himoya?", a: "qatlamli himoya" }],
    19: [{ q: "Hujummi?", a: "Yo'q" }],
    20: [{ q: "Audit doirasi?", a: "belgilangan, ruxsatli va xavfsiz doirani" }]
};

const MONGO_URI = "mongodb+srv://ctfuz_admin:AKKSAVDON137@ctf-uz-cluster.vtjol3t.mongodb.net/ctf-uz?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI).then(async () => {
    console.log("🚀 'NTFK 1' yangi o'quv yo'lini yaratish boshlandi...");
    const db = mongoose.connection.db;

    const mdPath = path.join(__dirname, 'CTF-UZ_Kiberxavfsizlik_1-oy_Kirish_yoli.md');
    if (!fs.existsSync(mdPath)) { console.log("❌ MD fayl topilmadi!"); process.exit(1); }
    const mdRaw = fs.readFileSync(mdPath, 'utf-8');
    
    const parts = mdRaw.split(/\n(?=## \d+-MODUL)/i);
    const courseIntroMd = parts[0].trim();
    const moduleBlocks = parts.slice(1);

    // KURS UCHUN UNIKAL SLUG VA ID
    const pathId = new mongoose.Types.ObjectId();
    const pathSlug = `ntfk-1-path-${Date.now().toString().slice(-5)}`; // Mutlaqo yangi manzil
    let allModuleSlugs = [];

    let globalLessonCounter = 1;

    for (let i = 0; i < moduleBlocks.length; i++) {
        const modBlock = moduleBlocks[i];
        const lesSplits = modBlock.split(/\n(?=### \d+-dars)/i);
        const modTitle = lesSplits[0].split('\n')[0].replace(/^##\s*/, '').trim();
        
        const modId = new mongoose.Types.ObjectId();
        const modSlug = `${pathSlug}-m${i+1}`;
        allModuleSlugs.push(modSlug);

        let insertedLesIds = [];
        
        for (let j = 1; j < lesSplits.length; j++) {
            const lesBody = lesSplits[j].trim();
            const lesTitle = lesBody.split('\n')[0].replace(/^###\s*/, '').trim();
            
            const lesId = new mongoose.Types.ObjectId();
            const lesSlug = `${modSlug}-l${globalLessonCounter}`;
            
            // Darsni yozish (Backend kutinganidek moduleSlug orqali bog'laymiz)
            await db.collection('lessons').insertOne({
                _id: lesId,
                title: lesTitle,
                slug: lesSlug,
                moduleSlug: modSlug, // Eng muhim joyi!
                moduleId: modId,
                pathId: pathId,
                content: `### ${lesTitle}\n\n${lesBody.split('\n').slice(1).join('\n').trim()}`,
                order: globalLessonCounter,
                xpReward: 50,
                status: "published", isPublished: true, published: true, active: true, visibility: "public"
            });
            insertedLesIds.push(lesId);

            // Savolni yozish
            const qList = questionsByLesson[globalLessonCounter] || [];
            if (qList.length > 0) {
                const q = qList[0];
                await db.collection('questions').insertOne({
                    lessonId: lesId,
                    prompt: q.q,
                    options: [q.a, "Boshqa noto'g'ri javob", "Uchinchi variant", "To'rtinchi variant"],
                    answers: [q.a],
                    correctAnswer: q.a,
                    points: 20,
                    type: "flag"
                });
            }
            globalLessonCounter++;
        }

        // Modulni yozish
        await db.collection('modules').insertOne({
            _id: modId,
            title: modTitle,
            slug: modSlug,
            pathSlug: pathSlug, // Eng muhim joyi!
            pathId: pathId,
            order: i + 1,
            lessons: insertedLesIds, 
            totalLessons: insertedLesIds.length, 
            status: "published", isPublished: true, published: true, active: true, visibility: "public"
        });
    }

    // Kursni yozish (LearningPath)
    await db.collection('learningpaths').insertOne({
        _id: pathId,
        title: "NTFK 1", // Yangi nom
        slug: pathSlug,
        description: "Boshlang‘ich daraja • 5 modul • 20 dars • nazariya + xavfsiz amaliyot.",
        overview: courseIntroMd,
        difficulty: "BEGINNER",
        order: 1, // Saytda birinchi bo'lib chiqishi uchun
        moduleSlugs: allModuleSlugs, // Tizimingiz darslarni shu arraydan qidiradi
        totalModules: 5,
        totalLessons: 20,
        status: "published", isPublished: true, published: true, active: true, visibility: "public"
    });

    console.log(`✅ AJOYIB! Tizimga begona va mutlaqo toza "NTFK 1" o'quv yo'li 5 ta modul va 20 ta dars bilan kiritildi!`);
    process.exit(0);
});
