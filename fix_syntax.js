const fs = require('fs');
const path = require('path');

// Faqat JavaScript fayllar joylashgan papkalarni to'g'rilaymiz
const targetDirs = [
    path.join(__dirname, 'public', 'js'),
    path.join(__dirname, 'routes'),
    path.join(__dirname, 'utils'),
    path.join(__dirname, 'models'),
    path.join(__dirname, 'server.js')
];

// HTML kodni qaytadan emojiga o'girish xaritasi
const reverseMap = {
    'check-circle': '✅', 'x-circle': '❌', 'hourglass': '⏳', 'unlock': '🔓',
    'swords': '⚔️', 'clock': '⏱️', 'trophy': '🏆', 'flame': '🔥', 'rocket': '🚀',
    'laptop': '💻', 'lock': '🔐', 'star': '⭐', 'target': '🎯', 'book': '📚',
    'brain': '🧠', 'github': '🐙', 'message-circle': '💬', 'globe': '🌐',
    'calendar': '📅', 'users': '👥', 'briefcase': '💼', 'coins': '💰',
    'building': '🏢', 'map-pin': '📍', 'shield': '🛡️', 'trash-2': '🗑️',
    'edit-3': '✏️', 'medal': '🏅', 'search': '🔍'
};

function processPath(target) {
    if (!fs.existsSync(target)) return;
    const stat = fs.statSync(target);
    
    if (stat.isFile() && target.endsWith('.js')) {
        let content = fs.readFileSync(target, 'utf8');
        const regex = /<i data-lucide=["']([^"']+)["'] class=["'][^"']+["']><\/i>/g;
        let changed = false;
        
        content = content.replace(regex, (match, iconName) => {
            changed = true;
            return reverseMap[iconName] || match;
        });
        
        if (changed) {
            fs.writeFileSync(target, content, 'utf8');
            console.log(`✅ To'g'rilandi: ${target.replace(__dirname, '')}`);
        }
    } else if (stat.isDirectory() && !target.includes('node_modules') && !target.includes('uploads')) {
        fs.readdirSync(target).forEach(file => processPath(path.join(target, file)));
    }
}

targetDirs.forEach(processPath);
console.log("🎉 JS fayllardagi sintaksis xatolar to'liq tuzatildi!");
