const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true,
        index: true
    },
    applicantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    employerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employer',
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['submitted', 'reviewing', 'interview', 'offered', 'accepted', 'rejected', 'withdrawn'],
        default: 'submitted',
        index: true
    },
    coverLetter: {
        type: String,
        maxlength: 5000,
        default: ''
    },
    cvFileId: {
        type: String,
        default: null
    },
    cvUrl: {
        type: String,
        default: null
    },
    // Snapshot — ariza yuborilganda Cyber ID
    portfolioSnapshot: {
        username: String,
        name: String,
        avatar: String,
        score: Number,
        cyberLevel: Number,
        skills: mongoose.Schema.Types.Mixed,
        solvedCount: Number,
        certificatesCount: Number,
        battleRating: Number,
        matchedSkills: [String],
        missingSkills: [String],
        matchScore: Number,
        snapshotAt: Date
    },
    // Employer feedback
    notes: [{
        text: String,
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        addedAt: { type: Date, default: Date.now }
    }],
    statusHistory: [{
        status: String,
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        note: String
    }],
    viewedByEmployer: {
        type: Boolean,
        default: false
    },
    viewedAt: Date
}, { timestamps: true });

// Compound indexes
applicationSchema.index({ jobId: 1, applicantId: 1 }, { unique: true });
applicationSchema.index({ applicantId: 1, status: 1, createdAt: -1 });
applicationSchema.index({ employerId: 1, status: 1, createdAt: -1 });

// Pre-save: add to history
applicationSchema.pre('save', function(next) {
    if (this.isModified('status')) {
        this.statusHistory = this.statusHistory || [];
        this.statusHistory.push({
            status: this.status,
            changedAt: new Date()
        });
    }
    next();
});

module.exports = mongoose.model('Application', applicationSchema);
