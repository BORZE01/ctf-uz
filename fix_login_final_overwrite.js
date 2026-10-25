const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');

// Идеальный и чистый шаблон страницы входа (login.html)
const cleanLoginHtml = `<!DOCTYPE html>
<html lang="uz">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kirish - CTF.UZ</title>
    <link rel="stylesheet" href="/css/style.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body style="font-family: 'Inter', sans-serif; background-color: #0b0f19; color: #fff; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0;">
    <div style="background: #111827; border: 1px solid #1f2937; border-radius: 16px; padding: 40px; width: 100%; max-width: 400px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
        <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="font-size: 1.8rem; font-weight: 700; margin: 0 0 8px 0;">Kirish</h1>
            <p style="color: #94A3B8; font-size: 0.9rem; margin: 0;">Cyber ID ingizga kiring</p>
        </div>

        <form action="/api/auth/login" method="POST" style="display: flex; flex-direction: column; gap: 14px;">
            <div>
                <label style="display: block; font-size: 0.75rem; color: #94A3B8; margin-bottom: 6px; text-transform: uppercase; font-weight: 600;">Username yoki Email</label>
                <input type="text" name="username" required style="width: 100%; padding: 12px 16px; background: #1f2937; border: 1px solid #374151; border-radius: 10px; color: #fff; font-size: 0.95krem; box-sizing: border-box;">
            </div>

            <div>
                <label style="display: block; font-size: 0.75rem; color: #94A3B8; margin-bottom: 6px; text-transform: uppercase; font-weight: 600;">Parol</label>
                <input type="password" name="password" required style="width: 100%; padding: 12px 16px; background: #1f2937; border: 1px solid #374151; border-radius: 10px; color: #fff; font-size: 0.95rem; box-sizing: border-box;">
            </div>

            <button type="submit" style="background: #2563EB; color: #fff; border: none; border-radius: 10px; padding: 12px; font-weight: 600; font-size: 0.95rem; cursor: pointer; width: 100%; margin-top: 6px; transition: background 0.2s;">
                Kirish &rarr;
            </button>

            <div style="color: #94A3B8; text-align: center; font-size: 0.8rem; margin: 10px 0; text-transform: uppercase; letter-spacing: 0.5px;">YOKI GOOGLE ORQALI</div>

            <button type="button" onclick="window.location.href='/api/auth/google'" style="display: flex; align-items: center; justify-content: center; gap: 10px; background: #ffffff; color: #000000; border: none; border-radius: 10px; padding: 12px 20px; font-weight: 600; font-size: 0.95rem; cursor: pointer; width: 100%; transition: background 0.2s;">
                <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.13 0-5.78-2.11-6.73-4.96H1.15v3.14C3.15 21.32 7.22 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.62H1.15C.42 8.08 0 9.73 0 12s.42 3.92 1.15 5.38l4.12-3.14z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.22 0 3.15 2.68 1.15 6.62l4.12 3.14c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
                Google orqali kirish
            </button>

            <button type="button" onclick="window.location.href='/api/auth/apple'" style="display: flex; align-items: center; justify-content: center; gap: 10px; background: #000000; color: #ffffff; border: none; border-radius: 10px; padding: 12px 20px; font-weight: 600; font-size: 0.95rem; cursor: pointer; width: 100%; transition: background 0.2s;">
                <svg width="18" height="18" viewBox="0 0 170 170" fill="white">
                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.1-1.9-14.24-6.08-3.56-2.91-7.51-7.61-11.85-14.11-6.19-9.25-11.12-19.5-14.79-30.75-3.67-11.25-5.51-22.18-5.51-32.78 0-14.37 3.73-26.24 11.18-35.61 7.46-9.36 16.92-14.12 28.39-14.28 4.79 0 10.15 1.25 16.08 3.75 5.92 2.5 9.9 3.76 11.93 3.76 1.74 0 5.95-1.35 12.63-4.06 6.69-2.71 12.38-3.9 17.07-3.57 15.11 1.09 26.68 7.32 34.72 18.69-12.8 7.82-19.12 18.23-18.96 31.23.16 10.36 4.16 18.97 12 25.82 5.51 4.79 12.23 7.99 20.17 9.61-2.45 7.64-5.69 15.22-9.72 22.74zM119.22 31.81c0-7.82 2.76-15.02 8.28-21.61 5.53-6.59 12.59-10.34 21.19-11.24.11 1.09.16 2.07.16 2.94 0 7.39-2.79 14.54-8.38 21.46-5.59 6.92-12.71 10.79-21.35 11.61-.11-.98-.16-1.9-16-3.16z"/>
                </svg>
                Apple bilan kirish
            </button>

            <div style="text-align: center; margin-top: 8px;">
                <a href="/forgot-password" style="color: #94A3B8; font-size: 0.85rem; text-decoration: none;">Parolni unutdingizmi?</a>
            </div>

            <div style="text-align: center; margin-top: 6px;">
                <a href="/register" style="color: #60A5FA; font-size: 0.85rem; text-decoration: none;">Hisobingiz yo'qmi? Ro'yxatdan o'ting</a>
            </div>
        </form>
    </div>
</body>
</html>`;

const loginPath = path.join(publicDir, 'login.html');
fs.writeFileSync(loginPath, cleanLoginHtml, 'utf8');

const adminLoginPath = path.join(publicDir, 'admin-login.html');
if (fs.existsSync(adminLoginPath)) {
    fs.writeFileSync(adminLoginPath, cleanLoginHtml, 'utf8');
}

console.log("✅ login.html и admin-login.html полностью перезаписаны в идеальном порядке без дубликатов!");
