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
        const mailOptions = {
            from: `"CTF.UZ" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: '🔐 CTF.UZ — Tasdiqlash kodi',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; background: #060B18; color: #F1F5F9; border-radius: 12px;">
                    <h1 style="color: #4A7FFF; text-align: center;">CTF.UZ</h1>
                    <p>Salom, <b>${name}</b>!</p>
                    <p>Sizning tasdiqlash kodingiz:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <span style="font-size: 36px; letter-spacing: 8px; color: #22D3EE; font-weight: bold; background: #0A1020; padding: 15px 30px; border-radius: 8px; display: inline-block;">${code}</span>
                    </div>
                    <p style="color: #94A3B8; font-size: 13px;">Kod 10 daqiqa amal qiladi.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Email yuborildi: ${to}`);
        return true;
    } catch (e) {
        console.error('❌ Email yuborish xatosi:', e.message);
        return false;
    }
}

module.exports = { sendEmail };
