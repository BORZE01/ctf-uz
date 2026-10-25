const mongoose = require('mongoose');
const MONGO_URI = "mongodb+srv://ctfuz_admin:AKKSAVDON137@ctf-uz-cluster.vtjol3t.mongodb.net/ctf-uz?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI).then(async () => {
    console.log("Veritabanına bağlanıldı. Şema uyumsuzlukları düzeltiliyor...");
    const db = mongoose.connection.db;

    // Çalışan bir kursu referans al (örneğin 2. yol)
    const workingPath = await db.collection('learningpaths').findOne({ title: { $regex: /2-yo'l/i } });
    const targetPath = await db.collection('learningpaths').findOne({ slug: "kiberxavfsizlik-1-oylik-kirish-yoli" });

    if (targetPath) {
        const updateData = {
            difficulty: "BEGINNER", // UI etiketini "BEGINNER" olarak düzelt
            status: workingPath?.status || "published", // Yayın durumunu çalışan kursla eşitle
            isPublished: true,
            published: true,
            visibility: "public"
        };
        
        await db.collection('learningpaths').updateOne(
            { _id: targetPath._id },
            { $set: updateData }
        );
        console.log("✅ 1-yo'l şeması arayüzle uyumlu hale getirildi (difficulty: BEGINNER).");
    } else {
        console.log("❌ 1-yo'l bulunamadı. Lütfen 'seed_path1_full.js' scriptini tekrar çalıştırın.");
    }
    process.exit(0);
});
