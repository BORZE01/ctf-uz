const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function sendEmail(to, name, code) {
    try {
        await transporter.sendMail({
            from: `"CTF.UZ" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: 'CTF.UZ - Tasdiqlash kodi',
            html: `
                <div style="font-family: monospace; background: #0B1220; color: #F4F7FB; padding: 30px; border-radius: 8px;">
                    <h2 style="color: #1E5EFF;">🇺🇿 CTF.UZ</h2>
                    <p>Salom, <strong>${name}</strong>!</p>
                    <p>Sizning tasdiqlash kodingiz:</p>
                    <h1 style="color: #00C2FF; letter-spacing: 8px; font-size: 36px;">${code}</h1>
                    <p style="color: #8b949e; font-size: 12px;">Kod 10 daqiqa ichida amal qiladi.</p>
                </div>
            `
        });
        return true;
    } catch (err) {
        console.error('❌ Email xatosi:', err.message);
        return false;
    }
}

module.exports = { sendEmail };