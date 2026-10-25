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
    console.log("🛠️ Auto-Seeder'ni yengish va ma'lumotlarni ustidan yozish boshlandi...");
    const db = mongoose.connection.db;

    // 1. MD faylni qat'iy mantiq bilan o'qish (bo'shliq va nuqtalarga qaramasdan)
    const mdPath = path.join(__dirname, 'CTF-UZ_Kiberxavfsizlik_1-oy_Kirish_yoli.md');
    if (!fs.existsSync(mdPath)) { console.log("❌ MD fayl topilmadi!"); process.exit(1); }
    const mdRaw = fs.readFileSync(mdPath, 'utf-8');
    const lines = mdRaw.split('\n');
    
    const modulesData = [];
    let currentModule = null;
    let currentLesson = null;

    for (let line of lines) {
        if (line.startsWith('## ') && line.toUpperCase().includes('MODUL')) {
            if (currentLesson) currentModule.lessons.push(currentLesson);
            if (currentModule) modulesData.push(currentModule);
            currentModule = { title: line.replace(/^##\s*/, '').trim(), lessons: [] };
            currentLesson = null;
        } else if (line.startsWith('### ') && line.toLowerCase().includes('dars')) {
            if (currentLesson) currentModule.lessons.push(currentLesson);
            currentLesson = { title: line.replace(/^###\s*/, '').trim(), content: line + '\n' };
        } else if (currentLesson) {
            currentLesson.content += line + '\n';
        }
    }
    if (currentLesson) currentModule.lessons.push(currentLesson);
    if (currentModule) modulesData.push(currentModule);

    // 2. Server avtomatik yaratgan aynan o'sha eski kursni topish
    const targetPath = await db.collection('learningpaths').findOne({ slug: "kiberxavfsizlik-1-oylik-kirish-yoli" });
    if (!targetPath) {
        console.log("❌ Server yaratgan eski kurs topilmadi! Iltimos, oldin Renderda 'Restart Service' bosing, u yaratgandan keyin bu skriptni ishlating.");
        process.exit(1);
    }

    // 3. Uning ichidagi barcha eski modullar va darslarni tozalab tashlash
    const existingModules = await db.collection('modules').find({ 
        $or: [{ pathId: targetPath._id }, { learningPath: targetPath._id }] 
    }).sort({ order: 1 }).toArray();
    
    const modIds = existingModules.map(m => m._id);
    const oldLessons = await db.collection('lessons').find({ 
        $or: [{ pathId: targetPath._id }, { moduleId: { $in: modIds } }] 
    }).toArray();
    const oldLesIds = oldLessons.map(l => l._id);
    
    if (oldLesIds.length > 0) {
        await db.collection('questions').deleteMany({ lessonId: { $in: oldLesIds } });
        await db.collection('lessons').deleteMany({ _id: { $in: oldLesIds } });
    }

    // 4. Eski ID larni saqlab qolgan holda ma'lumotlarni ustidan yozish
    let allModIds = [];
    let allLesIds = [];
    let globalLessonCounter = 1;
    const uniqueTime = Date.now();

    for (let i = 0; i < modulesData.length; i++) {
        const mdMod = modulesData[i];
        let modId;
        
        if (existingModules[i]) {
            modId = existingModules[i]._id;
            await db.collection('modules').updateOne({ _id: modId }, {
                $set: { title: mdMod.title, slug: `kiber-modul-${i+1}-${uniqueTime}` }
            });
        } else {
            modId = new mongoose.Types.ObjectId();
            await db.collection('modules').insertOne({
                _id: modId, pathId: targetPath._id, learningPath: targetPath._id, course: targetPath._id,
                title: mdMod.title, slug: `kiber-modul-${i+1}-${uniqueTime}`, order: i+1,
                status: "published", isPublished: true, published: true, active: true, visibility: "public"
            });
        }
        allModIds.push(modId);

        let insertedLesIds = [];
        for (let j = 0; j < mdMod.lessons.length; j++) {
            const mdLes = mdMod.lessons[j];
            const lesId = new mongoose.Types.ObjectId();
            
            const newLesson = {
                _id: lesId, moduleId: modId, module: modId, pathId: targetPath._id, learningPath: targetPath._id, course: targetPath._id,
                title: mdLes.title, slug: `kiber-dars-${globalLessonCounter}-${uniqueTime}`,
                order: j + 1, content: mdLes.content,
                status: "published", isPublished: true, published: true, active: true, visibility: "public"
            };
            await db.collection('lessons').insertOne(newLesson);
            insertedLesIds.push(lesId);
            allLesIds.push(lesId);

            const qList = questionsByLesson[globalLessonCounter] || [];
            if (qList.length > 0) {
                const qDocs = qList.map((q, idx) => ({
                    _id: new mongoose.Types.ObjectId(), lessonId: lesId,
                    question: q.question, answer: q.answer, order: idx + 1, xp: 20, createdAt: new Date()
                }));
                await db.collection('questions').insertMany(qDocs);
            }
            globalLessonCounter++;
        }

        await db.collection('modules').updateOne({ _id: modId }, {
            $set: { lessons: insertedLesIds, lessonList: insertedLesIds, totalLessons: insertedLesIds.length, count: insertedLesIds.length, lessonsCount: insertedLesIds.length }
        });
    }

    if (existingModules.length > modulesData.length) {
        const extraMods = existingModules.slice(modulesData.length).map(m => m._id);
        await db.collection('modules').deleteMany({ _id: { $in: extraMods } });
    }

    await db.collection('learningpaths').updateOne({ _id: targetPath._id }, {
        $set: { 
            difficulty: "BEGINNER", 
            modules: allModIds, lessons: allLesIds,
            totalModules: allModIds.length, totalLessons: allLesIds.length,
            modulesCount: allModIds.length, lessonsCount: allLesIds.length,
            status: "published", isPublished: true, published: true, active: true, visibility: "public"
        }
    });

    await db.collection('users').updateMany({}, {
        $pull: { enrolledPaths: { pathId: targetPath._id }, progress: { pathId: targetPath._id } }
    });

    console.log(`✅ MUAMMO HAL QILINDI! Server yaratgan eski kurs topildi va ustidan to'g'ri darslar yozildi.`);
    process.exit(0);
});
