const path = require('path');
const fs = require('fs');
const multer = require('multer');

// ══════════════════════════════════════════
// RUXSAT BERILGAN KENGAYTMALAR
// ══════════════════════════════════════════
const ALLOWED_EXTENSIONS = ['.zip', '.tar', '.gz', '.png', '.jpg', '.jpeg', '.pdf', '.txt', '.md', '.json'];
const ALLOWED_MIME_TYPES = [
    'application/zip', 'application/x-tar', 'application/gzip',
    'image/png', 'image/jpeg', 'application/pdf',
    'text/plain', 'text/markdown', 'application/json',
    'application/octet-stream'
];

// ══════════════════════════════════════════
// XAVFSIZ FAYL NOMI
// ══════════════════════════════════════════
function safeFileName(originalName) {
    // Faqat asosiy nom (path traversal oldini olish)
    const base = path.basename(originalName || 'file');
    
    // Faqat ruxsat berilgan belgilar
    const safe = base.replace(/[^a-zA-Z0-9._-]/g, '_');
    
    // Uzunlik cheklash
    const ext = path.extname(safe);
    const name = path.basename(safe, ext).slice(0, 50);
    
    return name + ext;
}

// ══════════════════════════════════════════
// FILE FILTER
// ══════════════════════════════════════════
function fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname || '').toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return cb(new Error(`Faqat ruxsat berilgan fayllar: ${ALLOWED_EXTENSIONS.join(', ')}`));
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return cb(new Error('Fayl turi ruxsat etilmagan'));
    }

    cb(null, true);
}

// ══════════════════════════════════════════
// STORAGE — CHALLENGES
// ══════════════════════════════════════════
const challengeDir = path.join(__dirname, '..', 'public', 'uploads', 'challenges');
if (!fs.existsSync(challengeDir)) fs.mkdirSync(challengeDir, { recursive: true });

const challengeStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, challengeDir),
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, unique + '-' + safeFileName(file.originalname));
    }
});

const uploadChallenge = multer({
    storage: challengeStorage,
    limits: { 
        fileSize: 50 * 1024 * 1024,  // 50 MB
        files: 1,
        fields: 20
    },
    fileFilter
});

// ══════════════════════════════════════════
// STORAGE — AVATARS
// ══════════════════════════════════════════
const avatarDir = path.join(__dirname, '..', 'public', 'uploads', 'avatars');
if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true });

const avatarStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, avatarDir),
    filename: (req, file, cb) => {
        const userId = req.session?.user?.id || 'anon';
        const ext = path.extname(file.originalname || '').toLowerCase();
        cb(null, `avatar-${userId}-${Date.now()}${ext}`);
    }
});

const avatarFilter = (req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.mimetype)) {
        return cb(new Error('Faqat rasm fayllari'));
    }
    cb(null, true);
};

const uploadAvatar = multer({
    storage: avatarStorage,
    limits: { fileSize: 5 * 1024 * 1024 },  // 5 MB
    fileFilter: avatarFilter
});

// ══════════════════════════════════════════
// ESKI FAYLNI O'CHIRISH
// ══════════════════════════════════════════
function deleteFile(filePath) {
    if (!filePath) return;
    try {
        const fullPath = path.join(__dirname, '..', 'public', filePath);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }
    } catch (err) {
        console.error('Fayl o\'chirish xatosi:', err.message);
    }
}

module.exports = {
    uploadChallenge,
    uploadAvatar,
    safeFileName,
    deleteFile,
    ALLOWED_EXTENSIONS
};