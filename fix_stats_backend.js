const fs = require('fs');
const path = require('path');

// 1. KATEGORIYALAR, FAKE PROFILLAR VA ID XATOLARINI TO'G'RILASH
const routesDir = path.join(__dirname, 'routes');
if (fs.existsSync(routesDir)) {
    const files = fs.readdirSync(routesDir);
    files.forEach(file => {
        if (file.endsWith('.js')) {
            let filePath = path.join(routesDir, file);
            let code = fs.readFileSync(filePath, 'utf8');
            let changed = false;

            // Fake profillarni reytingdan chiqarish va 574 ni haqiqiy hisob-kitobga almashtirish
            if (code.includes('574 +')) {
                code = code.replace(/574\s*\+\s*[a-zA-Z0-9_.\[\]]+/g, "await User.countDocuments({ username: { $not: /^fake_/i }, role: { $ne: 'fake' } })");
                changed = true;
            }
            if (code.includes('User.find(') && !code.includes('fake_')) {
                code = code.replace(/User\.find\(\s*\{?\s*\}?\s*\)/g, "User.find({ username: { $not: /^fake_/i }, role: { $ne: 'fake' } })");
                changed = true;
            }
            
            // Stego va Misc kategoriyalarini kiritish
            if (code.includes("'OSINT'") && !code.includes("'Stego'")) {
                code = code.replace(/'OSINT'/g, "'OSINT', 'Stego', 'Misc'");
                changed = true;
            }

            // ID formatlaridagi to'qnashuvni to'g'rilash (500 xatosi uchun)
            if (code.includes('req.user._id') && !code.includes('toString()')) {
                code = code.replace(/req\.user\._id(?![\.a-zA-Z])/g, 'req.user._id.toString()');
                changed = true;
            }
            
            // Async/await xatosini to'g'rilash
            if (code.match(/skills\s*=\s*calculate/)) {
                code = code.replace(/(const|let)\s+skills\s*=\s*calculate/g, '$1 skills = await calculate');
                changed = true;
            }

            // Challenge attempts va streak ma'lumotlarini yangilash
            if (file === 'challenges.js' && code.includes('user.score +=') && !code.includes('user.lastSolveDate')) {
                code = code.replace(/(user\.score\s*\+=\s*[^;]+;)/g, "$1\n        user.lastSolveDate = new Date();\n        user.streak = (user.streak || 0) + 1;\n        user.totalAttempts = (user.totalAttempts || 0) + 1;");
                changed = true;
            }

            if (changed) fs.writeFileSync(filePath, code, 'utf8');
        }
    });
}

// 2. LEVEL VA CYBERLEVEL SINXRONIZATSIYASI (Yagona formula)
const userModelPath = path.join(__dirname, 'models', 'User.js');
if (fs.existsSync(userModelPath)) {
    let userModel = fs.readFileSync(userModelPath, 'utf8');
    if (!userModel.includes('Level Sinxronizatsiyasi')) {
        const hookCode = `
// --- Level Sinxronizatsiyasi ---
userSchema.pre('save', function(next) {
    if (this.isModified('score') || this.isModified('ball') || this.isModified('points')) {
        const currentScore = this.score || this.ball || this.points || 0;
        // Formula: Har 100 ball = 1 level
        const calculatedLevel = Math.floor(currentScore / 100) + 1;
        this.level = calculatedLevel;
        this.cyberLevel = calculatedLevel;
    }
    next();
});
// ------------------------------
`;
        userModel = userModel.replace(/(module\.exports\s*=\s*mongoose\.model)/, hookCode + '\n$1');
        fs.writeFileSync(userModelPath, userModel, 'utf8');
    }
}

console.log("✅ Statistika, reyting, level va hisoblashdagi barcha arxitektura xatolari to'g'rilandi!");
