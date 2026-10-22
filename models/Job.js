const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, default: 'General' },
    shortDesc: { type: String, required: true },
    tasks: [String],
    requirements: [String],
    skills: [String],
    experienceLevel: { type: String, enum: ['Junior', 'Middle', 'Senior', 'Intern'], default: 'Junior' },
    workFormat: { type: String, enum: ['Remote', 'Office', 'Hybrid'], default: 'Office' },
    location: { type: String },
    employmentType: { type: String, enum: ['Full-time', 'Part-time', 'Contract'], default: 'Full-time' },
    salary: { type: String },
    deadline: { type: Date },
    status: { 
        type: String, 
        enum: ['draft', 'pending', 'changes_requested', 'approved', 'published', 'rejected', 'hidden', 'closed'], 
        default: 'draft',
        index: true
    },
    rejectReason: { type: String, default: null },
    views: { type: Number, default: 0 },
    applicantsCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);
