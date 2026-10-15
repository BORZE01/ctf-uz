const mongoose = require('mongoose');

const battleSchema = new mongoose.Schema({
    challenger: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    opponent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    challenges: [{
        challengeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge' },
        solvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        solvedAt: { type: Date, default: null }
    }],
    status: {
        type: String,
        enum: ['pending', 'active', 'completed', 'rejected', 'expired'],
        default: 'pending',
        index: true
    },
    scores: {
        challenger: { type: Number, default: 0 },
        opponent: { type: Number, default: 0 }
    },
    winner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    challengerRatingBefore: { type: Number, default: 1000 },
    opponentRatingBefore: { type: Number, default: 1000 },
    challengerRatingAfter: { type: Number, default: 1000 },
    opponentRatingAfter: { type: Number, default: 1000 },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 10 * 60 * 1000)  // 10 daqiqa
    }
}, { timestamps: true });

// Indexes
battleSchema.index({ status: 1, createdAt: -1 });
battleSchema.index({ challenger: 1, status: 1 });
battleSchema.index({ opponent: 1, status: 1 });

module.exports = mongoose.model('Battle', battleSchema);
