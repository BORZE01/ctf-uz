require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { connectDB, mongoose } = require('./utils/database');
const { LearningPath, Module, Lesson, Question } = require('./models/Learn');

async function createBackup() {
    await connectDB();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(__dirname, `backup_learn_${timestamp}.json`);

    const data = {
        createdAt: new Date(),
        paths: await LearningPath.find({}).lean(),
        modules: await Module.find({}).lean(),
        lessons: await Lesson.find({}).lean(),
        questions: await Question.find({}).lean()
    };

    fs.writeFileSync(backupFile, JSON.stringify(data, null, 2), 'utf8');
    console.log(`✅ Zaxira nusxa muvaffaqiyatli olindi: ${backupFile}`);
    console.log(`📊 Jami: ${data.paths.length} yo'l, ${data.modules.length} modul, ${data.lessons.length} dars, ${data.questions.length} savol.`);
    await mongoose.disconnect();
}

createBackup().catch(err => {
    console.error('❌ Backup xatosi:', err.message);
    process.exit(1);
});
