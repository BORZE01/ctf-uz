const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Employer = require('../models/Employer');
const Job = require('../models/Job');
const Application = require('../models/Application');
const User = require('../models/User');

// ══════════════════════════════════════════
// HELPER
// ══════════════════════════════════════════
async function getCurrentUser(req) {
    if (!req.session?.user) return null;
    if (!mongoose.Types.ObjectId.isValid(req.session.user.id)) return null;
    return await User.findById(req.session.user.id);
}

async function getOwnedEmployer(userId) {
    return await Employer.findOne({ ownerUserId: userId });
}

// ══════════════════════════════════════════
// GET /api/employer/me — mening tashkilotim
// ══════════════════════════════════════════
router.get('/me', async (req, res) => {
    try {
        const user = await getCurrentUser(req);
        if (!user) return res.status(401).json({ success: false, message: 'Kirish kerak' });

        const employer = await getOwnedEmployer(user._id);
        
        if (!employer) {
            return res.json({ 
                success: true, 
                employer: null,
                message: 'Sizda hali tashkilot yo\'q' 
            });
        }

        res.json({ success: true, employer });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// ══════════════════════════════════════════
// POST /api/employer/create — tashkilot yaratish
// ══════════════════════════════════════════
router.post('/create', async (req, res) => {
    try {
        const user = await getCurrentUser(req);
        if (!user) return res.status(401).json({ success: false, message: 'Kirish kerak' });

        // Allaqachon bormi?
        const existing = await getOwnedEmployer(user._id);
        if (existing) {
            return res.status(400).json({ 
                success: false, 
                message: 'Sizda allaqachon tashkilot bor' 
            });
        }

        const { name, website, description, industry, companySize, location, contactEmail, contactPhone } = req.body;

        if (!name || name.trim().length < 2) {
            return res.status(400).json({ 
                success: false, 
                message: 'Tashkilot nomi kamida 2 belgi' 
            });
        }

        const employer = await Employer.create({
            name: name.trim(),
            website: website || '',
            description: description || '',
            industry: industry || '',
            companySize: companySize || 'unknown',
            location: location || '',
            contactEmail: contactEmail || '',
            contactPhone: contactPhone || '',
            ownerUserId: user._id,
            verificationStatus: 'pending'
        });

        res.json({ 
            success: true, 
            employer,
            message: 'Tashkilot yaratildi. Admin tasdiqlashini kuting.' 
        });
    } catch (e) {
        console.error('POST /api/employer/create xatosi:', e);
        res.status(500).json({ success: false, message: e.message });
    }
});

// ══════════════════════════════════════════
// PATCH /api/employer/me — tashkilotni tahrirlash
// ══════════════════════════════════════════
router.patch('/me', async (req, res) => {
    try {
        const user = await getCurrentUser(req);
        if (!user) return res.status(401).json({ success: false, message: 'Kirish kerak' });

        const employer = await getOwnedEmployer(user._id);
        if (!employer) {
            return res.status(404).json({ success: false, message: 'Tashkilot topilmadi' });
        }

        const allowed = ['name', 'website', 'description', 'industry', 'companySize', 'location', 'contactEmail', 'contactPhone', 'logo'];
        allowed.forEach(key => {
            if (req.body[key] !== undefined) {
                employer[key] = req.body[key];
            }
        });

        await employer.save();
        res.json({ success: true, employer, message: 'Tashkilot yangilandi' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// ══════════════════════════════════════════
// GET /api/employer/jobs — mening vakansiyalarim
// ══════════════════════════════════════════
router.get('/jobs', async (req, res) => {
    try {
        const user = await getCurrentUser(req);
        if (!user) return res.status(401).json({ success: false, message: 'Kirish kerak' });

        const employer = await getOwnedEmployer(user._id);
        if (!employer) {
            return res.status(404).json({ success: false, message: 'Tashkilot topilmadi' });
        }

        const jobs = await Job.find({ employerId: employer._id })
            .sort({ createdAt: -1 })
            .lean();

        res.json({ success: true, jobs });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// ══════════════════════════════════════════
// POST /api/employer/jobs — yangi vakansiya
// ══════════════════════════════════════════
router.post('/jobs', async (req, res) => {
    try {
        const user = await getCurrentUser(req);
        if (!user) return res.status(401).json({ success: false, message: 'Kirish kerak' });

        const employer = await getOwnedEmployer(user._id);
        if (!employer) {
            return res.status(404).json({ success: false, message: 'Tashkilot topilmadi' });
        }

        if (employer.verificationStatus !== 'verified') {
            return res.status(403).json({ 
                success: false, 
                message: 'Tashkilot tasdiqlanmagan. Admin tasdiqlashini kuting.' 
            });
        }

        const {
            title, description, responsibilities, requirements, niceToHave,
            requiredSkills, optionalSkills, jobType, level, location, remote,
            salaryMin, salaryMax, salaryCurrency, experienceYears, applicationDeadline
        } = req.body;

        if (!title || !description) {
            return res.status(400).json({ 
                success: false, 
                message: 'title va description majburiy' 
            });
        }

        const job = await Job.create({
            employerId: employer._id,
            title: String(title).slice(0, 160),
            description: String(description).slice(0, 5000),
            responsibilities: (responsibilities || []).slice(0, 20),
            requirements: (requirements || []).slice(0, 20),
            niceToHave: (niceToHave || []).slice(0, 20),
            requiredSkills: (requiredSkills || []).slice(0, 20).map(s => String(s).slice(0, 50)),
            optionalSkills: (optionalSkills || []).slice(0, 20).map(s => String(s).slice(0, 50)),
            jobType: jobType || 'full-time',
            level: level || 'junior',
            location: location || '',
            remote: !!remote,
            salaryMin: salaryMin ? Number(salaryMin) : null,
            salaryMax: salaryMax ? Number(salaryMax) : null,
            salaryCurrency: salaryCurrency || 'UZS',
            experienceYears: experienceYears ? Number(experienceYears) : 0,
            applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null,
            status: 'pending',
            createdByUserId: user._id
        });

        // Employer statistikasi
        employer.totalJobs = (employer.totalJobs || 0) + 1;
        await employer.save();

        res.json({ 
            success: true, 
            job,
            message: 'Vakansiya yaratildi. Admin tasdiqlashini kuting.' 
        });
    } catch (e) {
        console.error('POST /api/employer/jobs xatosi:', e);
        res.status(500).json({ success: false, message: e.message });
    }
});

// ══════════════════════════════════════════
// PATCH /api/employer/jobs/:id — vakansiyani tahrirlash
// ══════════════════════════════════════════
router.patch('/jobs/:id', async (req, res) => {
    try {
        const user = await getCurrentUser(req);
        if (!user) return res.status(401).json({ success: false, message: 'Kirish kerak' });

        const employer = await getOwnedEmployer(user._id);
        if (!employer) {
            return res.status(404).json({ success: false, message: 'Tashkilot topilmadi' });
        }

        const job = await Job.findOne({ 
            _id: req.params.id, 
            employerId: employer._id 
        });
        
        if (!job) {
            return res.status(404).json({ success: false, message: 'Vakansiya topilmadi' });
        }

        const allowed = [
            'title', 'description', 'responsibilities', 'requirements', 'niceToHave',
            'requiredSkills', 'optionalSkills', 'jobType', 'level', 'location',
            'remote', 'salaryMin', 'salaryMax', 'salaryCurrency',
            'experienceYears', 'applicationDeadline', 'status'
        ];

        allowed.forEach(key => {
            if (req.body[key] !== undefined) {
                job[key] = req.body[key];
            }
        });

        await job.save();
        res.json({ success: true, job, message: 'Vakansiya yangilandi' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// ══════════════════════════════════════════
// DELETE /api/employer/jobs/:id — o'chirish
// ══════════════════════════════════════════
router.delete('/jobs/:id', async (req, res) => {
    try {
        const user = await getCurrentUser(req);
        if (!user) return res.status(401).json({ success: false, message: 'Kirish kerak' });

        const employer = await getOwnedEmployer(user._id);
        if (!employer) {
            return res.status(404).json({ success: false, message: 'Tashkilot topilmadi' });
        }

        const job = await Job.findOneAndDelete({ 
            _id: req.params.id, 
            employerId: employer._id 
        });

        if (!job) {
            return res.status(404).json({ success: false, message: 'Vakansiya topilmadi' });
        }

        employer.totalJobs = Math.max(0, (employer.totalJobs || 0) - 1);
        await employer.save();

        res.json({ success: true, message: 'Vakansiya o\'chirildi' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// ══════════════════════════════════════════
// GET /api/employer/applications — barcha arizalar
// ══════════════════════════════════════════
router.get('/applications', async (req, res) => {
    try {
        const user = await getCurrentUser(req);
        if (!user) return res.status(401).json({ success: false, message: 'Kirish kerak' });

        const employer = await getOwnedEmployer(user._id);
        if (!employer) {
            return res.status(404).json({ success: false, message: 'Tashkilot topilmadi' });
        }

        const { status, jobId, limit = 50 } = req.query;

        const query = { employerId: employer._id };
        if (status) query.status = status;
        if (jobId) query.jobId = jobId;

        const applications = await Application.find(query)
            .populate('jobId', 'title level jobType location')
            .populate('applicantId', 'username name avatar cyberId.slug')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .lean();

        res.json({ success: true, applications });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// ══════════════════════════════════════════
// GET /api/employer/applications/:id — bitta ariza
// ══════════════════════════════════════════
router.get('/applications/:id', async (req, res) => {
    try {
        const user = await getCurrentUser(req);
        if (!user) return res.status(401).json({ success: false, message: 'Kirish kerak' });

        const employer = await getOwnedEmployer(user._id);
        if (!employer) {
            return res.status(404).json({ success: false, message: 'Tashkilot topilmadi' });
        }

        const application = await Application.findOne({
            _id: req.params.id,
            employerId: employer._id
        })
            .populate('jobId')
            .populate('applicantId', 'username name avatar cyberId')
            .lean();

        if (!application) {
            return res.status(404).json({ success: false, message: 'Ariza topilmadi' });
        }

        // Mark as viewed
        if (!application.viewedByEmployer) {
            await Application.updateOne(
                { _id: application._id },
                { viewedByEmployer: true, viewedAt: new Date() }
            );
        }

        res.json({ success: true, application });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// ══════════════════════════════════════════
// PATCH /api/employer/applications/:id — statusni o'zgartirish
// ══════════════════════════════════════════
router.patch('/applications/:id', async (req, res) => {
    try {
        const user = await getCurrentUser(req);
        if (!user) return res.status(401).json({ success: false, message: 'Kirish kerak' });

        const employer = await getOwnedEmployer(user._id);
        if (!employer) {
            return res.status(404).json({ success: false, message: 'Tashkilot topilmadi' });
        }

        const { status, note } = req.body;
        const validStatuses = ['submitted', 'reviewing', 'interview', 'offered', 'accepted', 'rejected'];

        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Xato status' });
        }

        const application = await Application.findOne({
            _id: req.params.id,
            employerId: employer._id
        });

        if (!application) {
            return res.status(404).json({ success: false, message: 'Ariza topilmadi' });
        }

        if (status) application.status = status;
        if (note) {
            application.notes = application.notes || [];
            application.notes.push({
                text: String(note).slice(0, 1000),
                addedBy: user._id,
                addedAt: new Date()
            });
        }

        await application.save();

        res.json({ 
            success: true, 
            application,
            message: 'Ariza yangilandi' 
        });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

module.exports = router;
