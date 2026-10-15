const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Job = require('../models/Job');
const Employer = require('../models/Employer');
const Application = require('../models/Application');
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
// GET /api/career/jobs — barcha vakansiyalar
// ══════════════════════════════════════════
router.get('/jobs', async (req, res) => {
    try {
        const { level, jobType, location, search, featured, limit = 50 } = req.query;

        const query = { status: 'published' };
        if (level) query.level = level;
        if (jobType) query.jobType = jobType;
        if (location) query.location = new RegExp(String(location).slice(0, 50), 'i');
        if (featured === 'true') query.featured = true;
        if (search) {
            const s = String(search).slice(0, 100);
            query.$or = [
                { title: new RegExp(s, 'i') },
                { description: new RegExp(s, 'i') },
                { requiredSkills: new RegExp(s, 'i') }
            ];
        }

        const jobs = await Job.find(query)
            .populate('employerId', 'name logo verificationStatus location industry')
            .sort({ featured: -1, createdAt: -1 })
            .limit(parseInt(limit) || 50)
            .lean();

        // Faqat tasdiqlangan kompaniyalar
        const verified = jobs.filter(j => 
            j.employerId && j.employerId.verificationStatus === 'verified'
        );

        res.json({ 
            success: true, 
            jobs: verified, 
            total: verified.length 
        });
    } catch (e) {
        console.error('GET /api/career/jobs xatosi:', e);
        res.status(500).json({ success: false, message: e.message });
    }
});

// ══════════════════════════════════════════
// GET /api/career/jobs/:id — bitta vakansiya
// ══════════════════════════════════════════
router.get('/jobs/:id', async (req, res) => {
    try {
        // MongoDB ObjectId tekshirish
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Xato ID format' 
            });
        }

        const job = await Job.findById(req.params.id)
            .populate('employerId', 'name logo website description verificationStatus location industry companySize')
            .lean();

        if (!job) {
            return res.status(404).json({ 
                success: false, 
                message: 'Vakansiya topilmadi' 
            });
        }

        // Match hisoblash (agar login qilgan bo'lsa)
        let match = null;
        const user = await getCurrentUser(req);
        if (user) {
            try {
                match = await calculateFullMatch(user._id, job);
            } catch (e) {
                console.error('Match xatosi:', e.message);
            }
        }

        // Views count
        await Job.updateOne({ _id: job._id }, { $inc: { viewsCount: 1 } });

        res.json({ 
            success: true, 
            job, 
            match 
        });
    } catch (e) {
        console.error('GET /api/career/jobs/:id xatosi:', e);
        res.status(500).json({ success: false, message: e.message });
    }
});

// ══════════════════════════════════════════
// GET /api/career/recommendations — shaxsiy tavsiyalar
// ══════════════════════════════════════════
router.get('/recommendations', async (req, res) => {
    try {
        const user = await getCurrentUser(req);
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Kirish kerak' 
            });
        }

        const jobs = await Job.find({ status: 'published' })
            .populate('employerId', 'name logo verificationStatus location industry')
            .limit(50)
            .lean();

        const validJobs = jobs.filter(j => 
            j.employerId && j.employerId.verificationStatus === 'verified'
        );

        const scored = await Promise.all(
            validJobs.map(async (job) => {
                try {
                    const match = await calculateFullMatch(user._id, job);
                    return { ...job, match };
                } catch (e) {
                    return { ...job, match: { score: 0 } };
                }
            })
        );

        scored.sort((a, b) => (b.match?.score || 0) - (a.match?.score || 0));

        res.json({
            success: true,
            recommendations: scored.slice(0, 20),
            total: scored.length
        });
    } catch (e) {
        console.error('GET /api/career/recommendations xatosi:', e);
        res.status(500).json({ success: false, message: e.message });
    }
});

// ══════════════════════════════════════════
// POST /api/career/jobs/:id/apply — ariza yuborish
// ══════════════════════════════════════════
router.post('/jobs/:id/apply', async (req, res) => {
    try {
        const user = await getCurrentUser(req);
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Kirish kerak' 
            });
        }

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Xato ID' 
            });
        }

        const job = await Job.findById(req.params.id).populate('employerId');
        if (!job) {
            return res.status(404).json({ 
                success: false, 
                message: 'Vakansiya topilmadi' 
            });
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

        // O'z vakansiyasiga ariza yubormasin
        if (job.employerId.ownerUserId.toString() === user._id.toString()) {
            return res.status(400).json({ 
                success: false, 
                message: 'O\'z vakansiyangizga ariza yubora olmaysiz' 
            });
        }

        const { coverLetter } = req.body;

        // Match + Snapshot
        const matchData = await calculateFullMatch(user._id, job);
        const certCount = await Certificate.countDocuments({
            userId: user._id,
            status: 'active'
        });

        const application = await Application.create({
            jobId: job._id,
            applicantId: user._id,
            employerId: job.employerId._id,
            coverLetter: String(coverLetter || '').slice(0, 5000),
            portfolioSnapshot: {
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
            },
            status: 'submitted'
        });

        // Counters
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
        console.error('POST /api/career/jobs/:id/apply xatosi:', e);
        res.status(500).json({ success: false, message: e.message });
    }
});

// ══════════════════════════════════════════
// POST /api/career/jobs/:id/save — saqlash/bekor qilish
// ══════════════════════════════════════════
router.post('/jobs/:id/save', async (req, res) => {
    try {
        const user = await getCurrentUser(req);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Kirish kerak' });
        }

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Xato ID' });
        }

        // SavedJob model bor bo'lsa ishlatish
        let SavedJob;
        try {
            SavedJob = require('../models/SavedJob');
        } catch (e) {
            return res.status(501).json({ 
                success: false, 
                message: 'Saqlash funksiyasi hozircha mavjud emas' 
            });
        }

        const existing = await SavedJob.findOne({
            userId: user._id,
            jobId: req.params.id
        });

        if (existing) {
            await SavedJob.deleteOne({ _id: existing._id });
            res.json({ 
                success: true, 
                saved: false, 
                message: 'Saqlanganlardan olib tashlandi' 
            });
        } else {
            await SavedJob.create({ 
                userId: user._id, 
                jobId: req.params.id 
            });
            res.json({ 
                success: true, 
                saved: true, 
                message: 'Saqlandi' 
            });
        }
    } catch (e) {
        console.error('POST /api/career/jobs/:id/save xatosi:', e);
        res.status(500).json({ success: false, message: e.message });
    }
});

module.exports = router;
