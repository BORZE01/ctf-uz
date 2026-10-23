const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    category: { type: String, enum: ['Web', 'Crypto', 'Pwn', 'Reverse', 'Forensics', 'Misc'], required: true },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard', 'Insane'], default: 'Easy' },
    points: { type: Number, required: true, default: 100 },
    description: { type: String, required: true },
    flag: { type: String, required: true }, // To'g'ri javobni ko'rish va o'zgartirish uchun
    filePath: { type: String, default: null }, // Yuklangan fayl manzili
    hints: [{ type: String }], // Qo'shimcha: ishtirokchilar uchun maslahatlar
    isPublished: { type: Boolean, default: false }, // Qo'shimcha: Qoralama/Nashr holati
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.ArenaChallenge || mongoose.model('ArenaChallenge', challengeSchema);
