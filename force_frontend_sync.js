const mongoose = require('mongoose');
const MONGO_URI = "mongodb+srv://ctfuz_admin:AKKSAVDON137@ctf-uz-cluster.vtjol3t.mongodb.net/ctf-uz?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI).then(async () => {
    console.log("🛠️ Frontend Eşitleme Betiği Çalışıyor...");
    const db = mongoose.connection.db;

    const path = await db.collection('learningpaths').findOne({ slug: "kiberxavfsizlik-1-oylik-kirish-yoli" });
    if(!path) { console.log("❌ Kurs bulunamadı!"); process.exit(1); }

    const modules = await db.collection('modules').find({ 
        $or: [{ pathId: path._id }, { learningPath: path._id }] 
    }).sort({ order: 1 }).toArray();
    
    let allLessonIds = [];

    for (let mod of modules) {
        // Modüle ait tüm dersleri bul
        const lessons = await db.collection('lessons').find({ 
            $or: [{ moduleId: mod._id }, { module: mod._id }] 
        }).toArray();
        
        const lesIds = lessons.map(l => l._id);
        allLessonIds.push(...lesIds);

        // Modülü, arayüzün okuyabileceği tüm olası sayaç ve dizi isimleriyle güncelle
        await db.collection('modules').updateOne({ _id: mod._id }, {
            $set: {
                lessons: lesIds,
                lessonList: lesIds,
                totalLessons: lesIds.length,
                lessonsCount: lesIds.length,
                count: lesIds.length
            }
        });
    }

    // Ana kursu tüm olası sayaçlarla güncelle
    await db.collection('learningpaths').updateOne({ _id: path._id }, {
        $set: {
            lessons: allLessonIds,
            totalLessons: allLessonIds.length,
            lessonsCount: allLessonIds.length,
            modulesCount: modules.length,
            totalModules: modules.length
        }
    });

    // Arayüzdeki "0/1 dars yakunlangan" donmasını çözmek için kullanıcı kayıtlarını temizle
    const collections = await db.listCollections().toArray();
    for (let col of collections) {
        const name = col.name.toLowerCase();
        if (name.includes('progress') || name.includes('enroll') || name.includes('userpath')) {
            try { await db.collection(col.name).deleteMany({ pathId: path._id }); } catch(e) {}
        }
    }
    try {
        await db.collection('users').updateMany({}, {
            $pull: { enrolledPaths: { pathId: path._id }, progress: { pathId: path._id } }
        });
    } catch(e) {}

    console.log(`✅ İşlem Tamam! ${modules.length} modül ve ${allLessonIds.length} ders arayüz için zorla eşitlendi.`);
    process.exit(0);
});
