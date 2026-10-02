const mongoose = require('mongoose');

const jobAlertSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    skills: [String],
    location: String,
    level: String,
    format: String,
    active: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('JobAlert', jobAlertSchema);