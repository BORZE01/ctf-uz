const User = require('../models/User');
const Challenge = require('../models/Challenge');
const Submission = require('../models/Submission');
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
        .select('certificateId type title issuedAt expiresAt status')
        .sort({ issuedAt: -1 })
        .lean();

    // Skill evidence
    const skillEvidence = await SkillEvidence.find({
        userId,
        status: { $in: ['earned', 'verified'] }
    })
        .sort({ createdAt: -1 })
        .lean();

    // Ko'nikmalar aggregatsiyasi
    const skillsMap = new Map();
    skillEvidence.forEach(ev => {
        const key = ev.skillKey;
        const existing = skillsMap.get(key);
        const levelRank = { learning: 1, practiced: 2, verified: 3 };
        
        if (!existing || levelRank[ev.level] > levelRank[existing.level]) {
            skillsMap.set(key, {
                key,
                label: ev.skillLabel,
                level: ev.level,
                evidenceCount: (existing?.evidenceCount || 0) + 1,
                sources: [...(existing?.sources || []), {
                    type: ev.evidenceType,
                    name: ev.sourceName
                }]
            });
        } else {
            existing.evidenceCount++;
            existing.sources.push({ type: ev.evidenceType, name: ev.sourceName });
        }
    });
    const skills = Array.from(skillsMap.values());

    // Stats
    const solvedCount = (user.solvedChallenges || []).length;
    const verifiedSkills = skills.filter(s => s.level === 'verified').length;

    // Global rank
    const globalRank = await User.countDocuments({
        score: { $gt: user.score || 0 },
        verified: true
    }) + 1;

    // Public yoki owner uchun turli ma'lumotlar
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
            rank: globalRank
        },
        certificates: certificates.map(c => ({
            certificateId: c.certificateId,
            type: c.type,
            title: c.title,
            issuedAt: c.issuedAt,
            expiresAt: c.expiresAt,
            status: c.status
        })),
        openToOpportunities: user.cyberId?.openToOpportunities || false,
        preferredRoles: user.cyberId?.preferredRoles || [],
        createdAt: user.createdAt
    };

    // Owner uchun qo'shimcha
    if (isOwner) {
        base.email = user.email;
        base.phone = user.phone;
        base.bio = user.bio;
        base.visibility = user.cyberId?.visibility || 'public';
        base.portfolioLinks = user.cyberId?.portfolioLinks || [];
        base.activity = user.activity || [];
        base.analytics = user.analytics || { solved: 0, attempted: 0, successRate: 0 };
    } else {
        // Public uchun bio
        if (user.cyberId?.visibility === 'private') {
            return { 
                ...base, 
                hidden: true,
                message: 'Bu profil maxfiy'
            };
        }
        if (user.bio) base.bio = user.bio;
        base.portfolioLinks = user.cyberId?.portfolioLinks || [];
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
        // Duplicate key — ignore
        if (e.code === 11000) return null;
        throw e;
    }
}

module.exports = {
    getCyberIdData,
    addSkillEvidence
};
