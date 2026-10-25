const mongoose = require('mongoose');
const MONGO_URI = "mongodb+srv://ctfuz_admin:AKKSAVDON137@ctf-uz-cluster.vtjol3t.mongodb.net/ctf-uz?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI).then(async () => {
    console.log("Bazaga ulandi. Barcha ehtimoliy bog'lanishlar (schema relation) ta'minlanmoqda...");
    const db = mongoose.connection.db;

    const targetPath = await db.collection('learningpaths').findOne({ slug: "kiberxavfsizlik-1-oylik-kirish-yoli" });

    if (targetPath) {
        const modules = await db.collection('modules').find({ pathId: targetPath._id }).sort({ order: 1 }).toArray();
        const moduleIds = modules.map(m => m._id);

        let allLessonIds = [];

        for (let mod of modules) {
            const lessons = await db.collection('lessons').find({ moduleId: mod._id }).sort({ order: 1 }).toArray();
            const lessonIds = lessons.map(l => l._id);
            allLessonIds.push(...lessonIds);

            // Modulni asosiy yo'lga barcha ehtimoliy kalitlar orqali bog'lash
            await db.collection('modules').updateOne(
                { _id: mod._id },
                { $set: {
                    learningPath: targetPath._id,
                    learningPathId: targetPath._id,
                    course: targetPath._id,
                    courseId: targetPath._id,
                    path: targetPath._id,
                    lessons: lessonIds 
                }}
            );

            // Darslarni modulga barcha ehtimoliy kalitlar orqali bog'lash
            for (let les of lessons) {
                await db.collection('lessons').updateOne(
                    { _id: les._id },
                    { $set: {
                        module: mod._id,
                        learningPath: targetPath._id,
                        course: targetPath._id
                    }}
                );
            }
        }

        // Asosiy yo'lga modullar va darslar ro'yxatini yozish
        await db.collection('learningpaths').updateOne(
            { _id: targetPath._id },
            { $set: { modules: moduleIds, lessons: allLessonIds } }
        );

        console.log(`✅ Universal bog'lanish o'rnatildi! ${moduleIds.length} ta modul va ${allLessonIds.length} ta dars to'liq biriktirildi.`);
    } else {
        console.log("❌ 1-yo'l topilmadi.");
    }
    process.exit(0);
});
