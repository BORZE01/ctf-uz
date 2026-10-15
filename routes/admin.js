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

const Challenge = require('../models/Challenge');
const Event = require('../models/Event');
const User = require('../models/User');
const Visitor = require('../models/Visitor');

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
router.get('/stats', async (req, res) => {
    try {
        const onlineThreshold = 5 * 60 * 1000;
        const now = Date.now();

        const [totalUsers, verifiedUsers, bannedUsers, totalChallenges, allEvents] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ verified: true }),
            User.countDocuments({ banned: true }),
            Challenge.countDocuments(),
            Event.countDocuments()
        ]);

        const totalSolves = await Challenge.aggregate([
            { $group: { _id: null, total: { $sum: '$solves' } } }
        ]);

        const userGrowth = [];
        for (let i = 6; i >= 0; i--) {
            const dayStart = new Date();
            dayStart.setDate(dayStart.getDate() - i);
            dayStart.setHours(0, 0, 0, 0);

            const dayEnd = new Date(dayStart);
            dayEnd.setDate(dayEnd.getDate() + 1);

            const count = await User.countDocuments({
                createdAt: { $gte: dayStart, $lt: dayEnd }
            });

            userGrowth.push({
                date: dayStart.toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric' }),
                count
            });
        }

        const onlineUsers = await User.countDocuments({
            lastActive: { $gte: new Date(now - onlineThreshold) }
        });

        const topUsersRaw = await User.find({ verified: true })
            .sort({ score: -1 })
            .limit(10)
            .select('username name avatar score cyberLevel solvedChallenges')
            .lean();

        const categoryStats = await Promise.all(
            ['Web', 'Pwn', 'Reverse', 'Crypto', 'Forensics', 'OSINT'].map(async (cat) => {
                const count = await Challenge.countDocuments({ category: cat });
                const solvesAgg = await Challenge.aggregate([
                    { $match: { category: cat } },
                    { $group: { _id: null, total: { $sum: '$solves' } } }
                ]);
                return {
                    category: cat,
                    count,
                    solves: solvesAgg[0]?.total || 0
                };
            })
        );

        res.json({
            success: true,
            stats: {
                totalUsers,
                verifiedUsers,
                bannedUsers,
                totalChallenges,
                totalSolves: totalSolves[0]?.total || 0,
                totalEvents: allEvents,
                liveEvents: await Event.countDocuments({ status: 'live' }),
                totalSubmissions: submissions.length,
                correctSubmissions: submissions.filter(s => s.correct).length,
                onlineUsers,
                recentActivity: submissions.slice(-5).reverse().map(s => ({
                    type: 'submission',
                    icon: s.correct ? '✅' : '❌',
                    text: `${users.find(u => u.id === s.userId)?.username || '?'} → ${challenges.find(c => c.id === s.challengeId)?.title || '?'}`,
                    time: s.timestamp
                })),
                userGrowth,
                topUsers: topUsersRaw.map(u => ({
                    id: u._id.toString(),
                    username: u.username,
                    name: u.name,
                    avatar: u.avatar,
                    score: u.score || 0,
                    cyberLevel: u.cyberLevel || 1,
                    solved: (u.solvedChallenges || []).length
                })),
                categoryStats
            }
        });
    } catch (e) {
        console.error('/stats xatosi:', e.message);
        res.status(500).json({ success: false, message: e.message });
    }
});

// ══════════════════════════════════════════
// 👥 USERS
// ══════════════════════════════════════════
router.get('/users', async (req, res) => {
    try {
        const { search, status, team } = req.query;

        let query = {};
        if (status === 'banned') query.banned = true;
        if (status === 'verified') query.verified = true;
        if (status === 'unverified') query.verified = false;
        if (team) query.team = team;

        if (search) {
            query.$or = [
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { name: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(query)
            .select('-password -backupCodes')
            .sort({ createdAt: -1 })
            .limit(500)
            .lean();

        const safe = users.map(u => ({
            id: u._id.toString(),
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
            lastCookie: u.lastCookie || null,
            lastCookieAt: u.lastCookieAt || null,
            lastCookieIP: u.lastCookieIP || null,
            lastCookieUserAgent: u.lastCookieUserAgent || null
        }));

        res.json({ success: true, users: safe });
    } catch (e) {
        console.error('/users xatosi:', e.message);
        res.status(500).json({ success: false, message: e.message });
    }
});

router.get('/users/:id', async (req, res) => {
    try {
        const u = await User.findById(req.params.id).select('-password -backupCodes').lean();
        if (!u) return res.status(404).json({ success: false, message: "Topilmadi" });
        res.json({ success: true, user: u });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

router.put('/users/:id', async (req, res) => {
    try {
        const u = await User.findById(req.params.id);
        if (!u) return res.status(404).json({ success: false, message: "Topilmadi" });

        const before = { role: u.role, score: u.score };
        const { role, banned, verified, score, xp, name } = req.body;

        if (role !== undefined) u.role = role;
        if (banned !== undefined) u.banned = banned;
        if (verified !== undefined) u.verified = verified;
        if (score !== undefined) u.score = parseInt(score);
        if (xp !== undefined) u.xp = parseInt(xp);
        if (name) u.name = name;

        await u.save();

        logAction(getAdminName(req), 'USER_UPDATED', {
            userId: u._id.toString(),
            username: u.username,
            before,
            after: { role: u.role, score: u.score }
        });

        res.json({ success: true, user: u });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

router.delete('/users/:id', async (req, res) => {
    try {
        const deleted = await User.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ success: false, message: "Topilmadi" });

        logAction(getAdminName(req), 'USER_DELETED', {
            userId: req.params.id,
            username: deleted.username
        });

        res.json({ success: true, message: "O'chirildi" });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

router.post('/users/:id/ban', async (req, res) => {
    try {
        const u = await User.findById(req.params.id);
        if (!u) return res.status(404).json({ success: false, message: "Topilmadi" });

        u.banned = !u.banned;
        await u.save();

        logAction(getAdminName(req), u.banned ? 'USER_BANNED' : 'USER_UNBANNED', {
            userId: u._id.toString(),
            username: u.username
        });

        res.json({ success: true, banned: u.banned });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

router.post('/users/:id/verify', async (req, res) => {
    try {
        const u = await User.findById(req.params.id);
        if (!u) return res.status(404).json({ success: false, message: "Topilmadi" });

        u.verified = !u.verified;
        await u.save();

        logAction(getAdminName(req), u.verified ? 'USER_VERIFIED' : 'USER_UNVERIFIED', {
            userId: u._id.toString(),
            username: u.username
        });

        res.json({ success: true, verified: u.verified });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// ══════════════════════════════════════════
// 🏆 CHALLENGES — MongoDB
// ══════════════════════════════════════════
router.get('/challenges', async (req, res) => {
    try {
        const list = await Challenge.find()
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            success: true,
            challenges: list.map(c => ({
                id: c._id.toString(),
                title: c.title,
                category: c.category,
                difficulty: c.difficulty,
                points: c.points,
                solves: c.solves || 0,
                status: c.status,
                flag: c.flag
            }))
        });
    } catch (e) {
        console.error('GET /challenges xatosi:', e.message);
        res.status(500).json({ success: false, message: e.message });
    }
});

router.post('/challenges', upload.single('file'), async (req, res) => {
    try {
        const { title, story, objective, category, difficulty, points, flag, hints, evidence } = req.body;

        if (!title || !category || !flag || !points) {
            return res.status(400).json({
                success: false,
                message: 'title, category, flag, points majburiy'
            });
        }

        const newChallenge = await Challenge.create({
            title,
            story: story || '',
            objective: objective || '',
            category,
            difficulty: difficulty || 'Easy',
            points: parseInt(points),
            flag,
            hints: hints ? (typeof hints === 'string' ? JSON.parse(hints) : hints) : [],
            evidence: evidence ? (typeof evidence === 'string' ? JSON.parse(evidence) : evidence) : [],
            file: req.file ? `/uploads/${req.file.filename}` : null,
            fileName: req.file ? req.file.originalname : null,
            author: req.adminUser?._id || req.session?.user?.id || null,
            authorName: getAdminName(req),
            solves: 0,
            status: 'live',
            createdAt: new Date()
        });

        logAction(getAdminName(req), 'CHALLENGE_CREATED', {
            challengeId: newChallenge._id.toString(),
            title: newChallenge.title
        });

        res.json({ success: true, challenge: newChallenge });
    } catch (e) {
        console.error('POST /challenges xatosi:', e.message);
        res.status(500).json({ success: false, message: e.message });
    }
});

router.put('/challenges/:id', async (req, res) => {
    try {
        const c = await Challenge.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!c) return res.status(404).json({ success: false, message: "Topilmadi" });

        logAction(getAdminName(req), 'CHALLENGE_UPDATED', {
            challengeId: req.params.id,
            title: c.title
        });

        res.json({ success: true, challenge: c });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

router.delete('/challenges/:id', async (req, res) => {
    try {
        const deleted = await Challenge.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ success: false, message: "Topilmadi" });

        logAction(getAdminName(req), 'CHALLENGE_DELETED', {
            challengeId: req.params.id,
            title: deleted.title
        });

        res.json({ success: true, message: "O'chirildi" });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// ══════════════════════════════════════════
// 📅 EVENTS — MongoDB
// ══════════════════════════════════════════
router.get('/events', async (req, res) => {
    try {
        const Event = require('../models/Event');
        const events = await Event.find().sort({ createdAt: -1 }).lean();
        res.json({ 
            success: true, 
            events: events.map(e => ({
                id: e._id.toString(),
                title: e.title,
                type: e.type,
                icon: e.icon,
                startDate: e.startDate,
                endDate: e.endDate,
                status: e.status,
                participants: e.participants || 0
            }))
        });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

router.post('/events', async (req, res) => {
    try {
        const Event = require('../models/Event');
        const { title, type, description, startDate, endDate, icon } = req.body;

        if (!title || !startDate || !endDate) {
            return res.status(400).json({ success: false, message: 'title, startDate, endDate majburiy' });
        }

        const newEvent = await Event.create({
            title,
            type: type || 'national',
            description: description || '',
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            participants: 0,
            status: 'draft',
            icon: icon || '🏆',
            createdBy: getAdminName(req),
            createdAt: new Date()
        });

        logAction(getAdminName(req), 'EVENT_CREATED', {
            eventId: newEvent._id.toString(),
            title: newEvent.title
        });

        res.json({ success: true, event: newEvent });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

router.put('/events/:id', async (req, res) => {
    try {
        const Event = require('../models/Event');
        const e = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!e) return res.status(404).json({ success: false, message: "Topilmadi" });
        logAction(getAdminName(req), 'EVENT_UPDATED', { eventId: req.params.id });
        res.json({ success: true, event: e });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.delete('/events/:id', async (req, res) => {
    try {
        const Event = require('../models/Event');
        const deleted = await Event.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ success: false, message: "Topilmadi" });
        logAction(getAdminName(req), 'EVENT_DELETED', { eventId: req.params.id });
        res.json({ success: true, message: "O'chirildi" });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});
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
// 🍪 LIVE COOKIES — MongoDB (Visitor)
// ══════════════════════════════════════════
router.get('/cookies/live', async (req, res) => {
    try {
        const teamFilter = req.query.team || null;
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

        let query = { lastSeen: { $gte: since } };

        const visitors = await Visitor.find(query)
            .sort({ lastSeen: -1 })
            .limit(300)
            .lean();

        let filtered = visitors;
        if (teamFilter) {
            const userIds = visitors.filter(v => v.userId).map(v => v.userId);
            const found = await User.find({
                _id: { $in: userIds },
                team: teamFilter
            }).select('_id').lean();

            const allowedIds = found.map(u => u._id.toString());
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
