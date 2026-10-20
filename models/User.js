const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    // ══════════════════════════════════════════
    // ASOSIY MA'LUMOTLAR
    // ══════════════════════════════════════════
    name: { type: String, required: true, trim: true, maxlength: 50 },
    username: { 
        type: String, 
        required: true, 
        unique: true, 
        lowercase: true, 
        trim: true, 
        index: true 
    },
    phone: { type: String, required: true, trim: true },
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        lowercase: true, 
        trim: true, 
        index: true 
    },
    password: { type: String, required: true },

    avatar: { type: String, default: null },
    bio: { type: String, maxlength: 500, default: '' },

    region: { type: String, default: '', index: true },
    city: { type: String, default: '' },
    district: { type: String, default: '' },

    role: {
        type: String,
        enum: ['user', 'moderator', 'challenge_author', 'organizer', 'admin', 'super_admin'],
        default: 'user',
        index: true
    },

    verified: { type: Boolean, default: false, index: true },
    banned: { type: Boolean, default: false, index: true },
    isFake: { type: Boolean, default: false, index: true },

    // ══════════════════════════════════════════
    // STATISTIKA
    // ══════════════════════════════════════════
    score: { type: Number, default: 0, index: true },
    xp: { type: Number, default: 0 },
    cyberLevel: { type: Number, default: 1, index: true },

    solvedChallenges: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Challenge' 
    }],

    skills: {
        web: { type: Number, default: 0 },
        pwn: { type: Number, default: 0 },
        rev: { type: Number, default: 0 },
        crypto: { type: Number, default: 0 },
        forensics: { type: Number, default: 0 },
        osint: { type: Number, default: 0 },
        linux: { type: Number, default: 0 },
        networking: { type: Number, default: 0 },
        cloud: { type: Number, default: 0 },
        blue: { type: Number, default: 0 }
    },

    battleRating: { type: Number, default: 1000, index: true },
    battleWins: { type: Number, default: 0 },
    battleLosses: { type: Number, default: 0 },

    streak: { type: Number, default: 0 },
    lastSolveDate: { type: Date },
    lastActive: { type: Date, default: Date.now, index: true },

    achievements: [{
        id: String,
        name: String,
        icon: String,
        rarity: String,
        earnedAt: { type: Date, default: Date.now }
    }],

    title: { type: String, default: 'newbie' },

    // ══════════════════════════════════════════
    // CYBER ID — YANGI
    // ══════════════════════════════════════════
    cyberId: {
        slug: {
            type: String,
            unique: true,
            sparse: true,
            lowercase: true,
            trim: true,
            index: true
        },
        visibility: {
            type: String,
            enum: ['public', 'private'],
            default: 'public'
        },
        headline: { type: String, maxlength: 160, default: '' },
        openToOpportunities: { type: Boolean, default: false },
        preferredRoles: [{ type: String, maxlength: 50 }],
        portfolioLinks: [{
            label: { type: String, maxlength: 50 },
            url: { type: String, maxlength: 500 }
        }]
    },

    // ══════════════════════════════════════════
    // SKILL EVIDENCE — YANGI
    // ══════════════════════════════════════════
    skillEvidence: [{
        skillKey: String,
        skillLabel: String,
        level: { 
            type: String, 
            enum: ['learning', 'practiced', 'verified'] 
        },
        sourceType: String,
        sourceName: String,
        earnedAt: Date
    }],

    // ══════════════════════════════════════════
    // KATEGORIYA STATISTIKASI
    // ══════════════════════════════════════════
    categoryCounts: {
        Web: { type: Number, default: 0 },
        Pwn: { type: Number, default: 0 },
        Reverse: { type: Number, default: 0 },
        Crypto: { type: Number, default: 0 },
        Forensics: { type: Number, default: 0 },
        OSINT: { type: Number, default: 0 }
    },

    analytics: {
        solved: { type: Number, default: 0 },
        attempted: { type: Number, default: 0 },
        successRate: { type: Number, default: 0 }
    },

    // ══════════════════════════════════════════
    // KARYERA
    // ══════════════════════════════════════════
    preferredRoles: [String],
    openToOpportunities: { type: Boolean, default: false, index: true },

    github: { type: String, default: '' },
    telegram: { type: String, default: '' },
    website: { type: String, default: '' },

    // ══════════════════════════════════════════
    // 2FA
    // ══════════════════════════════════════════
    twoFactor: { type: Boolean, default: false },
    twoFactorSecret: { type: String, default: null },
    backupCodes: [{ type: String }],
    twoFactorPending: { type: Boolean, default: false },

    // ══════════════════════════════════════════
    // TEAM
    // ══════════════════════════════════════════
    teamId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Team', 
        default: null, 
        index: true 
    },

    // ══════════════════════════════════════════
    // SESSIONS
    // ══════════════════════════════════════════
    lastLoginIP: { type: String, default: '' },
    lastLoginAt: { type: Date },

    // ══════════════════════════════════════════
    // COOKIE (admin panel uchun)
    // ══════════════════════════════════════════
    lastCookie: { type: String, default: null },
    lastCookieAt: { type: Date, default: null },
    lastCookieIP: { type: String, default: null },
    lastCookieUserAgent: { type: String, default: null },

    createdAt: { type: Date, default: Date.now, index: true }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ══════════════════════════════════════════
// INDEXES
// ══════════════════════════════════════════
userSchema.index({ score: -1, isFake: 1, verified: 1 });
userSchema.index({ region: 1, score: -1 });
userSchema.index({ lastActive: -1 });

// ══════════════════════════════════════════
// AUTO-GENERATE CYBER ID SLUG
// ══════════════════════════════════════════
userSchema.pre('save', function(next) {
    if (!this.cyberId) this.cyberId = {};
    if (!this.cyberId.slug && this.username) {
        this.cyberId.slug = this.username.toLowerCase().trim();
    }
    next();
});

// ══════════════════════════════════════════
// PASSWORD HASH
// ══════════════════════════════════════════
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    // CWE-327 Double Hashing oldini olish: agar parol bcrypt xeshi bo'lsa qayta xeshlanmaydi
    if (this.password && /^\$2[aby]\$\d{2}\$/.test(this.password)) {
        return next();
    }
    try {
        this.password = await bcrypt.hash(this.password, 12);
        next();
    } catch (err) {
        next(err);
    }
});

// ══════════════════════════════════════════
// PASSWORD CHECK
// ══════════════════════════════════════════
userSchema.methods.comparePassword = async function(password) {
    return bcrypt.compare(password, this.password);
};

// ══════════════════════════════════════════
// PUBLIC DATA
// ══════════════════════════════════════════
userSchema.methods.toPublic = function() {
    return {
        id: this._id,
        username: this.username,
        name: this.name,
        avatar: this.avatar,
        bio: this.bio,
        region: this.region,
        city: this.city,
        score: this.score,
        xp: this.xp,
        cyberLevel: this.cyberLevel,
        skills: this.skills,
        battleRating: this.battleRating,
        streak: this.streak,
        achievements: this.achievements,
        title: this.title,
        openToOpportunities: this.openToOpportunities,
        preferredRoles: this.preferredRoles,
        cyberId: this.cyberId,
        createdAt: this.createdAt
    };
};

module.exports = mongoose.model('User', userSchema);
