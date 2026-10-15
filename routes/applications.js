const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Application = require('../models/Application');
const Job = require('../models/Job');
const Employer = require('../models/Employer');
const User = require('../models/User');
const Certificate = require('../models/Certificate');
const { calculateFullMatch } = require('../services/matchingService');

// ══════════════════════════════════════════
// HELPER
// ══════════════════════════════════════════
async function getCurrentUser(req) {
    if (!req.session?.user) return null;
    if (!mongoose.Types.ObjectId.isValid(req.session.user.id)) return null;
    return await User.findById(req.session.user.id);
}

// ══════════════════════════════════════════
// POST /api/applications/:jobId — ariza yuborish
// ══════════════════════════════════════════
router.post('/:jobId', async (req, res) => {
    try {
        const user = await getCurrentUser(req);
        if (!user) return res.status(401).json({ success: false, message: 'Kirish kerak' });

        const job = await Job.findById(req.params.jobId).populate('employerId');
        if (!job) {
            return res.status(404).json({ success: false, message: 'Vakansiya topilmadi' });
        }

        if (job.status !== 'published') {
            return res.status(400).json({ 
                success: false, 
                message: 'Bu vakansiya aktiv emas' 
            });
        }

        // Allaqachon ariza bormi?
        const existing = await Application.findOne({
            jobId: job._id,
            applicantId: user._id
        });

        if (existing) {
            return res.status(400).json({ 
                success: false, 
                message: 'Siz allaqachon ariza yuborgansiz' 
            });
        }

        // O'z tashkilotiga ariza yubormasin
        if (job.employerId.ownerUserId.toString() === user._id.toString()) {
            return res.status(400).json({ 
                success: false, 
                message: 'O\'z vakansiyangizga ariza yubora olmaysiz' 
            });
        }

        const { coverLetter } = req.body;

        // Snapshot — Cyber ID ma'lumotlari
        const matchData = await calculateFullMatch(user._id, job);
        const certCount = await Certificate.countDocuments({
            userId: user._id,
            status: 'active'
        });

        const portfolioSnapshot = {
            username: user.username,
            name: user.name,
            avatar: user.avatar,
            score: user.score || 0,
            cyberLevel: user.cyberLevel || 1,
            skills: user.skills || {},
            solvedCount: (user.solvedChallenges || []).length,
            certificatesCount: certCount,
            battleRating: user.battleRating || 1000,
            matchedSkills: matchData.requiredMatched || [],
            missingSkills: matchData.missingRequired || [],
            matchScore: matchData.score,
            snapshotAt: new Date()
        };

        const application = await Application.create({
            jobId: job._id,
            applicantId: user._id,
            employerId: job.employerId._id,
            coverLetter: String(coverLetter || '').slice(0, 5000),
            portfolioSnapshot,
            status: 'submitted'
        });

        // Increment counters
        job.applicationsCount = (job.applicationsCount || 0) + 1;
        await job.save();

        const employer = await Employer.findById(job.employerId._id);
        if (employer) {
            employer.totalApplications = (employer.totalApplications || 0) + 1;
            await employer.save();
        }

        res.json({
            success: true,
            application,
            matchScore: matchData.score,
            message: 'Ariza yuborildi!'
        });
    } catch (e) {
        console.error('POST /api/applications/:jobId xatosi:', e);
        res.status(500).json({ success: false, message: e.message });
    }
});

// ══════════════════════════════════════════
// GET /api/applications/me — mening arizalarim
// ══════════════════════════════════════════
router.get('/me', async (req, res) => {
    try {
        const user = await getCurrentUser(req);
        if (!user) return res.status(401).json({ success: false, message: 'Kirish kerak' });

        const { status, limit = 50 } = req.query;

        const query = { applicantId: user._id };
        if (status) query.status = status;

        const applications = await Application.find(query)
            .populate({
                path: 'jobId',
                populate: { path: 'employerId', select: 'name logo' }
            })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .lean();

        res.json({ success: true, applications });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// ══════════════════════════════════════════
// GET /api/applications/:id — bitta ariza (nomzod o'zi)
// ══════════════════════════════════════════
router.get('/:id', async (req, res) => {
    try {
        const user = await getCurrentUser(req);
        if (!user) return res.status(401).json({ success: false, message: 'Kirish kerak' });

        const application = await Application.findOne({
            _id: req.params.id,
            applicantId: user._id
        })
            .populate('jobId')
            .lean();

        if (!application) {
            return res.status(404).json({ success: false, message: 'Ariza topilmadi' });
        }

        res.json({ success: true, application });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// ══════════════════════════════════════════
// DELETE /api/applications/:id — bekor qilish
// ══════════════════════════════════════════
router.delete('/:id', async (req, res) => {
    try {
        const user = await getCurrentUser(req);
        if (!user) return res.status(401).json({ success: false, message: 'Kirish kerak' });

        const application = await Application.findOne({
            _id: req.params.id,
            applicantId: user._id
        });

        if (!application) {
            return res.status(404).json({ success: false, message: 'Ariza topilmadi' });
        }

        // Faqat submitted yoki reviewing — bekor qilish mumkin
        if (!['submitted', 'reviewing'].includes(application.status)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Bu arizani bekor qila olmaysiz' 
            });
        }

        application.status = 'withdrawn';
        await application.save();

        res.json({ success: true, message: 'Ariza bekor qilindi' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

module.exports = router;
