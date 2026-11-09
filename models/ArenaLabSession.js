const mongoose = require('mongoose');

const terminalEntrySchema = new mongoose.Schema({
  kind: { type: String, enum: ['system', 'command', 'clear'], default: 'command' },
  command: { type: String, default: '', maxlength: 180 },
  output: { type: String, default: '', maxlength: 8000 },
  prompt: { type: String, default: '', maxlength: 160 },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const arenaLabSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  labSlug: { type: String, required: true, enum: ['linux-privesc', 'codenest-linux-privesc', 'windows-privesc', 'uac-bypass'], index: true },
  status: { type: String, enum: ['running', 'paused', 'stopped', 'expired', 'completed'], default: 'running', index: true },
  state: {
    connected: { type: Boolean, default: false },
    elevated: { type: Boolean, default: false },
    serviceConfigured: { type: Boolean, default: false },
    serviceInspected: { type: Boolean, default: false },
    aclInspected: { type: Boolean, default: false },
    uacDefaultConfigured: { type: Boolean, default: false },
    uacDelegateConfigured: { type: Boolean, default: false },
    enumerated: { type: Boolean, default: false },
    exploitPrepared: { type: Boolean, default: false },
    cwd: { type: String, default: '/home/trainee', maxlength: 180 },
    previousCwd: { type: String, default: '', maxlength: 180 },
    objectivesCompleted: { type: [Boolean], default: [false, false, false, false] },
    codenest: {
      currentUser: { type: String, enum: ['kali', 'student', 'devuser', 'root'], default: 'kali' },
      pendingAuth: { type: String, enum: ['', 'devuser'], default: '' },
      cwd: { type: String, default: '/home/kali', maxlength: 180 },
      targetDiscovered: { type: Boolean, default: false },
      sshPortVerified: { type: Boolean, default: false },
      bruteForced: { type: Boolean, default: false },
      rockyouReady: { type: Boolean, default: true },
      flag1Located: { type: Boolean, default: false },
      flag1Read: { type: Boolean, default: false },
      backupInspected: { type: Boolean, default: false },
      devuserAuthenticated: { type: Boolean, default: false },
      flag2Read: { type: Boolean, default: false },
      sudoInspected: { type: Boolean, default: false },
      cronInspected: { type: Boolean, default: false },
      suidInspected: { type: Boolean, default: false },
      cronPayloadInstalled: { type: Boolean, default: false },
      cronTriggered: { type: Boolean, default: false },
      pathHelperCreated: { type: Boolean, default: false },
      pathHelperExecutable: { type: Boolean, default: false },
      pathHijackActive: { type: Boolean, default: false },
      backupToolExecuted: { type: Boolean, default: false },
      bashSuid: { type: Boolean, default: false },
      virtualSeconds: { type: Number, default: 0, min: 0, max: 86400 },
      rootVia: { type: String, enum: ['', 'sudo-find', 'cron', 'suid-path'], default: '' }
    }
  },
  commandCount: { type: Number, default: 0, min: 0, max: 600 },
  terminalHistory: { type: [terminalEntrySchema], default: [] },
  remainingMs: { type: Number, default: null, min: 0 },
  pausedAt: { type: Date, default: null },
  expiresAt: { type: Date, required: true, index: true },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null }
}, { timestamps: true, minimize: false, optimisticConcurrency: true });

// History lives in MongoDB, not in browser storage. TTL removes old records only
// after their retention window; a browser reload or a fresh login never resets a lab.
arenaLabSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 });
arenaLabSessionSchema.index({ userId: 1, labSlug: 1, updatedAt: -1 });
arenaLabSessionSchema.index({ userId: 1, status: 1, expiresAt: 1 });
// At most one actively running lab per account. Paused sessions remain resumable.
arenaLabSessionSchema.index({ userId: 1 }, { unique: true, partialFilterExpression: { status: 'running' } });

module.exports = mongoose.models.ArenaLabSession || mongoose.model('ArenaLabSession', arenaLabSessionSchema);
