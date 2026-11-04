const mongoose = require('mongoose');

// Siz taqdim etgan jonli baza manzili
const uri = 'mongodb+srv://ctfuz_admin:AKKSAVDON137@ctf-uz-cluster.vtjol3t.mongodb.net/ctf-uz?retryWrites=true&w=majority';

mongoose.connect(uri)
  .then(async () => {
     console.log("⏳ Jonli bazaga ulanilmoqda...");
     
     // Barcha maxfiy/yashirin maydonlarni o'qish uchun qat'iy bo'lmagan schema
     const UserSchema = new mongoose.Schema({}, { strict: false, collection: 'users' });
     const User = mongoose.models.User || mongoose.model('User', UserSchema);

     // @jasur7 dagi barcha ortiqcha va xato raqamlarni tozalash
     const result = await User.updateOne(
         { username: 'jasur7' },
         {
             $set: { 
                 score: 7171, 
                 level: 1, 
                 cyberLevel: 1,
                 xp: 7171,
                 currentXp: 7171
             },
             $unset: { 
                 points: 1, 
                 ball: 1, 
                 requiredXp: 1,
                 totalXp: 1, 
                 reyting: 1 
             }
         }
     );

     if (result.matchedCount > 0) {
         console.log("✅ G'ayritabiiy raqamlar tozalandi! Profil to'liq 1-Level va 7171 XP holatiga qaytarildi.");
     } else {
         console.log("⚠️ @jasur7 topilmadi.");
     }
     process.exit(0);
  })
  .catch(err => {
     console.error("❌ Xatolik:", err.message);
     process.exit(1);
  });
