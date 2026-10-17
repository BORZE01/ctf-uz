const mongoose = require('mongoose');

// =========================================
// 1. MODULE (Yo'nalishlar va bo'limlar)
// =========================================
const moduleSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, default: "Kiberxavfsizlik asoslari va amaliyot" },
  category: { type: String, default: "Cybersecurity Fundamentals" }, // 12 ta asosiy yo'nalish uchun
  difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'], default: 'Beginner' },
  order: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true }
});

// =========================================
// 2. LESSON (Darslar va Laboratoriyalar)
// =========================================
const lessonSchema = new mongoose.Schema({
  moduleSlug: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, default: "" }, // Kartochkada ko'rsatish uchun qisqa matn
  content: { type: String },
  duration: { type: Number, default: 15 }, // Dars davomiyligi (daqiqa)
  xpReward: { type: Number, default: 50 }, // Darsni to'liq o'qib chiqqani uchun beriladigan baza XP
  type: { type: String, enum: ['text', 'quiz', 'lab'], default: 'text' }, // Dars formati
  order: { type: Number, default: 1 }
});

// =========================================
// 3. QUESTION (Test va Amaliy topshiriqlar)
// =========================================
const questionSchema = new mongoose.Schema({
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
  prompt: { type: String, required: true },
  hint: { type: String },
  answers: [{ type: String, required: true }],
  points: { type: Number, default: 20 },
  type: { type: String, default: 'text' } // 'text', 'multiple-choice', 'command-line'
});

// =========================================
// 4. SUBMISSION (Topshiriq yechimlari)
// =========================================
const submissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
  isCorrect: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});
submissionSchema.index({ userId: 1, questionId: 1 }, { unique: true });

// =========================================
// 5. PROGRESS (YANGI - Dars davomiyligini kuzatish)
// =========================================
const progressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
  status: { type: String, enum: ['started', 'completed'], default: 'started' },
  savedState: { type: mongoose.Schema.Types.Mixed }, // Terminal yoki interaktiv dars chala qolsa, holatni saqlash
  completedAt: { type: Date }
}, { timestamps: true });
progressSchema.index({ userId: 1, lessonId: 1 }, { unique: true });

// =========================================
// 6. CERTIFICATE (YANGI - QR Sertifikatlar)
// =========================================
const certificateSchema = new mongoose.Schema({
  certId: { type: String, required: true, unique: true }, // Masalan: CTF-UZ-8A4F92B
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  moduleSlug: { type: String, required: true },
  courseName: { type: String, required: true },
  issueDate: { type: Date, default: Date.now },
  isValid: { type: Boolean, default: true }
});

// Ro'yxatdan o'tkazish
const Module = mongoose.models.Module || mongoose.model('Module', moduleSchema);
const Lesson = mongoose.models.Lesson || mongoose.model('Lesson', lessonSchema);
const Question = mongoose.models.Question || mongoose.model('Question', questionSchema);
const LearnSubmission = mongoose.models.LearnSubmission || mongoose.model('LearnSubmission', submissionSchema);
const Progress = mongoose.models.Progress || mongoose.model('Progress', progressSchema);
const Certificate = mongoose.models.Certificate || mongoose.model('Certificate', certificateSchema);

module.exports = { Module, Lesson, Question, LearnSubmission, Progress, Certificate };
