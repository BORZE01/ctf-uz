const fs = require('fs');
const path = require('path');

console.log("⏳ Premium Middleware va Frontend sahifa tayyorlanmoqda...");

// 1. MIDDLEWARE YARATISH (Faqat Premiumlar uchun to'siq)
const middlewareDir = path.join(__dirname, 'middleware');
if (!fs.existsSync(middlewareDir)) fs.mkdirSync(middlewareDir);

const premiumAuthCode = `
module.exports = function(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ success: false, message: "Tizimga kiring" });
    }
    // Adminlar va Premium foydalanuvchilarga ruxsat berish
    if (req.user.role === 'admin' || req.user.isPremium) {
        return next();
    }
    return res.status(403).json({ 
        success: false, 
        message: "Bu bo'lim faqat PRO obunachilar uchun ochiq!",
        upgradeUrl: "/pricing"
    });
};
`;
fs.writeFileSync(path.join(middlewareDir, 'premiumAuth.js'), premiumAuthCode.trim());
console.log("✅ Premium Middleware (To'siq) yaratildi.");

// 2. PREMIUM ROUTER YARATISH
const routesDir = path.join(__dirname, 'routes');
const premiumRouteCode = `
const express = require('express');
const router = express.Router();
const path = require('path');

// Tariflar sahifasini ko'rsatish
router.get('/pricing', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'pricing.html'));
});

// To'lovni boshlash API (Keyingi bosqich uchun tayyorlab ketamiz)
router.post('/api/checkout', (req, res) => {
    // Bu yerda Click/Payme integratsiyasi bo'ladi
    res.json({ success: true, message: "To'lov tizimi tez orada ulanadi!" });
});

module.exports = router;
`;
fs.writeFileSync(path.join(routesDir, 'premium.js'), premiumRouteCode.trim());
console.log("✅ Premium API router yaratildi.");

// 3. SERVER.JS GA ULASH
const serverPath = path.join(__dirname, 'server.js');
if (fs.existsSync(serverPath)) {
    let serverCode = fs.readFileSync(serverPath, 'utf8');
    if (!serverCode.includes("require('./routes/premium')")) {
        // Routerlarni ulash qismini topib, yoniga qo'shamiz
        serverCode = serverCode.replace(/(const usersRoute\s*=\s*require\('\.\/routes\/users'\);)/, "$1\nconst premiumRoute = require('./routes/premium');");
        serverCode = serverCode.replace(/(app\.use\('\/api\/users',\s*usersRoute\);)/, "$1\napp.use('/', premiumRoute);");
        fs.writeFileSync(serverPath, serverCode, 'utf8');
        console.log("✅ Premium marshruti server.js ga ulandi.");
    }
}

// 4. FRONTEND YARATISH (pricing.html - Glassmorphism dizayn)
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);

const pricingHtmlCode = `
<!DOCTYPE html>
<html lang="uz">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Premium Tariflar - CTF.UZ</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        body { background: #0f172a; color: #fff; min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 40px 20px; }
        .header-title { text-align: center; margin-bottom: 40px; }
        .header-title h1 { font-size: 2.5rem; color: #38bdf8; margin-bottom: 10px; }
        .header-title p { color: #94a3b8; font-size: 1.1rem; }
        
        .pricing-container { display: flex; gap: 30px; flex-wrap: wrap; justify-content: center; max-width: 1000px; width: 100%; }
        
        .card {
            background: rgba(30, 41, 59, 0.7);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 20px;
            padding: 40px 30px;
            width: 300px;
            text-align: center;
            transition: transform 0.3s, box-shadow 0.3s;
            position: relative;
            overflow: hidden;
        }
        
        .card:hover { transform: translateY(-10px); box-shadow: 0 10px 30px rgba(56, 189, 248, 0.2); }
        .card.pro { border-color: #38bdf8; background: rgba(14, 165, 233, 0.1); }
        .card.pro::before {
            content: 'TAVSIYA ETILADI'; position: absolute; top: 15px; right: -35px;
            background: #38bdf8; color: #000; font-size: 10px; font-weight: bold;
            padding: 5px 40px; transform: rotate(45deg);
        }
        
        .plan-name { font-size: 1.5rem; font-weight: bold; margin-bottom: 15px; }
        .plan-price { font-size: 2.5rem; font-weight: bold; color: #fff; margin-bottom: 20px; }
        .plan-price span { font-size: 1rem; color: #94a3b8; }
        
        .features { list-style: none; text-align: left; margin-bottom: 30px; }
        .features li { margin-bottom: 15px; color: #cbd5e1; font-size: 0.95rem; display: flex; align-items: center; }
        .features li::before { content: '✓'; color: #10b981; margin-right: 10px; font-weight: bold; }
        .features li.disabled { color: #475569; }
        .features li.disabled::before { content: '✕'; color: #ef4444; }
        
        .btn {
            display: inline-block; width: 100%; padding: 12px; border-radius: 8px;
            text-decoration: none; font-weight: bold; cursor: pointer; transition: 0.3s;
            text-align: center; border: none;
        }
        .btn-outline { background: transparent; border: 1px solid #38bdf8; color: #38bdf8; }
        .btn-outline:hover { background: #38bdf8; color: #000; }
        .btn-solid { background: #38bdf8; color: #000; }
        .btn-solid:hover { background: #0284c7; color: #fff; }
    </style>
</head>
<body>

    <div class="header-title">
        <h1>Karyerangizni PRO darajaga olib chiqing</h1>
        <p>Premium masalalar, yechimlar va platforma ustunliklariga ega bo'ling.</p>
    </div>

    <div class="pricing-container">
        <!-- Boshlang'ich -->
        <div class="card">
            <div class="plan-name">Boshlang'ich</div>
            <div class="plan-price">Bepul</div>
            <ul class="features">
                <li>Barcha oddiy masalalar</li>
                <li>Umumiy reytingda qatnashish</li>
                <li>Standart profil (Cyber ID)</li>
                <li class="disabled">Eksklyuziv PRO masalalar</li>
                <li class="disabled">Masalalar yechimi (Write-ups)</li>
                <li class="disabled">Profil uchun PRO nishoni</li>
            </ul>
            <a href="/dashboard" class="btn btn-outline">Hozirgi tarif</a>
        </div>

        <!-- PRO (1 Oylik) -->
        <div class="card pro">
            <div class="plan-name" style="color: #38bdf8;">PRO (1 Oylik)</div>
            <div class="plan-price">29,000 <span>so'm / oy</span></div>
            <ul class="features">
                <li>Barcha oddiy masalalar</li>
                <li>Umumiy reytingda qatnashish</li>
                <li>Profil uchun PRO nishoni (Badge)</li>
                <li>Eksklyuziv PRO masalalar</li>
                <li>Barcha masalalar yechimi (Write-ups)</li>
                <li>Reytingda alohida ajralib turish</li>
            </ul>
            <button onclick="alert('To\\\'lov tizimi tez orada ulanadi! Telegram orqali admin bilan bog\\\'laning.')" class="btn btn-solid">Xarid qilish</button>
        </div>
    </div>

</body>
</html>
`;
fs.writeFileSync(path.join(publicDir, 'pricing.html'), pricingHtmlCode.trim());
console.log("✅ Frontend sahifa (pricing.html) muvaffaqiyatli yaratildi.");

console.log("\n🚀 BARCHASI TAYYOR! Endi serverni yondirib, sayt.com/pricing manzilini tekshiring.");
