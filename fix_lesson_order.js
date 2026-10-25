require('dotenv').config();
const mongoose = require('mongoose');
const { Module, Lesson } = require('./models/Learn');

async function fixOrder() {
    const ATLAS_URI = "mongodb+srv://ctfuz_admin:AKKSAVDON137@ctf-uz-cluster.vtjol3t.mongodb.net/ctf-uz?retryWrites=true&w=majority";
    await mongoose.connect(ATLAS_URI);
    console.log("🔗 Bazaga ulandi. Darslar tartibi tekshirilmoqda...");

    const modules = await Module.find({ pathSlug: 'ntfk1-1' }).lean();
    
    for (const mod of modules) {
        // Shu modulga tegishli barcha darslarni slug yoki nomidagi raqam bo'yicha saralaymiz
        const lessons = await Lesson.find({ moduleSlug: mod.slug }).sort({ slug: 1 }).lean();
        
        let orderCounter = 1;
        for (const les of lessons) {
            await Lesson.updateOne(
                { _id: les._id },
                { $set: { order: orderCounter } }
            );
            console.log(`✅ [Modul: ${mod.slug}] -> ${les.slug} darsining tartibi ${orderCounter} qilib belgilandi.`);
            orderCounter++;
        }
    }

    console.log("\n🎉 Barcha darslarning ketma-ketlik tartibi muvaffaqiyatli to'g'rilandi!");
    await mongoose.disconnect();
}

fixOrder().catch(err => {
    console.error('❌ Xatolik:', err);
    process.exit(1);
});
