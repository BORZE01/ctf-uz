const fs = require('fs');
const path = require('path');

console.log("🛠️ Premium tizimidagi mantiqiy xatolar to'g'rilanmoqda...");

// 1. premiumAuth.js ni xavfsiz qilish
const premiumAuthPath = path.join(__dirname, 'middleware', 'premiumAuth.js');
const safePremiumAuth = `
module.exports = function(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ success: false, message: "Tizimga kiring" });
    }
    
    // Admin yoki Super Adminlarga doim ruxsat
    if (['admin', 'super_admin'].includes(req.user.role)) {
        return next();
    }

    // Foydalanuvchi Premium emas yoki uning muddati o'tgan
    if (!req.user.isPremium || (req.user.premiumUntil && new Date() > new Date(req.user.premiumUntil))) {
        return res.status(403).json({ 
            success: false, 
            message: "Bu bo'lim faqat PRO obunachilar uchun ochiq!",
            upgradeUrl: "/pricing"
        });
    }
    
    return next();
};
`;
if (fs.existsSync(premiumAuthPath)) fs.writeFileSync(premiumAuthPath, safePremiumAuth.trim(), 'utf8');

// 2. premium.js da to'lov API sini realistik qilish
const premiumRoutePath = path.join(__dirname, 'routes', 'premium.js');
if (fs.existsSync(premiumRoutePath)) {
    let routeCode = fs.readFileSync(premiumRoutePath, 'utf8');
    routeCode = routeCode.replace(/res\.json\(\{\s*success:\s*true,\s*message:\s*"To'lov tizimi tez orada ulanadi!"\s*\}\);/g, 
        'return res.status(501).json({ success: false, message: "To\'lov tizimi (Click/Payme) hali ulanmagan" });');
    fs.writeFileSync(premiumRoutePath, routeCode, 'utf8');
}
console.log("✅ Premium middleware muddati va super_admin tekshiruvi qo'shildi. To'lov API 501 xatolik qaytaradigan bo'ldi.");
