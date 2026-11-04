const fs = require('fs');
const adminRouteFile = 'routes/admin.js';

if (fs.existsSync(adminRouteFile)) {
    let adminCode = fs.readFileSync(adminRouteFile, 'utf8');
    
    const newRbac = `
// --- STRICT RBAC MIDDLEWARE (FIXED) ---
router.use((req, res, next) => {
    let userRole = 'user';
    // Sessiya va brauzer tokenni tekshirishning xavfsiz usuli
    if (req.user && req.user.role) userRole = req.user.role;
    else if (req.session && req.session.user && req.session.user.role) userRole = req.session.user.role;
    else if (req.session && req.session.admin) userRole = 'super_admin'; 
    
    const targetRole = req.body?.role;
    const hierarchy = { 'super_admin': 3, 'admin': 2, 'organizer': 2, 'moderator': 1, 'user': 0 };

    if (hierarchy[userRole] === undefined || hierarchy[userRole] < 1) {
        return res.status(403).json({ success: false, message: "Kritik xato: Ruxsat etilmagan kirish." });
    }

    if (['PUT', 'POST', 'PATCH'].includes(req.method) && targetRole) {
        if (userRole !== 'super_admin') {
            return res.status(403).json({ success: false, message: "Kritik xato: Faqat Super Admin rollarni boshqarishi mumkin!" });
        }
    }
    next();
});
// --------------------------------------
`;
    
    // Eski qattiq cheklovni yangisiga almashtiramiz
    adminCode = adminCode.replace(/\/\/ --- STRICT RBAC MIDDLEWARE ---[\s\S]*?\/\/ ------------------------------/g, newRbac.trim());
    
    fs.writeFileSync(adminRouteFile, adminCode, 'utf8');
    console.log("✅ Admin RBAC ruxsatlari moslashtirildi va to'g'rilandi!");
}
