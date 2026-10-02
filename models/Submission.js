const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    challengeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge', required: true, index: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', default: null, index: true },

    flag: { type: String, required: true },
    correct: { type: Boolean, default: false, index: true },

    // Points
    pointsAwarded: { type: Number, default: 0 },
    xpAwarded: { type: Number, default: 0 },

    // First blood
    isFirstBlood: { type: Boolean, default: false },

    // Time
    solveTimeMs: { type: Number, default: 0 },

    // Hints used
    hintsUsed: [{
        index: Number,
        cost: Number,
        at: Date
    }],

    // Metadata
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },

    createdAt: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

submissionSchema.index({ userId: 1, challengeId: 1 });
submissionSchema.index({ challengeId: 1, correct: 1 });

module.exports = mongoose.model('Submission', submissionSchema);