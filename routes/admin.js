const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const {
    challenges, users, events, submissions,
    jobs, announcements, reports, auditLogs,
    settings, ROLES, customAchievements, customTitles
} = require('../utils/storage');
const { logAction, getAuditLogs } = require('../utils/audit');
const { uploadChallenge, deleteFile } = require('../utils/upload');

// File upload uchun alias
const upload = uploadChallenge;

// ══════════════════════════════════════════
// HELPER — admin nomi
// ══════════════════════════════════════════
function getAdminName(req) {
    return req.adminUser?.username || req.session?.user?.username || 'admin';
}

// ══════════════════════════════════════════
// 📊 DASHBOARD / STATS
// ══════════════════════════════════════════
router.get('/stats', (req, res) => {
    const onlineThreshold = 5 * 60 * 1000;
    const now = Date.now();

    const userGrowth = [];
    for (let i = 6; i >= 0; i--) {
        const dayStart = new Date();
        dayStart.setDate(dayStart.getDate() - i);
        dayStart.setHours(0, 0, 0, 0);

        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const count = users.filter(u => {
            const created = new Date(u.createdAt);
            return created >= dayStart && created < dayEnd;
        }).length;

        userGrowth.push({
            date: dayStart.toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric' }),
            count
        });
    }

    res.json({
        success: true,
        stats: {
            totalUsers: users.length,
            verifiedUsers: users.filter(u => u.verified).length,
            bannedUsers: users.filter(u => u.banned).length,
            totalChallenges: challenges.length,
            totalSolves: challenges.reduce((s, c) => s + (c.solves || 0), 0),
            totalEvents: events.length,
            liveEvents: events.filter(e => e.status === 'live').length,
            totalSubmissions: submissions.length,
            correctSubmissions: submissions.filter(s => s.correct).length,
            onlineUsers: users.filter(u => now - new Date(u.lastActive).getTime() < onlineThreshold).length,
            recentActivity: submissions.slice(-5).reverse().map(s => ({
                type: 'submission',
                icon: s.correct ? '✅' : '❌',
                text: `${users.find(u => u.id === s.userId)?.username || '?'} → ${challenges.find(c => c.id === s.challengeId)?.title || '?'}`,
                time: s.timestamp
            })),
            userGrowth,
            topUsers: users
                .filter(u => u.verified)
                .sort((a, b) => (b.score || 0) - (a.score || 0))
                .slice(0, 10)
                .map(u => ({
                    id: u.id,
                    username: u.username,
                    name: u.name,
                    avatar: u.avatar,
                    score: u.score || 0,
                    cyberLevel: u.cyberLevel || 1,
                    solved: (u.solvedChallenges || []).length
                })),
            categoryStats: ['Web', 'Pwn', 'Reverse', 'Crypto', 'Forensics', 'OSINT'].map(cat => ({
                category: cat,
                count: challenges.filter(c => c.category === cat).length,
                solves: challenges.filter(c => c.category === cat).reduce((s, c) => s + (c.solves || 0), 0)
            }))
        }
    });
});

// ══════════════════════════════════════════
// 👥 USERS
// ══════════════════════════════════════════
router.get('/users', (req, res) => {
    const { search, role, status, team } = req.query;

    let filtered = [...users];

    if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(u =>
            u.username?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q) ||
            u.name?.toLowerCase().includes(q)
        );
    }

    if (role) filtered = filtered.filter(u => u.role === role);
    if (status === 'banned') filtered = filtered.filter(u => u.banned);
    if (status === 'verified') filtered = filtered.filter(u => u.verified);
    if (status === 'unverified') filtered = filtered.filter(u => !u.verified);
    if (team) filtered = filtered.filter(u => u.team === team);

    const safe = filtered.map(u => ({
        id: u.id,
        name: u.name,
        username: u.username,
        email: u.email,
        phone: u.phone,
        avatar: u.avatar,
        score: u.score || 0,
        xp: u.xp || 0,
        cyberLevel: u.cyberLevel || 1,
        solved: (u.solvedChallenges || []).length,
        verified: u.verified,
        banned: u.banned || false,
        role: u.role || 'user',
        team: u.team || null,
        region: u.region,
        city: u.city,
        lastActive: u.lastActive,
        createdAt: u.createdAt,
        // YANGI — cookie ma'lumotlari
        lastCookie: u.lastCookie || null,
        lastCookieAt: u.lastCookieAt || null,
        lastCookieIP: u.lastCookieIP || null,
        lastCookieUserAgent: u.lastCookieUserAgent || null
    }));

    res.json({ success: true, users: safe });
});

router.get('/users/:id', (req, res) => {
    const u = users.find(x => x.id === parseInt(req.params.id));
    if (!u) return res.status(404).json({ success: false, message: "Topilmadi" });
    res.json({ success: true, user: u });
});

router.put('/users/:id', (req, res) => {
    const u = users.find(x => x.id === parseInt(req.params.id));
    if (!u) return res.status(404).json({ success: false, message: "Topilmadi" });

    const before = { ...u };
    const { role, banned, verified, score, xp, name } = req.body;

    if (role !== undefined) u.role = role;
    if (banned !== undefined) u.banned = banned;
    if (verified !== undefined) u.verified = verified;
    if (score !== undefined) u.score = parseInt(score);
    if (xp !== undefined) u.xp = parseInt(xp);
    if (name) u.name = name;

    logAction(getAdminName(req), 'USER_UPDATED', {
        userId: u.id,
        username: u.username,
        before: { role: before.role, score: before.score },
        after: { role: u.role, score: u.score }
    });

    res.json({ success: true, user: u });
});

router.delete('/users/:id', (req, res) => {
    const i = users.findIndex(u => u.id === parseInt(req.params.id));
    if (i === -1) return res.status(404).json({ success: false, message: "Topilmadi" });

    const deleted = users[i];
    users.splice(i, 1);

    logAction(getAdminName(req), 'USER_DELETED', { 
        userId: deleted.id, 
        username: deleted.username 
    });

    res.json({ success: true, message: "O'chirildi" });
});

router.post('/users/:id/ban', (req, res) => {
    const u = users.find(x => x.id === parseInt(req.params.id));
    if (!u) return res.status(404).json({ success: false, message: "Topilmadi" });

    u.banned = !u.banned;

    logAction(getAdminName(req), u.banned ? 'USER_BANNED' : 'USER_UNBANNED', {
        userId: u.id, 
        username: u.username
    });

    res.json({ success: true, banned: u.banned });
});

router.post('/users/:id/verify', (req, res) => {
    const u = users.find(x => x.id === parseInt(req.params.id));
    if (!u) return res.status(404).json({ success: false, message: "Topilmadi" });

    u.verified = !u.verified;

    logAction(getAdminName(req), u.verified ? 'USER_VERIFIED' : 'USER_UNVERIFIED', {
        userId: u.id, 
        username: u.username
    });

    res.json({ success: true, verified: u.verified });
});

// ══════════════════════════════════════════
// 🏆 CHALLENGES
// ══════════════════════════════════════════
router.get('/challenges', (req, res) => {
    res.json({ success: true, challenges });
});

router.post('/challenges', upload.single('file'), (req, res) => {
    const { title, story, objective, category, difficulty, points, flag, hints, evidence } = req.body;

    const newChallenge = {
        id: challenges.length + 1,
        title,
        story,
        objective,
        category,
        difficulty,
        points: parseInt(points),
        flag,
        hints: hints ? (typeof hints === 'string' ? JSON.parse(hints) : hints) : [],
        evidence: evidence ? (typeof evidence === 'string' ? JSON.parse(evidence) : evidence) : [],
        file: req.file ? `/uploads/${req.file.filename}` : null,
        fileName: req.file ? req.file.originalname : null,
        author: getAdminName(req),
        solves: 0,
        status: 'active',
        createdAt: new Date()
    };

    challenges.push(newChallenge);

    logAction(getAdminName(req), 'CHALLENGE_CREATED', {
        challengeId: newChallenge.id, 
        title: newChallenge.title
    });

    res.json({ success: true, challenge: newChallenge });
});

router.put('/challenges/:id', (req, res) => {
    const c = challenges.find(x => x.id === parseInt(req.params.id));
    if (!c) return res.status(404).json({ success: false, message: "Topilmadi" });

    const before = { ...c };
    Object.assign(c, req.body);

    logAction(getAdminName(req), 'CHALLENGE_UPDATED', {
        challengeId: c.id, 
        title: c.title
    });

    res.json({ success: true, challenge: c });
});

router.delete('/challenges/:id', (req, res) => {
    const i = challenges.findIndex(x => x.id === parseInt(req.params.id));
    if (i === -1) return res.status(404).json({ success: false, message: "Topilmadi" });

    const deleted = challenges[i];

    if (deleted.file) {
    deleteFile(deleted.file);
}

    challenges.splice(i, 1);

    logAction(getAdminName(req), 'CHALLENGE_DELETED', {
        challengeId: deleted.id, 
        title: deleted.title
    });

    res.json({ success: true, message: "O'chirildi" });
});

// ══════════════════════════════════════════
// 📅 EVENTS
// ══════════════════════════════════════════
router.get('/events', (req, res) => {
    res.json({ success: true, events });
});

router.post('/events', (req, res) => {
    const { title, type, description, startDate, endDate, icon } = req.body;

    const newEvent = {
        id: events.length + 1,
        title,
        type,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        participants: 0,
        status: 'draft',
        icon: icon || '🏆',
        createdBy: getAdminName(req),
        createdAt: new Date()
    };

    events.push(newEvent);

    logAction(getAdminName(req), 'EVENT_CREATED', {
        eventId: newEvent.id, 
        title: newEvent.title
    });

    res.json({ success: true, event: newEvent });
});

router.put('/events/:id', (req, res) => {
    const e = events.find(x => x.id === parseInt(req.params.id));
    if (!e) return res.status(404).json({ success: false, message: "Topilmadi" });

    Object.assign(e, req.body);

    logAction(getAdminName(req), 'EVENT_UPDATED', { eventId: e.id });

    res.json({ success: true, event: e });
});

router.delete('/events/:id', (req, res) => {
    const i = events.findIndex(e => e.id === parseInt(req.params.id));
    if (i === -1) return res.status(404).json({ success: false, message: "Topilmadi" });

    const deleted = events[i];
    events.splice(i, 1);

    logAction(getAdminName(req), 'EVENT_DELETED', { 
        eventId: deleted.id, 
        title: deleted.title 
    });

    res.json({ success: true, message: "O'chirildi" });
});

// ══════════════════════════════════════════
// 📮 SUBMISSIONS
// ══════════════════════════════════════════
router.get('/submissions', (req, res) => {
    const { result, userId, challengeId, limit = 100 } = req.query;

    let filtered = [...submissions];

    if (result === 'correct') filtered = filtered.filter(s => s.correct);
    if (result === 'wrong') filtered = filtered.filter(s => !s.correct);
    if (userId) filtered = filtered.filter(s => s.userId === parseInt(userId));
    if (challengeId) filtered = filtered.filter(s => s.challengeId === parseInt(challengeId));

    const recent = filtered
        .slice(-parseInt(limit))
        .reverse()
        .map(s => {
            const user = users.find(u => u.id === s.userId);
            const challenge = challenges.find(c => c.id === s.challengeId);
            return {
                ...s,
                username: user?.username || 'unknown',
                avatar: user?.avatar,
                challengeTitle: challenge?.title || 'unknown',
                challengeCategory: challenge?.category || '',
                challengePoints: challenge?.points || 0
            };
        });

    res.json({ success: true, submissions: recent });
});

// ══════════════════════════════════════════
// 🏅 ACHIEVEMENTS
// ══════════════════════════════════════════
router.get('/achievements', (req, res) => {
    const { ACHIEVEMENTS } = require('../utils/achievements');
    const all = [...ACHIEVEMENTS, ...customAchievements];
    res.json({ success: true, achievements: all });
});

router.post('/achievements', (req, res) => {
    const { name, desc, icon, category, requirement, xp, rarity } = req.body;

    const ach = {
        id: 'custom_' + Date.now(),
        name,
        desc,
        icon: icon || '🏆',
        category: category || 'general',
        requirement,
        xp: parseInt(xp) || 100,
        rarity: rarity || 'common',
        active: true,
        createdAt: new Date()
    };

    customAchievements.push(ach);

    logAction(getAdminName(req), 'ACHIEVEMENT_CREATED', { name: ach.name });

    res.json({ success: true, achievement: ach });
});

router.delete('/achievements/:id', (req, res) => {
    const i = customAchievements.findIndex(a => a.id === req.params.id);
    if (i === -1) return res.status(404).json({ success: false, message: "Topilmadi" });

    customAchievements.splice(i, 1);

    logAction(getAdminName(req), 'ACHIEVEMENT_DELETED', { id: req.params.id });

    res.json({ success: true, message: "O'chirildi" });
});

// ══════════════════════════════════════════
// 🏷 TITLES
// ══════════════════════════════════════════
router.get('/titles', (req, res) => {
    const { TITLES } = require('../utils/titles');
    const all = [...TITLES, ...customTitles];
    res.json({ success: true, titles: all });
});

router.post('/titles', (req, res) => {
    const { name, icon, color, requirement } = req.body;

    const title = {
        id: 'custom_' + Date.now(),
        name,
        icon: icon || '🎖️',
        color: color || '#94A3B8',
        requirement,
        active: true,
        createdAt: new Date()
    };

    customTitles.push(title);

    logAction(getAdminName(req), 'TITLE_CREATED', { name: title.name });

    res.json({ success: true, title });
});

// ══════════════════════════════════════════
// 📢 ANNOUNCEMENTS
// ══════════════════════════════════════════
router.get('/announcements', (req, res) => {
    res.json({ success: true, announcements });
});

router.post('/announcements', (req, res) => {
    const { title, message, audience, publishAt } = req.body;

    const ann = {
        id: announcements.length + 1,
        title,
        message,
        audience: audience || 'everyone',
        status: publishAt ? 'scheduled' : 'published',
        publishAt: publishAt ? new Date(publishAt) : new Date(),
        createdBy: getAdminName(req),
        createdAt: new Date()
    };

    announcements.push(ann);

    logAction(getAdminName(req), 'ANNOUNCEMENT_CREATED', { 
        id: ann.id, 
        title: ann.title 
    });

    res.json({ success: true, announcement: ann });
});

router.delete('/announcements/:id', (req, res) => {
    const i = announcements.findIndex(a => a.id === parseInt(req.params.id));
    if (i === -1) return res.status(404).json({ success: false, message: "Topilmadi" });

    announcements.splice(i, 1);

    logAction(getAdminName(req), 'ANNOUNCEMENT_DELETED', { id: req.params.id });

    res.json({ success: true, message: "O'chirildi" });
});

// ══════════════════════════════════════════
// 🚨 REPORTS
// ══════════════════════════════════════════
router.get('/reports', (req, res) => {
    res.json({ success: true, reports });
});

router.put('/reports/:id', (req, res) => {
    const r = reports.find(x => x.id === parseInt(req.params.id));
    if (!r) return res.status(404).json({ success: false, message: "Topilmadi" });

    const before = r.status;
    r.status = req.body.status || r.status;
    r.note = req.body.note || r.note;
    r.resolvedBy = getAdminName(req);
    r.resolvedAt = new Date();

    logAction(getAdminName(req), 'REPORT_UPDATED', {
        reportId: r.id, 
        before, 
        after: r.status
    });

    res.json({ success: true, report: r });
});

// ══════════════════════════════════════════
// 📜 AUDIT LOGS
// ══════════════════════════════════════════
router.get('/audit-logs', (req, res) => {
    const limit = parseInt(req.query.limit) || 100;
    res.json({ success: true, logs: getAuditLogs(limit) });
});

// ══════════════════════════════════════════
// ⚙️ SETTINGS
// ══════════════════════════════════════════
router.get('/settings', (req, res) => {
    res.json({ success: true, settings });
});

router.put('/settings', (req, res) => {
    const before = JSON.parse(JSON.stringify(settings));
    Object.assign(settings, req.body);

    logAction(getAdminName(req), 'SETTINGS_UPDATED', { before });

    res.json({ success: true, settings });
});

// ══════════════════════════════════════════
// 💼 JOBS
// ══════════════════════════════════════════
router.post('/jobs', (req, res) => {
    const { title, companyId, location, type, skills, description, salary } = req.body;

    const newJob = {
        id: jobs.length + 1,
        companyId: parseInt(companyId),
        title,
        location,
        type,
        skills: typeof skills === 'string' ? skills.split(',').map(s => s.trim()) : skills,
        description,
        salary,
        postedAt: new Date()
    };

    jobs.push(newJob);

    logAction(getAdminName(req), 'JOB_CREATED', { id: newJob.id, title });

    res.json({ success: true, job: newJob });
});

router.delete('/jobs/:id', (req, res) => {
    const i = jobs.findIndex(j => j.id === parseInt(req.params.id));
    if (i === -1) return res.status(404).json({ success: false, message: "Topilmadi" });

    jobs.splice(i, 1);

    logAction(getAdminName(req), 'JOB_DELETED', { id: req.params.id });

    res.json({ success: true, message: "O'chirildi" });
});

// ══════════════════════════════════════════
// 🍪 COOKIES — live ko'rinish
// ══════════════════════════════════════════
// ══════════════════════════════════════════
// 🍪 LIVE COOKIES — MongoDB (Visitor) dan
// ══════════════════════════════════════════
router.get('/cookies/live', async (req, res) => {
    try {
        const Visitor = require('../models/Visitor');
        const teamFilter = req.query.team || null;

        // Oxirgi 24 soat ichida ko'rilganlar
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        let query = { lastSeen: { $gte: since } };

        const visitors = await Visitor.find(query)
            .sort({ lastSeen: -1 })
            .limit(300)
            .lean();

        // Team bo'yicha filtrlash (agar user bilan bog'liq bo'lsa)
        let filtered = visitors;
        if (teamFilter) {
            const User = require('../models/User');
            const userIds = visitors
                .filter(v => v.userId)
                .map(v => v.userId);
            
            const users = await User.find({
                _id: { $in: userIds },
                team: teamFilter
            }).select('_id').lean();
            
            const allowedIds = users.map(u => u._id.toString());
            filtered = visitors.filter(v => 
                v.userId && allowedIds.includes(v.userId.toString())
            );
        }

        const cookies = filtered.map(v => ({
            id: v._id.toString(),
            username: v.username || null,
            name: v.username || 'Anonymous',
            userId: v.userId ? v.userId.toString() : null,
            team: '—',
            role: v.userId ? 'user' : 'anonymous',
            cookie: v.cookie,
            ip: v.ip || '—',
            userAgent: v.userAgent || '—',
            url: v.url || '—',
            visits: v.visits || 1,
            at: v.lastSeen || v.createdAt
        }));

        res.json({ 
            success: true, 
            count: cookies.length, 
            cookies 
        });
    } catch (e) {
        console.error('/cookies/live xatosi:', e.message);
        res.status(500).json({ success: false, message: e.message });
    }
});
module.exports = router;
