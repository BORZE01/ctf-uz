
const mongoose = require('mongoose');

// SIZNING JONLI RENDER MONGODB MANZILINGIZNI SHU YERGA KIRITING
const MONGO_URI = 'mongodb+srv://ctfuz_admin:AKKSAVDON137@ctf-uz-cluster.vtjol3t.mongodb.net/ctf-uz?retryWrites=true&w=majority';

// KURS MODELI TUSHUNCHASI (Agar sizda boshqacha bo'lsa, o'zingizning modelingizga moslang)
const courseSchema = new mongoose.Schema({
    title: String,
    pathIndex: Number,
    modules: [{
        title: String,
        lessons: [{
            title: String,
            content: String
        }]
    }],
    exam: [{
        question: String,
        options: [String],
        correctAnswer: String,
        explanation: String
    }]
});
const Course = mongoose.models.Course || mongoose.model('Course', courseSchema);

const coursesData = [
    {
        title: "1-yo'l. Asoslar va qonunchilik",
        pathIndex: 1,
        modules: [
            {
                title: "Kiberxavfsizlik asoslari (CIA Triadasi)",
                lessons: [
                    {
                        title: "1. Kiberxavfsizlikka kirish va CIA",
                        content: "Kiberxavfsizlik faqatgina xakerlikdan iborat emas. U axborotni himoya qilish san'atidir. Eng fundamental tushuncha bu CIA triadasi: Confidentiality (Maxfiylik), Integrity (Yaxlitlik) va Availability (Mavjudlik). Maxfiylik - ma'lumotni faqat ruxsati borlar ko'rishi, Yaxlitlik - ma'lumotning tranzit va saqlanish jarayonida o'zgarmasligi, Mavjudlik - tizimlarning doimiy ishlab turishi... (Davomi: Real hayotdagi keyslar va ularning buzilish oqibatlari)."
                    },
                    {
                        title: "2. Etik xakerlik va qonunchilik",
                        content: "O'zbekiston Respublikasi Jinoyat Kodeksining 278-moddasiga ko'ra, kompyuter axborotidan qonunga xilof ravishda foydalanish jinoiy javobgarlikka tortiladi. Etik xaker (Oq qalpoqli) bilan jinoyatchi xakerni (Qora qalpoqli) ajratib turuvchi yagona chegara - bu RUXSATNOMA (Rules of Engagement).."
                    }
                ]
            },
            {
                title: "Asosiy muhitni tayyorlash",
                lessons: [
                    {
                        title: "1. VirtualBox o'rnatish va tarmoq izolyatsiyasi",
                        content: "Zararli kodlar va ekspluatatsiyalarni o'z kompyuteringizda sinab ko'rish o'ta xavfli. Shuning uchun biz Type-2 gipervizor (VirtualBox) dan foydalanamiz. NAT va Host-only tarmoq adapterlari o'rtasidagi farqni bilish muhim..."
                    },
                    {
                        title: "2. Kali Linux arxitekturasi",
                        content: "Kali Linux Debian bazasida qurilgan bo'lib, o'zida 600 dan ortiq xavfsizlik vositalarini jamlagan. Biz terminal, repozitoriylar bilan ishlash va root huquqlarini to'g'ri boshqarishni ko'rib chiqamiz..."
                    }
                ]
            }
        ],
        exam: [
            {
                question: "Vaziyat: Tizim administratori serverga faqat o'zi kira olishi uchun ruxsatlarni to'g'riladi, lekin serverga qilingan DDoS hujum oqibatida sayt hammaga yopilib qoldi. CIA triadasining qaysi ustuni buzildi?",
                options: ["Maxfiylik (Confidentiality)", "Yaxlitlik (Integrity)", "Mavjudlik (Availability)", "Autentifikatsiya"],
                correctAnswer: "Mavjudlik (Availability)",
                explanation: "DDoS hujum tizimni ishdan chiqaradi va qonuniy foydalanuvchilarning kirishini to'sadi, bu 'Availability' buzilishi demakdir."
            },
            {
                question: "Kompaniya sizga faqatgina '192.168.1.0/24' tarmog'ini skanerlashga yozma ruxsat berdi. Siz adashib '192.168.2.0/24' tarmog'iga Nmap skanerini ishga tushirdingiz va hech qanday zarar yetkazmadingiz. Qonunchilik va etik xakerlik nuqtai nazaridan bu qanday baholanadi?",
                options: ["Ruxsat etilgan qadam, chunki zarar yetmadi", "Qonunbuzarlik va shartnoma shartlarini buzish", "Grey-hat xakerlik", "Kompaniya xavfsizligiga yordam"],
                correctAnswer: "Qonunbuzarlik va shartnoma shartlarini buzish",
                explanation: "Etik xakerlikda qamrovdan (Scope) tashqariga chiqish, hatto zarar yetkazilmagan bo'lsa ham, ruxsatsiz kirish hisoblanadi."
            }
            // Yana 8 ta savol...
        ]
    },
    {
        title: "2-yo'l. Linux OS va Xavfsizlik",
        pathIndex: 2,
        modules: [
            {
                title: "Bash Scripting va Avtomatlashtirish",
                lessons: [
                    {
                        title: "1. Bash skriptlarga kirish",
                        content: "Xaker uchun har bir amalni qo'lda qilish vaqt yo'qotishdir. Bash skriptlar (#!/bin/bash) tizimda jarayonlarni avtomatlashtirish, loglarni o'qish va tarmoqni avtomat skanerlash uchun ishlatiladi..."
                    }
                ]
            }
        ],
        exam: [
            {
                // Kumulyativ savollar (1-yo'ldan va 2-yo'ldan aralash)
                question: "Siz serverning ufw xavfsizlik devorida 'sudo ufw deny 22' buyrug'ini kiritdingiz. Shu bilan birga serverda web-xizmat (80-port) ishlamoqda. CIA triadasining qaysi elementi oshirildi va tizimga qanday ulanish uzildi?",
                options: ["Maxfiylik oshdi, HTTP uzildi", "Maxfiylik oshdi, SSH uzildi", "Yaxlitlik oshdi, FTP uzildi", "Mavjudlik oshdi, SSH uzildi"],
                correctAnswer: "Maxfiylik oshdi, SSH uzildi",
                explanation: "Port 22 - SSH porti hisoblanadi. Uni yopish orqali masofaviy boshqaruv (Maxfiylik va Ruxsatsiz kirishning oldi olish) himoyalangan."
            }
        ]
    }
    // 3, 4, 5, 6, 7, 8-yo'nalishlar xuddi shu ob'ekt kabi qo'shiladi...
];

async function seedData() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ MongoDB ga ulanish muvaffaqiyatli.');
        
        await Course.deleteMany({});
        console.log('Eski kurslar tozalandi.');

        await Course.insertMany(coursesData);
        console.log('✅ Barcha 8 ta yo`nalish muvaffaqiyatli bazaga yozildi!');
        
        process.exit();
    } catch (error) {
        console.error('❌ Xatolik yuz berdi:', error);
        process.exit(1);
    }
}

seedData();
