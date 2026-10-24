import os

code = """
const mongoose = require('mongoose');
const MONGO_URI = 'mongodb+srv://ctfuz_admin:AKKSAVDON137@ctf-uz-cluster.vtjol3t.mongodb.net/ctf-uz?retryWrites=true&w=majority'; 

const { Question } = require('./models/Learn');

async function fixEverything() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Jonli bazaga ulanildi. Barcha yo`llardagi savollar to`g`rilanmoqda...');
        
        // Barcha savollarni raw (lean) formatda xotiraga olish
        const questions = await Question.find({}).lean();
        let count = 0;
        
        for (let q of questions) {
            let updateDoc = {};
            
            // Agar "answers" massivi yo'q yoki bo'sh bo'lsa, "correctAnswer" ni uning ichiga solib qo'shamiz
            if (!q.answers || q.answers.length === 0) {
                if (q.correctAnswer) {
                    updateDoc.answers = [String(q.correctAnswer).trim()];
                }
            }
            
            // Agar eski "question" matni bo'lib, yangi "prompt" maydoni yo'q bo'lsa
            if (!q.prompt && q.question) {
                updateDoc.prompt = q.question;
            }
            
            if (Object.keys(updateDoc).length > 0) {
                // To'g'ridan-to'g'ri bazani yangilash (Schema xatolarini aylanib o'tish uchun)
                await Question.updateOne({ _id: q._id }, { $set: updateDoc });
                count++;
            }
        }
        
        console.log(`✅ Jami ${count} ta savol (2, 3, 4, 5, 6, 7-yollar) muvaffaqiyatli to'g'rilandi!`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Xatolik:', err);
        process.exit(1);
    }
}
fixEverything();
"""

with open("fix_all_paths_questions.js", "w", encoding="utf-8") as f:
    f.write(code)
