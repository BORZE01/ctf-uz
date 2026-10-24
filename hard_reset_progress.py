import os

code = """
const mongoose = require('mongoose');
const MONGO_URI = 'mongodb+srv://ctfuz_admin:AKKSAVDON137@ctf-uz-cluster.vtjol3t.mongodb.net/ctf-uz?retryWrites=true&w=majority'; 

async function hardReset() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Veritabanına bağlanıldı. Koleksiyonlar tamamen siliniyor (drop)...');
        
        const collections = await mongoose.connection.db.listCollections().toArray();
        const colNames = collections.map(c => c.name);
        
        const targets = ['learnsubmissions', 'progresses', 'pathenrollments', 'assessmentattempts'];
        
        for (let target of targets) {
            if (colNames.includes(target)) {
                await mongoose.connection.db.dropCollection(target);
                console.log(`✅ ${target} koleksiyonu tamamen silindi.`);
            }
        }
        
        console.log('✅ Tüm eski ilerlemeler kökten temizlendi!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Hata:', err);
        process.exit(1);
    }
}
hardReset();
"""

with open("hard_reset_progress.js", "w", encoding="utf-8") as f:
    f.write(code)
