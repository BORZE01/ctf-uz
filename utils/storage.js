const bcrypt = require('bcryptjs');
const { loadFromFile } = require('./persistence');

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;

// ══════════════════════════════════════════
// ENV MAJBURIY
// ══════════════════════════════════════════
if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
    console.error('❌ ADMIN_USERNAME yoki ADMIN_PASSWORD .env da yo\'q!');
    console.error('   .env fayliga qo\'shing:');
    console.error('   ADMIN_USERNAME=jasur7');
    console.error('   ADMIN_PASSWORD=Kuchli@Parol123');
    process.exit(1);
}

// ══════════════════════════════════════════
// USERS
// ══════════════════════════════════════════
const users = loadFromFile('users', []);

// Admin bo'lmasa — yaratish
if (!users.find(u => u.username === process.env.ADMIN_USERNAME)) {
    const adminPasswordHash = bcrypt.hashSync(process.env.ADMIN_PASSWORD, BCRYPT_ROUNDS);
    users.push({
        id: 0,
        name: 'Administrator',
        username: process.env.ADMIN_USERNAME,
        phone: '998900000000',
        email: 'admin@ctf.uz',
        password: adminPasswordHash,
        avatar: null,
        bio: 'CTF.UZ administratori',
        region: 'Toshkent shahri',
        city: 'Toshkent',
        district: '',
        role: 'super_admin',
        verified: true,
        banned: false,
        score: 0,
        xp: 0,
        cyberLevel: 1,
        solvedChallenges: [],
        skills: { web: 0, pwn: 0, rev: 0, crypto: 0, forensics: 0, osint: 0, linux: 0, networking: 0, cloud: 0, blue: 0 },
        battleRating: 1000,
        streak: 0,
        lastActive: new Date(),
        preferredRoles: [],
        openToOpportunities: false,
        achievements: [],
        activity: [],
        categoryCounts: {},
        analytics: { solved: 0, attempted: 0, successRate: 0 },
        isFake: false,
        createdAt: new Date()
    });
}

// ══════════════════════════════════════════
// CHALLENGES
// ══════════════════════════════════════════
let challenges = loadFromFile('challenges', null);
if (!challenges) {
    challenges = [
        {
            id: 1,
            title: "Cyber Ministry Incident #042",
            story: "Toshkentdagi fictional fintech kompaniyasining payment API'sida shubhali trafik aniqlangan.",
            objective: "Buzilgan akkauntni toping.",
            category: "Web",
            difficulty: "Easy",
            points: 100,
            flag: "CTF{sql_injection_basics}",
            hints: [
                { text: "Login formasidagi SQL injection", cost: 20 },
                { text: "' OR '1'='1", cost: 30 }
            ],
            evidence: ["API logs", "Source code"],
            ratings: [],
            avgRating: 0,
            author: "admin",
            solves: 0,
            createdAt: new Date()
        },
        {
            id: 2,
            title: "University Portal Breach",
            story: "Universitet portalida XSS zaifligi aniqlandi.",
            objective: "XSS zaifligini toping va exploit qiling.",
            category: "Web",
            difficulty: "Medium",
            points: 200,
            flag: "CTF{xss_script_alert}",
            hints: [{ text: "Comment maydoniga e'tibor bering", cost: 40 }],
            evidence: ["Portal source"],
            ratings: [],
            avgRating: 0,
            author: "admin",
            solves: 0,
            createdAt: new Date()
        },
        {
            id: 3,
            title: "RSA Key Recovery",
            story: "Davlat tashkilotining shifrlangan xabarlari zaif RSA kaliti bilan himoyalangan.",
            objective: "Zaif RSA kalitini buzing.",
            category: "Crypto",
            difficulty: "Hard",
            points: 300,
            flag: "CTF{rsa_weak_key}",
            hints: [{ text: "Kichik e soni", cost: 60 }],
            evidence: ["public.pem"],
            ratings: [],
            avgRating: 0,
            author: "admin",
            solves: 0,
            createdAt: new Date()
        },
        {
            id: 4,
            title: "Forensics: Rasm Sirri",
            story: "Rasm ichida yashiringan ma'lumotni toping.",
            objective: "Rasm ichida yashiringan flagni toping.",
            category: "Forensics",
            difficulty: "Medium",
            points: 150,
            flag: "CTF{stego_image_hidden}",
            hints: [{ text: "strings buyrug'i", cost: 30 }],
            evidence: ["image.jpg"],
            ratings: [],
            avgRating: 0,
            author: "admin",
            solves: 0,
            createdAt: new Date()
        },
        {
            id: 5,
            title: "Reverse: Binary Secret",
            story: "Binary faylda yashirin flag mavjud.",
            objective: "Binary faylni tahlil qilib, flagni toping.",
            category: "Reverse",
            difficulty: "Hard",
            points: 400,
            flag: "CTF{reverse_binary_secret}",
            hints: [{ text: "Ghidra ishlatib ko'ring", cost: 80 }],
            evidence: ["binary"],
            ratings: [],
            avgRating: 0,
            author: "admin",
            solves: 0,
            createdAt: new Date()
        }
    ];
}

// ══════════════════════════════════════════
// SUBMISSIONS
// ══════════════════════════════════════════
const submissions = loadFromFile('submissions', []);

// ══════════════════════════════════════════
// VERIFICATION CODES
// ══════════════════════════════════════════
const verificationCodes = {};

// ══════════════════════════════════════════
// SKILL CATEGORIES
// ══════════════════════════════════════════
const skillCategories = [
    { id: 'web', name: 'Web Exploitation', icon: '🌐' },
    { id: 'pwn', name: 'Binary Exploitation', icon: '💥' },
    { id: 'rev', name: 'Reverse Engineering', icon: '🔍' },
    { id: 'crypto', name: 'Cryptography', icon: '🔐' },
    { id: 'forensics', name: 'Digital Forensics', icon: '🧪' },
    { id: 'osint', name: 'OSINT', icon: '🕵️' }
];

// ══════════════════════════════════════════
// LEARNING PATHS
// ══════════════════════════════════════════
const learningPaths = [
    { id: 1, level: 0, title: "Cyber Basics", description: "Kiberxavfsizlik asoslari", lessons: 8, duration: "2 soat", icon: "🔰" },
    { id: 2, level: 1, title: "Linux Fundamentals", description: "Linux buyruqlari", lessons: 12, duration: "4 soat", icon: "🐧" },
    { id: 3, level: 2, title: "Networking", description: "Tarmoq asoslari", lessons: 10, duration: "5 soat", icon: "📡" },
    { id: 4, level: 3, title: "Web Security", description: "Web zaifliklari", lessons: 15, duration: "8 soat", icon: "🌐" },
    { id: 5, level: 4, title: "Binary Exploitation", description: "Pwn va reverse", lessons: 14, duration: "10 soat", icon: "💥" },
    { id: 6, level: 5, title: "Advanced Cyber", description: "Ilg'or mavzular", lessons: 20, duration: "15 soat", icon: "🚀" }
];

// ══════════════════════════════════════════
// TEAMS
// ══════════════════════════════════════════
const teams = loadFromFile('teams', []);

// ══════════════════════════════════════════
// WRITEUPS
// ══════════════════════════════════════════
const writeups = loadFromFile('writeups', []);

// ══════════════════════════════════════════
// UNIVERSITIES
// ══════════════════════════════════════════
const universities = [
    { id: 1, name: "Toshkent Axborot Texnologiyalari Universiteti", shortName: "TATU" },
    { id: 2, name: "O'zbekiston Milliy Universiteti", shortName: "O'zMU" },
    { id: 3, name: "Toshkent Davlat Texnika Universiteti", shortName: "TDTU" },
    { id: 4, name: "Samarqand Davlat Universiteti", shortName: "SamDU" },
    { id: 5, name: "Inha University in Tashkent", shortName: "INHA" }
];

// ══════════════════════════════════════════
// EVENTS
// ══════════════════════════════════════════
const events = loadFromFile('events', [
    {
        id: 1,
        title: "National CTF 2026",
        type: "national",
        description: "Milliy CTF chempionati",
        startDate: new Date("2026-06-01"),
        endDate: new Date("2026-06-03"),
        participants: 0,
        status: "upcoming",
        icon: "🏆"
    }
]);

// ══════════════════════════════════════════
// COMPANIES
// ══════════════════════════════════════════
const companies = [
    { id: 1, name: "UzCard", slug: "uzcard", industry: "Fintech", location: "Toshkent", description: "To'lov tizimi", verified: true, banned: false, createdAt: new Date() },
    { id: 2, name: "Uzbektelecom", slug: "uzbektelecom", industry: "Telecom", location: "Toshkent", description: "Telekom operatori", verified: true, banned: false, createdAt: new Date() },
    { id: 3, name: "IT Park", slug: "it-park", industry: "Government", location: "Toshkent", description: "IT Park", verified: true, banned: false, createdAt: new Date() }
];

// ══════════════════════════════════════════
// JOBS
// ══════════════════════════════════════════
const jobs = [
    {
        id: 1,
        companyId: 1,
        title: "Cybersecurity Intern",
        location: "Toshkent",
        format: "hybrid",
        level: "internship",
        category: "SOC Analyst",
        description: "Stajyor sifatida ishlash imkoniyati",
        requirements: ["Linux", "Networking", "Python"],
        niceToHave: ["CTF", "Burp Suite"],
        skills: ["Linux", "Networking", "Python"],
        salary: "3-5 mln UZS",
        status: "active",
        featured: true,
        views: 0,
        applications: 0,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date()
    },
    {
        id: 2,
        companyId: 2,
        title: "SOC Analyst",
        location: "Toshkent",
        format: "office",
        level: "junior",
        category: "SOC Analyst",
        description: "SOC markazida tahlilchi",
        requirements: ["SIEM", "Linux", "Networking"],
        niceToHave: ["Python", "CTF"],
        skills: ["SIEM", "Linux", "Networking"],
        salary: "8-12 mln UZS",
        status: "active",
        featured: true,
        views: 0,
        applications: 0,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date()
    },
    {
        id: 3,
        companyId: 3,
        title: "Penetration Tester",
        location: "Toshkent / Remote",
        format: "remote",
        level: "middle",
        category: "Penetration Tester",
        description: "Pentest mutaxassisi",
        requirements: ["Web Security", "Burp Suite", "Linux"],
        niceToHave: ["CTF", "Pwn"],
        skills: ["Web Security", "Burp Suite", "Linux"],
        salary: "15-25 mln UZS",
        status: "active",
        featured: false,
        views: 0,
        applications: 0,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date()
    }
];

// ══════════════════════════════════════════
// CAREER
// ══════════════════════════════════════════
const applications = [];
const savedJobs = {};
const jobAlerts = {};
const careerProfiles = {};

// ══════════════════════════════════════════
// ANNOUNCEMENTS
// ══════════════════════════════════════════
const announcements = loadFromFile('announcements', []);

// ══════════════════════════════════════════
// REPORTS
// ══════════════════════════════════════════
const reports = [];

// ══════════════════════════════════════════
// AUDIT
// ══════════════════════════════════════════
const auditLogs = [];

// ══════════════════════════════════════════
// SETTINGS
// ══════════════════════════════════════════
const settings = {
    xp: { firstBlood: 500, achievement: 100, ctfParticipation: 250 },
    registration: { enabled: true, requireVerification: true },
    maintenance: { enabled: false, message: 'Texnik xizmat' }
};

// ══════════════════════════════════════════
// ROLES
// ══════════════════════════════════════════
const ROLES = {
    super_admin: { name: 'Super Admin', permissions: ['*'] },
    admin: { name: 'Admin', permissions: ['users.view', 'users.edit', 'challenges.view', 'challenges.create', 'events.view', 'reports.view'] },
    moderator: { name: 'Moderator', permissions: ['users.view', 'challenges.view', 'reports.view', 'reports.resolve'] }
};

const customAchievements = [];
const customTitles = [];
const achievements = [];

// ══════════════════════════════════════════
// EXPORTS
// ══════════════════════════════════════════
module.exports = {
    users, challenges, submissions, verificationCodes,
    skillCategories, learningPaths, teams, writeups,
    universities, events, companies, jobs,
    applications, savedJobs, jobAlerts, careerProfiles,
    announcements, reports, auditLogs, settings,
    ROLES, customAchievements, customTitles, achievements
};