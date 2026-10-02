const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ══════════════════════════════════════════
// JSON FAYLGA SAQLASH
// ══════════════════════════════════════════
function saveToFile(name, data) {
    try {
        const filePath = path.join(DATA_DIR, `${name}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (err) {
        console.error(`❌ ${name} saqlash xatosi:`, err.message);
        return false;
    }
}

// ══════════════════════════════════════════
// JSON FAYLDAN O'QISH
// ══════════════════════════════════════════
function loadFromFile(name, defaultValue = []) {
    try {
        const filePath = path.join(DATA_DIR, `${name}.json`);
        if (!fs.existsSync(filePath)) return defaultValue;
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
    } catch (err) {
        console.error(`❌ ${name} o'qish xatosi:`, err.message);
        return defaultValue;
    }
}

// ══════════════════════════════════════════
// AVTOMATIK SAQLASH — har 30 sekundda
// ══════════════════════════════════════════
function startAutoSave(storage) {
    setInterval(() => {
        saveToFile('users', storage.users);
        saveToFile('challenges', storage.challenges);
        saveToFile('submissions', storage.submissions);
        saveToFile('events', storage.events);
        saveToFile('announcements', storage.announcements);
    }, 30 * 1000);

    console.log('💾 Auto-save yoqildi (har 30 sekund)');
}

// ══════════════════════════════════════════
// DASTUR YOPILGANDA SAQLASH
// ══════════════════════════════════════════
function setupGracefulShutdown(storage) {
    const saveAll = () => {
        console.log('💾 Saqlash...');
        saveToFile('users', storage.users);
        saveToFile('challenges', storage.challenges);
        saveToFile('submissions', storage.submissions);
        saveToFile('events', storage.events);
        saveToFile('announcements', storage.announcements);
        console.log('✅ Saqlandi');
    };

    process.on('SIGINT', () => { saveAll(); process.exit(0); });
    process.on('SIGTERM', () => { saveAll(); process.exit(0); });
}

module.exports = {
    saveToFile,
    loadFromFile,
    startAutoSave,
    setupGracefulShutdown
};