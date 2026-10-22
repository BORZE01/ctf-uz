const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Challenge } = require('../models/Learn');
const User = require('../models/User');

// Fayl yuklash uchun Multer sozlamalari
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../public/uploads/challenges');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

function requireAdmin(req, res, next) {
    if (!req.session || !req.session.user) return res.status(401).json({ success: false, message: "Unauthorized" });
    User.findById(req.session.user.id).then(u => {
        if (!u || !['admin', 'super_admin'].includes(u.role)) return res.status(403).json({ success: false, message: "Forbidden" });
        next();
    }).catch(() => res.status(500).json({ success: false, message: "Server error" }));
}

// Barcha challengelarni olish (Admin uchun)
router.get('/admin/challenges', requireAdmin, async (req, res) => {
    try {
        const challenges = await Challenge.find().sort({ createdAt: -1 });
        res.json({ success: true, challenges });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Challenge qo'shish (Create)
router.post('/admin/challenges', requireAdmin, upload.single('challengeFile'), async (req, res) => {
    try {
        const { title, category, difficulty, points, description, flag, isPublished } = req.body;
        let filePath = null;
        if (req.file) {
            filePath = '/uploads/challenges/' + req.file.filename;
        }

        const newCh = await Challenge.create({
            title, category, difficulty, points: Number(points) || 100,
            description, flag, filePath, isPublished: isPublished === 'true' || isPublished === true
        });
        res.json({ success: true, challenge: newCh });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Challenge tahrirlash (Edit)
router.put('/admin/challenges/:id', requireAdmin, upload.single('challengeFile'), async (req, res) => {
    try {
        const ch = await Challenge.findById(req.params.id);
        if (!ch) return res.status(404).json({ success: false, message: "Topilmadi" });

        const { title, category, difficulty, points, description, flag, isPublished } = req.body;
        ch.title = title || ch.title;
        ch.category = category || ch.category;
        ch.difficulty = difficulty || ch.difficulty;
        ch.points = points ? Number(points) : ch.points;
        ch.description = description || ch.description;
        ch.flag = flag || ch.flag;
        ch.isPublished = isPublished !== undefined ? (isPublished === 'true' || isPublished === true) : ch.isPublished;

        if (req.file) {
            if (ch.filePath) {
                const oldPath = path.join(__dirname, '../public', ch.filePath);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            ch.filePath = '/uploads/challenges/' + req.file.filename;
        }

        await ch.save();
        res.json({ success: true, challenge: ch });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Challenge o'chirish (Delete)
router.delete('/admin/challenges/:id', requireAdmin, async (req, res) => {
    try {
        const ch = await Challenge.findByIdAndDelete(req.params.id);
        if (ch && ch.filePath) {
            const filePath = path.join(__dirname, '../public', ch.filePath);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
