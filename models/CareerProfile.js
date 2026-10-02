const mongoose = require('mongoose');

const careerProfileSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },

    public: { type: Boolean, default: false, index: true },
    title: { type: String, default: 'Cybersecurity Enthusiast', maxlength: 100 },
    bio: { type: String, maxlength: 1000, default: '' },

    experience: [{
        title: String,
        company: String,
        location: String,
        startDate: Date,
        endDate: Date,
        current: { type: Boolean, default: false },
        description: String
    }],

    education: [{
        degree: String,
        school: String,
        field: String,
        startYear: Number,
        endYear: Number,
        description: String
    }],

    certifications: [{
        name: String,
        issuer: String,
        issueDate: Date,
        expiryDate: Date,
        credentialId: String,
        url: String
    }],

    languages: [{
        name: String,
        level: String
    }],

    views: { type: Number, default: 0 },

    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('CareerProfile', careerProfileSchema);