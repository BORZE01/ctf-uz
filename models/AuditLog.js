const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    adminUsername: { type: String, required: true, index: true },

    action: { type: String, required: true, index: true },

    targetType: { type: String, default: '' },
    targetId: { type: String, default: '' },

    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    before: { type: mongoose.Schema.Types.Mixed, default: null },
    after: { type: mongoose.Schema.Types.Mixed, default: null },

    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },

    createdAt: { type: Date, default: Date.now, index: true, expires: '180d' }
}, { timestamps: false });

auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);