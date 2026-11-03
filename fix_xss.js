const fs = require('fs');

// Xavfsiz sanitizatsiya utilitsasini yaratish
const sanitizeUtils = `
// XSS dan himoya qilish uchun yordamchi funksiya
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
module.exports = { escapeHtml };
`;

if (!fs.existsSync('utils')) fs.mkdirSync('utils');
fs.writeFileSync('utils/sanitize.js', sanitizeUtils);
console.log("✅ 4. XSS himoya utilitsasi yaratildi.");
