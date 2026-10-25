const fs = require('fs');
const path = require('path');

const loginPath = path.join(__dirname, 'public', 'login.html');
if (fs.existsSync(loginPath)) {
    let content = fs.readFileSync(loginPath, 'utf8');

    // Apple yoki avval qo'shilgan ortiqcha tugmalarni tozalaymiz
    content = content.replace(/<button[^>]*class=["']apple-btn['"][\s\S]*?<\/button>/gi, '');
    content = content.replace(/<button[^>]*>[\s\S]*?Apple[\s\S]*?<\/button>/gi, '');
    content = content.replace(/<button[^>]*class=["']github-btn['"][\s\S]*?<\/button>/gi, '');

    // GitHub tugmasining kodi (.github-btn klassi bilan)
    const githubBtnCode = `\n    <button type="button" class="github-btn" onclick="location.href='/api/auth/github'" style="display: flex; align-items: center; justify-content: center; gap: 10px; background: #24292e; color: #ffffff; border: none; border-radius: 10px; padding: 12px 20px; font-weight: 600; font-size: 0.95rem; cursor: pointer; width: 100%; margin-top: 10px; transition: background 0.2s;">GitHub orqali kirish</button>`;

    // Google tugmasini topib, uning ortidan qo'shamiz
    const googleBtnRegex = /(<button[^>]*class=["'][^"']*google[^"']*["'][\s\S]*?<\/button>|<button[^>]*>[\s\S]*?Google[\s\S]*?<\/button>)/i;

    if (googleBtnRegex.test(content)) {
        content = content.replace(googleBtnRegex, `$1${githubBtnCode}`);
        fs.writeFileSync(loginPath, content, 'utf8');
        console.log("✅ login.html da Google tugmasining ortiga GitHub tugmasi qo'shildi!");
    } else {
        console.log("❌ Google tugmasi topilmadi!");
    }
}
