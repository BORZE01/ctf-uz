import os

code = """
const mongoose = require('mongoose');
const MONGO_URI = 'mongodb+srv://ctfuz_admin:AKKSAVDON137@ctf-uz-cluster.vtjol3t.mongodb.net/ctf-uz?retryWrites=true&w=majority'; 

const { LearnSubmission, Progress, PathEnrollment } = require('./models/Learn');

async function clearData() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Подключено к базе данных.');

        await LearnSubmission.deleteMany({});
        await Progress.deleteMany({});
        await PathEnrollment.deleteMany({});

        console.log('✅ Старый прогресс и конфликтующие ответы успешно удалены!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Ошибка:', err);
        process.exit(1);
    }
}
clearData();
"""

with open("clear_progress.js", "w", encoding="utf-8") as f:
    f.write(code)
