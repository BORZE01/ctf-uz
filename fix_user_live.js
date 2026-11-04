const mongoose = require('mongoose');
const User = require('./models/User');

const uri = 'mongodb+srv://ctfuz_admin:AKKSAVDON137@ctf-uz-cluster.vtjol3t.mongodb.net/ctf-uz?retryWrites=true&w=majority';

mongoose.connect(uri)
  .then(async () => {
     console.log("⏳ Jonli bazaga ulanilmoqda...");
     
     const user = await User.findOneAndUpdate(
         { username: 'jasur7' },
         {
             level: 1,
             cyberLevel: 1,
             score: 7171 // Ballni butun songa yaxlitlaymiz
         },
         { new: true }
     );

     if(user) {
         console.log("✅ Muvaffaqiyatli! @jasur7 profilining darajasi 1 ga tushirildi!");
         console.log(`Hozirgi holat: Score: ${user.score}, Level: ${user.level || user.cyberLevel}`);
     } else {
         console.log("⚠️ @jasur7 foydalanuvchisi topilmadi.");
     }
     process.exit(0);
  })
  .catch(err => {
     console.error("❌ Xatolik:", err.message);
     process.exit(1);
  });
