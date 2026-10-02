const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true },

    coverLetter: { type: String, maxlength: 5000, default: '' },
    resume: { type: String, default: null },  // File path

    status: {
        type: String,
        enum: ['applied', 'review', 'shortlisted', 'interview', 'offered', 'rejected', 'withdrawn'],
        default: 'applied',
        index: true
    },

    statusHistory: [{
        status: String,
        note: String,
        changedBy: mongoose.Schema.Types.ObjectId,
        changedAt: { type: Date, default: Date.now }
    }],

    // Skills match
    matchScore: { type: Number, default: 0 },
    matchedSkills: [String],

    createdAt: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

applicationSchema.index({ jobId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);