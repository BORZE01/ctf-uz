const { User, Challenge, University, Company, Job } = require('../models');

async function seedDatabase() {
    try {
        // ══════════════════════════════════════════
        // SUPER ADMIN
        // ══════════════════════════════════════════
        const adminExists = await User.findOne({ role: 'super_admin' });

        if (!adminExists) {
            const adminUsername = process.env.ADMIN_USERNAME || 'jasur7';
            const adminPassword = process.env.ADMIN_PASSWORD || '1657';

            if (!adminUsername || !adminPassword) {
                console.error('❌ ADMIN_USERNAME yoki ADMIN_PASSWORD .env da yo\'q!');
                process.exit(1);
            }

            await User.create({
                name: 'Jasur',
                username: adminUsername,
                phone: '998777010709',
                email: 'jasur7@gmail.com',
                password: adminPassword,
                role: 'super_admin',
                verified: true
            });

            console.log(`✅ Super Admin yaratildi: ${adminUsername}`);
        } else {
            console.log(`ℹ️ Super Admin mavjud: ${adminExists.username}`);
        }

        // ══════════════════════════════════════════
        // CHALLENGES
        // ══════════════════════════════════════════
        const challengeCount = await Challenge.countDocuments();

        if (challengeCount === 0) {
            const admin = await User.findOne({ role: 'super_admin' });

            if (!admin) {
                console.error('❌ Admin topilmadi — challenge yaratib bo\'lmaydi');
                return;
            }

            await Challenge.create([
                {
                    title: "Cyber Ministry Incident #042",
                    story: "Toshkentdagi fintech kompaniyasining API'sida shubhali trafik.",
                    objective: "Buzilgan akkauntni toping.",
                    category: "Web",
                    difficulty: "Easy",
                    points: 100,
                    initialPoints: 100,
                    flag: "CTF{sql_injection_basics}",
                    hints: [
                        { text: "Login formasidagi SQL injection", cost: 20 },
                        { text: "' OR '1'='1", cost: 30 }
                    ],
                    evidence: ["API logs", "Source code"],
                    author: admin._id,
                    status: 'live'
                },
                {
                    title: "University Portal Breach",
                    story: "Universitet portalida XSS zaifligi.",
                    objective: "XSS zaifligini toping.",
                    category: "Web",
                    difficulty: "Medium",
                    points: 200,
                    initialPoints: 200,
                    flag: "CTF{xss_script_alert}",
                    hints: [{ text: "Comment maydoniga e'tibor bering", cost: 40 }],
                    author: admin._id,
                    status: 'live'
                },
                {
                    title: "RSA Key Recovery",
                    story: "Davlat tashkilotining shifrlangan xabarlari.",
                    objective: "Zaif RSA kalitini buzing.",
                    category: "Crypto",
                    difficulty: "Hard",
                    points: 300,
                    initialPoints: 300,
                    flag: "CTF{rsa_weak_key}",
                    hints: [{ text: "Kichik e soni", cost: 60 }],
                    author: admin._id,
                    status: 'live'
                },
                {
                    title: "Forensics: Rasm Sirri",
                    story: "Rasm ichida yashiringan ma'lumot.",
                    objective: "Yashiringan flagni toping.",
                    category: "Forensics",
                    difficulty: "Medium",
                    points: 150,
                    initialPoints: 150,
                    flag: "CTF{stego_image_hidden}",
                    hints: [{ text: "strings buyrug'i", cost: 30 }],
                    author: admin._id,
                    status: 'live'
                },
                {
                    title: "Reverse: Binary Secret",
                    story: "Binary faylda yashirin flag.",
                    objective: "Binary faylni tahlil qiling.",
                    category: "Reverse",
                    difficulty: "Hard",
                    points: 400,
                    initialPoints: 400,
                    flag: "CTF{reverse_binary_secret}",
                    hints: [{ text: "Ghidra ishlatib ko'ring", cost: 80 }],
                    author: admin._id,
                    status: 'live'
                }
            ]);

            console.log('✅ 5 ta challenge yaratildi');
        } else {
            console.log(`ℹ️ ${challengeCount} ta challenge mavjud`);
        }

        // ══════════════════════════════════════════
        // UNIVERSITIES
        // ══════════════════════════════════════════
        const uniCount = await University.countDocuments();

        if (uniCount === 0) {
            await University.create([
                { name: "Toshkent Axborot Texnologiyalari Universiteti", shortName: "TATU", city: "Toshkent" },
                { name: "O'zbekiston Milliy Universiteti", shortName: "O'zMU", city: "Toshkent" },
                { name: "Toshkent Davlat Texnika Universiteti", shortName: "TDTU", city: "Toshkent" },
                { name: "Samarqand Davlat Universiteti", shortName: "SamDU", city: "Samarqand" },
                { name: "Inha University in Tashkent", shortName: "INHA", city: "Toshkent" }
            ]);
            console.log('✅ 5 ta universitet yaratildi');
        } else {
            console.log(`ℹ️ ${uniCount} ta universitet mavjud`);
        }

        // ══════════════════════════════════════════
        // COMPANIES + JOBS
        // ══════════════════════════════════════════
        const companyCount = await Company.countDocuments();

        if (companyCount === 0) {
            const companies = await Company.create([
                { name: "UzCard", industry: "Fintech", location: "Toshkent", verified: true, verificationStatus: 'verified' },
                { name: "Uzbektelecom", industry: "Telecom", location: "Toshkent", verified: true, verificationStatus: 'verified' },
                { name: "IT Park", industry: "Government", location: "Toshkent", verified: true, verificationStatus: 'verified' }
            ]);

            await Job.create([
                {
                    companyId: companies[0]._id,
                    title: "Cybersecurity Intern",
                    description: "Stajyor sifatida ishlash imkoniyati.",
                    location: "Toshkent",
                    format: "hybrid",
                    level: "internship",
                    requirements: ["Linux", "Networking", "Python"],
                    niceToHave: ["CTF", "Burp Suite"],
                    skills: ["Linux", "Networking", "Python"],
                    salary: "3-5 mln UZS",
                    status: 'published',
                    featured: true,
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                },
                {
                    companyId: companies[1]._id,
                    title: "SOC Analyst",
                    description: "SOC markazida tahlilchi.",
                    location: "Toshkent",
                    format: "office",
                    level: "junior",
                    requirements: ["SIEM", "Linux", "Networking"],
                    niceToHave: ["Python", "CTF"],
                    skills: ["SIEM", "Linux", "Networking"],
                    salary: "8-12 mln UZS",
                    status: 'published',
                    featured: true,
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                },
                {
                    companyId: companies[2]._id,
                    title: "Penetration Tester",
                    description: "Pentest mutaxassisi.",
                    location: "Toshkent / Remote",
                    format: "remote",
                    level: "middle",
                    requirements: ["Web Security", "Burp Suite", "Linux"],
                    niceToHave: ["CTF", "Pwn"],
                    skills: ["Web Security", "Burp Suite", "Linux"],
                    salary: "15-25 mln UZS",
                    status: 'published',
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                }
            ]);

            console.log('✅ 3 ta kompaniya va 3 ta ish o\'rni yaratildi');
        } else {
            console.log(`ℹ️ ${companyCount} ta kompaniya mavjud`);
        }

        console.log('✅ Database seed tugadi');
    } catch (err) {
        console.error('❌ Seed xatosi:', err.message);
        throw err;
    }
}

module.exports = { seedDatabase };
