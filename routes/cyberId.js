const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Certificate = require('../models/Certificate');
const SkillEvidence = require('../models/SkillEvidence');
const Challenge = require('../models/Challenge');
const { getCyberIdData } = require('../services/cyberIdService');

// ══════════════════════════════════════════
// HELPER
// ══════════════════════════════════════════
async function getCurrentUser(req) {
    if (!req.session?.user) return null;
    if (!mongoose.Types.ObjectId.isValid(req.session.user.id)) return null;
    return await User.findById(req.session.user.id);
}

// ══════════════════════════════════════════
// GET /api/cyber-id/me — o'z Cyber ID
// ══════════════════════════════════════════
router.get('/me', async (req, res) => {
    try {
        const user = await getCurrentUser(req);
        if (!user) return res.status(401).json({ success: false, message: 'Kirish kerak' });

        const data = await getCyberIdData(user._id, true);
        if (!data) return res.status(404).json({ success: false, message: 'Profil topilmadi' });

        res.json({ success: true, cyberId: data });
    } catch (e) {
        console.error('/api/cyber-id/me xatosi:', e);
        res.status(500).json({ success: false, message: e.message });
    }
});

// ══════════════════════════════════════════
// PATCH /api/cyber-id/me — tahrirlash
// ══════════════════════════════════════════
router.patch('/me', async (req, res) => {
    try {
        const user = await getCurrentUser(req);
        if (!user) return res.status(401).json({ success: false, message: 'Kirish kerak' });

        const { 
            headline, 
            visibility, 
            openToOpportunities, 
            preferredRoles, 
            portfolioLinks,
            location
        } = req.body;

        if (!user.cyberId) user.cyberId = {};
        if (!user.cyberId.slug) user.cyberId.slug = user.username.toLowerCase();

        if (headline !== undefined) {
            user.cyberId.headline = String(headline).slice(0, 160);
        }
        if (visibility && ['public', 'private'].includes(visibility)) {
            user.cyberId.visibility = visibility;
        }
        if (typeof openToOpportunities === 'boolean') {
            user.cyberId.openToOpportunities = openToOpportunities;
        }
        if (Array.isArray(preferredRoles)) {
            user.cyberId.preferredRoles = preferredRoles
                .slice(0, 10)
                .map(r => String(r).slice(0, 50));
        }
        if (Array.isArray(portfolioLinks)) {
            user.cyberId.portfolioLinks = portfolioLinks
                .slice(0, 10)
                .map(l => ({
                    label: String(l.label || '').slice(0, 50),
                    url: String(l.url || '').slice(0, 500)
                }))
                .filter(l => l.label && l.url);
        }
        if (location !== undefined) {
            user.cyberId.location = String(location).slice(0, 100);
        }

        await user.save();
        res.json({ success: true, message: 'Cyber ID yangilandi' });
    } catch (e) {
        console.error('PATCH /api/cyber-id/me xatosi:', e);
        res.status(500).json({ success: false, message: e.message });
    }
});

// ══════════════════════════════════════════
// GET /api/cyber-id/me/skills — ko'nikmalar
// ══════════════════════════════════════════
router.get('/me/skills', async (req, res) => {
    try {
        const user = await getCurrentUser(req);
        if (!user) return res.status(401).json({ success: false, message: 'Kirish kerak' });

        const evidence = await SkillEvidence.find({ userId: user._id })
            .sort({ createdAt: -1 })
            .lean();

        // Group by skill
        const skillsMap = new Map();
        evidence.forEach(ev => {
            const key = ev.skillKey;
            const existing = skillsMap.get(key);
            const levelRank = { learning: 1, practiced: 2, verified: 3 };

            if (!existing) {
                skillsMap.set(key, {
                    key,
                    label: ev.skillLabel,
                    level: ev.level,
                    status: ev.status,
                    evidenceCount: 1,
                    sources: [{
                        type: ev.evidenceType,
                        name: ev.sourceName,
                        level: ev.level,
                        earnedAt: ev.createdAt
                    }]
                });
            } else {
                existing.evidenceCount++;
                existing.sources.push({
                    type: ev.evidenceType,
                    name: ev.sourceName,
                    level: ev.level,
                    earnedAt: ev.createdAt
                });
                if (levelRank[ev.level] > levelRank[existing.level]) {
                    existing.level = ev.level;
                }
            }
        });

        res.json({
            success: true,
            skills: Array.from(skillsMap.values()),
            total: evidence.length
        });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// ══════════════════════════════════════════
// POST /api/cyber-id/me/skills — ko'nikma qo'shish (o'zi)
// ══════════════════════════════════════════
router.post('/me/skills', async (req, res) => {
    try {
        const user = await getCurrentUser(req);
        if (!user) return res.status(401).json({ success: false, message: 'Kirish kerak' });

        const { skillKey, skillLabel, evidenceType = 'self', sourceName = 'Self-declared' } = req.body;

        if (!skillKey || !skillLabel) {
            return res.status(400).json({ 
                success: false, 
                message: 'skillKey va skillLabel majburiy' 
            });
        }

        // Bu faqat "learning" darajasi uchun (o'zi qo'shgan)
        const existing = await SkillEvidence.findOne({
            userId: user._id,
            skillKey: skillKey.toLowerCase()
        });

        if (existing) {
            return res.status(400).json({ 
                success: false, 
                message: 'Bu ko\'nikma allaqachon mavjud' 
            });
        }

        const evidence = await SkillEvidence.create({
            userId: user._id,
            skillKey: skillKey.toLowerCase(),
            skillLabel,
            evidenceType: 'assessment',
            sourceName,
            level: 'learning',
            status: 'earned'
        });

        res.json({ 
            success: true, 
            evidence,
            message: 'Ko\'nikma qo\'shildi (O\'rganmoqda)' 
        });
    } catch (e) {
        if (e.code === 11000) {
            return res.status(400).json({ success: false, message: 'Bu ko\'nikma mavjud' });
        }
        res.status(500).json({ success: false, message: e.message });
    }
});

// ══════════════════════════════════════════
// DELETE /api/cyber-id/me/skills/:id — o'chirish
// ══════════════════════════════════════════
router.delete('/me/skills/:id', async (req, res) => {
    try {
        const user = await getCurrentUser(req);
        if (!user) return res.status(401).json({ success: false, message: 'Kirish kerak' });

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Xato ID' });
        }

        const evidence = await SkillEvidence.findOneAndDelete({
            _id: req.params.id,
            userId: user._id,
            level: 'learning'   // Faqat o'zi qo'shganlarni o'chira oladi
        });

        if (!evidence) {
            return res.status(404).json({ 
                success: false, 
                message: 'Ko\'nikma topilmadi yoki uni o\'chirish mumkin emas' 
            });
        }

        res.json({ success: true, message: 'O\'chirildi' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// ══════════════════════════════════════════
// GET /api/cyber-id/me/certificates — sertifikatlar
// ══════════════════════════════════════════
router.get('/me/certificates', async (req, res) => {
    try {
        const user = await getCurrentUser(req);
        if (!user) return res.status(401).json({ success: false, message: 'Kirish kerak' });

        const certificates = await Certificate.find({ userId: user._id })
            .sort({ issuedAt: -1 })
            .lean();

        // Add verify URL
        const result = certificates.map(c => ({
            ...c,
            verifyUrl: `${process.env.BASE_URL || 'http://localhost:3000'}/certificate-verify?id=${c.certificateId}`
        }));

        res.json({ success: true, certificates: result });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// ══════════════════════════════════════════
// GET /api/cyber-id/:slug — public profil
// ══════════════════════════════════════════
router.get('/:slug', async (req, res) => {
    try {
        const slug = req.params.slug.toLowerCase();

        // Slug yoki username bo'yicha
        let user = await User.findOne({ 'cyberId.slug': slug });
        if (!user) user = await User.findOne({ username: slug });

        if (!user) {
            return res.status(404).json({ success: false, message: 'Profil topilmadi' });
        }

        const currentUser = await getCurrentUser(req);
        const isOwner = currentUser && currentUser._id.toString() === user._id.toString();

        const data = await getCyberIdData(user._id, isOwner);
        if (!data) return res.status(404).json({ success: false, message: 'Profil topilmadi' });

        if (data.hidden) {
            return res.status(403).json({ 
                success: false, 
                message: data.message || 'Bu profil maxfiy',
                hidden: true
            });
        }

        res.json({ success: true, cyberId: data });
    } catch (e) {
        console.error('GET /api/cyber-id/:slug xatosi:', e);
        res.status(500).json({ success: false, message: e.message });
    }
});

module.exports = router;
