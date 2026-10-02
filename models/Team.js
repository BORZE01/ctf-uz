const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true, trim: true, maxlength: 50 },
    slug: { type: String, unique: true, lowercase: true, index: true },
    description: { type: String, maxlength: 500, default: '' },
    avatar: { type: String, default: null },

    universityId: { type: mongoose.Schema.Types.ObjectId, ref: 'University', default: null },

    captain: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    members: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        role: {
            type: String,
            enum: ['captain', 'co-captain', 'analyst', 'member'],
            default: 'member'
        },
        joinedAt: { type: Date, default: Date.now }
    }],

    // Invitations
    invitations: [{
        userId: mongoose.Schema.Types.ObjectId,
        invitedBy: mongoose.Schema.Types.ObjectId,
        status: {
            type: String,
            enum: ['pending', 'accepted', 'declined', 'expired'],
            default: 'pending'
        },
        invitedAt: { type: Date, default: Date.now },
        expiresAt: Date
    }],

    // Join requests
    joinRequests: [{
        userId: mongoose.Schema.Types.ObjectId,
        message: String,
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected'],
            default: 'pending'
        },
        requestedAt: { type: Date, default: Date.now }
    }],

    // Stats
    score: { type: Number, default: 0, index: true },
    xp: { type: Number, default: 0 },
    solvedChallenges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Challenge' }],
    memberCount: { type: Number, default: 0 },

    isPublic: { type: Boolean, default: true },
    maxMembers: { type: Number, default: 10 },

    createdAt: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

teamSchema.pre('save', function(next) {
    if (!this.slug && this.name) {
        this.slug = this.name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now().toString(36);
    }
    this.memberCount = this.members.length;
    next();
});

module.exports = mongoose.model('Team', teamSchema);