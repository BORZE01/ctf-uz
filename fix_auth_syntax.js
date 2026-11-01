const fs = require('fs');
let code = fs.readFileSync('routes/auth.js', 'utf8');

// Buzilgan verifyRecaptcha funksiyasini qidirib topish
const startIndex = code.indexOf('async function verifyRecaptcha');
const endIndex = code.indexOf('const bcrypt = require(\'bcryptjs\');');

if (startIndex !== -1 && endIndex !== -1) {
    const newVerify = `async function verifyRecaptcha(token) {
    if (!token) return false;
    try {
        const secretKey = process.env.RECAPTCHA_SECRET_KEY || '6LfSbgsuAAAAAFM4vHmM6EAVXYObICe7RDwIiz3F';
        const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ secret: secretKey, response: token })
        });
        const data = await response.json();
        console.log('Google reCAPTCHA javobi:', data);
        return data.success === true;
    } catch (err) {
        console.error('reCAPTCHA xatosi:', err);
        return false;
    }
}

`;
    // Eski xato funksiyani kesib tashlab, tozasini qo'yish
    code = code.substring(0, startIndex) + newVerify + code.substring(endIndex);
    
    // Login route da tokenni to'g'ri qabul qilishni ta'minlash
    code = code.replace(/const captchaToken = req\.body\.captchaToken.*/g, 'const captchaToken = req.body.captchaToken || req.body["g-recaptcha-response"];');
    
    fs.writeFileSync('routes/auth.js', code, 'utf8');
    console.log('✅ routes/auth.js dagi sintaksis xato to\'liq tozalandi va yangilandi!');
} else {
    console.log('❌ Fayl strukturasi topilmadi. Kodni qo\'lda tekshirish kerak.');
}
