const mongoose = require('mongoose');
const MONGO_URI = "mongodb+srv://ctfuz_admin:AKKSAVDON137@ctf-uz-cluster.vtjol3t.mongodb.net/ctf-uz?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI).then(async () => {
    console.log("Bazaga ulandi. Darslar soni frontend uchun to'g'rilanmoqda...");
    const db = mongoose.connection.db;

    const targetPath = await db.collection('learningpaths').findOne({ slug: "kiberxavfsizlik-1-oylik-kirish-yoli" });

    if (targetPath) {
        const modules = await db.collection('modules').find({ pathId: targetPath._id }).toArray();
        let totalLessonsForPath = 0;

        for (let mod of modules) {
            // Modulga tegishli darslarni topish
            const lessons = await db.collection('lessons').find({ moduleId: mod._id }).toArray();
            const lessonIds = lessons.map(l => l._id);

            // Modul ichiga darslar sonini va ID ro'yxatini kiritish
            await db.collection('modules').updateOne(
                { _id: mod._id },
                { $set: { 
                    lessons: lessonIds, 
                    totalLessons: lessons.length,
                    lessonsCount: lessons.length
                }}
            );
            totalLessonsForPath += lessons.length;
        }

        // Asosiy yo'l (Path) ichidagi umumiy darslar sonini yangilash
        await db.collection('learningpaths').updateOne(
            { _id: targetPath._id },
            { $set: { totalLessons: totalLessonsForPath, lessonsCount: totalLessonsForPath } }
        );

        console.log(`✅ Muammo hal qilindi! Jami ${totalLessonsForPath} ta dars modul va yo'llarga biriktirildi.`);
    } else {
        console.log("❌ 1-yo'l topilmadi.");
    }
    process.exit(0);
});
