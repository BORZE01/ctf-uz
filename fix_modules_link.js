const mongoose = require('mongoose');
const MONGO_URI = "mongodb+srv://ctfuz_admin:AKKSAVDON137@ctf-uz-cluster.vtjol3t.mongodb.net/ctf-uz?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI).then(async () => {
    console.log("Bazaga ulandi. Modullar frontend uchun ulanmoqda...");
    const db = mongoose.connection.db;

    const targetPath = await db.collection('learningpaths').findOne({ slug: "kiberxavfsizlik-1-oylik-kirish-yoli" });

    if (targetPath) {
        // 1. Modullarni topish va ularning ID larini ajratib olish
        const modules = await db.collection('modules').find({ pathId: targetPath._id }).sort({ order: 1 }).toArray();
        const moduleIds = modules.map(m => m._id);

        // 2. Asosiy yo'lga (LearningPath) modullar ro'yxatini kiritish
        await db.collection('learningpaths').updateOne(
            { _id: targetPath._id },
            { $set: { modules: moduleIds } }
        );

        // 3. Barcha modullarni saytda ochiq (published) holatiga keltirish
        await db.collection('modules').updateMany(
            { pathId: targetPath._id },
            { $set: { status: "published", isPublished: true, visibility: "public" } }
        );

        // 4. Barcha darslarni ham ochiq (published) holatiga keltirish (ehtiyot shart)
        await db.collection('lessons').updateMany(
            { pathId: targetPath._id },
            { $set: { status: "published", isPublished: true, visibility: "public" } }
        );

        console.log(`✅ Muammo hal qilindi! ${moduleIds.length} ta modul kursga biriktirildi va hammaga ochiq holatga o'tkazildi.`);
    } else {
        console.log("❌ 1-yo'l topilmadi.");
    }
    process.exit(0);
});
