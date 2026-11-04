const fs = require('fs');
const path = require('path');

const profileRoutePath = path.join(__dirname, 'routes', 'users.js');
const profileHtmlPath = path.join(__dirname, 'public', 'profile.html');

// 1. Profil routerida ma'lumotni to'g'ri formatlab yuborish
if (fs.existsSync(profileRoutePath)) {
    let code = fs.readFileSync(profileRoutePath, 'utf8');
    
    // Yagona hisob-kitobni o'rnatamiz
    code = code.replace(/res\.render\('profile',\s*\{[\s\S]*?\}\);/g, (match) => {
        if (!match.includes('safeLevel')) {
            return `
        // Profil uchun yagona hisob-kitob
        const safeScore = req.user.score || req.user.ball || 0;
        const safeLevel = Math.floor(safeScore / 100) + 1; // 100 ball = 1 level
        const currentXp = safeScore;
        const requiredXp = safeLevel * 100;
        
        req.user.level = safeLevel;
        req.user.cyberLevel = safeLevel;
        req.user.score = safeScore;
        await req.user.save(); // Bazani ham sinxronlash

        res.render('profile', { user: req.user, level: safeLevel, currentXp, requiredXp });
            `;
        }
        return match;
    });
    
    fs.writeFileSync(profileRoutePath, code, 'utf8');
    console.log("✅ Profil backend (routes/users.js) Level mantiqi to'g'rilandi.");
}

// 2. Profil HTML/JS qismidagi xato XP va Level ko'rsatkichlarni tozalash
if (fs.existsSync(profileHtmlPath)) {
    let html = fs.readFileSync(profileHtmlPath, 'utf8');
    
    // G'alati XP qiymati va noto'g'ri formullalarni olib tashlash
    html = html.replace(/100,999.*?121,000\s*XP/g, '0 / 100 XP'); // Eski harcode yoki yirik qiymat bo'lsa
    html = html.replace(/Level\s*20/g, 'Level 1');
    
    // Agar inline script bo'lsa, uni to'g'irlaymiz
    if (html.includes('calculateLevel')) {
        html = html.replace(/function\s+calculateLevel[\s\S]*?}/, `
        function calculateLevel(score) {
            return Math.floor((score || 0) / 100) + 1;
        }`);
    }
    
    fs.writeFileSync(profileHtmlPath, html, 'utf8');
    console.log("✅ Profil frontend (profile.html) ko'rsatkichlari tozalandi.");
}
