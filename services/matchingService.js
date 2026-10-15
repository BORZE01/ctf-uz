const Certificate = require('../models/Certificate');
const SkillEvidence = require('../models/SkillEvidence');

// ══════════════════════════════════════════
// SKILL NORMALIZATION — bir xil ko'rinishga
// ══════════════════════════════════════════
function normalizeSkill(skill) {
    if (!skill) return '';
    return String(skill)
        .toLowerCase()
        .trim()
        .replace(/[\s_\-]+/g, '');
}

// Skill synonyms
const SKILL_ALIASES = {
    'websecurity': ['web', 'websec', 'websecurity'],
    'networksecurity': ['network', 'networking', 'netsec'],
    'python': ['py', 'python3'],
    'javascript': ['js', 'nodejs', 'node'],
    'linux': ['unix', 'linuxos'],
    'penetrationtesting': ['pentest', 'pentesting', 'pentest'],
    'reverseengineering': ['reverse', 'reversing', 'rev'],
    'cryptography': ['crypto'],
    'forensics': ['digitalforensics', 'forensic'],
    'osint': ['intelligence', 'opensource'],
    'siem': ['splunk', 'elk', 'elkstack'],
    'cloud': ['aws', 'azure', 'gcp'],
};

// Expand synonyms
function expandSkill(skill) {
    const normalized = normalizeSkill(skill);
    const aliases = new Set([normalized]);
    
    for (const [canonical, alts] of Object.entries(SKILL_ALIASES)) {
        if (canonical === normalized || alts.includes(normalized)) {
            aliases.add(canonical);
            alts.forEach(a => aliases.add(a));
        }
    }
    
    return Array.from(aliases);
}

// ══════════════════════════════════════════
// USER SKILLS ni yig'ish
// ══════════════════════════════════════════
async function getUserSkills(userId) {
    const skills = new Map();

    // 1. Skill Evidence — verified/practiced
    const evidence = await SkillEvidence.find({
        userId,
        status: { $in: ['earned', 'verified'] }
    }).lean();

    evidence.forEach(ev => {
        const key = normalizeSkill(ev.skillKey);
        const existing = skills.get(key);
        const levelRank = { learning: 1, practiced: 2, verified: 3 };
        
        if (!existing || levelRank[ev.level] > levelRank[existing.level]) {
            skills.set(key, {
                key: ev.skillKey,
                normalized: key,
                level: ev.level,
                verified: ev.level === 'verified',
                source: ev.sourceName
            });
        }
    });

    // 2. Sertifikatlar bo'yicha (skill sertifikatlari)
    const certificates = await Certificate.find({
        userId,
        type: 'skill',
        status: 'active'
    }).lean();

    certificates.forEach(cert => {
        const key = normalizeSkill(cert.title);
        if (!skills.has(key)) {
            skills.set(key, {
                key: cert.title,
                normalized: key,
                level: 'verified',
                verified: true,
                source: 'Certificate'
            });
        }
    });

    return Array.from(skills.values());
}

// ══════════════════════════════════════════
// MATCH HISOBLASH
// ══════════════════════════════════════════
function calculateSkillMatch(userSkills, job) {
    // User skills — normalized set
    const userSkillSet = new Set();
    userSkills.forEach(s => {
        expandSkill(s.key).forEach(alias => userSkillSet.add(alias));
    });

    const required = (job.requiredSkills || []).map(s => ({
        original: s,
        normalized: normalizeSkill(s)
    }));
    const optional = (job.optionalSkills || []).map(s => ({
        original: s,
        normalized: normalizeSkill(s)
    }));

    // Required match
    const requiredMatched = required.filter(r => 
        expandSkill(r.original).some(a => userSkillSet.has(a))
    );
    const missingRequired = required.filter(r => 
        !expandSkill(r.original).some(a => userSkillSet.has(a))
    );

    // Optional match
    const optionalMatched = optional.filter(o => 
        expandSkill(o.original).some(a => userSkillSet.has(a))
    );
    const missingOptional = optional.filter(o => 
        !expandSkill(o.original).some(a => userSkillSet.has(a))
    );

    // Weights: required=2, optional=1
    const totalWeight = required.length * 2 + optional.length;
    const matchedWeight = requiredMatched.length * 2 + optionalMatched.length;
    
    const score = totalWeight > 0 
        ? Math.round((matchedWeight / totalWeight) * 100)
        : 0;

    // Penalty: agar majburiy skill yo'q bo'lsa
    const hasAllRequired = missingRequired.length === 0;

    return {
        score,
        hasAllRequired,
        requiredMatched: requiredMatched.map(r => r.original),
        missingRequired: missingRequired.map(r => r.original),
        optionalMatched: optionalMatched.map(o => o.original),
        missingOptional: missingOptional.map(o => o.original),
        totalRequired: required.length,
        totalOptional: optional.length
    };
}

// ══════════════════════════════════════════
// TO'LIQ MATCH — Job uchun
// ══════════════════════════════════════════
async function calculateFullMatch(userId, job) {
    const userSkills = await getUserSkills(userId);
    const match = calculateSkillMatch(userSkills, job);

    // Bonus omillar
    const bonuses = [];

    // Cyber Level bonus
    const User = require('../models/User');
    const user = await User.findById(userId).select('cyberLevel score').lean();
    
    if (user) {
        if (user.cyberLevel >= 10) bonuses.push({ type: 'level', value: 5, label: 'Yuqori Cyber Level' });
        else if (user.cyberLevel >= 5) bonuses.push({ type: 'level', value: 3, label: 'Yaxshi Cyber Level' });
    }

    // Sertifikat bonus
    const certCount = await Certificate.countDocuments({
        userId,
        status: 'active'
    });
    if (certCount >= 3) bonuses.push({ type: 'certificates', value: 3, label: `${certCount} ta sertifikat` });

    const bonusScore = bonuses.reduce((sum, b) => sum + b.value, 0);
    const finalScore = Math.min(100, match.score + bonusScore);

    return {
        ...match,
        score: finalScore,
        baseScore: match.score,
        bonuses,
        userSkillsCount: userSkills.length
    };
}

module.exports = {
    normalizeSkill,
    expandSkill,
    getUserSkills,
    calculateSkillMatch,
    calculateFullMatch
};
