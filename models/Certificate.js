const mongoose = require('mongoose');
const crypto = require('crypto');

const certificateSchema = new mongoose.Schema({
    certificateId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['course', 'competition', 'skill'],
        required: true
    },
    title: {
        type: String,
        required: true,
        maxlength: 160
    },
    issuer: {
        type: String,
        default: 'CTF.UZ'
    },
    issuedAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    expiresAt: Date,
    status: {
        type: String,
        enum: ['active', 'revoked', 'expired'],
        default: 'active',
        index: true
    },
    sourceType: {
        type: String,
        enum: ['course', 'competition', 'assessment'],
        required: true
    },
    sourceId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    // Verifikatsiya
    verificationHash: String,
    revokedAt: Date,
    revokedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    revokeReason: String,
    // Public ma'lumotlar
    publicName: String,
    publicShowRealName: { type: Boolean, default: true }
}, { timestamps: true });

// Auto-generate certificateId

// Auto-generate certificateId — pre('validate') (validatsiyadan OLDIN)
certificateSchema.pre('validate', function(next) {
    if (!this.certificateId) {
        const random = crypto.randomBytes(4).toString('hex').toUpperCase();
        const year = new Date().getFullYear();
        this.certificateId = `CTF-${year}-${random}`;
    }
    if (!this.issuedAt) {
        this.issuedAt = new Date();
    }
    if (!this.verificationHash && this.certificateId && this.userId) {
        this.verificationHash = crypto
            .createHash('sha256')
            .update(this.certificateId + this.userId.toString() + this.issuedAt.toISOString())
            .digest('hex');
    }
    next();
});

//Indexes
certificateSchema.index({ userId: 1, status: 1 });
certificateSchema.index({ issuedAt: -1 });

// Virtual: isActive
certificateSchema.virtual('isActive').get(function() {
    if (this.status !== 'active') return false;
    if (this.expiresAt && new Date() > this.expiresAt) return false;
    return true;
});

module.exports = mongoose.model('Certificate', certificateSchema);
