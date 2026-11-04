const mongoose = require('mongoose');
const User = require('./models/User');

require('dotenv').config(); 
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ctf-uz';

mongoose.connect(uri)
  .then(async () => {
     console.log("⏳ Bazaga ulanilmoqda...");
     // jasur7 foydalanuvchisini topib, levelini 1 ga o'zgartirish
     const user = await User.findOneAndUpdate(
         { username: 'jasur7' }, 
         { level: 1 },
         { new: true }
     );
     
     if(user) {
         console.log("✅ Muvaffaqiyatli! @jasur7 profilining darajasi (Level) 1 ga tushirildi!");
         console.log(`Hozirgi holat: Score: ${user.score}, Level: ${user.level}`);
     } else {
         console.log("⚠️ @jasur7 foydalanuvchisi topilmadi.");
     }
     process.exit(0);
  })
  .catch(err => {
     console.error("❌ Xatolik:", err.message);
     process.exit(1);
  });
