const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ctf-platform').then(async () => {
    console.log("MongoDB'ga ulandi. 1-yo'l darslari xavfsiz yangilanmoqda...");
    const db = mongoose.connection.db;

    // Faqat 1-yo'lga tegishli eski ma'lumotlarni topish va tozalash
    const oldPath = await db.collection('learningpaths').findOne({ order: 1 });
    if (oldPath) {
        const oldModules = await db.collection('modules').find({ pathId: oldPath._id }).toArray();
        const modIds = oldModules.map(m => m._id);
        const oldLessons = await db.collection('lessons').find({ moduleId: { $in: modIds } }).toArray();
        const lessonIds = oldLessons.map(l => l._id);
        
        await db.collection('questions').deleteMany({ lessonId: { $in: lessonIds } });
        await db.collection('lessons').deleteMany({ moduleId: { $in: modIds } });
        await db.collection('modules').deleteMany({ pathId: oldPath._id });
        await db.collection('learningpaths').deleteOne({ _id: oldPath._id });
    }

    // 1-Yo'lni yaratish
    const path1 = {
        _id: new mongoose.Types.ObjectId(),
        title: "Kiberxavfsizlik Asoslari",
        slug: "kiberxavfsizlik-asoslari",
        description: "Kiberxavfsizlik olamiga chuqurlashtirilgan kirish. Noldan boshlab professional darajagacha.",
        order: 1,
        difficulty: "Oson",
        icon: "shield-alt",
        createdAt: new Date()
    };
    await db.collection('learningpaths').insertOne(path1);

    // 1-Modul
    const mod1Id = new mongoose.Types.ObjectId();
    await db.collection('modules').insertOne({
        _id: mod1Id,
        pathId: path1._id,
        title: "1-Modul: Kiberxavfsizlik Poydevori va Tahdidlar",
        slug: "kiberxavfsizlik-poydevori-va-tahdidlar",
        description: "Axborot xavfsizligi tamoyillari va zamonaviy tahdidlar haqida to'liq ma'lumot.",
        order: 1,
        createdAt: new Date()
    });

    // 1.1 - Dars
    const lesson1Id = new mongoose.Types.ObjectId();
    await db.collection('lessons').insertOne({
        _id: lesson1Id,
        moduleId: mod1Id,
        title: "1. Kiberxavfsizlik poydevori (CIA Triad)",
        slug: "kiberxavfsizlik-poydevori-cia-triad",
        content: `Kiberxavfsizlik axborot tizimlari, tarmoqlar va ma'lumotlarni raqamli hujumlardan himoya qilish amaliyotidir. Zamonaviy kiberxavfsizlik axborot xavfsizligining uchta asosiy ustuniga tayanadi, u "CIA Uchburchagi" (CIA Triad) deb ataladi.

1. Maxfiylik (Confidentiality): Ma'lumotlarga faqat ruxsat etilgan shaxslar kirishini ta'minlash. Bunga shifrlash (encryption), qat'iy parollar, ikki bosqichli autentifikatsiya (2FA) va biometrik tekshiruvlar orqali erishiladi. Masalan, bank hisobingizdagi qoldiqni faqat siz va bank xodimi ko'ra olishi maxfiylikdir. Agar xaker bazani buzib, mijozlar ma'lumotlarini o'g'irlasa, maxfiylik buzilgan hisoblanadi.

2. Yaxlitlik (Integrity): Ma'lumotlarning ruxsatsiz yoki tasodifan o'zgartirilmasligi, yo'q qilinmasligi va ishonchliligini kafolatlash. Hujjat yuborilganda u manzildagiga yetib borguncha o'zgartirilmasligi kerak. Buni ta'minlash uchun Xesh funksiyalar (MD5, SHA-256), raqamli imzolar va versiyalarni nazorat qilish tizimlaridan foydalaniladi.

3. Mavjudlik (Availability): Tizimlar va ma'lumotlarning vakolatli foydalanuvchilar uchun har doim, kerak vaqtda ochiq va ishchi holatda bo'lishini ta'minlash. Bunga apparat ta'minotining zaxirasi (redundancy), DDoS hujumlarga qarshi himoya tizimlari va ma'lumotlarni muntazam zaxiralash (backups) orqali erishiladi.

Qo'shimcha tamoyillar:
- Defense in Depth (Chuqurlashtirilgan himoya): Himoyani faqat bitta devorga qarab qoldirmasdan, tarmoq, xost, dastur va ma'lumotlar darajasida alohida xavfsizlik qatlamlarini yaratish.
- Zero Trust (Nol ishonch): "Hech kimga ishonma, doim tekshir" qoidasi. Tizim ichidagi foydalanuvchi ham xuddi tashqaridagi kabi xavfli deb hisoblanadi va har bir qadamida avtorizatsiya talab qilinadi.`,
        order: 1,
        xp: 100
    });

    // 1.2 - Dars
    const lesson2Id = new mongoose.Types.ObjectId();
    await db.collection('lessons').insertOne({
        _id: lesson2Id,
        moduleId: mod1Id,
        title: "2. Xakerlar turlari va Ijtimoiy Muhandislik",
        slug: "xakerlar-turlari-ijtimoiy-muhandislik",
        content: `Tahdid subyektlari (Threat Actors) maqsadlari va qobiliyatlariga ko'ra turli sinflarga ajratiladi.

1. Xakerlar klassifikatsiyasi:
- Oq qalpoqlar (White Hat / Ethical Hackers): Qonuniy ruxsat asosida tizimlardagi zaifliklarni qidirib topib, ularni yopishga yordam beruvchi xavfsizlik mutaxassislari.
- Qora qalpoqlar (Black Hat): Ruxsatsiz tizimlarga kiruvchi, ma'lumotlarni o'g'irlaydigan, zarar yetkazuvchi va shaxsiy manfaat yo'lida jinoyat sodir etuvchi xakerlar.
- Kulrang qalpoqlar (Grey Hat): Ruxsatsiz tizimlarga kiradi, lekin zarar yetkazish o'rniga tashkilotga xabar beradi (ba'zida buning uchun mukofot yoki ish so'raydi).
- Hacktivistlar: Siyosiy, ijtimoiy yoki diniy maqsadlarni ko'zlab davlat va yirik korporatsiyalar tizimlariga hujum uyushtiruvchi guruhlar (Masalan: Anonymous).
- Script Kiddie'lar: O'zlashtirilgan chuqur dasturlash va tarmoq bilimisiz, internetda tayyor topilgan vositalar orqali zarar yetkazishga urinadigan shaxslar.
- APT (Advanced Persistent Threat): Davlat tomonidan moliyalashtiriladigan, eng so'nggi texnologiyalar bilan qurollangan, tizimda yillar davomida sezdirmasdan yashirinib ma'lumot yig'uvchi guruhlar.

2. Ijtimoiy Muhandislik (Social Engineering):
Bu inson psixologiyasidan foydalanib, kishilarni aldash orqali maxfiy ma'lumotlarni qo'lga kiritish san'atidir. Dasturlardagi emas, balki inson miyasidagi "zaifliklarni" ekspluatatsiya qiladi.
- Phishing (Fishing): Ommaviy tarzda yuboriladigan yolg'on elektron xatlar (masalan, bankdan kelgandek qilib yasalgan saytga yo'naltirish).
- Spear Phishing: Ma'lum bir aniq shaxsga yoki kompaniyaga qaratilgan, oldindan yig'ilgan ma'lumotlar asosida yozilgan ishonchli xatlar.
- Whaling: Kompaniyaning eng yuqori darajadagi rahbarlariga (CEO, CFO) qaratilgan maxsus fishing turi.
- Vishing (Voice Phishing): Telefon orqali bank xodimi yoki huquq tartibot organi xodimi sifatida o'zini tanishtirib ma'lumot o'g'irlash.
- Pretexting: Aldov uchun murakkab va ishonchli ssenariy (baxona) yaratish (masalan, "IT bo'limidanman, server yangilanyapti, parolingiz kerak").
- Tailgating: Ruxsatnomasi yo'q shaxsning, xodimning orqasidan ergashib yopiq eshikdan kirib olishi.`,
        order: 2,
        xp: 100
    });

    const questions1 = [
        { lessonId: lesson1Id, question: "Ma'lumotlarning faqat ruxsat etilgan shaxslar tomonidan o'qilishini ta'minlovchi tamoyil nima?", answer: "Maxfiylik", xp: 20 },
        { lessonId: lesson1Id, question: "O'zgartirishlardan himoyalash va ma'lumotlarning to'g'riligini kafolatlovchi tamoyil?", answer: "Yaxlitlik", xp: 20 },
        { lessonId: lesson1Id, question: "Tizimlarning kerakli vaqtda foydalanuvchilar uchun doimiy ishlashini ta'minlovchi tamoyil?", answer: "Mavjudlik", xp: 20 },
        { lessonId: lesson1Id, question: "Xavfsizlikni bir necha qatlamlarda (tarmoq, dastur, xost) ta'minlash strategiyasi qanday ataladi?", answer: "Defense in Depth", xp: 20 },
        { lessonId: lesson1Id, question: "Hech kimga ishonmaslik va har bir so'rovni doimiy tekshirishga asoslangan zamonaviy xavfsizlik modeli qanday ataladi?", answer: "Zero Trust", xp: 20 }
    ];

    const questions2 = [
        { lessonId: lesson2Id, question: "Siyosiy yoki ijtimoiy maqsadlarda tizimlarni buzuvchi guruhlar qanday nomlanadi?", answer: "Hacktivistlar", xp: 20 },
        { lessonId: lesson2Id, question: "O'zlashtirilgan bilimi bo'lmagan holda, tayyor vositalar orqali zarar yetkazishga urinadigan shaxslar kimlar?", answer: "Script Kiddie", xp: 20 },
        { lessonId: lesson2Id, question: "Oliy darajadagi moliyalashtirishga ega, davlat tomonidan qo'llab-quvvatlanuvchi xakerlik guruhlari qanday ataladi?", answer: "APT", xp: 20 },
        { lessonId: lesson2Id, question: "Telefon qo'ng'iroqlari orqali odamlarni aldaganga urinish ijtimoiy muhandislikning qaysi turiga kiradi?", answer: "Vishing", xp: 20 },
        { lessonId: lesson2Id, question: "Tashkilot rahbarlariga (CEO) qaratilgan maxsus ijtimoiy muhandislik hujumi qanday ataladi?", answer: "Whaling", xp: 20 }
    ];

    await db.collection('questions').insertMany([...questions1, ...questions2]);

    console.log("✅ 1-yo'l ma'lumotlari muvaffaqiyatli yangilandi (Kengaytirilgan kontent va 5 tadan savol)!");
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
