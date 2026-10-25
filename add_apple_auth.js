const fs = require('fs');
const path = require('path');

// 1. Backend: routes/auth.js ga Apple route'larini qo'shish
const authRoutePath = path.join(__dirname, 'routes', 'auth.js');
if (fs.existsSync(authRoutePath)) {
    let authContent = fs.readFileSync(authRoutePath, 'utf8');
    
    if (!authContent.includes('/apple')) {
        const appleCode = `
// ==================== APPLE AUTH ====================
router.get('/apple', (req, res) => {
    const clientId = process.env.APPLE_CLIENT_ID || 'uz.ctf.service';
    const redirectUri = process.env.APPLE_REDIRECT_URI || 'https://ctf-uz.onrender.com/api/auth/apple/callback';
    const appleAuthUrl = \`https://appleid.apple.com/auth/authorize?client_id=\${clientId}&redirect_uri=\${encodeURIComponent(redirectUri)}&response_type=code id_token&response_mode=form_post&scope=name email\`;
    res.redirect(appleAuthUrl);
});

router.post('/apple/callback', async (req, res) => {
    try {
        const { id_token, user } = req.body;
        let email = 'apple_user@privaterelay.appleid.com';
        let name = 'Apple User';

        if (user) {
            try {
                const parsedUser = JSON.parse(user);
                if (parsedUser.email) email = parsedUser.email;
                if (parsedUser.name) name = \`\${parsedUser.name.firstName || ''} \${parsedUser.name.lastName || ''}\`.trim();
            } catch (err) {
                console.error('Apple user parse xatosi:', err.message);
            }
        }

        const User = require('../models/User');
        let dbUser = await User.findOne({ email });
        
        if (!dbUser) {
            dbUser = await User.create({
                email,
                username: name || \`apple_\${Date.now().toString().slice(-4)}\`,
                isVerified: true,
                authProvider: 'apple'
            });
        }

        req.session.user = {
            id: dbUser._id,
            email: dbUser.email,
            username: dbUser.username
        };

        res.redirect('/profile');
    } catch (e) {
        console.error('Apple callback xatosi:', e.message);
        res.redirect('/login?error=apple_failed');
    }
});
`;
        authContent += appleCode;
        fs.writeFileSync(authRoutePath, authContent, 'utf8');
        console.log("✅ Backend (routes/auth.js) ga Apple funksiyasi muvaffaqiyatli qo'shildi!");
    } else {
        console.log("ℹ️ Backend (routes/auth.js) da Apple route'lari allaqachon mavjud.");
    }
} else {
    console.log("❌ routes/auth.js topilmadi!");
}

// 2. Frontend: public papkasidagi login/auth sahifalariga tugmani qo'shish
const publicDir = path.join(__dirname, 'public');
if (fs.existsSync(publicDir)) {
    const files = fs.readdirSync(publicDir);
    const appleButtonHtml = `
<button onclick="window.location.href='/api/auth/apple'" style="display: flex; align-items: center; justify-content: center; gap: 10px; background: #000000; color: #ffffff; border: none; border-radius: 10px; padding: 12px 20px; font-weight: 600; font-size: 0.95rem; cursor: pointer; width: 100%; margin-top: 12px; transition: background 0.2s;">
    <svg width="18" height="18" viewBox="0 0 170 170" fill="white">
        <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.1-1.9-14.24-6.08-3.56-2.91-7.51-7.61-11.85-14.11-6.19-9.25-11.12-19.5-14.79-30.75-3.67-11.25-5.51-22.18-5.51-32.78 0-14.37 3.73-26.24 11.18-35.61 7.46-9.36 16.92-14.12 28.39-14.28 4.79 0 10.15 1.25 16.08 3.75 5.92 2.5 9.9 3.76 11.93 3.76 1.74 0 5.95-1.35 12.63-4.06 6.69-2.71 12.38-3.9 17.07-3.57 15.11 1.09 26.68 7.32 34.72 18.69-12.8 7.82-19.12 18.23-18.96 31.23.16 10.36 4.16 18.97 12 25.82 5.51 4.79 12.23 7.99 20.17 9.61-2.45 7.64-5.69 15.22-9.72 22.74zM119.22 31.81c0-7.82 2.76-15.02 8.28-21.61 5.53-6.59 12.59-10.34 21.19-11.24.11 1.09.16 2.07.16 2.94 0 7.39-2.79 14.54-8.38 21.46-5.59 6.92-12.71 10.79-21.35 11.61-.11-.98-.16-1.9-16-3.16z"/>
    </svg>
    Apple bilan kirish
</button>
`;

    files.forEach(file => {
        if (file.includes('login') || file.includes('register') || file.includes('auth')) {
            const filePath = path.join(publicDir, file);
            let htmlContent = fs.readFileSync(filePath, 'utf8');
            if (!htmlContent.includes('/api/auth/apple')) {
                // Agar Google tugmasi yoki form bo'lsa, o'shaning tagiga qo'shamiz
                if (htmlContent.includes('google') || htmlContent.includes('form')) {
                    htmlContent = htmlContent.replace(/<\/form>/i, appleButtonHtml + '</form>');
                    fs.writeFileSync(filePath, htmlContent, 'utf8');
                    console.log(`✅ Frontend (${file}) sahifasiga Apple tugmasi qo'shildi!`);
                }
            }
        }
    });
}

console.log("\n🎉 Barcha o'zgarishlar muvaffaqiyatli bajarildi!");
