const TITLES = [
    { id: 'newbie', name: 'Newbie', icon: '🌱', color: '#94A3B8', requirement: (u) => true },
    { id: 'player', name: 'CTF Player', icon: '🎮', color: '#10B981', requirement: (u) => u.solvedChallenges.length >= 1 },
    { id: 'web_hunter', name: 'Web Hunter', icon: '🌐', color: '#3B82F6', requirement: (u) => countByCategory(u, 'Web') >= 5 },
    { id: 'crypto_wizard', name: 'Crypto Wizard', icon: '🔐', color: '#A855F7', requirement: (u) => countByCategory(u, 'Crypto') >= 5 },
    { id: 'binary_beast', name: 'Binary Beast', icon: '🦾', color: '#EF4444', requirement: (u) => countByCategory(u, 'Reverse') >= 10 },
    { id: 'osint_agent', name: 'OSINT Agent', icon: '🕵️', color: '#F59E0B', requirement: (u) => countByCategory(u, 'OSINT') >= 5 },
    { id: 'forensics_expert', name: 'Forensics Expert', icon: '🔬', color: '#06B6D4', requirement: (u) => countByCategory(u, 'Forensics') >= 10 },
    { id: 'ctf_veteran', name: 'CTF Veteran', icon: '⚔️', color: '#DC2626', requirement: (u) => u.solvedChallenges.length >= 50 },
    { id: 'first_blood', name: 'First Blood', icon: '🥇', color: '#F59E0B', requirement: (u) => (u.achievements || []).some(a => a.id === 'first_blood') },
    { id: 'elite_hacker', name: 'Elite Hacker', icon: '👑', color: '#FBBF24', requirement: (u) => u.solvedChallenges.length >= 100 },
    { id: 'national_champion', name: 'Milliy chempion', icon: '🇺🇿', color: '#10B981', requirement: (u) => (u.achievements || []).some(a => a.id === 'national_champion') }
];

function countByCategory(user, category) {
    // Bu funksiya challenges mapiga muhtoj
    return (user.categoryCounts || {})[category] || 0;
}

// Foydalanuvchi uchun ochilgan title larni olish
function getAvailableTitles(user) {
    return TITLES.filter(t => {
        try {
            return t.requirement(user);
        } catch {
            return false;
        }
    }).map(t => ({
        id: t.id,
        name: t.name,
        icon: t.icon,
        color: t.color
    }));
}

module.exports = { TITLES, getAvailableTitles };