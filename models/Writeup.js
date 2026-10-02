const mongoose = require('mongoose');

const writeupSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    challengeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge', required: true, index: true },

    title: { type: String, required: true, maxlength: 200 },
    content: { type: String, required: true, maxlength: 20000 },

    votes: { type: Number, default: 0, index: true },
    voters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    published: { type: Boolean, default: true, index: true },
    featured: { type: Boolean, default: false },

    spoilerProtection: { type: Boolean, default: true },

    views: { type: Number, default: 0 },

    createdAt: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

writeupSchema.index({ challengeId: 1, votes: -1 });

module.exports = mongoose.model('Writeup', writeupSchema);