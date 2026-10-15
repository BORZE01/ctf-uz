const mongoose = require('mongoose');

const employerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
        index: true
    },
    slug: {
        type: String,
        unique: true,
        sparse: true,
        lowercase: true,
        trim: true,
        index: true
    },
    website: {
        type: String,
        trim: true,
        maxlength: 200,
        default: ''
    },
    logo: {
        type: String,
        default: null
    },
    description: {
        type: String,
        maxlength: 2000,
        default: ''
    },
    industry: {
        type: String,
        maxlength: 100,
        default: ''
    },
    companySize: {
        type: String,
        enum: ['1-10', '11-50', '51-200', '201-500', '500+', 'unknown'],
        default: 'unknown'
    },
    location: {
        type: String,
        maxlength: 100,
        default: ''
    },
    contactEmail: {
        type: String,
        trim: true,
        lowercase: true,
        default: ''
    },
    contactPhone: {
        type: String,
        default: ''
    },
    verificationStatus: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending',
        index: true
    },
    verifiedAt: Date,
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: String,
    ownerUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    // Analytics
    totalJobs: { type: Number, default: 0 },
    totalApplications: { type: Number, default: 0 },
    activeJobs: { type: Number, default: 0 }
}, { timestamps: true });

// Auto-generate slug
employerSchema.pre('validate', function(next) {
    if (!this.slug && this.name) {
        this.slug = this.name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .substring(0, 50);
        
        // Add random suffix if not unique
        if (!this.slug) {
            this.slug = 'company-' + Date.now().toString(36);
        }
    }
    next();
});

// Indexes
employerSchema.index({ verificationStatus: 1, createdAt: -1 });
employerSchema.index({ ownerUserId: 1, verificationStatus: 1 });

module.exports = mongoose.model('Employer', employerSchema);
