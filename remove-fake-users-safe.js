require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const mongoose = require('mongoose');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');

const User = require('./models/User');

const filter = {
    isFake: true,
    username: /^fake_/i
};

async function main() {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
        throw new Error('MONGODB_URI .env faylida topilmadi.');
    }

    const parsed = new URL(uri);
    const databaseName = decodeURIComponent(
        parsed.pathname.replace(/^\/+/, '').split('/')[0] || ''
    );

    if (databaseName !== 'ctf-uz') {
        throw new Error(
            `Noto'g'ri baza: ${databaseName}. Faqat ctf-uz bazasi ruxsat etilgan.`
        );
    }

    await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000
    });

    console.log('MongoDB ulandi. Baza:', databaseName);

    const users = await User.find(filter).lean();

    console.log(`Topilgan fake akkauntlar: ${users.length}`);

    console.table(
        users.slice(0, 50).map(user => ({
            id: String(user._id),
            username: user.username,
            isFake: user.isFake
        }))
    );

    // Oddiy ishga tushirish — faqat tekshiruv
    if (!process.argv.includes('--delete')) {
        console.log('DRY-RUN: hech narsa o‘chirilmadi.');
        console.log("O'chirish uchun avval natijalarni tekshiring.");
        return;
    }

    if (process.env.CONFIRM_DELETE_FAKES !== 'YES') {
        throw new Error(
            "O'chirish bekor qilindi. Tasdiq uchun CONFIRM_DELETE_FAKES=YES kerak."
        );
    }

    if (users.length === 0) {
        console.log("O'chiriladigan fake foydalanuvchi yo'q.");
        return;
    }

    // O'chirishdan oldin backup
    const backupPath = path.join(
        os.tmpdir(),
        `ctf-uz-fake-users-${Date.now()}.json`
    );

    await fs.writeFile(
        backupPath,
        JSON.stringify(users, null, 2),
        { mode: 0o600, flag: 'wx' }
    );

    console.log('Backup yaratildi:', backupPath);

    // Faqat tekshirilgan ID larni va ikkala shartni moslab o'chirish
    const result = await User.deleteMany({
        _id: { $in: users.map(user => user._id) },
        isFake: true,
        username: /^fake_/i
    });

    const remaining = await User.countDocuments(filter);

    console.log(`O'chirilgan: ${result.deletedCount}`);
    console.log(`Qolgan fake akkauntlar: ${remaining}`);
}

main()
    .catch(err => {
        console.error('XATO:', err.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    });
