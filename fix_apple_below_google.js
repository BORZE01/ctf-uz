const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const files = ['login.html', 'register.html', 'admin-login.html'];

const appleButtonHtml = `\n    <button onclick="window.location.href='/api/auth/apple'" style="display: flex; align-items: center; justify-content: center; gap: 10px; background: #000000; color: #ffffff; border: none; border-radius: 10px; padding: 12px 20px; font-weight: 600; font-size: 0.95rem; cursor: pointer; width: 100%; margin-top: 10px; transition: background 0.2s;">\n        <svg width="18" height="18" viewBox="0 0 170 170" fill="white">\n            <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.1-1.9-14.24-6.08-3.56-2.91-7.51-7.61-11.85-14.11-6.19-9.25-11.12-19.5-14.79-30.75-3.67-11.25-5.51-22.18-5.51-32.78 0-14.37 3.73-26.24 11.18-35.61 7.46-9.36 16.92-14.12 28.39-14.28 4.79 0 10.15 1.25 16.08 3.75 5.92 2.5 9.9 3.76 11.93 3.76 1.74 0 5.95-1.35 12.63-4.06 6.69-2.71 12.38-3.9 17.07-3.57 15.11 1.09 26.68 7.32 34.72 18.69-12.8 7.82-19.12 18.23-18.96 31.23.16 10.36 4.16 18.97 12 25.82 5.51 4.79 12.23 7.99 20.17 9.61-2.45 7.64-5.69 15.22-9.72 22.74zM119.22 31.81c0-7.82 2.76-15.02 8.28-21.61 5.53-6.59 12.59-10.34 21.19-11.24.11 1.09.16 2.07.16 2.94 0 7.39-2.79 14.54-8.38 21.46-5.59 6.92-12.71 10.79-21.35 11.61-.11-.98-.16-1.9-16-3.16z"/>\n        </svg>\n        Apple bilan kirish\n    </button>`;

files.forEach(file => {
    const filePath = path.join(publicDir, file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Eskisini tozalab tashlaymiz
        content = content.replace(/<button[^>]*onclick="window\.location\.href=['"]\/api\/auth\/apple['"][^>]*>[\s\S]*?<\/button>/gi, '');
        
        // Google tugmasini topib, xuddi shundan keyinga Apple tugmasini qo'shamiz
        const googleButtonRegex = /(<button[^>]*>[\s\S]*?Google[\s\S]*?<\/button>|<a[^>]*>[\s\S]*?Google[\s\S]*?<\/a>)/i;
        
        if (googleButtonRegex.test(content)) {
            content = content.replace(googleButtonRegex, `$1${appleButtonHtml}`);
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ ${file} sahifasida Apple tugmasi Google tugmasining tagiga qo'shildi!`);
        }
    }
});
console.log("\n🎉 Tayyor!");
