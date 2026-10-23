const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { LearningPath, Certificate, AssessmentAttempt } = require('../models/Learn');
const User = require('../models/User');
const { calculatePathProgress } = require('./learn');
const { logAction } = require('../utils/audit');

function requireAuth(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ success: false, message: "Tizimga kiring" });
    }
    next();
}

// Kriptografik xavfsiz Sertifikat ID generatori
function generateSecureCertId() {
    const part1 = crypto.randomBytes(3).toString('hex').toUpperCase();
    const part2 = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `CTF-UZ-${part1}-${part2}`;
}

// POST /api/certificates/issue-course — Talablarni serverda qayta hisoblab, idempotent sertifikat berish
router.post('/issue-course', requireAuth, async (req, res) => {
    try {
        const { pathSlug } = req.body;
        if (!pathSlug) return res.status(400).json({ success: false, message: "pathSlug majburiy" });

        const userId = req.session.user.id;
        const user = await User.findById(userId).select('name username').lean();
        if (!user) return res.status(404).json({ success: false, message: "Foydalanuvchi topilmadi" });

        const pathDoc = await LearningPath.findOne({ slug: pathSlug.toLowerCase(), isPublished: true });
        if (!pathDoc) return res.status(404).json({ success: false, message: "O'quv yo'li topilmadi" });

        // 1. Idempotency: Oldin berilgan sertifikat bor-yo'qligini tekshirish
        const existingCert = await Certificate.findOne({
            userId,
            pathSlug: pathDoc.slug,
            type: pathDoc.certificateType
        }).lean();

        if (existingCert) {
            if (existingCert.status === 'revoked') {
                return res.status(403).json({
                    success: false,
                    message: "Sizning ushbu yo'nalishdagi sertifikatingiz ma'muriyat tomonidan bekor qilingan (Revoked)."
                });
            }
            return res.json({
                success: true,
                alreadyIssued: true,
                certificate: existingCert,
                message: "Sertifikat allaqachon rasmiylashtirilgan."
            });
        }

        // 2. Server tomonidan barcha shartlar bajarilganini qat'iy tekshirish
        const prog = await calculatePathProgress(userId, pathDoc);
        if (!prog.eligibleForCertificate) {
            return res.status(400).json({
                success: false,
                message: "Sertifikat olish shartlari to'liq bajarilmagan (Barcha darslar, lablar va yakuniy test kamida 80% bo'lishi shart).",
                progress: prog
            });
        }

        // 3. Professional sertifikat bo'lsa amaliy imtihon urinishini ham tekshirish
        if (pathDoc.certificateType === 'professional') {
            const passedPractical = await AssessmentAttempt.findOne({
                userId,
                pathId: pathDoc._id,
                type: 'practical_exam',
                passed: true
            }).lean();
            if (!passedPractical) {
                return res.status(403).json({
                    success: false,
                    message: "Professional sertifikat uchun ruxsat etilgan amaliy baholashdan o'tish talab qilinadi."
                });
            }
        }

        const certId = generateSecureCertId();
        const verifyUrl = `/verify-certificate/${certId}`;

        const newCert = await Certificate.create({
            certId,
            userId,
            recipientName: user.name || user.username,
            username: user.username,
            pathId: pathDoc._id,
            pathSlug: pathDoc.slug,
            courseName: pathDoc.certificateTitle || pathDoc.title,
            type: pathDoc.certificateType || 'course_completion',
            status: 'valid',
            isValid: true,
            scorePercent: prog.finalExamBestScore || 100,
            verifyUrl,
            issueDate: new Date()
        });

        logAction(user.username, 'CERTIFICATE_ISSUED', { certId, pathSlug: pathDoc.slug, type: newCert.type });

        res.json({
            success: true,
            certificate: newCert,
            message: "🎉 Sertifikat muvaffaqiyatli yaratildi!"
        });
    } catch (e) {
        if (e.code === 11000) {
            const cert = await Certificate.findOne({ userId: req.session.user.id, pathSlug: req.body.pathSlug }).lean();
            return res.json({ success: true, alreadyIssued: true, certificate: cert });
        }
        res.status(500).json({ success: false, message: e.message });
    }
});

// GET /api/certificates/me — Foydalanuvchining barcha sertifikatlari
router.get('/me', requireAuth, async (req, res) => {
    try {
        const certs = await Certificate.find({ userId: req.session.user.id }).sort({ issueDate: -1 }).lean();
        res.json({ success: true, certificates: certs });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// GET /api/certificates/verify/:certId — Ommaviy QR Verifikatsiya (Maxfiy ma'lumotlarsiz!)
router.get('/verify/:certId', async (req, res) => {
    try {
        const certId = String(req.params.certId || '').trim().toUpperCase();
        
        // Ham certId, ham certificateId orqali qidiramiz
        const cert = await Certificate.findOne({ 
            $or: [{ certId: certId }, { certificateId: certId }] 
        }).lean();
    

        if (!cert) {
            return res.status(404).json({
                success: false,
                status: 'not_found',
                message: "Bunday ID raqamli sertifikat CTF.UZ bazasida topilmadi."
            });
        }

        // FAQAT ruxsat etilgan ommaviy ma'lumotlarni qaytaramiz (email, telefon, userId chiqmaydi)
        res.json({
            success: true,
            certificate: {
                certId: cert.certId || cert.certificateId,
                recipientName: cert.recipientName || cert.username || "Noma'lum foydalanuvchi",
                username: cert.username || "noma'lum",
                courseName: cert.courseName || cert.title || "Maxsus Sertifikat",
                pathSlug: cert.pathSlug || "custom",
                type: cert.type === 'professional' ? 'Professional Practical Certification' : (cert.type === 'custom' ? 'Custom Award' : 'Course Completion Certificate'),
                rawType: cert.type || "custom",
                status: cert.status || "valid",
                isValid: cert.status !== 'revoked',
                scorePercent: cert.scorePercent || 100,
                issueDate: cert.issueDate || cert.createdAt,
                revokedAt: cert.revokedAt,
                revokedReason: cert.revokedReason,
                verifyUrl: cert.verifyUrl || `/verify-certificate/${cert.certId || cert.certificateId}`
            }
        });
    } catch (e) {
        res.status(500).json({ success: false, message: "Tekshirishda xatolik yuz berdi" });
    }
});

// GET /api/certificates/:certId
router.get('/:certId', async (req, res) => {
    try {
        const certId = String(req.params.certId || '').trim().toUpperCase();
        
        // Ham certId, ham certificateId orqali qidiramiz
        const cert = await Certificate.findOne({ 
            $or: [{ certId: certId }, { certificateId: certId }] 
        }).lean();
    
        if (!cert) return res.status(404).json({ success: false, message: "Sertifikat topilmadi" });

        res.json({
            success: true,
            certificate: {
                certId: cert.certId || cert.certificateId,
                recipientName: cert.recipientName || cert.username || "Noma'lum foydalanuvchi",
                username: cert.username || "noma'lum",
                courseName: cert.courseName || cert.title || "Maxsus Sertifikat",
                type: cert.type || "custom",
                status: cert.status || "valid",
                scorePercent: cert.scorePercent || 100,
                issueDate: cert.issueDate || cert.createdAt,
                revokedAt: cert.revokedAt,
                revokedReason: cert.revokedReason,
                verifyUrl: cert.verifyUrl || `/verify-certificate/${cert.certId || cert.certificateId}`
            }
        });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

module.exports = router;
