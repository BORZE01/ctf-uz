const User = require('../models/User');
const Certificate = require('../models/Certificate');
const SkillEvidence = require('../models/SkillEvidence');

// ══════════════════════════════════════════
// Cyber ID ma'lumotlarini yig'ish
// ══════════════════════════════════════════
async function getCyberIdData(userId, isOwner = false) {
    const user = await User.findById(userId)
        .select('-password -backupCodes')
        .lean();
    
    if (!user) return null;

    // Sertifikatlar
    const certificates = await Certificate.find({
        userId,
        status: 'active'
    })
        .select('certificateId type title issuedAt expiresAt status sourceType sourceName')
        .sort({ issuedAt: -1 })
        .lean();

    // Skill evidence
    const skillEvidence = await SkillEvidence.find({
        userId
    })
        .sort({ createdAt: -1 })
        .lean();

    // Ko'nikmalar aggregatsiyasi
    const skillsMap = new Map();
    skillEvidence.forEach(ev => {
        const key = ev.skillKey;
        const existing = skillsMap.get(key);
        const levelRank = { learning: 1, practiced: 2, verified: 3 };
        
        if (!existing) {
            skillsMap.set(key, {
                key,
                label: ev.skillLabel,
                level: ev.level,
                status: ev.status,
                evidenceCount: 1,
                sources: [{
                    type: ev.evidenceType,
                    name: ev.sourceName,
                    level: ev.level,
                    earnedAt: ev.createdAt
                }]
            });
        } else {
            existing.evidenceCount++;
            existing.sources.push({
                type: ev.evidenceType,
                name: ev.sourceName,
                level: ev.level,
                earnedAt: ev.createdAt
            });
            if (levelRank[ev.level] > levelRank[existing.level]) {
                existing.level = ev.level;
            }
        }
    });
    const skills = Array.from(skillsMap.values());

    // Stats
    const solvedCount = (user.solvedChallenges || []).length;
    const verifiedSkills = skills.filter(s => s.level === 'verified').length;
    const practicedSkills = skills.filter(s => s.level === 'practiced').length;

    // Global rank
    const globalRank = await User.countDocuments({
        score: { $gt: user.score || 0 },
        verified: true
    }) + 1;

    // Base data (hammaga)
    const base = {
        id: user._id.toString(),
        slug: user.cyberId?.slug || user.username,
        username: user.username,
        name: user.name,
        avatar: user.avatar,
        headline: user.cyberId?.headline || '',
        region: user.region,
        city: user.city,
        cyberLevel: user.cyberLevel || 1,
        score: user.score || 0,
        xp: user.xp || 0,
        rank: user.rank || { name: 'Rookie', icon: '🌱' },
        globalRank,
        skills,
        stats: {
            solved: solvedCount,
            certificates: certificates.length,
            verifiedSkills,
            practicedSkills,
            totalSkills: skills.length,
            rank: globalRank
        },
        certificates: certificates.map(c => ({
            id: c._id.toString(),
            certificateId: c.certificateId,
            type: c.type,
            title: c.title,
            issuedAt: c.issuedAt,
            expiresAt: c.expiresAt,
            status: c.status,
            sourceType: c.sourceType,
            sourceName: c.sourceName,
            verifyUrl: `/certificate-verify?id=${c.certificateId}`
        })),
        openToOpportunities: user.cyberId?.openToOpportunities || false,
        preferredRoles: user.cyberId?.preferredRoles || [],
        portfolioLinks: user.cyberId?.portfolioLinks || [],
        visibility: user.cyberId?.visibility || 'public',
        createdAt: user.createdAt
    };

    // Owner uchun qo'shimcha
    if (isOwner) {
        base.email = user.email;
        base.phone = user.phone;
        base.bio = user.bio;
        base.github = user.github;
        base.telegram = user.telegram;
        base.website = user.website;
        base.activity = user.activity || [];
        base.analytics = user.analytics || { solved: 0, attempted: 0, successRate: 0 };
        base.battleRating = user.battleRating || 1000;
        base.battleWins = user.battleWins || 0;
        base.battleLosses = user.battleLosses || 0;
        base.streak = user.streak || 0;
        base.achievements = user.achievements || [];
    } else {
        // Public uchun — privacy check
        if (user.cyberId?.visibility === 'private') {
            return { 
                ...base, 
                hidden: true,
                message: 'Bu profil maxfiy'
            };
        }
        if (user.bio) base.bio = user.bio;
        if (user.github) base.github = user.github;
        if (user.telegram) base.telegram = user.telegram;
        if (user.website) base.website = user.website;
        base.battleRating = user.battleRating || 1000;
        base.streak = user.streak || 0;
        base.achievements = user.achievements || [];
    }

    return base;
}

// ══════════════════════════════════════════
// Skill Evidence qo'shish
// ══════════════════════════════════════════
async function addSkillEvidence(userId, skillKey, skillLabel, evidenceType, sourceId, sourceName, level = 'practiced') {
    try {
        const evidence = await SkillEvidence.findOneAndUpdate(
            { userId, skillKey: skillKey.toLowerCase(), sourceId },
            {
                userId,
                skillKey: skillKey.toLowerCase(),
                skillLabel,
                evidenceType,
                sourceId,
                sourceName,
                level,
                status: level === 'verified' ? 'verified' : 'earned',
                verifiedAt: level === 'verified' ? new Date() : null
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        return evidence;
    } catch (e) {
        if (e.code === 11000) return null;
        throw e;
    }
}

module.exports = {
    getCyberIdData,
    addSkillEvidence
};
