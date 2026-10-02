const mongoose = require('mongoose');

const universitySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    shortName: { type: String, index: true },
    region: { type: String, default: '' },
    city: { type: String, default: '' },
    website: { type: String, default: '' },
    logo: { type: String, default: null },
    verified: { type: Boolean, default: true },
    teamCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('University', universitySchema);