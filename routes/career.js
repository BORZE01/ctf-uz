const express = require('express');
const router = express.Router();
const {
    jobs, companies, applications,
    savedJobs, jobAlerts, careerProfiles,
    users, challenges, submissions
} = require('../utils/storage');
const { calculateSkillScores, getUserRank } = require('../utils/scoring');

// ══════════════════════════════════════════
// HELPER
// ══════════════════════════════════════════
function formatJob(job, company) {
    return {
        id: job.id,
        title: job.title,
        slug: job.slug,
        location: job.location,
        format: job.format,
        level: job.level,
        category: job.category,
        description: job.description,
        skills: job.skills,
        salary: job.salary,
        featured: job.featured,
        views: job.views,
        applications: job.applications,
        createdAt: job.createdAt,
        expiresAt: job.expiresAt,
        company: company ? {
            id: company.id,
            name: company.name,
            slug: company.slug,
            industry: company.industry,
            logo: company.logo,
            verified: company.verified
        } : null
    };
}

// ══════════════════════════════════════════
// 📋 BARCHA ISHLAR (filter + search)
// ══════════════════════════════════════════
router.get('/jobs', (req, res) => {
    const { search, level, format, location, category, skill, featured, limit = 50 } = req.query;

    let filtered = jobs.filter(j => j.status === 'active');

    // Search
    if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(j =>
            j.title.toLowerCase().includes(q) ||
            j.description.toLowerCase().includes(q) ||
            j.skills.some(s => s.toLowerCase().includes(q)) ||
            companies.find(c => c.id === j.companyId)?.name.toLowerCase().includes(q)
        );
    }

    // Filter
    if (level) filtered = filtered.filter(j => j.level === level);
    if (format) filtered = filtered.filter(j => j.format === format);
    if (location) filtered = filtered.filter(j => j.location.toLowerCase().includes(location.toLowerCase()));
    if (category) filtered = filtered.filter(j => j.category === category);
    if (skill) filtered = filtered.filter(j => j.skills.includes(skill));
    if (featured === 'true') filtered = filtered.filter(j => j.featured);

    const formatted = filtered
        .slice(0, parseInt(limit))
        .map(j => formatJob(j, companies.find(c => c.id === j.companyId)));

    res.json({ success: true, jobs: formatted, total: filtered.length });
});

// ══════════════════════════════════════════
// 🎯 ISH DETALI
// ══════════════════════════════════════════
router.get('/jobs/:id', (req, res) => {
    const job = jobs.find(j => j.id === parseInt(req.params.id));
    if (!job) return res.status(404).json({ success: false, message: "Ish topilmadi" });

    job.views = (job.views || 0) + 1;

    const company = companies.find(c => c.id === job.companyId);

    // Agar user login qilgan bo'lsa — matching hisoblash
    let matchScore = 0;
    let matchedSkills = [];
    let userSkills = {};

    if (req.session.user) {
        const user = users.find(u => u.id === req.session.user.id);
        if (user) {
            userSkills = calculateSkillScores(user, challenges, submissions);
            // Job skills ni user skill bilan taqqoslash
            job.skills.forEach(skill => {
                const skillKey = skill.toLowerCase().replace(/\s+/g, '');
                const userVal = userSkills[skillKey] || userSkills[skill.toLowerCase()] || 0;
                if (userVal >= 30) {
                    matchedSkills.push(skill);
                }
            });
            matchScore = Math.round((matchedSkills.length / Math.max(job.skills.length, 1)) * 100);
        }
    }

    const response = formatJob(job, company);
    response.requirements = job.requirements;
    response.niceToHave = job.niceToHave;
    response.matchScore = matchScore;
    response.matchedSkills = matchedSkills;
    response.userSkills = userSkills;

    res.json({ success: true, job: response });
});

// ══════════════════════════════════════════
// 📝 ISHGA ARIZA TOPSHIRISH
// ══════════════════════════════════════════
router.post('/jobs/:id/apply', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: "Avval tizimga kiring" });
    }

    const job = jobs.find(j => j.id === parseInt(req.params.id));
    if (!job) return res.status(404).json({ success: false, message: "Ish topilmadi" });

    // Allaqachon ariza topshirilganmi?
    const existing = applications.find(a =>
        a.jobId === job.id && a.userId === req.session.user.id
    );

    if (existing) {
        return res.status(400).json({ success: false, message: "Siz allaqachon ariza topshirgansiz" });
    }

    const application = {
        id: applications.length + 1,
        jobId: job.id,
        userId: req.session.user.id,
        coverLetter: req.body.coverLetter || '',
        status: 'applied',
        statusHistory: [{ status: 'applied', at: new Date() }],
        createdAt: new Date()
    };

    applications.push(application);
    job.applications = (job.applications || 0) + 1;

    res.json({ success: true, message: "Ariza topshirildi!", application });
});

// ══════════════════════════════════════════
// 💾 ISHNI SAQLASH
// ══════════════════════════════════════════
router.post('/jobs/:id/save', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: "Avval tizimga kiring" });
    }

    const job = jobs.find(j => j.id === parseInt(req.params.id));
    if (!job) return res.status(404).json({ success: false, message: "Ish topilmadi" });

    const userId = req.session.user.id;
    if (!savedJobs[userId]) savedJobs[userId] = [];

    const idx = savedJobs[userId].indexOf(job.id);
    if (idx === -1) {
        savedJobs[userId].push(job.id);
        res.json({ success: true, saved: true, message: "Saqlandi" });
    } else {
        savedJobs[userId].splice(idx, 1);
        res.json({ success: true, saved: false, message: "Saqlanganlardan olib tashlandi" });
    }
});

// ══════════════════════════════════════════
// 📋 SAQLANGAN ISHLAR
// ══════════════════════════════════════════
router.get('/saved-jobs', (req, res) => {
    if (!req.session.user) return res.status(401).json({ success: false, message: "Kirish kerak" });

    const saved = savedJobs[req.session.user.id] || [];
    const formatted = saved
        .map(id => jobs.find(j => j.id === id))
        .filter(Boolean)
        .map(j => formatJob(j, companies.find(c => c.id === j.companyId)));

    res.json({ success: true, jobs: formatted });
});

// ══════════════════════════════════════════
// 📮 MENING ARIZALARIM
// ══════════════════════════════════════════
router.get('/my-applications', (req, res) => {
    if (!req.session.user) return res.status(401).json({ success: false, message: "Kirish kerak" });

    const myApps = applications
        .filter(a => a.userId === req.session.user.id)
        .map(a => {
            const job = jobs.find(j => j.id === a.jobId);
            const company = job ? companies.find(c => c.id === job.companyId) : null;
            return {
                ...a,
                job: job ? formatJob(job, company) : null
            };
        });

    res.json({ success: true, applications: myApps });
});

// ══════════════════════════════════════════
// 🔔 JOB ALERTS
// ══════════════════════════════════════════
router.post('/alerts', (req, res) => {
    if (!req.session.user) return res.status(401).json({ success: false, message: "Kirish kerak" });

    const { skills, location, level } = req.body;
    const userId = req.session.user.id;

    if (!jobAlerts[userId]) jobAlerts[userId] = [];

    jobAlerts[userId].push({
        id: jobAlerts[userId].length + 1,
        skills: skills || [],
        location: location || '',
        level: level || '',
        createdAt: new Date()
    });

    res.json({ success: true, message: "Alert yoqildi" });
});

router.get('/alerts', (req, res) => {
    if (!req.session.user) return res.status(401).json({ success: false, message: "Kirish kerak" });
    res.json({ success: true, alerts: jobAlerts[req.session.user.id] || [] });
});

// ══════════════════════════════════════════
// 🧑‍💼 CAREER PROFILE
// ══════════════════════════════════════════
router.get('/profile/:username', (req, res) => {
    const user = users.find(u => u.username === req.params.username);
    if (!user) return res.status(404).json({ success: false, message: "Foydalanuvchi topilmadi" });

    const profile = careerProfiles[user.id];
    if (!profile || !profile.public) {
        return res.status(403).json({ success: false, message: "Bu profil yopiq" });
    }

    const skills = calculateSkillScores(user, challenges, submissions);
    const sorted = [...users].sort((a, b) => (b.score || 0) - (a.score || 0));
    const globalRank = sorted.findIndex(u => u.id === user.id) + 1;

    res.json({
        success: true,
        profile: {
            username: user.username,
            name: user.name,
            avatar: user.avatar,
            title: profile.title || 'Cybersecurity Enthusiast',
            bio: profile.bio || '',
            location: [user.region, user.city].filter(Boolean).join(' · '),
            skills,
            globalRank,
            solved: (user.solvedChallenges || []).length,
            achievements: (user.achievements || []).length,
            experience: profile.experience || [],
            education: profile.education || [],
            certifications: profile.certifications || [],
            github: user.github,
            telegram: user.telegram,
            website: user.website,
            openToOpportunities: user.openToOpportunities
        }
    });
});

// ══════════════════════════════════════════
// ✏️ CAREER PROFILNI YANGILASH
// ══════════════════════════════════════════
router.put('/profile', (req, res) => {
    if (!req.session.user) return res.status(401).json({ success: false, message: "Kirish kerak" });

    const { public: isPublic, title, bio, experience, education, certifications } = req.body;
    const userId = req.session.user.id;

    if (!careerProfiles[userId]) careerProfiles[userId] = {};

    if (isPublic !== undefined) careerProfiles[userId].public = isPublic;
    if (title !== undefined) careerProfiles[userId].title = title;
    if (bio !== undefined) careerProfiles[userId].bio = bio;
    if (experience) careerProfiles[userId].experience = experience;
    if (education) careerProfiles[userId].education = education;
    if (certifications) careerProfiles[userId].certifications = certifications;

    res.json({ success: true, message: "Profil yangilandi", profile: careerProfiles[userId] });
});

// ══════════════════════════════════════════
// 🔍 TALENT SEARCH (Employer)
// ══════════════════════════════════════════
router.get('/talent', (req, res) => {
    const { skill, level, location, ctfExperience } = req.query;

    // Faqat public career profile qilgan users
    let filtered = users.filter(u => {
        const profile = careerProfiles[u.id];
        return profile && profile.public && u.openToOpportunities;
    });

    // Skill bo'yicha filter
    if (skill) {
        filtered = filtered.filter(u => {
            const skills = calculateSkillScores(u, challenges, submissions);
            return Object.entries(skills).some(([k, v]) =>
                k.toLowerCase().includes(skill.toLowerCase()) && v >= 30
            );
        });
    }

    // Location
    if (location) {
        filtered = filtered.filter(u =>
            (u.region || '').toLowerCase().includes(location.toLowerCase()) ||
            (u.city || '').toLowerCase().includes(location.toLowerCase())
        );
    }

    // CTF Experience
    if (ctfExperience === 'true') {
        filtered = filtered.filter(u => (u.solvedChallenges || []).length >= 5);
    }

    const results = filtered.map(u => {
        const skills = calculateSkillScores(u, challenges, submissions);
        const sorted = [...users].sort((a, b) => (b.score || 0) - (a.score || 0));
        const globalRank = sorted.findIndex(x => x.id === u.id) + 1;
        const profile = careerProfiles[u.id] || {};

        return {
            username: u.username,
            name: u.name,
            avatar: u.avatar,
            title: profile.title,
            location: [u.region, u.city].filter(Boolean).join(' · '),
            skills,
            globalRank,
            solved: (u.solvedChallenges || []).length,
            achievements: (u.achievements || []).length,
            openToOpportunities: u.openToOpportunities
        };
    });

    res.json({ success: true, talent: results });
});

// ══════════════════════════════════════════
// 📊 CAREER DASHBOARD (user)
// ══════════════════════════════════════════
router.get('/dashboard', (req, res) => {
    if (!req.session.user) return res.status(401).json({ success: false, message: "Kirish kerak" });

    const userId = req.session.user.id;
    const mySaved = (savedJobs[userId] || []).length;
    const myApps = applications.filter(a => a.userId === userId).length;
    const myAlerts = (jobAlerts[userId] || []).length;
    const profile = careerProfiles[userId] || {};

    // Profile completion
    let completion = 0;
    if (profile.title) completion += 20;
    if (profile.bio) completion += 20;
    if (profile.experience && profile.experience.length) completion += 20;
    if (profile.education && profile.education.length) completion += 20;
    if (profile.certifications && profile.certifications.length) completion += 20;

    res.json({
        success: true,
        stats: {
            savedJobs: mySaved,
            applications: myApps,
            alerts: myAlerts,
            profileViews: profile.views || 0,
            completion
        }
    });
});

// ══════════════════════════════════════════
// 🏢 KOMPANIYALAR
// ══════════════════════════════════════════
router.get('/companies', (req, res) => {
    const result = companies
        .filter(c => !c.banned)
        .map(c => ({
            ...c,
            openPositions: jobs.filter(j => j.companyId === c.id && j.status === 'active').length
        }));
    res.json({ success: true, companies: result });
});

router.get('/companies/:slug', (req, res) => {
    const company = companies.find(c => c.slug === req.params.slug);
    if (!company) return res.status(404).json({ success: false, message: "Kompaniya topilmadi" });

    const companyJobs = jobs
        .filter(j => j.companyId === company.id && j.status === 'active')
        .map(j => formatJob(j, company));

    res.json({ success: true, company: { ...company, jobs: companyJobs } });
});

module.exports = router;