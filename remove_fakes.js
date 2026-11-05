const mongoose = require('mongoose');
const uri = 'mongodb+srv://ctfuz_admin:AKKSAVDON137@ctf-uz-cluster.vtjol3t.mongodb.net/ctf-uz?retryWrites=true&w=majority';

mongoose.connect(uri).then(async () => {
    console.log("⏳ Bazaga ulanilmoqda...");
    const UserSchema = new mongoose.Schema({}, { strict: false, collection: 'users' });
    const User = mongoose.models.User || mongoose.model('User', UserSchema);
    
    const result = await User.deleteMany({ role: 'fake' });
    console.log(`✅ ${result.deletedCount} ta Fake User bazadan butunlay o'chirib tashlandi!`);
    process.exit(0);
}).catch(err => {
    console.error("Xato:", err);
    process.exit(1);
});