const fs = require('fs');
const path = require('path');

// 1. User modeliga Premium maydonlarini qo'shish
const userModelPath = path.join(__dirname, 'models', 'User.js');
if (fs.existsSync(userModelPath)) {
    let userCode = fs.readFileSync(userModelPath, 'utf8');
    
    if (!userCode.includes('isPremium')) {
        // Schema boshlanishiga Premium maydonlarini tiqamiz
        userCode = userCode.replace(/new mongoose\.Schema\(\{/, `new mongoose.Schema({
    isPremium: { type: Boolean, default: false },
    premiumUntil: { type: Date, default: null },
    premiumPlan: { type: String, default: 'free' },`);
        
        fs.writeFileSync(userModelPath, userCode, 'utf8');
        console.log("✅ User modeliga Premium (isPremium, premiumUntil) maydonlari muvaffaqiyatli qo'shildi!");
    } else {
        console.log("ℹ️ User modelida Premium maydonlari allaqachon mavjud.");
    }
} else {
    console.log("⚠️ User.js modeli topilmadi.");
}

// 2. To'lovlar (Payment) tarixini saqlash uchun yangi model yaratish
const paymentModelPath = path.join(__dirname, 'models', 'Payment.js');
const paymentCode = `const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    planName: { type: String, required: true }, // masalan: 'Pro - 1 oy'
    provider: { type: String, default: 'manual' }, // click, payme, manual
    status: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payment', paymentSchema);
`;

fs.writeFileSync(paymentModelPath, paymentCode, 'utf8');
console.log("✅ To'lovlar (Payment.js) modeli yaratildi!");

