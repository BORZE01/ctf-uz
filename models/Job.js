const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    employerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employer',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 160,
        index: true
    },
    description: {
        type: String,
        required: true,
        maxlength: 5000
    },
    responsibilities: [{
        type: String,
        maxlength: 500
    }],
    requirements: [{
        type: String,
        maxlength: 500
    }],
    niceToHave: [{
        type: String,
        maxlength: 500
    }],
    requiredSkills: [{
        type: String,
        maxlength: 50
    }],
    optionalSkills: [{
        type: String,
        maxlength: 50
    }],
    jobType: {
        type: String,
        enum: ['internship', 'full-time', 'part-time', 'contract'],
        default: 'full-time',
        index: true
    },
    level: {
        type: String,
        enum: ['internship', 'junior', 'middle', 'senior', 'lead'],
        default: 'junior',
        index: true
    },
    location: {
        type: String,
        maxlength: 100,
        default: ''
    },
    remote: {
        type: Boolean,
        default: false
    },
    salaryMin: Number,
    salaryMax: Number,
    salaryCurrency: {
        type: String,
        default: 'UZS'
    },
    experienceYears: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['draft', 'pending', 'published', 'closed', 'rejected'],
        default: 'draft',
        index: true
    },
    featured: {
        type: Boolean,
        default: false,
        index: true
    },
    applicationDeadline: Date,
    applicationsCount: {
        type: Number,
        default: 0
    },
    viewsCount: {
        type: Number,
        default: 0
    },
    createdByUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

// Indexes
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ status: 1, featured: -1, createdAt: -1 });
jobSchema.index({ requiredSkills: 1 });
jobSchema.index({ level: 1, jobType: 1 });

// Virtuals
jobSchema.virtual('isOpen').get(function() {
    if (this.status !== 'published') return false;
    if (this.applicationDeadline && new Date() > this.applicationDeadline) return false;
    return true;
});

// Salary display
jobSchema.methods.salaryDisplay = function() {
    if (!this.salaryMin && !this.salaryMax) return 'Kelishiladi';
    if (this.salaryMin && this.salaryMax) {
        return `${this.salaryMin.toLocaleString()} - ${this.salaryMax.toLocaleString()} ${this.salaryCurrency}`;
    }
    if (this.salaryMin) {
        return `${this.salaryMin.toLocaleString()}+ ${this.salaryCurrency}`;
    }
    return `-${this.salaryMax.toLocaleString()} ${this.salaryCurrency}`;
};

module.exports = mongoose.model('Job', jobSchema);
