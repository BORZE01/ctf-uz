const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: { type: String, default: 'Cybersecurity' },
    difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
    order: { type: Number, default: 1 },
    pathSlug: { type: String, required: true, index: true },
    isPublished: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

const lessonSchema = new mongoose.Schema({
    moduleSlug: { type: String, required: true, index: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    content: { type: String, default: '' },
    duration: { type: Number, default: 15 },
    xpReward: { type: Number, default: 50 },
    order: { type: Number, default: 1 },
    isMandatory: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});
lessonSchema.index({ moduleSlug: 1, slug: 1 }, { unique: true });

const questionSchema = new mongoose.Schema({
    lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true, index: true },
    prompt: { type: String, required: true },
    answers: [{ type: String, required: true }],
    points: { type: Number, default: 20 },
    isMandatory: { type: Boolean, default: true },
    order: { type: Number, default: 1 },
    createdAt: { type: Date, default: Date.now }
});

const learnSubmissionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true, index: true },
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    submittedAnswer: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
    pointsAwarded: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

const progressSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
    moduleSlug: { type: String, index: true },
    status: { type: String, enum: ['started', 'completed'], default: 'started' },
    answeredQuestions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    quizScorePercent: { type: Number, default: 0 },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null }
});
progressSchema.index({ userId: 1, lessonId: 1 }, { unique: true });

const learningPathSchema = new mongoose.Schema({
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, default: '' },
    description: { type: String, default: '' },
    level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'Practical'], default: 'Beginner' },
    category: { type: String, default: 'Foundations' },
    moduleSlugs: [{ type: String }],
    finalExamMinPercent: { type: Number, default: 80 },
    certificateType: { type: String, enum: ['course_completion', 'professional'], default: 'course_completion' },
    certificateTitle: { type: String, required: true },
    finalQuestions: [{
        id: { type: String, required: true },
        prompt: { type: String, required: true },
        options: [{ type: String }],
        correctAnswer: { type: String, required: true },
        points: { type: Number, default: 25 }
    }],
    isPublished: { type: Boolean, default: true },
    order: { type: Number, default: 1 },
    createdAt: { type: Date, default: Date.now }
});

const pathEnrollmentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    pathId: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningPath', required: true },
    pathSlug: { type: String, required: true, index: true },
    status: { type: String, enum: ['enrolled', 'in_progress', 'completed'], default: 'enrolled' },
    progressPercent: { type: Number, default: 0 },
    finalExamPassed: { type: Boolean, default: false },
    finalExamBestScore: { type: Number, default: 0 },
    enrolledAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null }
});
pathEnrollmentSchema.index({ userId: 1, pathId: 1 }, { unique: true });

const assessmentAttemptSchema = new mongoose.Schema({
    attemptId: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    pathId: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningPath', required: true },
    pathSlug: { type: String, required: true },
    status: { type: String, enum: ['in_progress', 'passed', 'failed'], default: 'in_progress' },
    scorePercent: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    startedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    completedAt: { type: Date, default: null }
});

const certificateSchema = new mongoose.Schema({
    certId: { type: String, required: true, unique: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    recipientName: { type: String, required: true },
    username: { type: String, required: true },
    pathId: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningPath', default: null },
    pathSlug: { type: String, default: null },
    courseName: { type: String, required: true },
    type: { type: String, enum: ['course_completion', 'professional'], default: 'course_completion' },
    status: { type: String, enum: ['valid', 'revoked'], default: 'valid' },
    isValid: { type: Boolean, default: true },
    scorePercent: { type: Number, default: 100 },
    verifyUrl: { type: String, required: true },
    issueDate: { type: Date, default: Date.now },
    revokedAt: { type: Date, default: null },
    revokedReason: { type: String, default: null },
    revokedBy: { type: String, default: null }
}, { strict: false });
certificateSchema.index({ userId: 1, pathSlug: 1, type: 1 }, { unique: true, sparse: true });

module.exports = {
    Module: mongoose.models.Module || mongoose.model('Module', moduleSchema),
    Lesson: mongoose.models.Lesson || mongoose.model('Lesson', lessonSchema),
    Question: mongoose.models.Question || mongoose.model('Question', questionSchema),
    LearnSubmission: mongoose.models.LearnSubmission || mongoose.model('LearnSubmission', learnSubmissionSchema),
    Progress: mongoose.models.Progress || mongoose.model('Progress', progressSchema),
    LearningPath: mongoose.models.LearningPath || mongoose.model('LearningPath', learningPathSchema),
    PathEnrollment: mongoose.models.PathEnrollment || mongoose.model('PathEnrollment', pathEnrollmentSchema),
    AssessmentAttempt: mongoose.models.AssessmentAttempt || mongoose.model('AssessmentAttempt', assessmentAttemptSchema),
    Certificate: mongoose.models.Certificate || mongoose.model('Certificate', certificateSchema)
};
