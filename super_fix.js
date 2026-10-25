const mongoose = require('mongoose');
const MONGO_URI = "mongodb+srv://ctfuz_admin:AKKSAVDON137@ctf-uz-cluster.vtjol3t.mongodb.net/ctf-uz?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI).then(async () => {
    console.log("🚀 So'nggi ta'mirlash ishga tushdi...");
    const db = mongoose.connection.db;

    // 1. Ishlayotgan "Foundations" kursidan to'g'ri 'BEGINNER' formatini olamiz
    const foundations = await db.collection('learningpaths').findOne({ title: { $regex: /Foundations/i } });
    const correctBeginner = foundations ? foundations.difficulty : "beginner";

    const targetPath = await db.collection('learningpaths').findOne({ slug: "kiberxavfsizlik-1-oylik-kirish-yoli" });
    if (!targetPath) {
        console.log("❌ 1-yo'l topilmadi!");
        process.exit(1);
    }

    // Modullar va darslarni qidiramiz
    const modules = await db.collection('modules').find({
        $or: [{ pathId: targetPath._id }, { learningPath: targetPath._id }]
    }).toArray();
    const modIds = modules.map(m => m._id);

    let lesIds = [];
    for (let mod of modules) {
        const lessons = await db.collection('lessons').find({
            $or: [{ moduleId: mod._id }, { module: mod._id }]
        }).toArray();
        
        lesIds.push(...lessons.map(l => l._id));

        // Modulni barcha aktivatsiya qoidalari bilan yondirish (isDeleted, active va h.k.)
        await db.collection('modules').updateOne({ _id: mod._id }, {
            $set: {
                pathId: targetPath._id,
                learningPath: targetPath._id,
                course: targetPath._id,
                status: "published",
                isPublished: true,
                published: true,
                active: true,
                isActive: true,
                deleted: false,
                isDeleted: false,
                visibility: "public"
            }
        });

        // Darslarni ham yondirish
        for (let les of lessons) {
            await db.collection('lessons').updateOne({ _id: les._id }, {
                $set: {
                    moduleId: mod._id,
                    module: mod._id,
                    pathId: targetPath._id,
                    learningPath: targetPath._id,
                    course: targetPath._id,
                    status: "published",
                    isPublished: true,
                    published: true,
                    active: true,
                    isActive: true,
                    deleted: false,
                    isDeleted: false,
                    visibility: "public"
                }
            });
        }
    }

    // Asosiy kursni barcha ruxsatnomalar bilan yangilash
    await db.collection('learningpaths').updateOne({ _id: targetPath._id }, {
        $set: {
            difficulty: correctBeginner, // To'g'ri formatdagi qiyinchilik
            modules: modIds,
            lessons: lesIds,
            totalModules: modIds.length,
            totalLessons: lesIds.length,
            modulesCount: modIds.length,
            lessonsCount: lesIds.length,
            status: "published",
            isPublished: true,
            published: true,
            active: true,
            isActive: true,
            deleted: false,
            isDeleted: false,
            visibility: "public"
        }
    });

    console.log(`✅ Tizim to'liq yangilandi! ${modIds.length} ta modul va ${lesIds.length} ta dars ekranga chiqarishga ruxsat oldi.`);
    console.log(`🎯 Qiyinchilik darajasi: "${correctBeginner}" qilib belgilandi.`);
    process.exit(0);
});
