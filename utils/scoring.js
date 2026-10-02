// ══════════════════════════════════════════
// SKILL HISOBLASH
// ══════════════════════════════════════════
async function calculateSkillScores(user) {
    const Challenge = require('../models/Challenge');

    const skills = {
        web: 0, pwn: 0, rev: 0, crypto: 0, forensics: 0,
        osint: 0, linux: 0, networking: 0, cloud: 0, blue: 0
    };

    if (!user.solvedChallenges || user.solvedChallenges.length === 0) {
        return skills;
    }

    const solved = await Challenge.find({
        _id: { $in: user.solvedChallenges }
    });

    const categoryMap = {
        'Web': 'web',
        'Pwn': 'pwn',
        'Reverse': 'rev',
        'Crypto': 'crypto',
        'Forensics': 'forensics',
        'OSINT': 'osint'
    };

    const difficultyMultiplier = {
        'Easy': 1,
        'Medium': 1.5,
        'Hard': 2,
        'Expert': 3
    };

    solved.forEach(c => {
        const key = categoryMap[c.category];
        if (key) {
            const mult = difficultyMultiplier[c.difficulty] || 1;
            skills[key] = Math.min(100, skills[key] + (c.points / 10) * mult);
        }
    });

    return skills;
}

// ══════════════════════════════════════════
// CYBER LEVEL
// ══════════════════════════════════════════
const LEVEL_THRESHOLDS = [
    0, 500, 1200, 2000, 3000, 4500, 6500, 9000, 12000, 16000,
    21000, 27000, 34000, 42000, 51000, 61000, 72000, 84000, 97000, 111000
];

function calculateLevel(xp) {
    let level = 1;
    for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
        if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
        else break;
    }
    return level;
}

// ══════════════════════════════════════════
// RANK (getUserRank)
// ══════════════════════════════════════════
function getUserRank(score) {
    if (score >= 10000) return { name: 'Legend', color: '#d4af37', icon: '👑' };
    if (score >= 5000) return { name: 'Master', color: '#00c2ff', icon: '💎' };
    if (score >= 2500) return { name: 'Expert', color: '#9333ea', icon: '⭐' };
    if (score >= 1000) return { name: 'Advanced', color: '#16a34a', icon: '🔥' };
    if (score >= 500) return { name: 'Intermediate', color: '#f5b942', icon: '⚡' };
    if (score >= 100) return { name: 'Beginner', color: '#8892b0', icon: '🌱' };
    return { name: 'Rookie', color: '#4a4a6a', icon: '🔰' };
}

// ══════════════════════════════════════════
// LEVEL PROGRESS
// ══════════════════════════════════════════
function getLevelProgress(xp) {
    const level = calculateLevel(xp);
    const currentThreshold = LEVEL_THRESHOLDS[level - 1] || 0;
    const nextThreshold = LEVEL_THRESHOLDS[level] || (currentThreshold + 10000);
    const progress = ((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100;

    return {
        level,
        currentXP: xp,
        levelStartXP: currentThreshold,
        nextLevelXP: nextThreshold,
        progress: Math.min(100, Math.max(0, progress)),
        remaining: nextThreshold - xp
    };
}

// ══════════════════════════════════════════
// ELO (Battle Rating)
// ══════════════════════════════════════════
function calculateElo(playerRating, opponentRating, result) {
    const K = 32;
    const expected = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
    const actual = result === 'win' ? 1 : result === 'draw' ? 0.5 : 0;
    return Math.round(playerRating + K * (actual - expected));
}

module.exports = {
    calculateSkillScores,
    calculateLevel,
    getUserRank,
    getLevelProgress,
    calculateElo,
    LEVEL_THRESHOLDS
};