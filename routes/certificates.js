const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Certificate = require('../models/Certificate');
const User = require('../models/User');
const { 
    issueCertificate, 
    verifyCertificate, 
    revokeCertificate 
} = require('../services/certificateService');

// ══════════════════════════════════════════
// GET /api/certificates/me — o'z sertifikatlarim
// ══════════════════════════════════════════
router.get('/me', async (req, res) => {
    try {
        if (!req.session?.user) {
            return res.status(401).json({ success: false, message: 'Kirish kerak' });
        }

        const certificates = await Certificate.find({ 
            userId: req.session.user.id 
        })
            .sort({ issuedAt: -1 })
            .lean();

        res.json({ success: true, certificates });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// ══════════════════════════════════════════
// GET /api/certificates/verify/:id — ommaviy tekshirish
// ══════════════════════════════════════════
router.get('/verify/:id', async (req, res) => {
    try {
        const result = await verifyCertificate(req.params.id.toUpperCase());
        res.json({ success: true, ...result });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// ══════════════════════════════════════════
// POST /api/certificates/issue — admin yoki avtomatik
// ══════════════════════════════════════════
router.post('/issue', async (req, res) => {
    try {
        if (!req.session?.user) {
            return res.status(401).json({ success: false, message: 'Kirish kerak' });
        }

        const currentUser = await User.findById(req.session.user.id);
        if (!currentUser) {
            return res.status(401).json({ success: false, message: 'Kirish kerak' });
        }

        const adminRoles = ['admin', 'super_admin', 'organizer'];
        const isAdmin = adminRoles.includes(currentUser.role);
        const isSelf = req.body.userId === currentUser._id.toString();

        // Faqat admin boshqalarga, foydalanuvchi o'ziga — va faqat ba'zi turlar
        if (!isAdmin && !isSelf) {
            return res.status(403).json({ success: false, message: 'Ruxsat yo\'q' });
        }

        const { userId, type, title, sourceType, sourceId, expiresAt } = req.body;

        if (!userId || !type || !title || !sourceType || !sourceId) {
            return res.status(400).json({ 
                success: false, 
                message: 'userId, type, title, sourceType, sourceId majburiy' 
            });
        }

        const result = await issueCertificate({
            userId,
            type,
            title,
            sourceType,
            sourceId,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            issuedBy: currentUser._id
        });

        res.json({
            success: true,
            certificate: result.certificate,
            alreadyIssued: result.alreadyIssued,
            message: result.alreadyIssued 
                ? 'Bu sertifikat allaqachon berilgan' 
                : 'Sertifikat berildi'
        });
    } catch (e) {
        console.error('POST /api/certificates/issue xatosi:', e);
        res.status(500).json({ success: false, message: e.message });
    }
});

// ══════════════════════════════════════════
// POST /api/certificates/:id/revoke — bekor qilish
// ══════════════════════════════════════════
router.post('/:id/revoke', async (req, res) => {
    try {
        if (!req.session?.user) {
            return res.status(401).json({ success: false, message: 'Kirish kerak' });
        }

        const currentUser = await User.findById(req.session.user.id);
        if (!currentUser) {
            return res.status(401).json({ success: false, message: 'Kirish kerak' });
        }

        const adminRoles = ['admin', 'super_admin'];
        if (!adminRoles.includes(currentUser.role)) {
            return res.status(403).json({ success: false, message: 'Faqat admin bekor qila oladi' });
        }

        const { reason } = req.body;
        const result = await revokeCertificate(
            req.params.id.toUpperCase(),
            currentUser._id,
            reason || ''
        );

        res.json({
            success: true,
            certificate: result.certificate,
            message: result.alreadyRevoked ? 'Allaqachon bekor qilingan' : 'Bekor qilindi'
        });
    } catch (e) {
        console.error('POST /api/certificates/:id/revoke xatosi:', e);
        res.status(500).json({ success: false, message: e.message });
    }
});

module.exports = router;
