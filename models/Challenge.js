const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true, maxlength: 200 },
    story: { type: String, default: '', maxlength: 2000 },
    objective: { type: String, default: '', maxlength: 1000 },

    category: {
        type: String,
        enum: ['Web', 'Pwn', 'Reverse', 'Crypto', 'Forensics', 'OSINT', 'Stego', 'Misc'],
        required: true,
        index: true
    },

    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard', 'Expert'],
        required: true,
        index: true
    },

    points: { type: Number, required: true, default: 100 },
    initialPoints: { type: Number, default: 100 },

    flag: { type: String, required: true },
    flagType: { type: String, enum: ['static', 'dynamic'], default: 'static' },

    hints: [{
        text: String,
        cost: { type: Number, default: 20 }
    }],

    evidence: [String],

    file: { type: String, default: null },
    fileName: { type: String, default: null },

    // Lifecycle
    status: {
        type: String,
        enum: ['draft', 'review', 'scheduled', 'live', 'archived'],
        default: 'live',
        index: true
    },

    scheduledAt: { type: Date },
    archivedAt: { type: Date },

    // Versioning
    version: { type: Number, default: 1 },
    versions: [{
        version: Number,
        changedBy: mongoose.Schema.Types.ObjectId,
        changedAt: Date,
        changes: mongoose.Schema.Types.Mixed
    }],

    // Stats
    solves: { type: Number, default: 0, index: true },
    attempts: { type: Number, default: 0 },
    totalAttempts: { type: Number, default: 0 },

    // First blood
    firstBloodUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    firstBloodAt: { type: Date, default: null },

    // Rating
    ratings: [{
        userId: mongoose.Schema.Types.ObjectId,
        rating: Number,
        ratedAt: { type: Date, default: Date.now }
    }],
    avgRating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },

    // Authors
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    authorName: { type: String, default: 'admin' },

    // Events
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', default: null, index: true },

    // Dynamic scoring
    dynamicScoring: { type: Boolean, default: false },
    minPoints: { type: Number, default: 50 },
    decay: { type: Number, default: 10 },

    createdAt: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

challengeSchema.index({ category: 1, difficulty: 1, status: 1 });
challengeSchema.index({ points: -1 });

// Dynamic scoring
challengeSchema.methods.calculateCurrentPoints = function() {
    if (!this.dynamicScoring) return this.points;

    const solvedRatio = this.solves / Math.max(this.solves + 10, 1);
    const decay = Math.floor(solvedRatio * (this.initialPoints - this.minPoints));
    return Math.max(this.minPoints, this.initialPoints - decay);
};

module.exports = mongoose.model('Challenge', challengeSchema);
