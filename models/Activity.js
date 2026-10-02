const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
        type: String,
        enum: ['solve', 'achievement', 'rank_up', 'team_join', 'battle', 'login'],
        required: true,
        index: true
    },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    icon: { type: String, default: '⚡' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now, index: true, expires: '90d' }
}, { timestamps: false });

activitySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);