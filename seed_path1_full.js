const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!MONGO_URI) {
    console.error("❌ XATO: .env faylida MONGODB_URI topilmadi!");
    process.exit(1);
}

// Har bir dars (1..20) uchun dars matniga asoslangan 5 tadan interaktiv savol va aniq javob
const questionsByLesson = {
    1: [
        { question: "Kiberxavfsizlik nimani himoya qiladi? (Qisqa javob: Qurilma, hisob, ma'lumot va xizmatlarni)", answer: "Qurilma, hisob, ma'lumot va xizmatlarni" },
        { question: "Nega antivirusning o'zi yetarli emas? (Kalit ibora: qatlamli himoya kerak)", answer: "qatlamli himoya kerak" },
        { question: "Yaxshi xavfsizlikda oldini olish va aniqlashdan keyingi uchinchi bosqich nima?", answer: "tiklanish" },
        { question: "Fayllar yo'qolganda ularni qayta tiklashga yordam beradigan nusxa nima deyiladi?", answer: "zaxira nusxa" },
        { question: "Amaliy mashqda o'zingiz foydalanadigan nechta raqamli aktivni yozish topshirilgan?", answer: "5" }
    ],
    2: [
        { question: "CIA nimani anglatadi? (Maxfiylik, yaxlitlik, mavjudlik)", answer: "Maxfiylik, yaxlitlik, mavjudlik" },
        { question: "Fayl ruxsatsiz o'zgartirilsa qaysi xususiyat buziladi?", answer: "Yaxlitlik" },
        { question: "Backup (zaxira nusxa) asosan qaysi xususiyatni qo'llab-quvvatlaydi?", answer: "Mavjudlik" },
        { question: "Ma'lumotni faqat tegishli ruxsatga ega odamlar ko'rishi CIA triadasining qaysi qismi?", answer: "Maxfiylik" },
        { question: "Maktab platformasi imtihon kuni ochilmasa, bu qaysi xususiyat muammosi hisoblanadi?", answer: "Mavjudlik" }
    ],
    3: [
        { question: "Himoya, kuzatish va hodisaga javob berish qaysi jamoaning asosiy vazifasi? (Blue Team / Red Team)", answer: "Blue Team" },
        { question: "Belgilangan ruxsat va doirada tashkilot himoyasini sinab ko'radigan jamoa qanday ataladi?", answer: "Red Team" },
        { question: "Noutbuk, telefon va server kabi oxirgi qurilmalarga qaratilgan xavfsizlik yo'nalishi nima deyiladi? (Endpoint / Bulut)", answer: "Endpoint" },
        { question: "Sayt, server, brauzer, protokol va API kabi qismlarni qaysi xavfsizlik yo'nalishi qamrab oladi?", answer: "Veb xavfsizligi" },
        { question: "Red Team sinovi uchun eng muhim shart nima? (Aniq ruxsat, doira va qoidalar)", answer: "Aniq ruxsat, doira va qoidalar" }
    ],
    4: [
        { question: "Ommaga ochiq saytni tekshirishga avtomatik ruxsat bormi? (Ha / Yo'q)", answer: "Yo'q" },
        { question: "Qaysi tizim va qanday chegarada sinov o'tkazilishini belgilovchi tushuncha ingliz tilida nima deyiladi?", answer: "Scope" },
        { question: "O'rganish uchun haqiqiy tizim o'rniga qanday muhitdan foydalanish ma'qul?", answer: "laboratoriya" },
        { question: "Ruxsatli sinovda zaiflik topilsa, maqsad sharmanda qilish emas, balki nimani kamaytirishdir?", answer: "xavfni" },
        { question: "Sinov paytida shubha tug'ilsa, ishni davom ettirish kerakmi yoki to'xtatib mas'ul shaxsdan aniqlik olish kerakmi? (to'xtatish / davom ettirish)", answer: "to'xtatish" }
    ],
    5: [
        { question: "Qiymatga ega va himoya qilinishi kerak bo'lgan narsa nima deb ataladi?", answer: "Aktiv" },
        { question: "Aktivga zarar yetkazishi mumkin bo'lgan shaxs, hodisa yoki sharoit nima deyiladi?", answer: "Tahdid" },
        { question: "Himoyani susaytiradigan nuqson yoki noto'g'ri sozlama qanday ataladi?", answer: "Zaiflik" },
        { question: "Zaiflik bo'lsa, hujum albatta sodir bo'ladimi? (Ha / Yo'q)", answer: "Yo'q" },
        { question: "Kutubxonadagi kompyuterda foydalanuvchi tizimdan chiqmay ketgan bo'lsa, ochiq qolgan sessiya nimaga misol bo'ladi? (Aktiv / Tahdid / Zaiflik)", answer: "Zaiflik" }
    ],
    6: [
        { question: "Muayyan zaiflikdan foydalanishga mo'ljallangan usul yoki kod nima deb ataladi?", answer: "Eksploit" },
        { question: "Muvaffaqiyatsiz kirish urinishi ham xavfsizlik uchun ahamiyatlimi? (Ha / Yo'q)", answer: "Ha" },
        { question: "Tizim yoki ma'lumotga zarar yetkazish, ruxsatsiz kirishga qaratilgan amaliy harakat nima deyiladi?", answer: "Hujum" },
        { question: "Hodisa natijasida yuzaga kelgan zarar (ma'lumot ochilishi, xizmat to'xtashi) nima deb ataladi?", answer: "Oqibat" },
        { question: "Noto'g'ri xulosa va ortiqcha choralarning oldini olish uchun tahlilchi fakt va nimani ajratishi kerak?", answer: "taxmin" }
    ],
    7: [
        { question: "Riskni baholashda qaysi ikki jihat muhim? (Ehtimol va ta'sir)", answer: "Ehtimol va ta'sir" },
        { question: "Hodisa yuz berishi qanchalik mumkinligini ifodalovchi tushuncha nima?", answer: "Ehtimol" },
        { question: "Hodisa sodir bo'lsa qancha zarar yetishini ifodalovchi tushuncha nima?", answer: "Ta'sir" },
        { question: "Eng katta ball avtomatik ravishda yakuniy haqiqat hisoblanadimi? (Ha / Yo'q)", answer: "Yo'q" },
        { question: "Barcha muammoni bir vaqtda tuzatish imkoni bo'lmagani uchun yuqori ehtimol va katta ta'sirga ega risklarga nima beriladi?", answer: "ustuvorlik" }
    ],
    8: [
        { question: "Zaiflikni boshqarish faqat uni topishdan iboratmi? (Ha / Yo'q)", answer: "Yo'q" },
        { question: "Hisobotda muammo, ta'sir, xavfsiz dalil va holat bilan birga yana nima bo'lishi kerak?", answer: "tavsiya" },
        { question: "Tuzatish kiritilgandan keyin muammo haqiqatan bartaraf etilganini bilish uchun nima qilinadi?", answer: "qayta tekshirish" },
        { question: "Xavfsizlik hisobotiga haqiqiy parol yoki foydalanuvchining maxfiy ma'lumotini qo'shish shartmi? (Ha / Yo'q)", answer: "Yo'q" },
        { question: "Umumiy hujjat hamma ko'ra oladigan bo'lib qolgan bo'lsa, kirishni kimlar bilan cheklash tavsiya etiladi? (zarur foydalanuvchilar)", answer: "zarur foydalanuvchilar" }
    ],
    9: [
        { question: "Texnik himoyani emas, insonning ishonchi va shoshilishidan foydalanishga urinish qanday ataladi?", answer: "Ijtimoiy muhandislik" },
        { question: "Aldov orqali parol, kod yoki ma'lumotni qo'lga kiritishga qaratilgan soxta xabarlar hujumi nima deyiladi?", answer: "Phishing" },
        { question: "Jo'natuvchining ko'rinadigan nomiga ishonish yetarli dalilmi? (Ha / Yo'q)", answer: "Yo'q" },
        { question: "Shubhali xabar kelganda undagi havolani bosmasdan, qaysi kanal orqali tekshirish kerak? (rasmiy kanal)", answer: "rasmiy kanal" },
        { question: "Uyga vazifada phishingni aniqlash uchun necha bandli tekshiruv ro'yxatini tuzish topshirilgan?", answer: "7" }
    ],
    10: [
        { question: "Qurilma yoki ma'lumotga zarar yetkazish, josuslik qilish uchun ishlatiladigan zararli dasturlar umumiy qanday ataladi?", answer: "Malware" },
        { question: "Foydali dastur ko'rinishida kelib, yashirin zararli vazifa bajaradigan dastur turi nima?", answer: "Troyan" },
        { question: "Ma'lumotni bloklashi yoki shifrlab, to'lov talab qilishi mumkin bo'lgan zararli dastur turi nima?", answer: "Ransomware" },
        { question: "Klaviatura kiritmalarini yashirincha kuzatishga urinadigan zararli dastur nima deyiladi?", answer: "Keylogger" },
        { question: "Boshqa fayl yoki dastur bilan bog'lanib tarqaladigan zararli dastur turi nima?", answer: "Virus" }
    ],
    11: [
        { question: "Kirishda paroldan tashqari yana bir tasdiq omilini talab qiluvchi tizim qisqartmasi nima?", answer: "MFA" },
        { question: "Tasdiqlash kodini boshqa shaxsga berish mumkinmi? (Ha / Yo'q)", answer: "Yo'q" },
        { question: "Har bir xizmat uchun alohida va murakkab parol saqlashga yordam beradigan dastur nima deyiladi? (Parol menejeri)", answer: "Parol menejeri" },
        { question: "Bitta sizib chiqish bir nechta akkauntni xavf ostiga qo'ymasligi uchun parolni nima qilmaslik kerak? (takror ishlatmaslik)", answer: "takror ishlatmaslik" },
        { question: "Hisob buzilganidan shubha bo'lsa, parolni almashtirish bilan birga faol bo'lgan boshqa nimalarni tugatish kerak? (sessiyalarni)", answer: "sessiyalarni" }
    ],
    12: [
        { question: "Brauzer va sayt orasidagi aloqani shifrlashga yordam beradigan xavfsiz protokol qanday ataladi?", answer: "HTTPS" },
        { question: "HTTPS borligi saytning halol yoki ishonchli ekanini to'liq kafolatlaydimi? (Ha / Yo'q)", answer: "Yo'q" },
        { question: "Internetdagi faoliyatdan (postlar, profil ma'lumotlari) qoladigan ma'lumotlar nima deb ataladi? (Raqamli iz)", answer: "Raqamli iz" },
        { question: "Havolani bosishdan oldin sayt manzilining qaysi asosiy qismini diqqat bilan tekshirish kerak? (domen)", answer: "domen" },
        { question: "Ortiqcha ochiq ma'lumot ulashish qaysi turdagi hujumni osonlashtirishi mumkin? (ijtimoiy muhandislik)", answer: "ijtimoiy muhandislik" }
    ],
    13: [
        { question: "Apparat qismlari va dasturlar o'rtasidagi boshqaruvchi qatlam qisqartmasi nima? (OT)", answer: "OT" },
        { question: "Operatsion tizimning xotira, jarayon va apparat resurslarini boshqaruvchi eng muhim qismi nima deyiladi?", answer: "Yadro" },
        { question: "Oyna, tugma va menyular orqali ishlash interfeysi qisqartmasi nima?", answer: "GUI" },
        { question: "Matnli buyruqlar orqali boshqarish interfeysi (buyruq satri) qisqartmasi nima?", answer: "CLI" },
        { question: "OTga klaviatura, tarmoq adapteri yoki printer kabi qurilmalar bilan ishlashga yordam beruvchi dasturlar nima deyiladi?", answer: "Drayverlar" }
    ],
    14: [
        { question: "Foydalanuvchi va dasturga vazifasini bajarish uchun zarur bo'lgan eng kichik vakolatni berish qanday tamoyil deyiladi? (Eng kam huquq tamoyili)", answer: "Eng kam huquq tamoyili" },
        { question: "Fayl ruxsatlarining uchta asosiy turi: o'qish, yozish va uchinchisi nima?", answer: "bajarish" },
        { question: "Kundalik oddiy ishlar uchun doimiy ravishda qaysi hisobdan foydalanmaslik tavsiya etiladi? (administrator)", answer: "administrator" },
        { question: "Fayl kengaytmasi o'zgartirilgani faylni avtomatik xavfsiz qiladimi? (Ha / Yo'q)", answer: "Yo'q" },
        { question: "Faylga kim va qanday amal bilan kira olishini boshqarish uchun nimalar kerak?", answer: "Ruxsatlar" }
    ],
    15: [
        { question: "Ishga tushgan dastur nusxasi va uning ishlash holati nima deb ataladi?", answer: "Jarayon" },
        { question: "Ma'lum xavfsizlik nuqsonlarini tuzatish uchun dasturlarda nimani o'z vaqtida o'rnatish muhim?", answer: "yangilanish" },
        { question: "Dastur yuklashda qanday manbalar ma'qul? (rasmiy)", answer: "rasmiy" },
        { question: "Noma'lum jarayonni ko'rish darhol u zararli dastur ekanini anglatadimi? (Ha / Yo'q)", answer: "Yo'q" },
        { question: "Jarayonlar ishlash davomida kompyuterning protsessori va nimasidan foydalanadi?", answer: "xotira" }
    ],
    16: [
        { question: "Tizim yoki ilovada sodir bo'lgan hodisalar haqidagi jurnal yozuvlari nima deb ataladi?", answer: "Log" },
        { question: "Muhim fayl yoki tizim ma'lumotining alohida saqlangan zaxira nusxasi ingliz tilida nima deyiladi?", answer: "Backup" },
        { question: "Zaxira nusxa buzilgan yoki tiklab bo'lmaydigan bo'lib qolmasligi uchun vaqti-vaqti bilan nimani sinab ko'rish muhim? (tiklashni)", answer: "tiklashni" },
        { question: "Log va backupdan qaysi biri 'nima bo'lganini' tushuntirishga yordam beradi?", answer: "Log" },
        { question: "Tahlil davomida loglarni o'zgartirish mumkinmi? (Ha / Yo'q)", answer: "Yo'q" }
    ],
    17: [
        { question: "Domen nomini IP manzil bilan moslashtirib beruvchi xizmat qanday ataladi?", answer: "DNS" },
        { question: "Tarmoq trafigini belgilangan qoidalar asosida ruxsat etuvchi yoki bloklovchi vosita nima?", answer: "Firewall" },
        { question: "VPN barcha kiberxavflarni (masalan, fishing va zararli dasturlarni) to'liq yo'q qiladimi? (Ha / Yo'q)", answer: "Yo'q" },
        { question: "Turli tarmoqlar orasida trafikni yo'naltiruvchi qurilma nima deb ataladi?", answer: "Router" },
        { question: "Tarmoqdagi qurilma yoki interfeysni aniqlashga yordam beruvchi raqamli manzil nima?", answer: "IP manzil" }
    ],
    18: [
        { question: "Bitta himoya chorasi yetarli bo'lmasligi mumkinligi sababli qanday himoya kerak? (qatlamli himoya)", answer: "qatlamli himoya" },
        { question: "Noutbuk yo'qolganda yoki o'g'irlanganda diskdagi ma'lumotlarni o'qib bo'lmasligi uchun nimani yoqish kerak? (disk shifrlash)", answer: "disk shifrlash" },
        { question: "Kim nima qilganini aniq bilish uchun umumiy akkaunt o'rniga har bir foydalanuvchida nima bo'lishi kerak? (shaxsiy akkaunt)", answer: "shaxsiy akkaunt" },
        { question: "Vaqt va resurslarni eng muhim xavflarga yo'naltirish uchun himoya rejasida nima belgilanadi? (ustuvorlik)", answer: "ustuvorlik" },
        { question: "Amaliy mashqda shaxsiy qurilma uchun necha bandli tekshiruv ro'yxati yaratish topshirilgan?", answer: "10" }
    ],
    19: [
        { question: "Qurilmaning sekinlashishi yoki g'alati holat avtomatik ravishda hujum deganimi? (Ha / Yo'q)", answer: "Yo'q" },
        { question: "Hisobotda noto'g'ri xulosaning oldini olish uchun fakt va nimani ajratamiz?", answer: "taxmin" },
        { question: "Hodisa haqida xizmat yoki tashkilotning qanday kanaliga xabar berish kerak? (rasmiy mas'ul kanaliga)", answer: "rasmiy mas'ul kanaliga" },
        { question: "Hisobotda ortiqcha dramatik til o'rniga nima ishlatish kerak? (aniq fakt)", answer: "aniq fakt" },
        { question: "Oddiy foydalanuvchi shubhali amalni payqaganda birinchi navbatda uni nima qilishi kerak? (to'xtatish)", answer: "to'xtatish" }
    ],
    20: [
        { question: "Yakuniy audit faqat qanday doirani qamrab oladi? (belgilangan, ruxsatli va xavfsiz doirani)", answer: "belgilangan, ruxsatli va xavfsiz doirani" },
        { question: "Ishonchlilik va halollik uchun tekshirilmagan narsani hisobotga tekshirilgan deb qo'shish mumkinmi? (Ha / Yo'q)", answer: "Yo'q" },
        { question: "Yakuniy loyiha amaliy mashqida kamida nechta aktivni sanash va nechta riskni baholash so'ralgan?", answer: "5" },
        { question: "Risk jadvalidan eng muhim nechta riskni tanlab, aniq tavsiya berish kerak?", answer: "3" },
        { question: "Kursni tugatish mezoniga ko'ra, har dars oxiridagi savollardan kamida necha foiz to'g'ri javob berish tavsiya etiladi? (80%)", answer: "80%" }
    ]
};

function makeSlug(text) {
    return text
        .toLowerCase()
        .replace(/o‘|o'|o`/g, 'o')
        .replace(/g‘|g'|g`/g, 'g')
        .replace(/’|'|`/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

mongoose.connect(MONGO_URI).then(async () => {
    console.log("✅ MongoDB'ga muvaffaqiyatli ulandi.");
    const db = mongoose.connection.db;

    // 1. BACKUP OLISH (Mavjud 1-yo'l ma'lumotlarini saqlab qo'yish)
    const existingPath = await db.collection('learningpaths').findOne({
        $or: [{ order: 1 }, { slug: 'kiberxavfsizlik-1-oylik-kirish-yoli' }, { slug: 'kiberxavfsizlik-asoslari' }]
    });

    if (existingPath) {
        const oldMods = await db.collection('modules').find({ pathId: existingPath._id }).toArray();
        const oldModIds = oldMods.map(m => m._id);
        const oldLessons = await db.collection('lessons').find({
            $or: [{ moduleId: { $in: oldModIds } }, { pathId: existingPath._id }]
        }).toArray();
        const oldLessonIds = oldLessons.map(l => l._id);
        const oldQuestions = await db.collection('questions').find({ lessonId: { $in: oldLessonIds } }).toArray();

        const backupData = {
            backedUpAt: new Date().toISOString(),
            learningPath: existingPath,
            modules: oldMods,
            lessons: oldLessons,
            questions: oldQuestions
        };
        fs.writeFileSync('backup_path1.json', JSON.stringify(backupData, null, 2), 'utf-8');
        console.log(`📦 Mavjud 1-yo'l backup qilindi -> backup_path1.json (${oldMods.length} modul, ${oldLessons.length} dars)`);

        // Faqat 1-yo'lga tegishli eski modul, dars va savollarni tozalash (Foydalanuvchilar va boshqa yo'llarga tegilmaydi!)
        await db.collection('questions').deleteMany({ lessonId: { $in: oldLessonIds } });
        await db.collection('lessons').deleteMany({ _id: { $in: oldLessonIds } });
        await db.collection('modules').deleteMany({ _id: { $in: oldModIds } });
    }

    // 2. MARKDOWN FAYLNI TO'LIQ O'QISH VA PARS QILISH
    const mdRaw = fs.readFileSync(path.join(__dirname, 'CTF-UZ_Kiberxavfsizlik_1-oy_Kirish_yoli.md'), 'utf-8');

    const footerSplit = mdRaw.split(/\n(?=## Yakuniy baholash va sertifikat mezonlari)/);
    const mainMd = footerSplit[0];
    const footerMd = footerSplit[1] || '';

    const parts = mainMd.split(/\n(?=## \d+-MODUL\.)/);
    const courseIntroMd = parts[0].trim();
    const moduleBlocks = parts.slice(1);

    const pathId = existingPath ? existingPath._id : new mongoose.Types.ObjectId();

    const pathDoc = {
        _id: pathId,
        title: "CTF.UZ — Kiberxavfsizlik: 1-oylik kirish yo‘li",
        slug: "kiberxavfsizlik-1-oylik-kirish-yoli",
        description: "Boshlang‘ich daraja • 5 modul • 20 dars • nazariya + xavfsiz amaliyot. Kiberxavfsizlikka kirish, CIA triadasi, asosiy terminlar, raqamli tahdidlar, operatsion tizimlar va amaliy himoya.",
        overview: courseIntroMd + "\n\n" + footerMd,
        order: 1,
        difficulty: "Boshlang‘ich",
        duration: "1 oy (20 dars · 30–60 daqiqadan)",
        totalModules: 5,
        totalLessons: 20,
        icon: "shield-alt",
        updatedAt: new Date(),
        createdAt: existingPath ? existingPath.createdAt : new Date()
    };

    await db.collection('learningpaths').replaceOne({ _id: pathId }, pathDoc, { upsert: true });
    console.log("✅ 1-yo'l (LearningPath) saqlandi:", pathDoc.title);

    let totalModulesInserted = 0;
    let totalLessonsInserted = 0;
    let totalQuestionsInserted = 0;

    const moduleDurations = {
        1: "4 dars · 30–35 daqiqadan",
        2: "4 dars · 35–40 daqiqadan",
        3: "4 dars · 40–45 daqiqadan",
        4: "4 dars · 45–50 daqiqadan",
        5: "4 dars · 50–60 daqiqadan"
    };

    for (const modBlock of moduleBlocks) {
        const lessonSplits = modBlock.split(/\n(?=### \d+-dars\.)/);
        const modHeaderSection = lessonSplits[0].trim();
        const lessonBlocks = lessonSplits.slice(1);

        const modHeaderLines = modHeaderSection.split('\n');
        const modTitleLine = modHeaderLines[0].replace(/^##\s*/, '').trim(); // "1-MODUL. KIBERXAVFSIZLIKKA KIRISH"
        const modOrderMatch = modTitleLine.match(/^(\d+)-MODUL/i);
        const modOrder = modOrderMatch ? parseInt(modOrderMatch[1], 10) : totalModulesInserted + 1;
        const modDesc = modHeaderLines.slice(1).join('\n').trim();

        const modId = new mongoose.Types.ObjectId();
        const modSlug = `path1-modul-${modOrder}-${makeSlug(modTitleLine)}`;

        await db.collection('modules').insertOne({
            _id: modId,
            pathId: pathId,
            title: modTitleLine,
            slug: modSlug,
            description: `${moduleDurations[modOrder] || ''} — ${modDesc}`,
            duration: moduleDurations[modOrder] || "4 dars",
            order: modOrder,
            createdAt: new Date()
        });
        totalModulesInserted++;

        for (const lesBlock of lessonBlocks) {
            const lesLines = lesBlock.trim().split('\n');
            const lesTitleLine = lesLines[0].replace(/^###\s*/, '').trim(); // "1-dars. Kiberxavfsizlik nima va nima uchun kerak?"
            const lesNumMatch = lesTitleLine.match(/^(\d+)-dars/i);
            const globalLessonNum = lesNumMatch ? parseInt(lesNumMatch[1], 10) : totalLessonsInserted + 1;

            const lesBodyRaw = lesLines.slice(1).join('\n').trim();
            const metaMatch = lesBodyRaw.match(/Taxminiy vaqt:\s*([^|]+)\|\s*Daraja:\s*([^\n]+)/i);
            const durationStr = metaMatch ? metaMatch[1].trim() : "45 daqiqa";
            const difficultyStr = metaMatch ? metaMatch[2].trim() : "boshlang‘ich";

            // 1-darsga Kurs haqida kirish qismini, 20-darsga esa Yakuniy baholash mezonlarini ham to'liq qo'shamiz (hech bir harf qolib ketmasligi uchun)
            let fullLessonContent = "";
            if (globalLessonNum === 1) {
                fullLessonContent += `${courseIntroMd}\n\n---\n\n## ${modTitleLine}\n${modDesc}\n\n### ${lesTitleLine}\n\n${lesBodyRaw}`;
            } else {
                fullLessonContent += `## ${modTitleLine}\n${modDesc}\n\n### ${lesTitleLine}\n\n${lesBodyRaw}`;
            }

            if (globalLessonNum === 20 && footerMd) {
                fullLessonContent += `\n\n---\n\n${footerMd}`;
            }

            const lessonId = new mongoose.Types.ObjectId();
            const lessonSlug = `path1-dars-${globalLessonNum}-${makeSlug(lesTitleLine)}`;

            await db.collection('lessons').insertOne({
                _id: lessonId,
                moduleId: modId,
                pathId: pathId,
                title: lesTitleLine,
                slug: lessonSlug,
                duration: durationStr,
                difficulty: difficultyStr,
                content: fullLessonContent,
                order: globalLessonNum,
                xp: 100,
                createdAt: new Date()
            });
            totalLessonsInserted++;

            // Har bir dars uchun 5 tadan savol-javob qo'shish
            const qList = questionsByLesson[globalLessonNum] || [];
            const qDocs = qList.map((qItem, idx) => ({
                _id: new mongoose.Types.ObjectId(),
                lessonId: lessonId,
                moduleId: modId,
                pathId: pathId,
                question: qItem.question,
                answer: qItem.answer,
                order: idx + 1,
                xp: 20,
                createdAt: new Date()
            }));

            if (qDocs.length > 0) {
                await db.collection('questions').insertMany(qDocs);
                totalQuestionsInserted += qDocs.length;
            }
        }
    }

    console.log("==========================================");
    console.log(`🎉 MUVAFFAQIYATLI YAKUNLANDI!`);
    console.log(`📚 Kiritilgan modullar soni: ${totalModulesInserted} ta (Kutilgan: 5 ta)`);
    console.log(`📖 Kiritilgan darslar soni: ${totalLessonsInserted} ta (Kutilgan: 20 ta)`);
    console.log(`❓ Kiritilgan savollar soni: ${totalQuestionsInserted} ta (Har bir darsda 5 tadan)`);
    console.log("==========================================");

    process.exit(0);
}).catch(err => {
    console.error("❌ Xatolik yuz berdi:", err);
    process.exit(1);
});
