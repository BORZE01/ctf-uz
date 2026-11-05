const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
    employer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    employerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employer', required: true },
    applicantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    coverLetter: { type: String },
    portfolioSnapshot: { type: mongoose.Schema.Types.Mixed },
    status: { type: String, enum: ['submitted', 'reviewed', 'accepted', 'rejected', 'withdrawn'], default: 'submitted' },
    createdAt: { type: Date, default: Date.now }
});
// 1 ta user 1 ta vakansiyaga 1 marta topshira oladi
ApplicationSchema.index({ jobId: 1, applicantId: 1 }, { unique: true });

module.exports = mongoose.model('Application', ApplicationSchema);