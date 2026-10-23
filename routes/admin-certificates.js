const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');

let Certificate;
try {
    Certificate = mongoose.model('Certificate');
} catch (error) {
    const certSchema = new mongoose.Schema({}, { strict: false });
    Certificate = mongoose.model('Certificate', certSchema);
}

router.get('/', async (req, res) => {
    try {
        const certs = await Certificate.find().populate('userId', 'username email').sort({ createdAt: -1 });
        res.json({ success: true, certificates: certs });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const { username, title } = req.body;
        const user = await User.findOne({ username: new RegExp('^' + username.trim() + '$', 'i') });
        
        if (!user) return res.status(404).json({ success: false, message: "Foydalanuvchi topilmadi" });

        const generatedId = 'CTF-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        
        const newCert = {
            userId: user._id,
            title: title || 'Kiberxavfsizlik asoslari',
            courseName: title || 'Kiberxavfsizlik asoslari',
            certId: generatedId,
            certificateId: generatedId,
            pathSlug: 'custom-' + generatedId.toLowerCase(), // Уникальное значение для обхода индекса E11000
            issueDate: new Date(),
            createdAt: new Date(),
            sourceId: user._id,
            sourceType: 'admin',
            type: 'custom',
            status: 'issued',
            recipientName: user.name || user.username,
            username: user.username
        };
        
        await Certificate.collection.insertOne(newCert);
        
        res.json({ success: true, certificate: newCert });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        await Certificate.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

module.exports = router;