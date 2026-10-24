import os

code = """
const mongoose = require('mongoose');
const MONGO_URI = 'mongodb+srv://ctfuz_admin:AKKSAVDON137@ctf-uz-cluster.vtjol3t.mongodb.net/ctf-uz?retryWrites=true&w=majority'; 

const { Question } = require('./models/Learn');

async function fixAll() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Jonli bazaga ulanildi. Barcha savollar tahlil qilinmoqda...');
        
        const questions = await Question.find({});
        let count = 0;
        
        for (let q of questions) {
            let needsSave = false;
            
            // Eski formatdagi "question" maydonini "prompt" ga o'tkazish
            if (!q.prompt && q.question) {
                q.prompt = q.question;
                needsSave = true;
            }
            
            // "answers" massivini "correctAnswer" orqali to'ldirish
            if ((!q.answers || q.answers.length === 0) && q.correctAnswer) {
                q.answers = [String(q.correctAnswer).trim()];
                needsSave = true;
            }
            
            if (needsSave) {
                await q.save();
                count++;
            }
        }
        
        console.log(`✅ Jami ${count} ta savol barcha modullarda muvaffaqiyatli to'g'rilandi!`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Xatolik:', err);
        process.exit(1);
    }
}
fixAll();
"""

with open("fix_all_questions.js", "w", encoding="utf-8") as f:
    f.write(code)
