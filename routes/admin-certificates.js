const express = require('express');
const router = express.Router();
const { Certificate } = require('../models/Learn');
const { logAction } = require('../utils/audit');

// GET /api/admin/certificates — Barcha sertifikatlar ro'yxati
router.get('/', async (req, res) => {
    try {
        const certs = await Certificate.find().sort({ issueDate: -1 }).limit(300).lean();
        res.json({ success: true, certificates: certs });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// POST /api/admin/certificates/:certId/revoke — Sertifikatni sabab bilan bekor qilish
router.post('/:certId/revoke', async (req, res) => {
    try {
        const certId = String(req.params.certId || '').trim().toUpperCase();
        const reason = String(req.body.reason || "Qoidabuzarlik yoki ma'muriyat qarori").trim();
        const adminName = req.session?.user?.username || 'admin';

        const cert = await Certificate.findOne({ certId });
        if (!cert) return res.status(404).json({ success: false, message: "Sertifikat topilmadi" });

        cert.status = 'revoked';
        cert.isValid = false;
        cert.revokedAt = new Date();
        cert.revokedReason = reason;
        cert.revokedBy = adminName;
        await cert.save();

        logAction(adminName, 'CERTIFICATE_REVOKED', { certId, reason, recipient: cert.username });
        res.json({ success: true, message: `Sertifikat (${certId}) bekor qilindi (Revoked).`, certificate: cert });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// POST /api/admin/certificates/:certId/restore — Qayta tiklash
router.post('/:certId/restore', async (req, res) => {
    try {
        const certId = String(req.params.certId || '').trim().toUpperCase();
        const adminName = req.session?.user?.username || 'admin';

        const cert = await Certificate.findOne({ certId });
        if (!cert) return res.status(404).json({ success: false, message: "Sertifikat topilmadi" });

        cert.status = 'valid';
        cert.isValid = true;
        cert.revokedAt = null;
        cert.revokedReason = null;
        cert.revokedBy = null;
        await cert.save();

        logAction(adminName, 'CERTIFICATE_RESTORED', { certId });
        res.json({ success: true, message: `Sertifikat (${certId}) qayta tiklandi.`, certificate: cert });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

module.exports = router;
