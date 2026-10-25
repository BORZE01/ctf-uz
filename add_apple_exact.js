const fs = require('fs');
const path = require('path');

const loginPath = path.join(__dirname, 'public', 'login.html');
if (fs.existsSync(loginPath)) {
    let content = fs.readFileSync(loginPath, 'utf8');

    // Oldin qo'shilgan ortiqcha/xato apple tugmalarini tozalaymiz
    content = content.replace(/<button[^>]*class=["']apple-btn['"][\s\S]*?<\/button>/gi, '');

    // Apple tugmasining aniq kodi
    const appleBtnCode = `\n    <button type="button" class="apple-btn" onclick="location.href='/api/auth/apple'">Apple bilan kirish</button>`;

    // Google tugmasini qidirib topamiz va uning darhol keyiniga qo'shamiz
    // Google tugmasi class="google-btn" yoki shunga o'xshash bo'lishi mumkin
    const googleBtnRegex = /(<button[^>]*class=["'][^"']*google[^"']*["'][\s\S]*?<\/button>|<button[^>]*>[\s\S]*?Google[\s\S]*?<\/button>)/i;

    if (googleBtnRegex.test(content)) {
        content = content.replace(googleBtnRegex, `$1${appleBtnCode}`);
        fs.writeFileSync(loginPath, content, 'utf8');
        console.log("✅ login.html da Google tugmasining ortiga Apple tugmasi muvaffaqiyatli qo'shildi!");
    } else {
        console.log("❌ Google tugmasi topilmadi!");
    }
}
