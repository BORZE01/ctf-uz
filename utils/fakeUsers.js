const User = require('../models/User');
const Challenge = require('../models/Challenge');
const bcrypt = require('bcryptjs');

const UZBEK_NAMES = [
    'Aziz Karimov', 'Dilshod Rahimov', 'Jasur Toshmatov', 'Bobur Yusupov',
    'Sardor Aliyev', 'Shahzod Nazarov', 'Kamola Saidova', 'Nilufar Ergasheva',
    'Zulfiya Rahimova', 'Malika Abdullayeva', 'Umid Toshpulatov', 'Bekzod Ismoilov',
    'Doston Xolmatov', 'Otabek Yo\'ldoshev', 'Rustam Umarov', 'Farrux Qodirov',
    'Laziza Karimova', 'Shahnoza Tursunova', 'Gulnora Yusupova', 'Madina Saidova'
];

const CITIES = ['Toshkent', 'Samarqand', 'Buxoro', 'Farg\'ona', 'Andijon', 'Namangan'];

function random(arr) {
    if (!arr || arr.length === 0) return null;
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seedFakeUsers(count = 20) {
    try {
        console.log(`🌱 ${count} ta fake foydalanuvchi yaratilmoqda...`);

        const existingCount = await User.countDocuments({ isFake: true });
        if (existingCount >= count) {
            console.log(`✅ ${existingCount} ta fake mavjud`);
            return;
        }

        const challenges = await Challenge.find().select('_id category').lean();
        if (challenges.length === 0) {
            console.log('⚠️ Challenges yo\'q');
            return;
        }

        const password = await bcrypt.hash('password123', 12);
        let created = 0;

        for (let i = existingCount; i < count; i++) {
            const name = UZBEK_NAMES[i % UZBEK_NAMES.length];
            const username = `fake_${name.toLowerCase().replace(/\s+/g, '_')}_${i}`;

            const exists = await User.findOne({ username });
            if (exists) continue;

            const solvedCount = randomInt(3, 15);
            const solved = [];
            for (let j = 0; j < solvedCount; j++) {
                const c = random(challenges);
                if (c && !solved.includes(c._id)) solved.push(c._id);
            }

            const score = solvedCount * randomInt(50, 200);

            await User.create({
                name,
                username,
                phone: `998${randomInt(900000000, 999999999)}`,
                email: `${username}@ctf.uz`,
                password,
                region: random(CITIES),
                city: random(CITIES),
                verified: true,
                isFake: true,
                score,
                xp: score,
                cyberLevel: Math.floor(score / 1000) + 1,
                solvedChallenges: solved,
                skills: {
                    web: randomInt(20, 95),
                    pwn: randomInt(10, 90),
                    rev: randomInt(10, 85),
                    crypto: randomInt(15, 90),
                    forensics: randomInt(20, 95),
                    osint: randomInt(30, 98),
                    linux: randomInt(40, 95),
                    networking: randomInt(30, 90),
                    cloud: randomInt(10, 80),
                    blue: randomInt(20, 90)
                },
                battleRating: randomInt(900, 2000),
                streak: randomInt(0, 30),
                analytics: { solved: solvedCount, attempted: 0, successRate: 100 },
                createdAt: new Date(Date.now() - randomInt(0, 90) * 86400000)
            });

            created++;
        }

        console.log(`✅ ${created} ta fake foydalanuvchi qo'shildi`);
    } catch (err) {
        console.error('❌ Fake users xatosi:', err.message);
    }
}

function startLiveUpdates() {
    setInterval(async () => {
        try {
            const fakeUsers = await User.find({ isFake: true }).select('_id score').lean();
            if (fakeUsers.length === 0) return;

            const randomUser = random(fakeUsers);
            const delta = randomInt(-30, 150);
            const newScore = Math.max(0, randomUser.score + delta);

            await User.updateOne(
                { _id: randomUser._id },
                {
                    score: newScore,
                    xp: newScore,
                    cyberLevel: Math.floor(newScore / 1000) + 1,
                    lastActive: new Date()
                }
            );
        } catch (e) {}
    }, 30000);

    console.log('⚡ Live updates yoqildi');
}

module.exports = { seedFakeUsers, startLiveUpdates };