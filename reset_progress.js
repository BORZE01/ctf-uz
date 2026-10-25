const mongoose = require('mongoose');
const MONGO_URI = "mongodb+srv://ctfuz_admin:AKKSAVDON137@ctf-uz-cluster.vtjol3t.mongodb.net/ctf-uz?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI).then(async () => {
    console.log("Bazaga ulandi. Shaxsiy progress xotirasi va UI qiyinchilik darajasi tozalanmoqda...");
    const db = mongoose.connection.db;

    const targetPath = await db.collection('learningpaths').findOne({ slug: "kiberxavfsizlik-1-oylik-kirish-yoli" });
    if (!targetPath) {
        console.log("❌ 1-yo'l topilmadi.");
        process.exit(1);
    }

    // 1. Qiyinchilik darajasini aniq BEGINNER ga qaytarish va raqamlarni mustahkamlash
    await db.collection('learningpaths').updateOne(
        { _id: targetPath._id },
        { $set: { 
            difficulty: "BEGINNER",
            totalModules: 5,
            totalLessons: 20,
            modulesCount: 5,
            lessonsCount: 20
        }}
    );

    // 2. Tizimdagi barcha kolleksiyalarni aylanib chiqib, shu kursga tegishli 'Eskirgan Progress' ni o'chirish
    const collections = await db.listCollections().toArray();
    const coreCols = ['learningpaths', 'modules', 'lessons', 'questions'];
    
    let deletedCount = 0;
    for (let col of collections) {
        if (!coreCols.includes(col.name) && col.name !== 'users') {
            try {
                const res1 = await db.collection(col.name).deleteMany({ pathId: targetPath._id });
                const res2 = await db.collection(col.name).deleteMany({ learningPath: targetPath._id });
                const res3 = await db.collection(col.name).deleteMany({ courseId: targetPath._id });
                deletedCount += (res1.deletedCount + res2.deletedCount + res3.deletedCount);
            } catch(e) {}
        }
    }

    // 3. Agar progress 'users' kolleksiyasi ichida array bo'lib saqlangan bo'lsa, uni ham tozalash
    try {
        await db.collection('users').updateMany(
            {},
            { $pull: { 
                enrolledPaths: { pathId: targetPath._id },
                courses: { courseId: targetPath._id },
                learningPaths: { pathId: targetPath._id },
                progress: { pathId: targetPath._id }
            }}
        );
    } catch(e) {}

    console.log(`✅ Tayyor! ${deletedCount} ta eskirgan progress xotirasi o'chirildi va kurs BEGINNER darajasiga qaytarildi.`);
    process.exit(0);
});
