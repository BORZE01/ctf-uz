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

module.exports = { seedLearningPathsSafe,  seedDatabase };


async function seedLearningPathsSafe() {
    const { Module, Lesson, Question, LearningPath } = require('../models/Learn');

    // 1. 5 ta Asosiy Modul (Foundations + SOC + Web) - deleteMany ISHLATILMAYDI!
    const modulesData = [
        {
            slug: 'cyber-intro',
            title: '01. Kiberxavfsizlikka kirish',
            description: 'CIA triadasi, etik xakerlik, xavfsizlik qoidalari va ruxsat bilan ishlash.',
            category: 'Cybersecurity Fundamentals',
            difficulty: 'Beginner',
            icon: '🛡️',
            order: 1,
            pathSlug: 'foundations'
        },
        {
            slug: 'network-fundamentals',
            title: '02. Tarmoq va internet asoslari',
            description: 'IP, TCP/UDP, DNS, HTTP/HTTPS, portlar va tarmoq diagnostikasi.',
            category: 'Networking',
            difficulty: 'Beginner',
            icon: '🌐',
            order: 2,
            pathSlug: 'foundations'
        },
        {
            slug: 'linux-cli',
            title: '03. Linux va buyruq satri',
            description: 'Fayllar, ruxsatlar, jarayonlar, terminal va oddiy skriptlar.',
            category: 'Linux',
            difficulty: 'Beginner',
            icon: '🐧',
            order: 3,
            pathSlug: 'foundations'
        },
        {
            slug: 'web-auth-basics',
            title: '04. Web va autentifikatsiya asoslari',
            description: 'Brauzer-server aloqasi, cookie, session, autentifikatsiya va xavfsizlik xatolari.',
            category: 'Web Security',
            difficulty: 'Beginner',
            icon: '🔐',
            order: 4,
            pathSlug: 'foundations'
        },
        {
            slug: 'practical-labs-review',
            title: '05. Amaliy laboratoriyalar va yakuniy tayyorgarlik',
            description: 'Oldingi mavzularni tekshirish, ruxsat etilgan lab topshiriqlari.',
            category: 'Practical Labs',
            difficulty: 'Beginner',
            icon: '🧪',
            order: 5,
            pathSlug: 'foundations'
        },
        {
            slug: 'soc-log-analysis',
            title: 'SOC: Log tahlili va SIEM asoslari',
            description: 'Tizim loglari, SIEM qoidalari, tarmoq monitoringi va hodisalarni aniqlash.',
            category: 'Defensive Security',
            difficulty: 'Intermediate',
            icon: '📡',
            order: 6,
            pathSlug: 'soc-analyst-l1'
        },
        {
            slug: 'owasp-web-pentest',
            title: 'Web Xavfsizlik: Инъекция va XSS tahlili',
            description: 'Autentifikatsiya xatolari, IDOR, SQLi, XSS aniqlash va ularni yopish (patching).',
            category: 'Offensive Security',
            difficulty: 'Intermediate',
            icon: '🕸️',
            order: 7,
            pathSlug: 'web-security-pentesting'
        }
    ];

    for (const m of modulesData) {
        await Module.findOneAndUpdate({ slug: m.slug }, { $set: m }, { upsert: true, new: true });
    }

    // 2. Har bir modul uchun Darslar va Savollar (Upsert)
    const lessonsData = [
        {
            moduleSlug: 'cyber-intro',
            slug: 'cia-triad-va-etika',
            title: 'CIA Triadasi va Etik Xakerlik Qoidalari',
            description: 'Maxfiylik, Butunlik va Foydalanuvchanlik tamoyillari.',
            content: '<h3>CIA Triadasi</h3><p>Axborot xavfsizligi uchta asosiy ustunga tayanadi: <b>Confidentiality</b> (Maxfiylik), <b>Integrity</b> (Butunlik) va <b>Availability</b> (Foydalanuvchanlik). Har qanday pentest faqat yozma ruxsat (Rules of Engagement) asosida bajariladi.</p>',
            duration: 15,
            xpReward: 50,
            order: 1,
            questions: [
                { prompt: "CIA triadasidagi 'I' harfi nimani anglatadi? (inglizcha)", answers: ['integrity', 'butunlik'], points: 25, order: 1 },
                { prompt: "Tizimni ruxsatsiz tekshirish qonuniymi? (ha/yoq)", answers: ['yoq', "yo'q", 'no'], points: 25, order: 2 }
            ]
        },
        {
            moduleSlug: 'network-fundamentals',
            slug: 'tcp-ip-va-dns',
            title: 'TCP/IP protokollari, Portlar va DNS',
            description: 'Tarmoq paketlari qanday harakatlanishi va asosiy portlar.',
            content: '<h3>Tarmoq asoslari</h3><p>HTTPS standart holatda <b>443</b>-portda, SSH esa <b>22</b>-portda ishlaydi. DNS domen nomlarini IP manzillarga o\'giradi.</p>',
            duration: 20,
            xpReward: 60,
            order: 1,
            questions: [
                { prompt: "HTTPS protokoli standart qaysi portda ishlaydi?", answers: ['443'], points: 30, order: 1 },
                { prompt: "Domen nomini IP manzilga o'giruvchi xizmat nima deb ataladi?", answers: ['dns', 'domain name system'], points: 30, order: 2 }
            ]
        },
        {
            moduleSlug: 'linux-cli',
            slug: 'linux-fayl-ruxsatlari',
            title: 'Linux Terminal va Fayl Ruxsatlari (chmod)',
            description: 'Linuxda foydalanuvchi huquqlari va terminal buyruqlari.',
            content: '<h3>Linux Permissions</h3><p>Fayl huquqlarini o\'zgartirish uchun <code>chmod</code> buyrug\'i, joriy foydalanuvchini aniqlash uchun <code>whoami</code> buyrug\'i ishlatiladi.</p>',
            duration: 20,
            xpReward: 60,
            order: 1,
            questions: [
                { prompt: "Linuxda joriy foydalanuvchi nomini ko'rsatuvchi buyruq nima?", answers: ['whoami'], points: 30, order: 1 },
                { prompt: "Fayl ruxsatlarini (permissions) o'zgartiruvchi buyruqni yozing:", answers: ['chmod'], points: 30, order: 2 }
            ]
        },
        {
            moduleSlug: 'web-auth-basics',
            slug: 'http-cookies-va-session',
            title: 'HTTP, Cookie, Session va Xavfsizlik',
            description: 'Web ilovalarda sessiya boshqaruvi va HttpOnly bayrog\'i.',
            content: '<h3>Session Security</h3><p>JavaScript orqali (masalan XSS hujumida) cookie o\'g\'irlanishini oldini olish uchun cookiega <b>HttpOnly</b> atributi qo\'yiladi.</p>',
            duration: 25,
            xpReward: 70,
            order: 1,
            questions: [
                { prompt: "JavaScript (document.cookie) orqali cookie o'qilishini bloklovchi atribut qaysi?", answers: ['httponly', 'http-only'], points: 35, order: 1 }
            ]
        },
        {
            moduleSlug: 'practical-labs-review',
            slug: 'amaliy-tekshiruv-asoslari',
            title: 'Amaliy Laboratoriya Metodologiyasi',
            description: 'Reconnaissance, tahlil va xavfsizlik hisobotini yozish.',
            content: '<h3>Amaliy Bosqich</h3><p>Har bir topilgan zaiflik CVSS bo\'yicha baholanadi va uni bartaraf etish (remediation) bo\'yicha aniq tavsiya yoziladi.</p>',
            duration: 20,
            xpReward: 80,
            order: 1,
            questions: [
                { prompt: "Zaifliklarni tuzatish va yopish jarayoni ingliz tilida nima deb ataladi? (patching / remediation)", answers: ['remediation', 'patching'], points: 40, order: 1 }
            ]
        },
        {
            moduleSlug: 'soc-log-analysis',
            slug: 'siem-va-log-monitoring',
            title: 'SIEM va Brute-Force Hujumlarini Aniqlash',
            description: 'Linux auth.log va Windows Event ID tahlili.',
            content: '<h3>SOC Level 1</h3><p>Windows tizimlarida muvaffaqiyatsiz login urinishi <b>4625</b> Event ID bilan, muvaffaqiyatli kirish esa <b>4624</b> bilan qayd etiladi.</p>',
            duration: 25,
            xpReward: 90,
            order: 1,
            questions: [
                { prompt: "Windows Event Log'da muvaffaqiyatsiz (Failed) logon qaysi Event ID bilan yoziladi?", answers: ['4625'], points: 50, order: 1 }
            ]
        },
        {
            moduleSlug: 'owasp-web-pentest',
            slug: 'idor-va-sqli-himoyasi',
            title: 'IDOR va SQL Injection: Aniqlash va Tuzatish',
            description: 'Obyekt darajasidagi avtorizatsiya va Prepared Statements.',
            content: '<h3>Web Security</h3><p>SQL Injection zaifligini butunlay yopish uchun so\'rovlarda <b>Prepared Statements</b> (Parameterized Queries) ishlatiladi.</p>',
            duration: 30,
            xpReward: 100,
            order: 1,
            questions: [
                { prompt: "SQL Injection'dan himoyalanishning eng ishonchli usuli nima? (prepared statements / parameterized queries)", answers: ['prepared statements', 'parameterized queries'], points: 50, order: 1 }
            ]
        }
    ];

    for (const lData of lessonsData) {
        const { questions, ...lessonFields } = lData;
        const lessonDoc = await Lesson.findOneAndUpdate(
            { moduleSlug: lessonFields.moduleSlug, slug: lessonFields.slug },
            { $set: lessonFields },
            { upsert: true, new: true }
        );

        for (const qData of (questions || [])) {
            await Question.findOneAndUpdate(
                { lessonId: lessonDoc._id, order: qData.order },
                { $set: { ...qData, lessonId: lessonDoc._id, type: 'flag', isMandatory: true } },
                { upsert: true, new: true }
            );
        }
    }

    // 3. 4 ta Taklif Etilgan Learning Path (Foundations, SOC L1, Web Security, Practical Assessment)
    const pathsData = [
        {
            slug: 'foundations',
            title: 'Foundations',
            subtitle: "Boshlang'ich daraja · 5 modul",
            description: 'Kompyuter tarmoqlari, Linux, Windows, HTTP, DNS va axborot xavfsizligi asoslari.',
            level: 'Beginner',
            category: 'Foundations',
            icon: '🛡️',
            moduleSlugs: ['cyber-intro', 'network-fundamentals', 'linux-cli', 'web-auth-basics', 'practical-labs-review'],
            finalExamMinPercent: 80,
            certificateType: 'course_completion',
            certificateTitle: 'CTF.UZ Cybersecurity Foundations — Course Completion Certificate',
            isPaidExam: false,
            order: 1,
            finalQuestions: [
                { id: 'f1', prompt: 'CIA triadasining uchta komponenti qaysi?', options: ['Confidentiality, Integrity, Availability', 'Control, Internet, Access', 'Crypto, Identity, Auth'], correctAnswer: 'Confidentiality, Integrity, Availability', points: 25 },
                { id: 'f2', prompt: 'HTTPS standart qaysi portdan foydalanadi?', options: ['80', '22', '443', '8080'], correctAnswer: '443', points: 25 },
                { id: 'f3', prompt: 'Linuxda fayl huquqlarini o\'zgartirish buyrug\'i qaysi?', options: ['ls -la', 'chmod', 'pwd', 'cat'], correctAnswer: 'chmod', points: 25 },
                { id: 'f4', prompt: 'XSS orqali cookie o\'g\'irlanishini qaysi bayroq (flag) to\'xtatadi?', options: ['HttpOnly', 'SameSite=None', 'Path=/', 'Domain'], correctAnswer: 'HttpOnly', points: 25 }
            ]
        },
        {
            slug: 'soc-analyst-l1',
            title: 'SOC Analyst Level 1',
            subtitle: "Himoya yo'nalishi · Blue Team",
            description: 'Log tahlili, SIEM, tarmoq monitoringi, tahdidlarni aniqlash va hodisalarga javob berish.',
            level: 'Intermediate',
            category: 'Defensive',
            icon: '📡',
            moduleSlugs: ['soc-log-analysis'],
            finalExamMinPercent: 80,
            certificateType: 'course_completion',
            certificateTitle: 'CTF.UZ SOC Analyst — Level 1 Certificate',
            isPaidExam: false,
            order: 2,
            finalQuestions: [
                { id: 's1', prompt: 'Windows tizimida Failed Logon qaysi Event ID bilan yoziladi?', options: ['4624', '4625', '1102', '7045'], correctAnswer: '4625', points: 50 },
                { id: 's2', prompt: 'SIEM tizimining asosiy vazifasi nima?', options: ['Loglarni markaziy yig\'ish va korrelyatsiya qilish', 'Faqat antivirus bazasini yangilash', 'Kod kompilyatsiyasi'], correctAnswer: 'Loglarni markaziy yig\'ish va korrelyatsiya qilish', points: 50 }
            ]
        },
        {
            slug: 'web-security-pentesting',
            title: 'Web Security & Pentesting',
            subtitle: "Amaliy xavfsizlik yo'nalishi",
            description: 'Web xavfsizligi, autentifikatsiya, xavfsizlik xatolarini aniqlash va ularni tuzatish.',
            level: 'Intermediate',
            category: 'Offensive',
            icon: '🕸️',
            moduleSlugs: ['owasp-web-pentest'],
            finalExamMinPercent: 80,
            certificateType: 'course_completion',
            certificateTitle: 'CTF.UZ Web Security — Course Completion Certificate',
            isPaidExam: false,
            order: 3,
            finalQuestions: [
                { id: 'w1', prompt: 'SQL Injection zaifligini yopishning asosiy usuli qaysi?', options: ['Prepared Statements (Parameterized Queries)', 'Faqat POST metodidan foydalanish', 'CSS o\'chirish'], correctAnswer: 'Prepared Statements (Parameterized Queries)', points: 50 },
                { id: 'w2', prompt: 'Boshqa foydalanuvchi ID raqamini o\'zgartirib uning ma\'lumotini ko\'rish qanday zaiflik?', options: ['IDOR (Broken Object Level Authorization)', 'CSRF', 'Clickjacking'], correctAnswer: 'IDOR (Broken Object Level Authorization)', points: 50 }
            ]
        },
        {
            slug: 'advanced-practical-assessment',
            title: 'Advanced Practical Assessment',
            subtitle: 'Yakuniy amaliy baholash · Sertifikatsiya',
            description: 'Vaqt chegaralangan, ruxsat etilgan laboratoriyada topshiriqlarni bajarish va texnik hisobot tayyorlash.',
            level: 'Practical',
            category: 'Assessment',
            icon: '🏆',
            moduleSlugs: ['practical-labs-review', 'owasp-web-pentest'],
            finalExamMinPercent: 85,
            certificateType: 'professional',
            certificateTitle: 'CTF.UZ Practical Certification',
            isPaidExam: true,
            examPriceUzs: 250000,
            examDurationMinutes: 180,
            order: 4,
            finalQuestions: [
                { id: 'p1', prompt: 'Pentest hisobotida eng muhim qism qaysi?', options: ['Aniq dalillar (PoC) va zaiflikni bartaraf etish (Remediation) rejasi', 'Faqat skaner loglari', 'Kompaniya tarixi'], correctAnswer: 'Aniq dalillar (PoC) va zaiflikni bartaraf etish (Remediation) rejasi', points: 100 }
            ]
        }
    ];

    for (const p of pathsData) {
        await LearningPath.findOneAndUpdate({ slug: p.slug }, { $set: p }, { upsert: true, new: true });
    }
    console.log("✅ Learning Paths va Modullar xavfsiz (upsert) saqlandi!");
}
