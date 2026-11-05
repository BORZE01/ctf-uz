require('dotenv').config();
const mongoose = require('mongoose');
const Application = require('./models/Application');

async function migrate() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ctf-uz';
    await mongoose.connect(uri);
    console.log("⏳ MongoDB ulandi. Takroriy arizalar tekshirilmoqda...");

    const duplicates = await Application.aggregate([
        { 
            $group: { 
                _id: { jobId: "$jobId", applicantId: "$applicantId" }, 
                count: { $sum: 1 }, 
                docs: { $push: "$_id" } 
            } 
        },
        { $match: { count: { $gt: 1 }, "_id.jobId": { $ne: null }, "_id.applicantId": { $ne: null } } }
    ]);

    if (duplicates.length > 0) {
        console.log(`⚠️ Topildi: ${duplicates.length} ta takroriy ariza guruhi.`);
        for (let dup of duplicates) {
            const [keep, ...remove] = dup.docs;
            await Application.deleteMany({ _id: { $in: remove } });
            console.log(`✅ Takroriy arizalar o'chirildi. Saqlab qolindi: ${keep}`);
        }
    } else {
        console.log("✅ Takroriy arizalar topilmadi.");
    }

    try {
        await Application.collection.createIndex(
            { jobId: 1, applicantId: 1 }, 
            { unique: true, sparse: true }
        );
        console.log("🛡️ Unique index (jobId + applicantId) muvaffaqiyatli o'rnatildi.");
    } catch (e) {
        console.error("❌ Index yaratishda xato:", e.message);
    }

    process.exit(0);
}
migrate();
