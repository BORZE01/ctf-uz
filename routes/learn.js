const express = require('express');
const router = express.Router();
const { Module, Lesson, Question, LearnSubmission, Progress } = require('../models/Learn');
const User = require('../models/User');
const { requireAdmin } = require('../middleware/auth');

const checkAuth = (req, res, next) => {
    const userId = req.session?.userId || req.session?.user?.id || req.user?._id;
    if (!userId) return res.status(401).json({ success: false, message: "Avtorizatsiyadan o'ting" });
    req.userId = userId;
    next();
};

// ==========================================
// 1. CONTINUE LEARNING API (Oxirgi dars)
// ==========================================
router.get('/continue', checkAuth, async (req, res) => {
    try {
        const lastProgress = await Progress.findOne({ userId: req.userId })
            .sort({ updatedAt: -1 })
            .populate('lessonId')
            .lean();
            
        if (!lastProgress || !lastProgress.lessonId) {
            return res.json({ success: true, hasContinue: false });
        }

        const lesson = lastProgress.lessonId;
        const mod = await Module.findOne({ slug: lesson.moduleSlug }).lean();

        let targetLesson = lesson;
        if (lastProgress.status === 'completed') {
            const nextLesson = await Lesson.findOne({ 
                moduleSlug: lesson.moduleSlug, 
                order: { $gt: lesson.order } 
            }).sort({ order: 1 }).lean();
            
            if (nextLesson) targetLesson = nextLesson;
        }

        res.json({
            success: true,
            hasContinue: true,
            lesson: {
                title: targetLesson.title,
                slug: targetLesson.slug,
                moduleSlug: targetLesson.moduleSlug,
                moduleTitle: mod ? mod.title : 'Noma\'lum modul',
                status: targetLesson._id.toString() === lesson._id.toString() ? lastProgress.status : 'not_started'
            }
        });
    } catch (e) {
        console.error("Continue API Error:", e);
        res.status(500).json({ success: false, message: "Server xatosi" });
    }
});

// ==========================================
// 2. MODULLAR VA QIDIRUV API
// ==========================================
router.get('/modules', async (req, res) => {
    try {
        const userId = req.session?.userId || req.session?.user?.id || req.user?._id;
        const { q, difficulty, category } = req.query;
        let moduleFilter = { isActive: true };
        
        if (difficulty) moduleFilter.difficulty = difficulty;
        if (category) moduleFilter.category = category;

        const modules = await Module.find(moduleFilter).sort({order: 1}).lean();
        
        let userProgressList = [];
        if (userId) {
            userProgressList = await Progress.find({ userId }).lean();
        }

        let totalLessons = 0;
        let completedLessons = 0;
        let filteredModules = [];

        for (let m of modules) {
            let lessonFilter = { moduleSlug: m.slug };
            
            if (q) {
                const regex = new RegExp(q.trim(), 'i');
                lessonFilter.$or = [
                    { title: regex },
                    { description: regex }
                ];
            }

            const lessons = await Lesson.find(lessonFilter).sort({order: 1}).lean();
            
            if (q && lessons.length === 0) continue;

            const fullLessons = await Lesson.find({ moduleSlug: m.slug }).lean();
            totalLessons += fullLessons.length;
            
            m.lessons = lessons.map(les => {
                const prog = userProgressList.find(p => p.lessonId.toString() === les._id.toString());
                const status = prog ? prog.status : 'not_started';
                if (status === 'completed') completedLessons++;
                return {
                    ...les,
                    status: status,
                    progressPercent: status === 'completed' ? 100 : (status === 'started' ? 50 : 0)
                };
            });
            
            filteredModules.push(m);
        }

        const globalProgress = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);
        res.json({ success: true, data: filteredModules, stats: { totalLessons, completedLessons, globalProgress } });
    } catch(e) {
        console.error("Learn modules error:", e);
        res.status(500).json({success: false, message: "Server xatosi"});
    }
});

// ==========================================
// 3. DARS VA SUBMIT API
// ==========================================
router.get('/lesson/:slug', async (req, res) => {
    try {
        const userId = req.session?.userId || req.session?.user?.id || req.user?._id;
        const lesson = await Lesson.findOne({slug: req.params.slug}).lean();
        if(!lesson) return res.status(404).json({success: false, message: "Dars topilmadi"});
        
        let questions = await Question.find({lessonId: lesson._id}).select('-answers').lean();

        if (userId) {
            await Progress.findOneAndUpdate(
                { userId, lessonId: lesson._id },
                { $setOnInsert: { status: 'started' } },
                { upsert: true }
            );
            
            const qIds = questions.map(q => q._id);
            const subs = await LearnSubmission.find({ userId, questionId: { $in: qIds }, isCorrect: true }).lean();
            const solvedIds = subs.map(s => s.questionId.toString());
            
            questions = questions.map(q => ({...q, isSolved: solvedIds.includes(q._id.toString())}));
        }

        res.json({success: true, lesson, questions});
    } catch(e) {
        console.error("Lesson API Error:", e);
        res.status(500).json({success: false});
    }
});

router.post('/submit', checkAuth, async (req, res) => {
    try {
        const { questionId, userAnswer } = req.body;
        const userId = req.userId;
        
        const question = await Question.findById(questionId);
        if (!question) return res.status(404).json({ success: false, message: "Savol topilmadi" });

        const cleanUserAnswer = (userAnswer || '').toLowerCase().trim();
        const isCorrect = (question.answers || []).some(ans => ans && ans.toString().toLowerCase().trim() === cleanUserAnswer);

        if (!isCorrect) return res.json({ success: false, message: "Javob noto'g'ri. Qayta urinib ko'ring!" });

        const existingSub = await LearnSubmission.findOne({ userId, questionId });
        if (existingSub) return res.json({ success: true, alreadySolved: true, message: "To'g'ri! Siz avval bu savol uchun XP olgansiz." });
        
        await LearnSubmission.create({ userId, questionId, isCorrect: true });
        
        const UserDb = require("mongoose").models.User || require("../models/User");
        await UserDb.findByIdAndUpdate(userId, { $inc: { xp: question.points || 20 } });

        await Progress.findOneAndUpdate(
            { userId, lessonId: question.lessonId },
            { status: 'completed', completedAt: new Date() }
        );

        return res.json({ success: true, pointsAdded: question.points, message: `To'g'ri! +${question.points} XP berildi.` });
    } catch(e) {
        console.error("API Xatosi:", e); 
        res.status(500).json({ success: false, message: e.message || "Server xatosi" });
    }
});

// ==========================================
// ADMIN ACADEMY API (SECURED)
// ==========================================
router.post('/academy/modules', requireAdmin, async (req, res) => {
    try {
        const m = await Module.create(req.body);
        res.json({ success: true, module: m });
    } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete('/academy/modules/:id', requireAdmin, async (req, res) => {
    try {
        const mod = await Module.findById(req.params.id);
        if (!mod) return res.status(404).json({ success: false, message: 'Modul topilmadi' });
        
        const lessons = await Lesson.find({ moduleSlug: mod.slug });
        const lessonIds = lessons.map(l => l._id);
        
        await Question.deleteMany({ lessonId: { $in: lessonIds } });
        await Progress.deleteMany({ lessonId: { $in: lessonIds } });
        await Lesson.deleteMany({ moduleSlug: mod.slug });
        await Module.findByIdAndDelete(req.params.id);
        
        res.json({ success: true, message: 'Modul va unga tegishli barcha ma\'lumotlar o\'chirildi' });
    } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/academy/lessons', requireAdmin, async (req, res) => {
    try {
        const modExists = await Module.findOne({ slug: req.body.moduleSlug });
        if (!modExists) return res.status(404).json({ success: false, message: 'Modul topilmadi.' });
        
        const l = await Lesson.create(req.body);
        res.json({ success: true, lesson: l });
    } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete('/academy/lessons/:id', requireAdmin, async (req, res) => {
    try {
        await Question.deleteMany({ lessonId: req.params.id });
        await Progress.deleteMany({ lessonId: req.params.id });
        await Lesson.findByIdAndDelete(req.params.id);
        
        res.json({ success: true, message: 'Dars va uning bog\'liqliklari o\'chirildi' });
    } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/academy/questions', requireAdmin, async (req, res) => {
    try {
        const q = await Question.create(req.body);
        res.json({ success: true, question: q });
    } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

router.get("/academy/lesson-detail/:slug*", async (req, res) => {
    try {
        const fullPath = req.params.slug + (req.params[0] || "");
        const parts = fullPath.split("/").filter(Boolean);
        const lessonSlug = parts[parts.length - 1];

        let lesson = await Lesson.findOne({ slug: lessonSlug });
        if (!lesson && parts.length > 1) {
            lesson = await Lesson.findOne({ moduleSlug: parts[0], slug: parts[1] });
        }
        if (!lesson) {
            lesson = await Lesson.findOne({ slug: fullPath });
        }

        if (!lesson) return res.status(404).json({ success: false, message: "Dars topilmadi" });

        const questions = await Question.find({ lessonId: lesson._id });
        res.json({ success: true, lesson, questions });
    } catch(e) {
        res.status(500).json({ success: false, message: e.message });
    }
});


// ==========================================
// Tahrirlash API (Edit Modules & Lessons)
// ==========================================
router.put('/academy/modules/:id', requireAdmin, async (req, res) => {
    try {
        const m = await Module.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, module: m, message: 'Modul tahrirlandi' });
    } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/academy/lessons/:id', requireAdmin, async (req, res) => {
    try {
        const l = await Lesson.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, lesson: l, message: 'Dars tahrirlandi' });
    } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/academy/questions/:id', requireAdmin, async (req, res) => {
    try {
        const q = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, question: q, message: 'Savol tahrirlandi' });
    } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
