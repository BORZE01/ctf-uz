const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
    title: { type: String, required: true },
    employerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employer', required: true }, // To'g'rilandi
    level: { type: String, default: 'Junior' }, // experienceLevel o'rniga
    jobType: { type: String, default: 'Full-time' }, // employmentType o'rniga
    description: { type: String, required: true },
    requiredSkills: [{ type: String }],
    featured: { type: Boolean, default: false },
    viewsCount: { type: Number, default: 0 },
    applicationsCount: { type: Number, default: 0 },
    status: { type: String, enum: ['draft', 'pending', 'published', 'closed'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Job', JobSchema);