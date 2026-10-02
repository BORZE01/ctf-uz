const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true, index: true },
    description: { type: String, default: '' },
    type: {
        type: String,
        enum: ['national', 'university', 'school', 'corporate', 'rvb', 'osint'],
        default: 'national'
    },
    icon: { type: String, default: '🏆' },

    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true },

    // CTF Engine
    status: {
        type: String,
        enum: ['draft', 'scheduled', 'live', 'paused', 'finished', 'archived'],
        default: 'draft',
        index: true
    },

    // Registration
    registrationOpen: { type: Boolean, default: false },
    registrationStart: Date,
    registrationEnd: Date,
    maxParticipants: { type: Number, default: 0 },
    maxTeams: { type: Number, default: 0 },

    // Participants
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
    participantCount: { type: Number, default: 0 },

    // Challenges
    challenges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Challenge' }],

    // Scoreboard
    scoreboardFreeze: { type: Boolean, default: false },
    scoreboardFrozenAt: { type: Date, default: null },
    scoreboardVisible: { type: Boolean, default: true },

    // Rules
    rules: { type: String, default: '' },
    eligibility: { type: String, default: '' },

    // Awards
    awards: [{
        rank: Number,
        prize: String,
        description: String
    }],

    // Announcements
    announcements: [{
        title: String,
        message: String,
        createdAt: { type: Date, default: Date.now }
    }],

    // Certificates
    certificatesEnabled: { type: Boolean, default: false },
    certificateTemplate: String,

    // Author
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    createdAt: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

eventSchema.index({ status: 1, startDate: -1 });

// Slug generator
eventSchema.pre('save', function(next) {
    if (!this.slug && this.title) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 50);
    }
    next();
});

module.exports = mongoose.model('Event', eventSchema);