const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');

// RBAC Middleware
const isEmployer = async (req, res, next) => {
    if (!req.session || !req.session.user) return res.status(401).json({ success: false, message: 'Tizimga kiring' });
    try {
        const u = await User.findById(req.session.user.id);
        if (!u || !['employer', 'admin', 'super_admin'].includes(u.role)) {
            return res.status(403).json({ success: false, message: 'Faqat ish beruvchilar uchun' });
        }
        req.dbUser = u;
        next();
    } catch(e) { res.status(500).json({ success: false, message: 'Server xatosi' }); }
};

// 1. ARIZA YUBORISH
router.post('/apply', async (req, res) => {
    try {
        if (!req.session || !req.session.user) {
            return res.json({ success: false, message: 'Iltimos, qayta login qiling (Sessiya eskirgan).' });
        }
        
        const user = await User.findById(req.session.user.id);
        
        if (!user) return res.json({ success: false, message: 'Profil topilmadi.' });
        
        if (user.role === 'employer') {
            return res.json({ success: true, message: 'Siz allaqachon ish beruvchisiz!' });
        }
        
        await User.updateOne(
            { _id: user._id }, 
            { $set: { role: 'pending_employer' } }
        );
        
        req.session.user.role = 'pending_employer';
        
        await new Promise((resolve, reject) => {
            req.session.save((err) => {
                if (err) return reject(err);
                resolve();
            });
        });

        return res.json({ success: true, message: "Arizangiz muvaffaqiyatli qabul qilindi!" });
    } catch(err) {
        console.error("Apply Error:", err.message);
        return res.json({ success: false, message: "Backend xatosi: " + err.message });
    }
});

// 2. DASHBOARD STATS
router.get('/stats', isEmployer, async (req, res) => {
    try {
        const jobs = await Job.find({ author: req.dbUser._id });
        const apps = await Application.find({ employer: req.dbUser._id });
        res.json({
            success: true,
            companyStatus: req.dbUser.companyProfile?.status || 'incomplete',
            stats: {
                totalJobs: jobs.length,
                pendingJobs: jobs.filter(j => j.status === 'pending').length,
                publishedJobs: jobs.filter(j => j.status === 'published').length,
                rejectedJobs: jobs.filter(j => j.status === 'rejected').length,
                totalApps: apps.length,
                newApps: apps.filter(a => a.status === 'new').length
            }
        });
    } catch (err) { res.status(500).json({ success: false, message: 'Server xatosi' }); }
});

// 3. PROFILNI YANGILASH
router.put('/profile', isEmployer, async (req, res) => {
    try {
        const { companyName, description, website, contactEmail, industry } = req.body;
        await User.updateOne({ _id: req.dbUser._id }, {
            $set: {
                'companyProfile.companyName': companyName,
                'companyProfile.description': description,
                'companyProfile.website': website,
                'companyProfile.contactEmail': contactEmail,
                'companyProfile.industry': industry,
                'companyProfile.status': 'pending'
            }
        });
        res.json({ success: true, message: "Profil yangilandi va moderatsiyaga yuborildi." });
    } catch (err) { res.status(500).json({ success: false, message: "Server xatosi" }); }
});

// 4. VAKANSIYA QO'SHISH (Validation xatosi to'g'rilandi)
router.post('/jobs', isEmployer, async (req, res) => {
    try {
        const uniqueSlug = 'job-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        
        const job = new Job({ 
            title: req.body.title,
            shortDesc: req.body.shortDesc, // <-- Mongoose aynan shuni kutmoqda
            description: req.body.shortDesc, // Zaxira sifatida
            type: req.body.workFormat,
            level: req.body.experienceLevel,
            salary: req.body.salary,
            author: req.dbUser._id, 
            status: 'draft' 
        });
        
        job.set('slug', uniqueSlug, { strict: false });
        
        await job.save();
        res.json({ success: true, message: "Vakansiya qoralama sifatida saqlandi!" });
    } catch (err) { 
        console.error("Job saqlashda xato:", err);
        res.status(500).json({ success: false, message: "Baza xatosi: " + err.message }); 
    }
});

// 5. ARIZALARNI KORISH
router.get('/applications', isEmployer, async (req, res) => {
    try {
        const apps = await Application.find({ employer: req.dbUser._id })
            .populate('job', 'title')
            .populate('candidate', 'name username email skills cyberLevel')
            .sort('-createdAt');
        res.json({ success: true, apps });
    } catch (err) { res.status(500).json({ success: false }); }
});

// 6. ARIZA HOLATINI O'ZGARTIRISH
router.put('/applications/:id/status', isEmployer, async (req, res) => {
    try {
        const { status } = req.body;
        const app = await Application.findOne({ _id: req.params.id, employer: req.dbUser._id });
        if (!app) return res.status(404).json({ success: false });
        app.status = status;
        await app.save();
        res.json({ success: true, message: "Holat yangilandi" });
    } catch (err) { res.status(500).json({ success: false }); }
});

module.exports = router;
