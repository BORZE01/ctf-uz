const express = require('express');
const router = express.Router();
const { Module, Lesson, Question, LearnSubmission, Progress } = require('../models/Learn');
const User = require('../models/User');

const checkAuth = (req, res, next) => {
    const userId = req.session?.userId || req.session?.user?.id || req.user?._id;
    if (!userId) return res.status(401).json({ success: false, message: "Avtorizatsiyadan o'ting" });
    req.userId = userId;
    next();
};

router.get('/modules', async (req, res) => {
    try {
        const userId = req.session?.userId || req.session?.user?.id || req.user?._id;
        const modules = await Module.find({ isActive: true }).sort({order: 1}).lean();
        
        let userProgressList = [];
        if (userId) {
            userProgressList = await Progress.find({ userId }).lean();
        }

        let totalLessons = 0;
        let completedLessons = 0;

        for (let m of modules) {
            const lessons = await Lesson.find({moduleSlug: m.slug}).sort({order: 1}).lean();
            totalLessons += lessons.length;
            
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
        }

        const globalProgress = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);
        res.json({ success: true, data: modules, stats: { totalLessons, completedLessons, globalProgress } });
    } catch(e) {
        console.error("Learn modules error:", e);
        res.status(500).json({success: false, message: "Server xatosi"});
    }
});

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
// ADMIN ACADEMY API
// ==========================================
router.post('/academy/modules', checkAuth, async (req, res) => {
    try {
        const m = await Module.create(req.body);
        res.json({ success: true, module: m });
    } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete('/academy/modules/:id', checkAuth, async (req, res) => {
    try {
        await Module.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/academy/lessons', checkAuth, async (req, res) => {
    try {
        const modExists = await Module.findOne({ slug: req.body.moduleSlug });
        if (!modExists) {
            return res.status(404).json({ success: false, message: "Xato! Bunday modul bazada topilmadi." });
        }
        const l = await Lesson.create(req.body);
        res.json({ success: true, lesson: l });
    } catch(e) { 
        console.error("Dars yaratish xatosi:", e);
        res.status(500).json({ success: false, message: e.message }); 
    }
});

router.delete('/academy/lessons/:id', checkAuth, async (req, res) => {
    try {
        await Lesson.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});


router.post('/academy/questions', checkAuth, async (req, res) => {
    try {
        const { Question } = require('../models/Learn');
        const q = await Question.create(req.body);
        res.json({ success: true, question: q });
    } catch(e) { 
        console.error("Savol yaratish xatosi:", e);
        res.status(500).json({ success: false, message: e.message }); 
    }
});

module.exports = router;
