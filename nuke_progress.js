
const mongoose = require('mongoose');
const MONGO_URI = 'mongodb+srv://ctfuz_admin:AKKSAVDON137@ctf-uz-cluster.vtjol3t.mongodb.net/ctf-uz?retryWrites=true&w=majority'; 

async function nuke() {
    try {
        await mongoose.connect(MONGO_URI);
        const db = mongoose.connection.db;
        
        await db.collection('learnsubmissions').deleteMany({});
        await db.collection('progresses').deleteMany({});
        await db.collection('pathenrollments').deleteMany({});
        await db.collection('assessmentattempts').deleteMany({});
        
        console.log('✅ Tüm eski ilerleme kayıtları veritabanı çekirdeğinden kalıcı olarak temizlendi!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Hata:', err);
        process.exit(1);
    }
}
nuke();
