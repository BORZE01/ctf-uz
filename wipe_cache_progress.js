const mongoose = require('mongoose');
const MONGO_URI = "mongodb+srv://ctfuz_admin:AKKSAVDON137@ctf-uz-cluster.vtjol3t.mongodb.net/ctf-uz?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI).then(async () => {
    console.log("🧹 Eski kullanıcı kayıtları ve kilitlenmiş progress temizleniyor...");
    const db = mongoose.connection.db;

    const targetPath = await db.collection('learningpaths').findOne({ slug: "kiberxavfsizlik-1-oylik-kirish-yoli" });

    if(targetPath) {
        // İlerleme ve kayıt koleksiyonlarındaki eski verileri tamamen sil
        const collections = await db.listCollections().toArray();
        for (let col of collections) {
            const name = col.name.toLowerCase();
            if (name.includes('progress') || name.includes('enroll') || name.includes('userpath')) {
                try {
                    await db.collection(col.name).deleteMany({ pathId: targetPath._id });
                    await db.collection(col.name).deleteMany({ learningPath: targetPath._id });
                    await db.collection(col.name).deleteMany({ course: targetPath._id });
                } catch(e) {}
            }
        }

        // Kullanıcı dökümanlarının içindeki donmuş array kayıtlarını sil
        try {
            await db.collection('users').updateMany(
                {},
                { $pull: {
                    enrolledPaths: { pathId: targetPath._id },
                    courses: { courseId: targetPath._id },
                    learningPaths: { pathId: targetPath._id }
                }}
            );
        } catch(e) {}

        console.log("✅ Kullanıcı ilerlemeleri sıfırlandı. Kurs taze bir başlangıca hazır.");
    }
    process.exit(0);
});
