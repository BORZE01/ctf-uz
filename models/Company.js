const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    slug: { type: String, unique: true, lowercase: true, index: true },

    industry: { type: String, index: true },
    location: { type: String, default: '' },
    website: { type: String, default: '' },
    description: { type: String, maxlength: 2000, default: '' },
    logo: { type: String, default: null },

    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    verified: { type: Boolean, default: false, index: true },
    verificationStatus: {
        type: String,
        enum: ['pending', 'verified', 'suspended', 'rejected'],
        default: 'pending',
        index: true
    },

    banned: { type: Boolean, default: false, index: true },

    jobCount: { type: Number, default: 0 },

    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

companySchema.pre('save', function(next) {
    if (!this.slug && this.name) {
        this.slug = this.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    }
    next();
});

module.exports = mongoose.model('Company', companySchema);