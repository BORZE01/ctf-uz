const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI).then(async () => {
    if (!fs.existsSync('backup_path1.json')) {
        console.error("❌ backup_path1.json topilmadi!");
        process.exit(1);
    }
    const backup = JSON.parse(fs.readFileSync('backup_path1.json', 'utf-8'));
    const db = mongoose.connection.db;

    const pathId = new mongoose.Types.ObjectId(backup.learningPath._id);
    const currentMods = await db.collection('modules').find({ pathId }).toArray();
    const currentModIds = currentMods.map(m => m._id);
    const currentLessons = await db.collection('lessons').find({ moduleId: { $in: currentModIds } }).toArray();
    const currentLessonIds = currentLessons.map(l => l._id);

    await db.collection('questions').deleteMany({ lessonId: { $in: currentLessonIds } });
    await db.collection('lessons').deleteMany({ _id: { $in: currentLessonIds } });
    await db.collection('modules').deleteMany({ _id: { $in: currentModIds } });

    if (backup.modules.length) await db.collection('modules').insertMany(backup.modules);
    if (backup.lessons.length) await db.collection('lessons').insertMany(backup.lessons);
    if (backup.questions.length) await db.collection('questions').insertMany(backup.questions);

    console.log("✅ 1-yo'l backup'dan muvaffaqiyatli qayta tiklandi!");
    process.exit(0);
});
