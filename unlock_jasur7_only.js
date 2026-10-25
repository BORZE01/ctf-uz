require('dotenv').config();
const mongoose = require('mongoose');
const { Module, Lesson } = require('./models/Learn');
const User = require('./models/User');

async function unlockForJasur7() {
    const ATLAS_URI = "mongodb+srv://ctfuz_admin:AKKSAVDON137@ctf-uz-cluster.vtjol3t.mongodb.net/ctf-uz?retryWrites=true&w=majority";
    await mongoose.connect(ATLAS_URI);
    console.log("🔗 Bazaga ulandi. Faqat 'jasur7' hisobi uchun darslar ochilmoqda...");

    // Faqat jasur7@gmail.com yoki username: jasur7 bo'lgan foydalanuvchini qidiramiz
    const user = await User.findOne({ 
        $or: [
            { username: "jasur7" }, 
            { email: "jasur7@gmail.com" }
        ] 
    });

    if (!user) {
        console.log("❌ 'jasur7' hisobi topilmadi!");
        process.exit(1);
    }
    console.log(`👤 Topilgan foydalanuvchi: ${user.username} (${user.email}) - ID: ${user._id}`);

    // NTFK1 1 yo'liga tegishli barcha modullar va darslarni topamiz
    const modules = await Module.find({ pathSlug: 'ntfk1-1' }).lean();
    const lessons = await Lesson.find({ moduleSlug: { $in: modules.map(m => m.slug) } }).lean();
    
    console.log(`📚 'NTFK1 1' bo'yicha topildi: ${modules.length} ta modul va ${lessons.length} ta dars.`);

    // Progress modelini aniqlaymiz yoki yaratamiz
    const Progress = mongoose.models.Progress || mongoose.model('Progress', new mongoose.Schema({
        userId: mongoose.Schema.Types.ObjectId,
        lessonId: mongoose.Schema.Types.ObjectId,
        moduleSlug: String,
        status: String,
        completedAt: Date
    }, { strict: false }));

    // Faqat shu foydalanuvchi uchun barcha darslarni 'completed' qilamiz
    for (const les of lessons) {
        await Progress.findOneAndUpdate(
            { userId: user._id, lessonId: les._id },
            {
                $set: {
                    userId: user._id,
                    lessonId: les._id,
                    moduleSlug: les.moduleSlug,
                    status: 'completed',
                    completedAt: new Date()
                }
            },
            { upsert: true, new: true }
        );
    }

    console.log(`\n🎉 MUVAFFAQIYATLI! Faqatgina "${user.username}" hisobi uchun "NTFK1 1" darslarining barchasi ochildi va to'liq yakunlangan deb belgilandi!`);
    await mongoose.disconnect();
}

unlockForJasur7().catch(err => {
    console.error('❌ Xatolik:', err);
    process.exit(1);
});
