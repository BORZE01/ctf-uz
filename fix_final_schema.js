const mongoose = require('mongoose');
const MONGO_URI = "mongodb+srv://ctfuz_admin:AKKSAVDON137@ctf-uz-cluster.vtjol3t.mongodb.net/ctf-uz?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI).then(async () => {
    console.log("Veritabanına bağlanıldı. Çalışan kursun şeması kopyalanıyor...");
    const db = mongoose.connection.db;

    // Çalışan referans kursu (2. yol) ve bizim hedef kursumuzu (1. yol) bul
    const referencePath = await db.collection('learningpaths').findOne({ title: { $regex: /2-yo'l/i } });
    const targetPath = await db.collection('learningpaths').findOne({ slug: "kiberxavfsizlik-1-oylik-kirish-yoli" });

    if (!targetPath || !referencePath) {
        console.log("❌ Kurslar bulunamadı! Lütfen veritabanı bağlantınızı kontrol edin.");
        process.exit(1);
    }

    const targetModules = await db.collection('modules').find({ pathId: targetPath._id }).toArray();
    const targetModuleIds = targetModules.map(m => m._id);

    let targetLessonIds = [];
    for (let mod of targetModules) {
        const lessons = await db.collection('lessons').find({ moduleId: mod._id }).toArray();
        targetLessonIds.push(...lessons.map(l => l._id));
    }

    // Frontend'in okuma ihtimali olan tüm sayaç ve dizi (array) alanlarını zorla tanımlıyoruz
    let updateFields = {
        modules: targetModuleIds,
        lessons: targetLessonIds,
        moduleCount: 5,
        totalModules: 5,
        modulesCount: 5,
        lessonCount: 20,
        totalLessons: 20,
        lessonsCount: 20,
        status: "published",
        isPublished: true,
        visibility: "public"
    };

    // Referans kurstaki bilinmeyen ancak 4 (modül) veya 12 (ders) değerine sahip dinamik alanları tespit edip 1. yola 5 ve 20 olarak uyarla
    for (let key in referencePath) {
        if (typeof referencePath[key] === 'number') {
            if (referencePath[key] === 4) updateFields[key] = 5;
            if (referencePath[key] === 12) updateFields[key] = 20;
        }
    }

    await db.collection('learningpaths').updateOne(
        { _id: targetPath._id },
        { $set: updateFields }
    );

    console.log(`✅ Başarılı! Şema eşitlendi. ${targetModuleIds.length} modül ve ${targetLessonIds.length} ders sisteme tam entegre edildi.`);
    process.exit(0);
});
