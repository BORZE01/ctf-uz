const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

// Agar .env faylingiz bo'lsa, uni o'qiydi
require('dotenv').config(); 
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ctf-uz';

mongoose.connect(uri)
  .then(async () => {
     console.log("⏳ Bazaga ulanilmoqda...");
     const hash = await bcrypt.hash('1657', 12);
     const user = await User.findOneAndUpdate(
         { username: 'jasur7' }, // Agar yuzername boshqa bo'lsa, shu yerni o'zgartiring
         { role: 'super_admin', password: hash },
         { new: true }
     );
     if(user) {
         console.log("✅ Tabriklaymiz! @jasur7 profili Super Admin darajasiga ko'tarildi!");
         console.log("🔑 Yangi parol: Admin123!");
     } else {
         console.log("⚠️ @jasur7 foydalanuvchisi topilmadi.");
     }
     process.exit(0);
  })
  .catch(err => {
     console.error("Xatolik:", err.message);
     process.exit(1);
  });
