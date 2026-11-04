const mongoose = require('mongoose');

// Jonli baza manzili
const uri = 'mongodb+srv://ctfuz_admin:AKKSAVDON137@ctf-uz-cluster.vtjol3t.mongodb.net/ctf-uz?retryWrites=true&w=majority';

mongoose.connect(uri)
  .then(async () => {
     console.log("⏳ Jonli bazaga ulanilmoqda...");
     
     const UserSchema = new mongoose.Schema({}, { strict: false, collection: 'users' });
     const User = mongoose.models.User || mongoose.model('User', UserSchema);

     const users = await User.find({});
     let count = 0;

     for (let user of users) {
         let score = user.score || user.ball || user.points || 0;
         
         // Profil sahifasidagi 7-levelga moslash uchun formulani qo'llaymiz
         let calculatedLevel = Math.floor(score / 1000); 
         if (calculatedLevel < 1) calculatedLevel = 1;

         await User.updateOne(
             { _id: user._id },
             {
                 $set: {
                     level: calculatedLevel,
                     cyberLevel: calculatedLevel
                 }
             }
         );
         count++;
     }

     console.log(`✅ Muvaffaqiyatli! Barcha ${count} ta foydalanuvchining Level ko'rsatkichi Balliga qarab sinxronlandi.`);
     process.exit(0);
  })
  .catch(err => {
     console.error("❌ Xatolik:", err.message);
     process.exit(1);
  });
