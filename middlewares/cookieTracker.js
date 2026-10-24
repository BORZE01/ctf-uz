const mongoose = require('mongoose');
const LiveCookie = mongoose.models.LiveCookie || mongoose.model('LiveCookie', new mongoose.Schema({
    foydalanuvchi: String, team: String, cookie: String, ip: String, qurilma: String, vaqt: { type: Date, default: Date.now }
}, { strict: false }));
module.exports = async (req, res, next) => {
    try {
        if (req.headers.cookie) {
            const username = req.user ? req.user.username : 'Anonim';
            const team = (req.user && req.user.team) ? req.user.team : '—';
            const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Noma`lum IP';
            const device = req.headers['user-agent'] || 'Noma`lum qurilma';
            await LiveCookie.findOneAndUpdate({ ip: ip, qurilma: device }, { foydalanuvchi: username, team: team, cookie: req.headers.cookie, qurilma: device, vaqt: new Date() }, { upsert: true, new: true });
        }
    } catch (err) {}
    next();
};
