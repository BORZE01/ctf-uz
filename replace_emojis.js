const fs = require('fs');
const path = require('path');

// 1. Qidiriladigan papkalar (Faqat foydalanuvchiga ko'rinadigan qismlar)
const targetDirs = [
    path.join(__dirname, 'public'),
    path.join(__dirname, 'routes'),
    path.join(__dirname, 'utils')
];

// 2. SVG Ikonkalar (Lucide Icons tizimiga moslashtirilgan html teglar)
const emojiMap = {
    '✅': '<i data-lucide="check-circle" class="icon-success"></i>',
    '❌': '<i data-lucide="x-circle" class="icon-error"></i>',
    '⏳': '<i data-lucide="hourglass" class="icon-wait"></i>',
    '🔓': '<i data-lucide="unlock" class="icon-auth"></i>',
    '⚔️': '<i data-lucide="swords" class="icon-arena"></i>',
    '⏱️': '<i data-lucide="clock" class="icon-time"></i>',
    '🏆': '<i data-lucide="trophy" class="icon-award"></i>',
    '🔥': '<i data-lucide="flame" class="icon-fire"></i>',
    '🚀': '<i data-lucide="rocket" class="icon-launch"></i>',
    '💻': '<i data-lucide="laptop" class="icon-tech"></i>',
    '🔐': '<i data-lucide="lock" class="icon-auth"></i>',
    '⭐': '<i data-lucide="star" class="icon-star"></i>',
    '🎯': '<i data-lucide="target" class="icon-aim"></i>',
    '📚': '<i data-lucide="book" class="icon-learn"></i>',
    '🧠': '<i data-lucide="brain" class="icon-skill"></i>',
    '🐙': '<i data-lucide="github" class="icon-social"></i>',
    '💬': '<i data-lucide="message-circle" class="icon-social"></i>',
    '🌐': '<i data-lucide="globe" class="icon-web"></i>',
    '📅': '<i data-lucide="calendar" class="icon-date"></i>',
    '👥': '<i data-lucide="users" class="icon-users"></i>',
    '💼': '<i data-lucide="briefcase" class="icon-job"></i>',
    '💰': '<i data-lucide="coins" class="icon-money"></i>',
    '🏢': '<i data-lucide="building" class="icon-company"></i>',
    '📍': '<i data-lucide="map-pin" class="icon-map"></i>',
    '🛡️': '<i data-lucide="shield" class="icon-shield"></i>',
    '🗑️': '<i data-lucide="trash-2" class="icon-action"></i>',
    '✏️': '<i data-lucide="edit-3" class="icon-action"></i>',
    '🏅': '<i data-lucide="medal" class="icon-award"></i>',
    '🔍': '<i data-lucide="search" class="icon-search"></i>'
};

const emojiRegex = new RegExp(Object.keys(emojiMap).join('|'), 'g');

// 3. Fayllarni rekursiv qidirish va almashtirish funksiyasi
function processDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            // Keraksiz papkalarni o'tkazib yuborish
            if (['uploads', 'css', 'assets'].includes(file)) continue;
            processDirectory(fullPath);
        } else if (stat.isFile() && /\.(html|js)$/.test(file)) {
            // Faqat HTML va JS fayllarni o'qish
            let content = fs.readFileSync(fullPath, 'utf8');
            let hasChanges = false;

            // HTML fayllarga Lucide Icons kutubxonasini ulab ketish (agar yo'q bo'lsa)
            if (fullPath.endsWith('.html') && !content.includes('lucide.min.js')) {
                 content = content.replace('</body>', '    <script src="https://unpkg.com/lucide@latest"></script>\n    <script>lucide.createIcons();</script>\n</body>');
                 hasChanges = true;
            }

            // Emojilarni SVG ikonkalarga almashtirish
            if (emojiRegex.test(content)) {
                content = content.replace(emojiRegex, match => {
                    return emojiMap[match] || match; 
                });
                hasChanges = true;
            }

            // Agar o'zgarish bo'lsa, faylni saqlash
            if (hasChanges) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`✅ Yangilandi: ${fullPath.replace(__dirname, '')}`);
            }
        }
    }
}

console.log("⏳ CTF-UZ tizimidagi emojilar professional SVG ikonkalarga almashtirilmoqda...");
targetDirs.forEach(dir => processDirectory(dir));
console.log("🎉 Barcha amallar muvaffaqiyatli yakunlandi!");
