const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    title: { type: String, required: true },
    slug: { type: String, unique: true, lowercase: true, index: true },
    description: { type: String, required: true },

    location: { type: String, required: true, index: true },
    format: { type: String, enum: ['office', 'remote', 'hybrid'], default: 'office', index: true },
    level: { type: String, enum: ['internship', 'entry', 'junior', 'middle', 'senior'], default: 'junior', index: true },
    category: { type: String, index: true },

    requirements: [String],
    niceToHave: [String],
    skills: [String],

    salary: { type: String, default: '' },

    status: {
        type: String,
        enum: ['draft', 'pending_review', 'published', 'expired', 'rejected'],
        default: 'pending_review',
        index: true
    },

    featured: { type: Boolean, default: false, index: true },
    views: { type: Number, default: 0 },
    applicationCount: { type: Number, default: 0 },

    expiresAt: { type: Date, index: true },
    publishedAt: Date,

    createdAt: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

jobSchema.pre('save', function(next) {
    if (!this.slug && this.title) {
        this.slug = this.title.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now().toString(36);
    }
    next();
});

module.exports = mongoose.model('Job', jobSchema);