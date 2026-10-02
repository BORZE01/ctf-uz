// Skill mapping
const SKILL_MAP = {
    'Web': 'web',
    'Pwn': 'pwn',
    'Reverse': 'rev',
    'Crypto': 'crypto',
    'Forensics': 'forensics',
    'OSINT': 'osint'
};

const DIFFICULTY_MULTIPLIER = {
    'Easy': 1,
    'Medium': 1.5,
    'Hard': 2,
    'Expert': 3
};

function calculateSkillPoints(challenge) {
    const base = challenge.points / 10;
    const multiplier = DIFFICULTY_MULTIPLIER[challenge.difficulty] || 1;
    return base * multiplier;
}

function getSkillRank(score) {
    if (score >= 90) return 'Expert';
    if (score >= 75) return 'Advanced';
    if (score >= 50) return 'Intermediate';
    if (score >= 25) return 'Beginner';
    return 'Novice';
}

module.exports = {
    SKILL_MAP,
    DIFFICULTY_MULTIPLIER,
    calculateSkillPoints,
    getSkillRank
};