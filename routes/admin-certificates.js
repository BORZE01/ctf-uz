const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Certificate = require('../models/Certificate');
const User = require('../models/User');
const { 
    issueCertificate, 
    revokeCertificate 
} = require('../services/certificateService');

// ══════════════════════════════════════════
// HELPER — admin nomi
// ══════════════════════════════════════════
function getAdminName(req) {
    return req.adminUser?.username || req.session?.user?.username || 'admin';
}

// ══════════════════════════════════════════
// GET /api/admin/certificates — barcha sertifikatlar
// ══════════════════════════════════════════
router.get('/', async (req, res) => {
    try {
        const { status, type, search, limit = 100, page = 1 } = req.query;

        const query = {};
        if (status) query.status = status;
        if (type) query.type = type;

        // Qidirish — certificateId yoki userId
        if (search) {
            const s = String(search).slice(0, 50);
            
            // User topish
            const users = await User.find({
                $or: [
                    { username: new RegExp(s, 'i') },
                    { email: new RegExp(s, 'i') },
                    { name: new RegExp(s, 'i') }
                ]
            }).select('_id').limit(50).lean();

            const userIds = users.map(u => u._id);

            query.$or = [
                { certificateId: new RegExp(s, 'i') },
                { title: new RegExp(s, 'i') },
                { userId: { $in: userIds } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [certificates, total] = await Promise.all([
            Certificate.find(query)
                .populate('userId', 'username name email avatar')
                .sort({ issuedAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Certificate.countDocuments(query)
        ]);

        // Format
        const result = certificates.map(c => ({
            id: c._id.toString(),
            certificateId: c.certificateId,
            type: c.type,
            title: c.title,
            issuer: c.issuer,
            status: c.status,
            issuedAt: c.issuedAt,
            expiresAt: c.expiresAt,
            sourceType: c.sourceType,
            sourceId: c.sourceId,
            revokedAt: c.revokedAt,
            revokeReason: c.revokeReason,
            user: c.userId ? {
                id: c.userId._id.toString(),
                username: c.userId.username,
                name: c.userId.name,
                email: c.userId.email,
                avatar: c.userId.avatar
            } : null
        }));

        res.json({
            success: true,
            certificates: result,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit))
        });
    } catch (e) {
        console.error('GET /api/admin/certificates xatosi:', e);
        res.status(500).json({ success: false, message: e.message });
    }
});

// ══════════════════════════════════════════
// GET /api/admin/certificates/stats — statistika
// ══════════════════════════════════════════
router.get('/stats', async (req, res) => {
    try {
        const [
            total,
            active,
            revoked,
            expired,
            byType
        ] = await Promise.all([
            Certificate.countDocuments(),
            Certificate.countDocuments({ status: 'active' }),
            Certificate.countDocuments({ status: 'revoked' }),
            Certificate.countDocuments({ 
                status: 'active',
                expiresAt: { $lt: new Date() }
            }),
            Certificate.aggregate([
                { $group: { _id: '$type', count: { $sum: 1 } } }
            ])
        ]);

        // Oxirgi 30 kun
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const recentlyIssued = await Certificate.countDocuments({
            issuedAt: { $gte: thirtyDaysAgo }
        });

        res.json({
            success: true,
            stats: {
                total,
                active,
                revoked,
                expired,
                recentlyIssued,
                byType: byType.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {})
            }
        });
    } catch (e) {
        console.error('GET /api/admin/certificates/stats xatosi:', e);
        res.status(500).json({ success: false, message: e.message });
    }
});

// ══════════════════════════════════════════
// GET /api/admin/certificates/search-users — user qidirish
// ══════════════════════════════════════════
router.get('/search-users', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 2) {
            return res.json({ success: true, users: [] });
        }

        const s = String(q).slice(0, 50);

        const users = await User.find({
            $or: [
                { username: new RegExp(s, 'i') },
                { email: new RegExp(s, 'i') },
                { name: new RegExp(s, 'i') }
            ]
        })
            .select('username name email avatar cyberLevel')
            .limit(10)
            .lean();

        res.json({
            success: true,
            users: users.map(u => ({
                id: u._id.toString(),
                username: u.username,
                name: u.name,
                email: u.email,
                avatar: u.avatar,
                cyberLevel: u.cyberLevel || 1
            }))
        });
    } catch (e) {
        console.error('GET /api/admin/certificates/search-users xatosi:', e);
        res.status(500).json({ success: false, message: e.message });
    }
});

// ══════════════════════════════════════════
// POST /api/admin/certificates/issue — sertifikat berish
// ══════════════════════════════════════════
router.post('/issue', async (req, res) => {
    try {
        const { userId, type, title, sourceType, sourceId, expiresAt } = req.body;

        if (!userId || !type || !title || !sourceType || !sourceId) {
            return res.status(400).json({
                success: false,
                message: 'userId, type, title, sourceType, sourceId majburiy'
            });
        }

        // User mavjudligini tekshirish
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'Foydalanuvchi topilmadi' 
            });
        }

        // Type tekshirish
        if (!['course', 'competition', 'skill'].includes(type)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Xato sertifikat turi' 
            });
        }

        const result = await issueCertificate({
            userId,
            type,
            title,
            sourceType,
            sourceId,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            issuedBy: req.adminUser?._id || req.session?.user?.id
        });

        res.json({
            success: true,
            certificate: result.certificate,
            alreadyIssued: result.alreadyIssued,
            message: result.alreadyIssued
                ? 'Bu sertifikat allaqachon berilgan'
                : `Sertifikat berildi: ${result.certificate.certificateId}`
        });
    } catch (e) {
        console.error('POST /api/admin/certificates/issue xatosi:', e);
        res.status(500).json({ success: false, message: e.message });
    }
});

// ══════════════════════════════════════════
// POST /api/admin/certificates/:id/revoke — bekor qilish
// ══════════════════════════════════════════
router.post('/:id/revoke', async (req, res) => {
    try {
        const { reason } = req.body;

        if (!reason || reason.trim().length < 3) {
            return res.status(400).json({ 
                success: false, 
                message: 'Bekor qilish sababi kamida 3 belgi' 
            });
        }

        const result = await revokeCertificate(
            req.params.id.toUpperCase(),
            req.adminUser?._id || req.session?.user?.id,
            String(reason).slice(0, 500)
        );

        res.json({
            success: true,
            certificate: result.certificate,
            message: result.alreadyRevoked 
                ? 'Allaqachon bekor qilingan' 
                : 'Sertifikat bekor qilindi'
        });
    } catch (e) {
        console.error('POST /api/admin/certificates/:id/revoke xatosi:', e);
        res.status(500).json({ success: false, message: e.message });
    }
});

// ══════════════════════════════════════════
// POST /api/admin/certificates/bulk-issue — ko'p userlarga
// ══════════════════════════════════════════
router.post('/bulk-issue', async (req, res) => {
    try {
        const { userIds, type, title, sourceType, sourceId, expiresAt } = req.body;

        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'userIds massivi kerak' 
            });
        }

        if (!type || !title || !sourceType || !sourceId) {
            return res.status(400).json({ 
                success: false, 
                message: 'type, title, sourceType, sourceId majburiy' 
            });
        }

        if (userIds.length > 100) {
            return res.status(400).json({ 
                success: false, 
                message: 'Maksimal 100 ta user' 
            });
        }

        const adminId = req.adminUser?._id || req.session?.user?.id;
        const results = {
            issued: [],
            alreadyIssued: [],
            failed: []
        };

        for (const userId of userIds) {
            try {
                const user = await User.findById(userId);
                if (!user) {
                    results.failed.push({ userId, reason: 'User topilmadi' });
                    continue;
                }

                const result = await issueCertificate({
                    userId,
                    type,
                    title,
                    sourceType,
                    sourceId,
                    expiresAt: expiresAt ? new Date(expiresAt) : null,
                    issuedBy: adminId
                });

                if (result.alreadyIssued) {
                    results.alreadyIssued.push({
                        userId,
                        certificateId: result.certificate.certificateId
                    });
                } else {
                    results.issued.push({
                        userId,
                        username: user.username,
                        certificateId: result.certificate.certificateId
                    });
                }
            } catch (err) {
                results.failed.push({ userId, reason: err.message });
            }
        }

        res.json({
            success: true,
            results,
            message: `${results.issued.length} ta berildi, ${results.alreadyIssued.length} ta allaqachon bor, ${results.failed.length} ta xato`
        });
    } catch (e) {
        console.error('POST /api/admin/certificates/bulk-issue xatosi:', e);
        res.status(500).json({ success: false, message: e.message });
    }
});

// ══════════════════════════════════════════
// GET /api/admin/certificates/:id — bitta sertifikat
// ══════════════════════════════════════════
router.get('/:id', async (req, res) => {
    try {
        const certificate = await Certificate.findOne({
            certificateId: req.params.id.toUpperCase()
        })
            .populate('userId', 'username name email avatar cyberLevel')
            .populate('revokedBy', 'username')
            .lean();

        if (!certificate) {
            return res.status(404).json({ 
                success: false, 
                message: 'Sertifikat topilmadi' 
            });
        }

        res.json({ success: true, certificate });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// ══════════════════════════════════════════
// DELETE /api/admin/certificates/:id — o'chirish
// ══════════════════════════════════════════
router.delete('/:id', async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Xato ID' 
            });
        }

        const deleted = await Certificate.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ 
                success: false, 
                message: 'Sertifikat topilmadi' 
            });
        }

        res.json({ 
            success: true, 
            message: 'Sertifikat o\'chirildi (permanent)',
            deletedId: deleted.certificateId
        });
    } catch (e) {
        console.error('DELETE xatosi:', e);
        res.status(500).json({ success: false, message: e.message });
    }
});

module.exports = router;
