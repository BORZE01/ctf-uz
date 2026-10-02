const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    type: {
        type: String,
        enum: [
            'challenge_solved', 'achievement_earned', 'rank_changed',
            'event_started', 'job_match', 'application_update',
            'team_invitation', 'admin_message', 'system'
        ],
        required: true,
        index: true
    },

    title: { type: String, required: true },
    message: { type: String, default: '' },
    link: { type: String, default: null },

    icon: { type: String, default: '🔔' },

    read: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },

    // Push channels
    sentEmail: { type: Boolean, default: false },
    sentTelegram: { type: Boolean, default: false },

    createdAt: { type: Date, default: Date.now, index: true, expires: '30d' }
}, { timestamps: true });

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);