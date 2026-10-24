
const mongoose = require('mongoose');
const MONGO_URI = 'mongodb+srv://ctfuz_admin:AKKSAVDON137@ctf-uz-cluster.vtjol3t.mongodb.net/ctf-uz?retryWrites=true&w=majority'; 

const { LearningPath, Module, Lesson, Question } = require('./models/Learn');

async function seedData() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Jonli bazaga ulanildi.');

        await LearningPath.deleteMany({ slug: { $in: ['4-yol-tarmoq', '5-yol-pentest', '6-yol-web', '7-yol-exploit'] } });

        // 4-YO'L: TARMOQ
        const path4 = await LearningPath.create({
            title: "4-yo'l. Tarmoq asoslari va hujumlar", slug: "4-yol-tarmoq",
            description: "OSI modeli, TCP/IP, Nmap orqali skanerlash va MITM hujumlari.",
            order: 4, isPublished: true, level: "Intermediate", certificateTitle: "Tarmoq Xavfsizligi Mutaxassisi",
            finalQuestions: [
                { id: "p4q1", prompt: "Nmap orqali yashirin (Stealth) SYN skanerlash qaysi bayroq bilan amalga oshiriladi?", options: ["-sT", "-sS", "-sU", "-O"], correctAnswer: "-sS", points: 10 }
            ]
        });
        const mod4 = await Module.create({ title: "Tarmoq Skanerlash (Nmap)", slug: "4-yol-m1", pathSlug: path4.slug, order: 1 });
        const l4 = await Lesson.create({
            title: "1. Nmap va portlarni o'rganish", slug: "4-yol-l1", moduleSlug: mod4.slug, order: 1, xpReward: 50,
            content: "Nmap — tarmoq xaritasi va ochiq portlarni aniqlovchi eng kuchli vosita. TCP xandshake jarayonining yarmini bajarish orqali (SYN skanerlash) biz iz qoldirmasdan server holatini bilib olishimiz mumkin."
        });
        await Question.create([{ lessonId: l4._id, prompt: "Nmap orqali operatsion tizim (OS) versiyasini aniqlash bayrog'i qaysi?", options: ["-sV", "-O", "-p-", "-A"], correctAnswer: "-O", points: 20 }]);

        // 5-YO'L: VOSITALAR
        const path5 = await LearningPath.create({
            title: "5-yo'l. Pentesting vositalari", slug: "5-yol-pentest",
            description: "Metasploit va Burp Suite arxitekturasi.",
            order: 5, isPublished: true, level: "Advanced", certificateTitle: "Pentesting Vositalari Mutaxassisi",
            finalQuestions: [
                { id: "p5q1", prompt: "Burp Suite vositasida brauzer trafigini ushlab qoluvchi asosiy bo'lim qanday nomlanadi?", options: ["Repeater", "Intruder", "Proxy (Intercept)", "Decoder"], correctAnswer: "Proxy (Intercept)", points: 10 }
            ]
        });
        const mod5 = await Module.create({ title: "Web Proxy va Trafik", slug: "5-yol-m1", pathSlug: path5.slug, order: 1 });
        const l5 = await Lesson.create({
            title: "1. Burp Suite orqali MITM", slug: "5-yol-l1", moduleSlug: mod5.slug, order: 1, xpReward: 50,
            content: "Burp Suite brauzer va server o'rtasida turib barcha so'rovlarni (HTTP Request) ushlab qoladi. Bu orqali narxlarni o'zgartirish yoki yashirin parametrlarni tahrirlash mumkin."
        });
        await Question.create([{ lessonId: l5._id, prompt: "Ushlab qolingan so'rovni takta-takror jo'natib, har xil ssenariylarni sinab ko'rish uchun qaysi Burp Suite bo'limi ishlatiladi?", options: ["Proxy", "Repeater", "Sequencer", "Comparer"], correctAnswer: "Repeater", points: 20 }]);

        // 6-YO'L: WEB PENTESTING
        const path6 = await LearningPath.create({
            title: "6-yo'l. Web Pentesting (OWASP Top 10)", slug: "6-yol-web",
            description: "XSS, SQLi, CSRF kabi zamonaviy web zaifliklar va ularning ekspluatatsiyasi.",
            order: 6, isPublished: true, level: "Advanced", certificateTitle: "Web Xavfsizlik Eksperti",
            finalQuestions: [
                { id: "p6q1", prompt: "Qaysi zaiflik orqali ma'lumotlar bazasidan yashirin jadvallarni o'qib olish mumkin?", options: ["XSS", "CSRF", "SQLi", "SSRF"], correctAnswer: "SQLi", points: 10 }
            ]
        });
        const mod6 = await Module.create({ title: "Inyeksiyalar va XSS", slug: "6-yol-m1", pathSlug: path6.slug, order: 1 });
        const l6 = await Lesson.create({
            title: "1. Cross-Site Scripting (XSS)", slug: "6-yol-l1", moduleSlug: mod6.slug, order: 1, xpReward: 50,
            content: "XSS — bu boshqa foydalanuvchilarning brauzerida zararli JavaScript kodini ishga tushirish zaifligidir. Bu orqali ularning cookie (sessiya) fayllarini o'g'irlash mumkin."
        });
        await Question.create([{ lessonId: l6._id, prompt: "Foydalanuvchi kiritgan ma'lumot (masalan, izoh) to'g'ridan-to'g'ri bazaga saqlanib, keyin barchaga ko'rsatilsa, bu qaysi XSS turiga kiradi?", options: ["Reflected XSS", "Stored XSS", "DOM-based XSS", "Blind XSS"], correctAnswer: "Stored XSS", points: 20 }]);

        console.log('✅ 4, 5 va 6-yo`nalishlar bazaga muvaffaqiyatli yozildi!');
        process.exit(0);
    } catch (err) { console.error(err); process.exit(1); }
}
seedData();
