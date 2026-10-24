import os

code = """
const mongoose = require('mongoose');
const MONGO_URI = 'mongodb+srv://ctfuz_admin:AKKSAVDON137@ctf-uz-cluster.vtjol3t.mongodb.net/ctf-uz?retryWrites=true&w=majority'; 

const { Lesson, Question } = require('./models/Learn');

async function fix() {
    try {
        await mongoose.connect(MONGO_URI);
        
        const l1 = await Lesson.findOne({ slug: "1-yol-m1-l1" });
        const l2 = await Lesson.findOne({ slug: "1-yol-m1-l2" });
        const l3 = await Lesson.findOne({ slug: "1-yol-m1-l3" });

        if (l1) {
            await Question.deleteMany({ lessonId: l1._id });
            await Question.create([
                { lessonId: l1._id, question: "Ma'lumotlarning tranzit vaqtida o'zgartirilmaganini tasdiqlash uchun CIA triadasining qaysi tamoyilidan foydalaniladi?", options: ["Maxfiylik", "Yaxlitlik", "Mavjudlik", "Autentifikatsiya"], answers: ["Yaxlitlik"], correctAnswer: "Yaxlitlik", points: 20 },
                { lessonId: l1._id, question: "Tizimga qilingan massiv trafik hujumi (DDoS) qaysi xavfsizlik tamoyilini bevosita ishdan chiqarishga qaratilgan?", options: ["Maxfiylik", "Yaxlitlik", "Mavjudlik", "Shifrlash"], answers: ["Mavjudlik"], correctAnswer: "Mavjudlik", points: 20 }
            ]);
        }

        if (l2) {
            await Question.deleteMany({ lessonId: l2._id });
            await Question.create([
                { lessonId: l2._id, question: "Siyosiy yoki ijtimoiy maqsadlarda tizimlarni buzuvchi guruhlar qanday nomlanadi?", options: ["Red Hat", "Hacktivistlar", "Script Kiddies", "White Hat"], answers: ["Hacktivistlar"], correctAnswer: "Hacktivistlar", points: 20 },
                { lessonId: l2._id, question: "O'zlashtirilgan bilimi bo'lmagan holda, tayyor vositalar orqali zarar yetkazishga urinadigan shaxslar kimlar?", options: ["Grey Hat", "Black Hat", "Script Kiddie", "Phishers"], answers: ["Script Kiddie"], correctAnswer: "Script Kiddie", points: 20 }
            ]);
        }

        if (l3) {
            await Question.deleteMany({ lessonId: l3._id });
            await Question.create([
                { lessonId: l3._id, question: "Foydalanuvchining shaxsiy fayllarini shifrlab qo'yib, to'lov talab qiluvchi dastur qanday ataladi?", options: ["Spyware", "Ransomware", "Adware", "Trojan"], answers: ["Ransomware"], correctAnswer: "Ransomware", points: 20 },
                { lessonId: l3._id, question: "Yirik tashkilotga uning IT dasturlarini yetkazib beruvchi hamkori tizimini buzish orqali qilinadigan hujum turi qaysi?", options: ["Phishing", "Supply Chain Attack", "DDoS", "Man-in-the-Middle"], answers: ["Supply Chain Attack"], correctAnswer: "Supply Chain Attack", points: 20 }
            ]);
        }

        console.log('✅ Ошибка с форматом вопросов исправлена!');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
fix();
"""

with open("fix_lesson_questions.js", "w", encoding="utf-8") as f:
    f.write(code)
