const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Challenge = require('../models/Challenge'); // Standart model
const User = require('../models/User');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../public/uploads/challenges');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.]/g, '_'));
    }
});

const upload = multer({ storage: storage, limits: { fileSize: 50 * 1024 * 1024 } });

async function requireAdmin(req, res, next) {
    if (!req.session || !req.session.user) return res.status(401).json({ success: false, message: "Avtorizatsiya talab qilinadi" });
    try {
        const u = await User.findById(req.session.user.id).select('role banned').lean();
        if (!u || u.banned || !['admin', 'super_admin'].includes(u.role)) return res.status(403).json({ success: false, message: "Faqat adminlar" });
        next();
    } catch (e) { return res.status(500).json({ success: false, message: e.message }); }
}

router.get('/challenges', requireAdmin, async (req, res) => {
    try {
        const challenges = await Challenge.find().sort({ createdAt: -1 });
        res.json({ success: true, challenges: challenges.map(c => ({...(c.toObject ? c.toObject() : c), hints: (c.hints||[]).map(h => h.text || h)})) });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/challenges', requireAdmin, upload.any(), async (req, res) => {
    try {
        const { title, category, difficulty, points, description, flag, hints, isPublished } = req.body;
        
        // Hints formatini to'g'rilash (obyekt shakliga o'tkazish)
        let parsedHints = hints ? (Array.isArray(hints) ? hints : hints.split('\n').map(h => h.trim()).filter(Boolean)) : [];
        parsedHints = parsedHints.map(h => typeof h === 'string' ? { text: h } : h);

        let fileUrl = null, fileName = null;
        if (req.files && req.files.length > 0) {
            fileUrl = '/uploads/challenges/' + req.files[0].filename;
            fileName = req.files[0].originalname;
        }

        const newCh = await Challenge.create({
            title: title ? title.trim() : 'Challenge',
            category: category ? category.trim() : 'Web',
            difficulty: difficulty ? difficulty.trim() : 'Easy', // Probellarni tozalash
            points: Number(points) || 100,
            story: description || '',
            flag: flag ? flag.trim() : '',
            hints: parsedHints, // To'g'ri formatdagi maslahatlar
            file: fileUrl, fileName: fileName,
            status: (isPublished === 'true' || isPublished === true) ? 'live' : 'draft',
            solves: 0, createdAt: new Date()
        });
        res.json({ success: true, challenge: newCh });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/challenges/:id', requireAdmin, upload.any(), async (req, res) => {
    try {
        const ch = await Challenge.findById(req.params.id);
        if (!ch) return res.status(404).json({ success: false, message: "Topilmadi" });

        const { title, category, difficulty, points, description, flag, hints, isPublished } = req.body;
        
        if (title) ch.title = title.trim();
        if (category) ch.category = category.trim();
        if (difficulty) ch.difficulty = difficulty.trim();
        if (points) ch.points = Number(points);
        if (description) ch.story = description;
        if (flag) ch.flag = flag.trim(); 
        
        if (hints) {
            let rawHints = Array.isArray(hints) ? hints : hints.split('\n').map(h => h.trim()).filter(Boolean);
            ch.hints = rawHints.map(h => typeof h === 'string' ? { text: h } : h);
        }
        
        if (isPublished !== undefined) ch.status = (isPublished === 'true' || isPublished === true) ? 'live' : 'draft';

        if (req.files && req.files.length > 0) {
            if (ch.file) {
                const oldPath = path.join(__dirname, '../public', ch.file);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            ch.file = '/uploads/challenges/' + req.files[0].filename;
            ch.fileName = req.files[0].originalname;
        }
        await ch.save();
        res.json({ success: true, challenge: ch });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete('/challenges/:id', requireAdmin, async (req, res) => {
    try {
        const ch = await Challenge.findByIdAndDelete(req.params.id);
        if (ch && ch.file) {
            const filePath = path.join(__dirname, '../public', ch.file);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
