
const mongoose = require('mongoose');
// DIQQAT: JONLI MONGO_URI MANZILINI SHU YERGA QO'YING
const MONGO_URI = 'mongodb+srv://ctfuz_admin:AKKSAVDON137@ctf-uz-cluster.vtjol3t.mongodb.net/ctf-uz?retryWrites=true&w=majority'; 

const { LearningPath, Module, Lesson, Question } = require('./models/Learn');

async function seedData() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Jonli bazaga ulanildi.');

        // Eski 1-yo'l ma'lumotlarini va uning savollarini tozalash
        const oldPaths = await LearningPath.find({ slug: '1-yol-asoslar' });
        for (let p of oldPaths) {
            const oldLessons = await Lesson.find({ moduleSlug: { $regex: /^1-yol/ } });
            const lessonIds = oldLessons.map(l => l._id);
            await Question.deleteMany({ lessonId: { $in: lessonIds } });
            await Lesson.deleteMany({ moduleSlug: { $regex: /^1-yol/ } });
            await Module.deleteMany({ pathSlug: p.slug });
        }
        await LearningPath.deleteMany({ slug: '1-yol-asoslar' });

        // ==========================================
        // 1-YO'NALISH (PATH) VA YAKUNIY IMTIHON
        // ==========================================
        const path1 = await LearningPath.create({
            title: "1-yo'l. Asoslar va qonunchilik",
            slug: "1-yol-asoslar",
            description: "Kiberxavfsizlik olamiga kirish. Xakerlik orqasidagi falsafa, qonun-qoidalar va asosiy laboratoriya muhitini qurish.",
            order: 1,
            isPublished: true,
            level: "Beginner",
            certificateTitle: "Kiberxavfsizlik Asoslari Mutaxassisi",
            finalQuestions: [
                {
                    question: "Vaziyat: Siz kompaniya serveriga qilingan hujumni to'xtatdingiz. Hujumchi mijozlar bazasini ko'chira olmadi, lekin tizimni o'chirib yubordi. Natijada sayt 5 soat ishlamadi. CIA triadasining qaysi ustuni quladi?",
                    options: ["Confidentiality (Maxfiylik)", "Integrity (Yaxlitlik)", "Availability (Mavjudlik)", "Non-repudiation (Inkor etmaslik)"],
                    correctAnswer: "Availability (Mavjudlik)",
                    points: 10
                },
                {
                    question: "Sizga yozma ruxsatnoma (RoE) orqali faqat '10.0.0.5' IP manzilini tekshirish buyurildi. Siz u yerdan '10.0.0.6' ga olib boruvchi zaiflik topdingiz va qiziqish ustun kelib uni ham buzib kirdingiz. Qonunchilikka ko'ra siz kimsiz?",
                    options: ["Oq qalpoqli (Etik xaker)", "Kulrang qalpoqli (Grey-hat)", "Qora qalpoqli (Jinoyatchi)", "Red Team a'zosi"],
                    correctAnswer: "Qora qalpoqli (Jinoyatchi)",
                    points: 10
                }
                // Haqiqiy skriptda bu yerda 10 ta savol bo'ladi. Hozir test uchun 2 ta.
            ]
        });

        // ==========================================
        // MODULLAR
        // ==========================================
        const mod1 = await Module.create({ title: "Kiberxavfsizlik asoslari (CIA Triadasi)", slug: "1-yol-modul-1", pathSlug: path1.slug, order: 1 });
        const mod2 = await Module.create({ title: "Asosiy muhitni tayyorlash", slug: "1-yol-modul-2", pathSlug: path1.slug, order: 2 });

        // ==========================================
        // DARSLAR VA ULARNING SAVOLLARI
        // ==========================================
        // 1-Dars
        const l1 = await Lesson.create({
            title: "1. Kiberxavfsizlikka kirish va CIA",
            slug: "1-yol-dars-1",
            moduleSlug: mod1.slug,
            order: 1,
            xpReward: 50,
            content: `<h3>Xakerlik faqat qora ekrandagi yashil yozuvlardan iboratmi?</h3>
            <p>Ko'pchilik kiberxavfsizlik deganda kapyushon kiygan, qorong'i xonada klaviaturani tez bosadigan xakerni tasavvur qiladi. Ammo real hayotda kiberxavfsizlik — bu <b>axborotni himoya qilish san'ati</b>.</p>
            <p>Tasavvur qiling, siz yirik bankning bosh xavfsizlik arxitektori etib tayinlandingiz. Sizning asosiy vazifangiz uchta ustunni ushlab turishdir. Buni biz <b>CIA Triadasi</b> deb ataymiz:</p>
            <ul>
                <li><b>Confidentiality (Maxfiylik):</b> Mijozning hisob raqamini faqat u va bank xodimi ko'ra olishi kerak. Agar xaker bazani o'g'irlasa, maxfiylik buziladi.</li>
                <li><b>Integrity (Yaxlitlik):</b> Tasavvur qiling, siz do'stingizga $100 yubordingiz. Agar tarmoqdagi xaker (MITM) bu summani $1000 ga o'zgartirib qo'ysa, ma'lumot yaxlitligi buziladi.</li>
                <li><b>Availability (Mavjudlik):</b> Siz Black Friday kuni xarid qilmoqchisiz, lekin onlayn do'kon serveri DDoS hujumiga uchrab, sayt ochilmayapti. Demak, mavjudlik qulagan.</li>
            </ul>
            <p>Xavfsizlik mutaxassisi ushbu uchta elementning balansini ushlashi kerak. Juda qattiq maxfiylik mavjudlikni qiyinlashtirishi mumkin (masalan, tizimga kirish uchun 5 ta parol so'rash mijozlarni bezdiradi).</p>`
        });

        await Question.create([
            {
                lessonId: l1._id,
                question: "Bankdagi hisobingizdagi pul miqdori tranzit vaqtida xaker tomonidan 0 ga o'zgartirildi. CIA'ning qaysi qismi buzildi?",
                options: ["Maxfiylik", "Yaxlitlik (Integrity)", "Mavjudlik", "Autentifikatsiya"],
                correctAnswer: "Yaxlitlik (Integrity)",
                points: 20
            }
        ]);

        // 2-Dars
        const l2 = await Lesson.create({
            title: "2. Etik xakerlik va qonunchilik",
            slug: "1-yol-dars-2",
            moduleSlug: mod1.slug,
            order: 2,
            xpReward: 50,
            content: `<h3>Qalpoqlar rangida nima ma'no bor?</h3>
            <p>Kiberxavfsizlikda mutaxassislar uchta rangga bo'linadi:</p>
            <ul>
                <li><b>Qora qalpoq (Black Hat):</b> Ruxsatsiz, yomon niyatda tizimlarni buzuvchi jinoyatchilar.</li>
                <li><b>Oq qalpoq (White Hat):</b> Kompaniyalar tomonidan rasman yollangan, tizim zaifliklarini topib beruvchi himoyachilar.</li>
                <li><b>Kulrang qalpoq (Grey Hat):</b> Ruxsatsiz buzib kiradi, lekin zarar yetkazmaydi. Zaiflikni aytgani uchun pul (Bug Bounty) so'raydi. (Qonunan baribir jinoyat hisoblanadi!)</li>
            </ul>
            <p>O'zbekiston Respublikasi Jinoyat Kodeksining <b>278-moddasiga</b> ko'ra, kompyuter axborotidan qonunga xilof ravishda foydalanish jinoiy javobgarlikka tortiladi.</p>
            <p>Etik xakerni jinoyatchidan ajratib turuvchi yagona qog'oz bu — <b>Rules of Engagement (RoE - Kelishuv qoidalari)</b> dir. Unda qaysi IP manzillarni buzish mumkinligi va qachon hujum qilish mumkinligi aniq yoziladi.</p>`
        });

        await Question.create([
            {
                lessonId: l2._id,
                question: "Do'stingizning kompaniyasidagi zaiflikni ko'rib qoldingiz. Unga yordam berish maqsadida (ruxsatsiz) zaiflikni buzib kirdingiz va unga qanday yopishni aytdingiz. Qonun nuqtai nazaridan bu harakat qanday baholanadi?",
                options: ["White Hat harakati", "Jinoiy javobgarlik (Black/Grey Hat)", "Kompaniya xavfsizligiga yordam", "Bug Bounty"],
                correctAnswer: "Jinoiy javobgarlik (Black/Grey Hat)",
                points: 20
            }
        ]);

        console.log('✅ 1-yo`nalish CHUQURLASHTIRILGAN matnlar va SAVOLLAR bilan yozildi!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Xatolik:', err);
        process.exit(1);
    }
}
seedData();
