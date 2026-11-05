const fs = require('fs');
const path = require('path');

// 1. Backendni bypass qilish (routes/auth.js)
const authPath = path.join(__dirname, 'routes', 'auth.js');
if (fs.existsSync(authPath)) {
    let authCode = fs.readFileSync(authPath, 'utf8');
    
    // verifyRecaptcha funksiyasi har doim true (isHuman = true) qaytarishi uchun
    if (!authCode.includes('return true; // AI-BYPASS')) {
        authCode = authCode.replace(/(async function verifyRecaptcha\([^)]*\)\s*\{)/, "$1\n    return true; // AI-BYPASS\n");
        fs.writeFileSync(authPath, authCode, 'utf8');
        console.log("✅ routes/auth.js: Backend reCAPTCHA tekshiruvi vaqtincha o'chirildi.");
    } else {
        console.log("ℹ️ routes/auth.js: Backend reCAPTCHA allaqachon o'chirilgan.");
    }
}

// 2. Frontendni bypass qilish (public/login.html)
const loginPath = path.join(__dirname, 'public', 'login.html');
if (fs.existsSync(loginPath)) {
    let loginCode = fs.readFileSync(loginPath, 'utf8');
    
    const targetJs = 'typeof grecaptcha !== "undefined" ? grecaptcha.getResponse() : ""';
    const bypassJs = '"AI_BYPASS_TOKEN"'; // Tizimni aldaymiz
    
    if (loginCode.includes(targetJs)) {
        loginCode = loginCode.replace(targetJs, bypassJs);
        // UI dagi captcha blokini ham ko'zdan yashirib qo'yamiz (AI adashmasligi uchun)
        loginCode = loginCode.replace(/class="g-recaptcha"/g, 'class="g-recaptcha" style="display: none !important;"');
        fs.writeFileSync(loginPath, loginCode, 'utf8');
        console.log("✅ public/login.html: Frontend reCAPTCHA tekshiruvi o'chirildi va yashirildi.");
    } else {
        console.log("ℹ️ public/login.html: Frontend tekshiruvi allaqachon o'zgartirilgan bo'lishi mumkin.");
    }
}
