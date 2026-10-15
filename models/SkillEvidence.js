const mongoose = require('mongoose');

const skillEvidenceSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    skillKey: {
        type: String,
        required: true,
        index: true,
        lowercase: true,
        trim: true
    },
    skillLabel: {
        type: String,
        required: true
    },
    evidenceType: {
        type: String,
        enum: ['challenge', 'course', 'competition', 'assessment'],
        required: true
    },
    sourceId: {
        type: mongoose.Schema.Types.ObjectId
    },
    sourceName: String,
    level: {
        type: String,
        enum: ['learning', 'practiced', 'verified'],
        default: 'earned'
    },
    status: {
        type: String,
        enum: ['earned', 'verified', 'revoked'],
        default: 'earned'
    },
    verifiedAt: Date,
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Unique per user + skill + source
skillEvidenceSchema.index(
    { userId: 1, skillKey: 1, sourceId: 1 },
    { unique: true, sparse: true }
);

module.exports = mongoose.model('SkillEvidence', skillEvidenceSchema);
