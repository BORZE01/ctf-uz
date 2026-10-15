const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
   sessionId: { type: String, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    username: { type: String, default: null },
    cookie: { type: String, required: true },
    ip: { type: String, default: null, index: true },
    userAgent: { type: String, default: null },
    url: { type: String, default: null },
    visits: { type: Number, default: 1 },
    lastSeen: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// Eski visitor'larni tozalash uchun TTL (7 kun)
visitorSchema.index({ lastSeen: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

module.exports = mongoose.model('Visitor', visitorSchema);
