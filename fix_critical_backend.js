const fs = require('fs');

// 1. RBAC (Rol ierarxiyasi) himoyasini o'rnatish
const adminRouteFile = 'routes/admin.js';
if (fs.existsSync(adminRouteFile)) {
    let adminCode = fs.readFileSync(adminRouteFile, 'utf8');
    const rbacMiddleware = `
// --- STRICT RBAC MIDDLEWARE ---
router.use((req, res, next) => {
    const userRole = req.user?.role || req.session?.role || 'user';
    const targetRole = req.body?.role;
    const hierarchy = { 'super_admin': 3, 'admin': 2, 'organizer': 2, 'moderator': 1, 'user': 0 };

    if (hierarchy[userRole] === undefined || hierarchy[userRole] < 1) {
        return res.status(403).json({ success: false, message: "Kritik xato: Ruxsat etilmagan kirish." });
    }

    if (['PUT', 'POST', 'PATCH'].includes(req.method) && targetRole) {
        if (userRole !== 'super_admin') {
            return res.status(403).json({ success: false, message: "Kritik xato: Faqat Super Admin rollarni boshqarishi mumkin!" });
        }
        if (hierarchy[targetRole] === undefined) {
            return res.status(400).json({ success: false, message: "Kritik xato: Noma'lum rol turi." });
        }
    }
    next();
});
// ------------------------------
`;
    if (!adminCode.includes('STRICT RBAC MIDDLEWARE')) {
        adminCode = adminCode.replace(/(const router = express\.Router\(\);)/, '$1\n' + rbacMiddleware);
        fs.writeFileSync(adminRouteFile, adminCode, 'utf8');
        console.log("✅ 1. Admin routerida Qat'iy Rol Ierarxiyasi (RBAC) o'rnatildi.");
    }
}

// 2. CSRF joylashuvini API routerlardan oldinga surish (Cookie saqlanib qoladi)
const serverFile = 'server.js';
if (fs.existsSync(serverFile)) {
    let serverCode = fs.readFileSync(serverFile, 'utf8');
    
    const csrfBlockRegex = /app\.use\([^)]*csrf[^)]*\);?/gi;
    const csrfMatches = serverCode.match(csrfBlockRegex);
    
    if (csrfMatches && csrfMatches.length > 0) {
        const csrfCode = csrfMatches.join('\n');
        serverCode = serverCode.replace(csrfBlockRegex, ''); 
        
        if (!serverCode.includes(csrfCode)) {
            serverCode = serverCode.replace(/(app\.use\(['"]\/api)/i, csrfCode + '\n$1');
            fs.writeFileSync(serverFile, serverCode, 'utf8');
            console.log("✅ 2. CSRF himoyasi routerlardan oldinga ko'chirildi (Cookie o'zgarishsiz qoldi).");
        }
    } else {
        console.log("ℹ️ CSRF qatorlari topilmadi yoki allaqachon to'g'ri joyda.");
    }
}
