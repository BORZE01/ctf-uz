const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const {
    Module, Lesson, Question, LearnSubmission,
    Progress, LearningPath, PathEnrollment,
    AssessmentAttempt, Certificate
} = require('../models/Learn');
const User = require('../models/User');
const { logAction } = require('../utils/audit');

function requireAuth(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ success: false, message: "Tizimga kirish talab qilinadi" });
    }
    next();
}

async function requireStrictAdmin(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ success: false, message: "Avtorizatsiya talab qilinadi" });
    }
    try {
        const u = await User.findById(req.session.user.id).select('role banned').lean();
        if (!u || u.banned || !['admin', 'super_admin'].includes(u.role)) {
            return res.status(403).json({ success: false, message: "Faqat administratorlar uchun ruxsat etilgan" });
        }
        req.adminUser = u;
        next();
    } catch (e) {
        return res.status(500).json({ success: false, message: "Server xatosi" });
    }
}

function generateSecureCertId() {
    const p1 = crypto.randomBytes(3).toString('hex').toUpperCase();
    const p2 = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `CTF-UZ-${p1}-${p2}`;
}

async function calculatePathProgress(userId, pathDoc) {
    const modules = await Module.find({
        $or: [{ pathSlug: pathDoc.slug }, { slug: { $in: pathDoc.moduleSlugs || [] } }]
    }).sort({ order: 1, createdAt: 1 }).lean();

    const moduleSlugs = modules.map(m => m.slug);
    const lessons = await Lesson.find({ moduleSlug: { $in: moduleSlugs } }).sort({ order: 1, createdAt: 1 }).lean();

    if (!userId) {
        return {
            totalModules: modules.length,
            completedModules: 0,
            totalLessons: lessons.length,
            completedLessons: 0,
            progressPercent: 0,
            allModulesCompleted: false,
            finalExamPassed: false,
            eligibleForCertificate: false,
            completedLessonIds: []
        };
    }

    const userProgress = await Progress.find({
        userId,
        lessonId: { $in: lessons.map(l => l._id) },
        status: 'completed'
    }).lean();

    const completedLessonSet = new Set(userProgress.map(p => p.lessonId.toString()));
    const completedLessonsCount = lessons.filter(l => completedLessonSet.has(l._id.toString())).length;

    let completedModulesCount = 0;
    for (const m of modules) {
        const mLessons = lessons.filter(l => l.moduleSlug === m.slug);
        if (mLessons.length > 0 && mLessons.every(l => completedLessonSet.has(l._id.toString()))) {
            completedModulesCount++;
        }
    }

    const allModulesCompleted = modules.length > 0 && completedModulesCount === modules.length && lessons.length > 0;

    const enrollment = await PathEnrollment.findOne({ userId, pathId: pathDoc._id });
    const finalExamPassed = enrollment ? !!enrollment.finalExamPassed : false;

    const totalSteps = lessons.length + 1;
    const doneSteps = completedLessonsCount + (finalExamPassed ? 1 : 0);
    const progressPercent = lessons.length === 0 ? 0 : Math.min(100, Math.round((doneSteps / totalSteps) * 100));

    const eligibleForCertificate = allModulesCompleted && finalExamPassed;

    if (enrollment) {
        enrollment.progressPercent = progressPercent;
        if (eligibleForCertificate) {
            enrollment.status = 'completed';
            if (!enrollment.completedAt) enrollment.completedAt = new Date();
        } else if (doneSteps > 0) {
            enrollment.status = 'in_progress';
        }
        await enrollment.save();
    }

    return {
        totalModules: modules.length,
        completedModules: completedModulesCount,
        totalLessons: lessons.length,
        completedLessons: completedLessonsCount,
        progressPercent,
        allModulesCompleted,
        finalExamPassed,
        finalExamBestScore: enrollment?.finalExamBestScore || 0,
        eligibleForCertificate,
        completedLessonIds: Array.from(completedLessonSet)
    };
}

router.get('/paths', async (req, res) => {
    try {
        const paths = await LearningPath.find({ isPublished: true }).sort({ order: 1, createdAt: 1 }).lean();
        const userId = req.session?.user?.id || null;

        const enriched = await Promise.all(paths.map(async (p) => {
            const learnersCount = await PathEnrollment.countDocuments({ pathId: p._id });
            const modulesCount = await Module.countDocuments({
                $or: [{ pathSlug: p.slug }, { slug: { $in: p.moduleSlugs || [] } }]
            });
            const prog = await calculatePathProgress(userId, p);
            let enrolled = false;
            let certificate = null;

            if (userId) {
                const enr = await PathEnrollment.findOne({ userId, pathId: p._id }).lean();
                enrolled = !!enr;
                certificate = await Certificate.findOne({ userId, pathSlug: p.slug, status: 'valid' }).lean();
            }

            const { finalQuestions, ...safePath } = p;
            return {
                ...safePath,
                learnersCount,
                modulesCount,
                examQuestionsCount: (finalQuestions || []).length,
                userState: {
                    enrolled,
                    ...prog,
                    isCompletedAndCertified: !!certificate,
                    certificate: certificate ? {
                        certId: certificate.certId,
                        courseName: certificate.courseName,
                        issueDate: certificate.issueDate,
                        scorePercent: certificate.scorePercent,
                        verifyUrl: certificate.verifyUrl
                    } : null
                }
            };
        }));

        res.json({ success: true, paths: enriched });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

router.get('/paths/:slug', async (req, res) => {
    try {
        const pathDoc = await LearningPath.findOne({ slug: req.params.slug.toLowerCase() }).lean();
        if (!pathDoc) return res.status(404).json({ success: false, message: "O'quv yo'li topilmadi" });

        const userId = req.session?.user?.id || null;
        const modules = await Module.find({
            $or: [{ pathSlug: pathDoc.slug }, { slug: { $in: pathDoc.moduleSlugs || [] } }]
        }).sort({ order: 1, createdAt: 1 }).lean();

        const prog = await calculatePathProgress(userId, pathDoc);
        const completedSet = new Set(prog.completedLessonIds);

        let previousModuleCompleted = true;
        for (let i = 0; i < modules.length; i++) {
            const m = modules[i];
            const lessons = await Lesson.find({ moduleSlug: m.slug }).sort({ order: 1, createdAt: 1 }).select('-content').lean();
            
            let prevLessonDone = true;
            m.lessons = await Promise.all(lessons.map(async (l, idx) => {
                const qCount = await Question.countDocuments({ lessonId: l._id });
                const isDone = completedSet.has(l._id.toString());
                const isLessonLocked = !prevLessonDone;
                prevLessonDone = isDone;
                return {
                    ...l,
                    questionsCount: qCount,
                    completed: isDone,
                    locked: isLessonLocked
                };
            }));

            const completedInMod = m.lessons.filter(l => l.completed).length;
            m.totalLessons = m.lessons.length;
            m.completedLessons = completedInMod;
            m.isCompleted = m.lessons.length > 0 && completedInMod === m.lessons.length;
            m.isLocked = i > 0 && !previousModuleCompleted;
            previousModuleCompleted = m.isCompleted;
        }

        const safeQuestions = (pathDoc.finalQuestions || []).map(q => ({
            id: q.id || (q._id ? q._id.toString() : 'ex_'+Math.random()),
            prompt: q.prompt,
            options: q.options,
            points: q.points
        }));

        const existingCert = userId ? await Certificate.findOne({ userId, pathSlug: pathDoc.slug, status: 'valid' }).lean() : null;
        const enrollment = userId ? await PathEnrollment.findOne({ userId, pathId: pathDoc._id }).lean() : null;

        res.json({
            success: true,
            path: {
                ...pathDoc,
                finalQuestions: safeQuestions,
                modules,
                enrolled: !!enrollment,
                progress: prog,
                certificate: existingCert ? {
                    certId: existingCert.certId,
                    recipientName: existingCert.recipientName,
                    username: existingCert.username,
                    courseName: existingCert.courseName,
                    issueDate: existingCert.issueDate,
                    scorePercent: existingCert.scorePercent,
                    verifyUrl: existingCert.verifyUrl
                } : null
            }
        });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

router.post('/paths/:slug/enroll', requireAuth, async (req, res) => {
    try {
        const pathDoc = await LearningPath.findOne({ slug: req.params.slug.toLowerCase() }).lean();
        if (!pathDoc) return res.status(404).json({ success: false, message: "O'quv yo'li topilmadi" });

        const userId = req.session.user.id;
        const enrollment = await PathEnrollment.findOneAndUpdate(
            { userId, pathId: pathDoc._id },
            { $setOnInsert: { userId, pathId: pathDoc._id, pathSlug: pathDoc.slug, status: 'enrolled', enrolledAt: new Date() } },
            { upsert: true, new: true }
        );

        const prog = await calculatePathProgress(userId, pathDoc);
        res.json({ success: true, enrollment, progress: prog });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

router.get('/lesson/:slug', requireAuth, async (req, res) => {
    try {
        const lesson = await Lesson.findOne({ slug: req.params.slug.toLowerCase() }).lean();
        if (!lesson) return res.status(404).json({ success: false, message: "Dars topilmadi" });

        const questions = await Question.find({ lessonId: lesson._id }).sort({ order: 1, createdAt: 1 }).select('-answers').lean();

        const progress = await Progress.findOneAndUpdate(
            { userId: req.session.user.id, lessonId: lesson._id },
            { $setOnInsert: { moduleSlug: lesson.moduleSlug, status: 'started', startedAt: new Date() } },
            { upsert: true, new: true }
        ).lean();

        res.json({
            success: true,
            lesson,
            questions,
            progress: {
                status: progress.status,
                answeredQuestions: (progress.answeredQuestions || []).map(id => id.toString())
            }
        });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

router.post('/submit', requireAuth, async (req, res) => {
    try {
        const { lessonId, questionId, answer } = req.body;
        const userId = req.session.user.id;

        const lesson = await Lesson.findById(lessonId);
        if (!lesson) return res.status(404).json({ success: false, message: "Dars topilmadi" });

        const allQuestions = await Question.find({ lessonId: lesson._id }).sort({ order: 1 });
        let prog = await Progress.findOne({ userId, lessonId: lesson._id });
        if (!prog) {
            prog = new Progress({ userId, lessonId: lesson._id, moduleSlug: lesson.moduleSlug, status: 'started', answeredQuestions: [] });
        }

        if (!questionId && allQuestions.length === 0) {
            const wasDone = prog.status === 'completed';
            prog.status = 'completed';
            prog.quizScorePercent = 100;
            prog.completedAt = new Date();
            await prog.save();
            if (!wasDone) {
                await User.findByIdAndUpdate(userId, { $inc: { xp: lesson.xpReward || 50 } });
            }
            return res.json({ success: true, correct: true, lessonCompleted: true, message: "Dars muvaffaqiyatli yakunlandi!" });
        }

        const question = await Question.findOne({ _id: questionId, lessonId: lesson._id });
        if (!question) return res.status(404).json({ success: false, message: "Savol topilmadi" });

        const cleanSubmitted = String(answer || '').trim().toLowerCase();
        const isCorrect = (question.answers || []).some(a => String(a).trim().toLowerCase() === cleanSubmitted);
        const alreadyAnswered = (prog.answeredQuestions || []).some(id => id.toString() === question._id.toString());

        await LearnSubmission.create({
            userId,
            lessonId: lesson._id,
            questionId: question._id,
            submittedAnswer: String(answer || '').trim(),
            isCorrect,
            pointsAwarded: (isCorrect && !alreadyAnswered) ? (question.points || 20) : 0
        });

        if (!isCorrect) {
            return res.json({
                success: true,
                correct: false,
                lessonCompleted: prog.status === 'completed',
                message: "Javob noto'g'ri. Matnni diqqat bilan o'qib qayta urinib ko'ring."
            });
        }

        if (!alreadyAnswered) {
            prog.answeredQuestions.push(question._id);
            await User.findByIdAndUpdate(userId, { $inc: { xp: question.points || 20, score: question.points || 20 } });
        }

        const answeredSet = new Set(prog.answeredQuestions.map(id => id.toString()));
        const allAnswered = allQuestions.every(q => answeredSet.has(q._id.toString()));

        prog.quizScorePercent = allQuestions.length > 0 ? Math.round((answeredSet.size / allQuestions.length) * 100) : 100;

        let justCompletedLesson = false;
        if (allAnswered && prog.status !== 'completed') {
            prog.status = 'completed';
            prog.completedAt = new Date();
            justCompletedLesson = true;
            await User.findByIdAndUpdate(userId, { $inc: { xp: lesson.xpReward || 50 } });
        }

        await prog.save();

        res.json({
            success: true,
            correct: true,
            lessonCompleted: prog.status === 'completed',
            justCompletedLesson,
            answeredCount: answeredSet.size,
            totalQuestions: allQuestions.length,
            message: prog.status === 'completed'
                ? "Barcha savollarga to'g'ri javob berildi! Dars yakunlandi."
                : `To'g'ri javob! (${answeredSet.size}/${allQuestions.length})`
        });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// YAKUNIY IMTIHON VA AVTOMATIK SERTIFIKAT - KAFOLATLANGAN LOGIKA
router.post('/paths/:slug/final-assessment/submit', requireAuth, async (req, res) => {
    try {
        const mongoose = require('mongoose');
        const pathDoc = await LearningPath.findOne({ slug: req.params.slug.toLowerCase() }).lean();
        if (!pathDoc) return res.status(404).json({ success: false, message: "O'quv yo'li topilmadi" });

        const userId = req.session.user.id;
        const preProg = await calculatePathProgress(userId, pathDoc);

        if (!preProg.allModulesCompleted) {
            return res.status(403).json({ success: false, message: "Yakuniy imtihonni boshlash uchun avval barcha modullar va darslarni 100% tugatishingiz shart!" });
        }

        const questions = pathDoc.finalQuestions || [];
        const answers = req.body.answers || {};
        let totalPoints = 0;
        let earnedPoints = 0;

        questions.forEach((q, i) => {
            const pts = q.points || 25;
            totalPoints += pts;
            
            const qIdStr = q.id || (q._id ? q._id.toString() : '');
            let submittedVal = answers[qIdStr];
            if (submittedVal === undefined || submittedVal === null || submittedVal === '') {
                submittedVal = answers[i];
            }
            
            let uAnsStr = String(submittedVal || '');
            if (q.options && q.options.length > 0) {
                const optIdx = parseInt(uAnsStr);
                if (!isNaN(optIdx) && q.options[optIdx]) {
                    uAnsStr = q.options[optIdx];
                }
            }

            const uAns = uAnsStr.trim().toLowerCase().replace(/\s+/g, ' ');
            const cAns = String(q.correctAnswer || '').trim().toLowerCase().replace(/\s+/g, ' ');
            if (uAns && uAns === cAns) earnedPoints += pts;
        });

        const scorePercent = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
        const minReq = pathDoc.finalExamMinPercent || 80;
        const passed = scorePercent >= minReq;

        const attemptId = 'ATT-' + crypto.randomBytes(5).toString('hex').toUpperCase();
        await AssessmentAttempt.create({
            attemptId, userId, pathId: pathDoc._id, pathSlug: pathDoc.slug,
            status: passed ? 'passed' : 'failed', scorePercent, passed,
            expiresAt: new Date(Date.now() + 3600000), completedAt: new Date()
        });

        const enrollment = await PathEnrollment.findOneAndUpdate(
            { userId, pathId: pathDoc._id },
            { $setOnInsert: { userId, pathId: pathDoc._id, pathSlug: pathDoc.slug, enrolledAt: new Date() }, $max: { finalExamBestScore: scorePercent } },
            { upsert: true, new: true }
        );

        let issuedCertificate = null;

        if (passed) {
            enrollment.finalExamPassed = true;
            enrollment.status = 'completed';
            enrollment.progressPercent = 100;
            enrollment.completedAt = new Date();
            await enrollment.save();

            const user = await User.findById(userId).select('name username').lean();
            
            // MongoDB muammosini chetlab o'tish uchun ID larni Object formatiga o'giramiz
            const userObjId = new mongoose.Types.ObjectId(userId);
            let cert = await Certificate.findOne({ userId: userObjId, pathSlug: pathDoc.slug });
            
            if (!cert) {
                const certId = generateSecureCertId();
                const certType = pathDoc.certificateType && ['course_completion', 'professional'].includes(pathDoc.certificateType) ? pathDoc.certificateType : 'course_completion';
                
                const certDoc = {
                    certId,
                    userId: userObjId,
                    recipientName: user.name || user.username,
                    username: user.username,
                    pathId: new mongoose.Types.ObjectId(pathDoc._id),
                    pathSlug: pathDoc.slug,
                    courseName: pathDoc.certificateTitle || pathDoc.title,
                    type: certType,
                    status: 'valid',
                    isValid: true,
                    scorePercent,
                    verifyUrl: `/verify-certificate/${certId}`,
                    issueDate: new Date(),
                    sourceId: String(pathDoc._id),
                    sourceType: 'learning_path',
                    title: pathDoc.certificateTitle || pathDoc.title
                };
                
                await Certificate.collection.insertOne(certDoc);
                cert = certDoc;
                logAction(user.username, 'CERTIFICATE_ISSUED', { certId, pathSlug: pathDoc.slug, scorePercent });
            }
            issuedCertificate = cert;
        }

        res.json({
            success: true, passed, scorePercent, requiredPercent: minReq, certificate: issuedCertificate,
            message: passed ? `Tabriklaymiz! Siz imtihondan o'tdingiz!` : `Natija: ${scorePercent}%. Kerakli: ${minReq}%.`
        });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// ══════════════════════════════════════════════════════════
// 2. ADMIN 100% TO'LIQ BOSHQARUV (CREATE, EDIT, DELETE)
// ══════════════════════════════════════════════════════════

router.get('/academy/all', requireStrictAdmin, async (req, res) => {
    try {
        const paths = await LearningPath.find().sort({ order: 1, createdAt: 1 }).lean();
        const modules = await Module.find().sort({ order: 1, createdAt: 1 }).lean();
        const lessons = await Lesson.find().sort({ order: 1, createdAt: 1 }).lean();
        const questions = await Question.find().sort({ order: 1, createdAt: 1 }).lean();
        res.json({ success: true, paths, modules, lessons, questions });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/academy/paths', requireStrictAdmin, async (req, res) => {
    try {
        const slug = String(req.body.slug || '').toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');
        const p = await LearningPath.create({ ...req.body, slug });
        res.json({ success: true, path: p });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/academy/paths/:id', requireStrictAdmin, async (req, res) => {
    try {
        const oldPath = await LearningPath.findById(req.params.id);
        if (!oldPath) return res.status(404).json({ success: false, message: "Yo'l topilmadi" });
        const newSlug = req.body.slug ? String(req.body.slug).toLowerCase().trim().replace(/[^a-z0-9-]/g, '-') : oldPath.slug;
        if (newSlug !== oldPath.slug) {
            await Module.updateMany({ pathSlug: oldPath.slug }, { $set: { pathSlug: newSlug } });
        }
        const updated = await LearningPath.findByIdAndUpdate(req.params.id, { $set: { ...req.body, slug: newSlug } }, { new: true });
        res.json({ success: true, path: updated });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete('/academy/paths/:id', requireStrictAdmin, async (req, res) => {
    try {
        const p = await LearningPath.findByIdAndDelete(req.params.id);
        if (p) {
            const mods = await Module.find({ pathSlug: p.slug });
            for (const m of mods) {
                const less = await Lesson.find({ moduleSlug: m.slug });
                for (const l of less) {
                    await Question.deleteMany({ lessonId: l._id });
                }
                await Lesson.deleteMany({ moduleSlug: m.slug });
            }
            await Module.deleteMany({ pathSlug: p.slug });
        }
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/academy/modules', requireStrictAdmin, async (req, res) => {
    try {
        const slug = String(req.body.slug || '').toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');
        const mod = await Module.create({ ...req.body, slug });
        if (mod.pathSlug) {
            await LearningPath.updateOne({ slug: mod.pathSlug }, { $addToSet: { moduleSlugs: mod.slug } });
        }
        res.json({ success: true, module: mod });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/academy/modules/:id', requireStrictAdmin, async (req, res) => {
    try {
        const oldMod = await Module.findById(req.params.id);
        if (!oldMod) return res.status(404).json({ success: false, message: "Modul topilmadi" });
        const newSlug = req.body.slug ? String(req.body.slug).toLowerCase().trim().replace(/[^a-z0-9-]/g, '-') : oldMod.slug;

        if (newSlug !== oldMod.slug) {
            await Lesson.updateMany({ moduleSlug: oldMod.slug }, { $set: { moduleSlug: newSlug } });
            await LearningPath.updateMany({ moduleSlugs: oldMod.slug }, { $set: { "moduleSlugs.$": newSlug } });
        }
        if (req.body.pathSlug && req.body.pathSlug !== oldMod.pathSlug) {
            await LearningPath.updateOne({ slug: oldMod.pathSlug }, { $pull: { moduleSlugs: oldMod.slug } });
            await LearningPath.updateOne({ slug: req.body.pathSlug }, { $addToSet: { moduleSlugs: newSlug } });
        }

        const updated = await Module.findByIdAndUpdate(req.params.id, { $set: { ...req.body, slug: newSlug } }, { new: true });
        res.json({ success: true, module: updated });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete('/academy/modules/:id', requireStrictAdmin, async (req, res) => {
    try {
        const mod = await Module.findByIdAndDelete(req.params.id);
        if (mod) {
            await LearningPath.updateMany({}, { $pull: { moduleSlugs: mod.slug } });
            const less = await Lesson.find({ moduleSlug: mod.slug });
            for (const l of less) {
                await Question.deleteMany({ lessonId: l._id });
            }
            await Lesson.deleteMany({ moduleSlug: mod.slug });
        }
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/academy/lessons', requireStrictAdmin, async (req, res) => {
    try {
        const slug = String(req.body.slug || '').toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');
        const les = await Lesson.create({ ...req.body, slug });
        res.json({ success: true, lesson: les });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/academy/lessons/:id', requireStrictAdmin, async (req, res) => {
    try {
        const slug = req.body.slug ? String(req.body.slug).toLowerCase().trim().replace(/[^a-z0-9-]/g, '-') : undefined;
        const updateData = { ...req.body };
        if (slug) updateData.slug = slug;
        const les = await Lesson.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true });
        res.json({ success: true, lesson: les });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete('/academy/lessons/:id', requireStrictAdmin, async (req, res) => {
    try {
        await Question.deleteMany({ lessonId: req.params.id });
        await Lesson.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/academy/questions', requireStrictAdmin, async (req, res) => {
    try {
        const answers = Array.isArray(req.body.answers)
            ? req.body.answers
            : String(req.body.answers || '').split(',').map(s => s.trim()).filter(Boolean);
        const q = await Question.create({ ...req.body, answers });
        res.json({ success: true, question: q });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/academy/questions/:id', requireStrictAdmin, async (req, res) => {
    try {
        const answers = Array.isArray(req.body.answers)
            ? req.body.answers
            : String(req.body.answers || '').split(',').map(s => s.trim()).filter(Boolean);
        const q = await Question.findByIdAndUpdate(req.params.id, {
            $set: { prompt: req.body.prompt, answers, points: parseInt(req.body.points) || 20 }
        }, { new: true });
        res.json({ success: true, question: q });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete('/academy/questions/:id', requireStrictAdmin, async (req, res) => {
    try {
        await Question.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/academy/paths/:id/exam-questions', requireStrictAdmin, async (req, res) => {
    try {
        const p = await LearningPath.findById(req.params.id);
        if (!p) return res.status(404).json({ success: false, message: "Yo'l topilmadi" });
        const options = Array.isArray(req.body.options)
            ? req.body.options
            : String(req.body.options || '').split(',').map(s => s.trim()).filter(Boolean);
        const qId = 'ex_' + Date.now();
        p.finalQuestions.push({
            id: qId,
            prompt: req.body.prompt,
            options,
            correctAnswer: req.body.correctAnswer,
            points: parseInt(req.body.points) || 25
        });
        await p.save();
        res.json({ success: true, path: p });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/academy/paths/:id/exam-questions/:qId', requireStrictAdmin, async (req, res) => {
    try {
        const p = await LearningPath.findById(req.params.id);
        if (!p) return res.status(404).json({ success: false, message: "Yo'l topilmadi" });
        const q = (p.finalQuestions || []).find(item => item.id === req.params.qId);
        if (!q) return res.status(404).json({ success: false, message: "Imtihon savoli topilmadi" });

        q.prompt = req.body.prompt;
        q.options = Array.isArray(req.body.options)
            ? req.body.options
            : String(req.body.options || '').split(',').map(s => s.trim()).filter(Boolean);
        q.correctAnswer = req.body.correctAnswer;
        q.points = parseInt(req.body.points) || 25;

        await p.save();
        res.json({ success: true, path: p });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete('/academy/paths/:id/exam-questions/:qId', requireStrictAdmin, async (req, res) => {
    try {
        await LearningPath.findByIdAndUpdate(req.params.id, {
            $pull: { finalQuestions: { id: req.params.qId } }
        });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
module.exports.calculatePathProgress = calculatePathProgress;
