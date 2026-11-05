const mongoose = require('mongoose');

// Mongo URI (oldindan ishlagan URI'ni ishlating yoki .env dan)
const uri = 'mongodb+srv://ctfuz_admin:AKKSAVDON137@ctf-uz-cluster.vtjol3t.mongodb.net/ctf-uz?retryWrites=true&w=majority';

mongoose.connect(uri).then(async () => {
    console.log("⏳ Bazaga ulanilmoqda...");
    const UserSchema = new mongoose.Schema({}, { strict: false, collection: 'users' });
    const User = mongoose.models.User || mongoose.model('User', UserSchema);
    
    const count = await User.countDocuments({ isFake: true });
    console.log(`🔍 Topildi: ${count} ta soxta (isFake: true) foydalanuvchi.`);
    
    if (count > 0) {
        const result = await User.deleteMany({ isFake: true });
        console.log(`✅ ${result.deletedCount} ta Fake User bazadan MUVAFFAQIYATLI O'CHIRILDI!`);
    } else {
        console.log("ℹ️ Bazada o'chirilishi kerak bo'lgan soxta foydalanuvchilar topilmadi.");
    }
    
    process.exit(0);
}).catch(err => {
    console.error("Xato:", err);
    process.exit(1);
});
