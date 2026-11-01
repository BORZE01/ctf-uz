const fs = require('fs');
let code = fs.readFileSync('routes/auth.js', 'utf8');

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
}`;

code = code.replace(/async function verifyRecaptcha[\s\S]*?catch \(err\) \{[\s\S]*?return false;\n\s*\}/m, newVerify);
code = code.replace(/const captchaToken = req\.body\.captchaToken.*/g, 'const captchaToken = req.body.captchaToken || req.body["g-recaptcha-response"];');

fs.writeFileSync('routes/auth.js', code, 'utf8');
console.log('✅ routes/auth.js muvaffaqiyatli yangilandi!');
