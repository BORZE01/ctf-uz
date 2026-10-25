const mongoose = require('mongoose');
const MONGO_URI = "mongodb+srv://ctfuz_admin:AKKSAVDON137@ctf-uz-cluster.vtjol3t.mongodb.net/ctf-uz?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI).then(async () => {
    console.log("🧹 Tozalash jarayoni boshlandi. Barcha 1-yo'l ma'lumotlari qidirilmoqda...");
    const db = mongoose.connection.db;

    // 1-yo'lga tegishli barcha variantlarni topamiz
    const paths = await db.collection('learningpaths').find({
        $or: [
            { slug: "kiberxavfsizlik-1-oylik-kirish-yoli" },
            { title: { $regex: /1-yo'l/i } },
            { title: { $regex: /Kiberxavfsizlik: 1-oy/i } }
        ]
    }).toArray();

    if (paths.length === 0) {
        console.log("✅ 1-yo'l bazada umuman yo'q. Baza top-toza!");
        process.exit(0);
    }

    const pathIds = paths.map(p => p._id);
    console.log(`Topildi: ${pathIds.length} ta eski 1-yo'l formati.`);

    // Modullarni topish
    const modules = await db.collection('modules').find({
        $or: [{ pathId: { $in: pathIds } }, { learningPath: { $in: pathIds } }, { course: { $in: pathIds } }]
    }).toArray();
    const modIds = modules.map(m => m._id);

    // Darslarni topish
    const lessons = await db.collection('lessons').find({
        $or: [
            { pathId: { $in: pathIds } },
            { learningPath: { $in: pathIds } },
            { moduleId: { $in: modIds } },
            { module: { $in: modIds } },
            { slug: { $regex: /^path1-dars-/ } }
        ]
    }).toArray();
    const lesIds = lessons.map(l => l._id);

    // O'CHIRISH JARAYONI
    if (lesIds.length > 0) {
        const qRes = await db.collection('questions').deleteMany({ lessonId: { $in: lesIds } });
        console.log(`🗑️ ${qRes.deletedCount} ta savol o'chirildi.`);
        
        const lRes = await db.collection('lessons').deleteMany({ _id: { $in: lesIds } });
        console.log(`🗑️ ${lRes.deletedCount} ta dars o'chirildi.`);
    }

    if (modIds.length > 0) {
        const mRes = await db.collection('modules').deleteMany({ _id: { $in: modIds } });
        console.log(`🗑️ ${mRes.deletedCount} ta modul o'chirildi.`);
    }

    const pRes = await db.collection('learningpaths').deleteMany({ _id: { $in: pathIds } });
    console.log(`🗑️ ${pRes.deletedCount} ta kurs (yo'l) o'chirildi.`);

    // Foydalanuvchi progresslarini tozalash
    const collections = await db.listCollections().toArray();
    for (let col of collections) {
        const name = col.name.toLowerCase();
        if (name.includes('progress') || name.includes('enroll') || name.includes('userpath')) {
            try {
                await db.collection(col.name).deleteMany({ pathId: { $in: pathIds } });
                await db.collection(col.name).deleteMany({ learningPath: { $in: pathIds } });
            } catch(e) {}
        }
    }

    try {
        await db.collection('users').updateMany({}, {
            $pull: { 
                enrolledPaths: { pathId: { $in: pathIds } }, 
                progress: { pathId: { $in: pathIds } },
                courses: { courseId: { $in: pathIds } }
            }
        });
        console.log(`🗑️ Foydalanuvchilarning chala qolgan xotirasi (progress) tozalandi.`);
    } catch(e) {}

    console.log("✅ BAZA 100% TOZALANDI!");
    process.exit(0);
});
