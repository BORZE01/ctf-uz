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