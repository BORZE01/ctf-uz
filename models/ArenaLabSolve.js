const mongoose = require('mongoose');

const arenaLabSolveSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  labSlug: { type: String, required: true, enum: ['linux-privesc', 'codenest-linux-privesc', 'windows-privesc', 'uac-bypass'] },
  pointsAwarded: { type: Number, required: true, min: 0 },
  flagDigest: { type: String, required: true, select: false },
  solvedAt: { type: Date, default: Date.now }
}, { timestamps: true });

arenaLabSolveSchema.index({ userId: 1, labSlug: 1 }, { unique: true });

module.exports = mongoose.models.ArenaLabSolve || mongoose.model('ArenaLabSolve', arenaLabSolveSchema);
