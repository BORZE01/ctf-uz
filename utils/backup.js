const fs = require('fs');
const path = require('path');

const BACKUP_DIR = path.join(__dirname, '..', 'backups');
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

// ══════════════════════════════════════════
// BACKUP YARATISH
// ══════════════════════════════════════════
function createBackup(storage) {
    try {
        const date = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');

        const data = {
            users: storage.users,
            challenges: storage.challenges,
            submissions: storage.submissions,
            events: storage.events,
            announcements: storage.announcements,
            reports: storage.reports,
            auditLogs: storage.auditLogs,
            timestamp: new Date()
        };

        const filename = `backup-${date}.json`;
        const filePath = path.join(BACKUP_DIR, filename);

        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log(`✅ Backup yaratildi: ${filename}`);

        // Oxirgi 7 tasini saqlash
        cleanupOldBackups();

        return filename;
    } catch (err) {
        console.error('❌ Backup xatosi:', err.message);
        return null;
    }
}

// ══════════════════════════════════════════
// ESKI BACKUP LARNI TOZALASH
// ══════════════════════════════════════════
function cleanupOldBackups(keep = 7) {
    try {
        const files = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.startsWith('backup-'))
            .sort()
            .reverse();

        files.slice(keep).forEach(f => {
            fs.unlinkSync(path.join(BACKUP_DIR, f));
        });
    } catch (err) {
        console.error('Backup tozalash xatosi:', err.message);
    }
}

// ══════════════════════════════════════════
// AVTOMATIK BACKUP — har kuni 03:00
// ══════════════════════════════════════════
function startBackup(storage) {
    const now = new Date();
    const next3AM = new Date(now);
    next3AM.setHours(3, 0, 0, 0);
    if (next3AM <= now) next3AM.setDate(next3AM.getDate() + 1);

    const msUntil = next3AM.getTime() - now.getTime();

    setTimeout(() => {
        createBackup(storage);
        setInterval(() => createBackup(storage), 24 * 60 * 60 * 1000);
    }, msUntil);

    console.log(`⏰ Backup rejalashtirildi: ${next3AM.toLocaleString('uz-UZ')}`);
}

// ══════════════════════════════════════════
// BACKUP DAN TIKLASH
// ══════════════════════════════════════════
function restoreBackup(filename) {
    try {
        const filePath = path.join(BACKUP_DIR, filename);
        if (!fs.existsSync(filePath)) {
            return { ok: false, message: 'Backup topilmadi' };
        }
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        return { ok: true, data };
    } catch (err) {
        return { ok: false, message: err.message };
    }
}

module.exports = {
    createBackup,
    startBackup,
    restoreBackup,
    cleanupOldBackups
};