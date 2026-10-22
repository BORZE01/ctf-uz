const mongoose = require('mongoose');

const appSchema = new mongoose.Schema({
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
    employer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String },
    portfolioUrl: { type: String },
    status: { 
        type: String, 
        enum: ['new', 'reviewing', 'shortlisted', 'interview', 'rejected', 'hired'], 
        default: 'new' 
    }
}, { timestamps: true });

module.exports = mongoose.model('Application', appSchema);
