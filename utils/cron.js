const User = require('../models/User');

async function checkStreaks() {
    try {
        const now = Date.now();
        const oneDayMs = 24 * 60 * 60 * 1000;

        const users = await User.find({
            isFake: false,
            lastSolveDate: { $exists: true }
        });

        for (const user of users) {
            const lastSolve = new Date(user.lastSolveDate).getTime();
            const diffDays = Math.floor((now - lastSolve) / oneDayMs);
            if (diffDays > 1 && user.streak !== 0) {
                user.streak = 0;
                await user.save();
            }
        }

        console.log('✅ Streak tekshirildi');
    } catch (err) {
        console.error('Streak xatosi:', err.message);
    }
}

function startCron() {
    setInterval(checkStreaks, 60 * 60 * 1000);
    console.log('⏰ Cron ishga tushdi');
}

module.exports = { startCron, checkStreaks };