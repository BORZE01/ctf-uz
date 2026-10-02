const ACHIEVEMENTS = [
    { id: 'welcome', name: 'Xush kelibsiz', desc: 'Hisob yaratildi', icon: '🎉', rarity: 'common' },
    { id: 'first_challenge', name: 'Birinchi qadam', desc: 'Birinchi challenge', icon: '👣', rarity: 'common' },
    { id: 'first_blood', name: 'First Blood', desc: 'Birinchi bo\'lib', icon: '🥇', rarity: 'legendary' },
    { id: 'solve_10', name: '10 ta yechim', desc: '10 challenge', icon: '💀', rarity: 'common' },
    { id: 'solve_25', name: '25 ta yechim', desc: '25 challenge', icon: '🔥', rarity: 'uncommon' },
    { id: 'solve_50', name: 'CTF Veteran', desc: '50 challenge', icon: '⚔️', rarity: 'rare' },
    { id: 'solve_100', name: 'Century', desc: '100 challenge', icon: '💯', rarity: 'epic' },
    { id: 'web_5', name: 'Web Hunter', desc: '5 Web', icon: '🌐', rarity: 'uncommon' },
    { id: 'crypto_5', name: 'Crypto Rookie', desc: '5 Crypto', icon: '🔐', rarity: 'uncommon' },
    { id: 'rev_5', name: 'Reverse Beginner', desc: '5 Reverse', icon: '🔍', rarity: 'uncommon' },
    { id: 'forensics_5', name: 'Forensics Detective', desc: '5 Forensics', icon: '🔬', rarity: 'uncommon' },
    { id: 'osint_5', name: 'OSINT Scout', desc: '5 OSINT', icon: '🔎', rarity: 'uncommon' },
    { id: 'pwn_5', name: 'PWN Novice', desc: '5 Pwn', icon: '💥', rarity: 'uncommon' },
    { id: 'streak_7', name: '7 kun streak', desc: '7 kun', icon: '🔥', rarity: 'uncommon' },
    { id: 'streak_30', name: '30 kun streak', desc: '30 kun', icon: '⚡', rarity: 'epic' }
];

async function checkAchievements(user, action, data = {}) {
    const awarded = [];

    const award = (id) => {
        if (!user.achievements) user.achievements = [];
        if (user.achievements.find(a => a.id === id)) return;

        const ach = ACHIEVEMENTS.find(a => a.id === id);
        if (!ach) return;

        user.achievements.push({
            id,
            name: ach.name,
            icon: ach.icon,
            rarity: ach.rarity,
            earnedAt: new Date()
        });

        user.xp = (user.xp || 0) + 100;
        awarded.push(ach);
    };

    if (action === 'register') award('welcome');

    if (action === 'solve') {
        const solvedCount = (user.solvedChallenges || []).length;
        if (solvedCount >= 1) award('first_challenge');
        if (solvedCount >= 10) award('solve_10');
        if (solvedCount >= 25) award('solve_25');
        if (solvedCount >= 50) award('solve_50');
        if (solvedCount >= 100) award('solve_100');

        if (data.isFirstBlood) award('first_blood');

        const cc = user.categoryCounts || {};
        if ((cc['Web'] || 0) >= 5) award('web_5');
        if ((cc['Crypto'] || 0) >= 5) award('crypto_5');
        if ((cc['Reverse'] || 0) >= 5) award('rev_5');
        if ((cc['Forensics'] || 0) >= 5) award('forensics_5');
        if ((cc['OSINT'] || 0) >= 5) award('osint_5');
        if ((cc['Pwn'] || 0) >= 5) award('pwn_5');
    }

    if (action === 'streak') {
        if (user.streak >= 7) award('streak_7');
        if (user.streak >= 30) award('streak_30');
    }

    return awarded;
}

module.exports = { ACHIEVEMENTS, checkAchievements };