require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { LearningPath, Module, Lesson, Question } = require('./models/Learn');

const MODULE_ACCENTS = {
    1: { color: '#3B82F6', icon: '🌐', badge: '1-MODUL • NETWORKING' },
    2: { color: '#10B981', icon: '💻', badge: '2-MODUL • LINUX TERMINAL' },
    3: { color: '#8B5CF6', icon: '🔐', badge: '3-MODUL • LINUX SECURITY' },
    4: { color: '#F59E0B', icon: '⚙️', badge: '4-MODUL • SYSTEM ADMIN' },
    5: { color: '#EC4899', icon: '📡', badge: '5-MODUL • NMAP & DIAGNOSTICS' },
    6: { color: '#06B6D4', icon: '🖧', badge: '6-MODUL • SERVICES & PROTOCOLS' },
    7: { color: '#14B8A6', icon: '📦', badge: '7-MODUL • OPERATIONS & BACKUP' },
    8: { color: '#EF4444', icon: '🛡️', badge: '8-MODUL • DEFENSIVE SECURITY' }
};

const SECTION_STYLES = {
    'Dars maqsadi': { icon: '🎯', border: '#38BDF8', bg: 'rgba(56, 189, 248, 0.08)' },
    'Asosiy mavzular': { icon: '📌', border: '#818CF8', bg: 'rgba(129, 140, 248, 0.08)' },
    'Tushuntirish': { icon: '📖', border: '#6366F1', bg: 'rgba(99, 102, 241, 0.08)' },
    'Amaliy misol va tahlil': { icon: '💡', border: '#F59E0B', bg: 'rgba(245, 158, 11, 0.08)' },
    'Amaliy laboratoriya': { icon: '🛠️', border: '#10B981', bg: 'rgba(16, 185, 129, 0.09)' },
    'Ko‘p uchraydigan xatolar': { icon: '⚠️', border: '#EF4444', bg: 'rgba(239, 68, 68, 0.08)' },
    'Vaqt taqsimoti': { icon: '⏱️', border: '#14B8A6', bg: 'rgba(20, 184, 166, 0.08)' },
    'Dars yakuni': { icon: '🏁', border: '#A855F7', bg: 'rgba(168, 85, 247, 0.08)' }
};

function escapeHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function parseSectionsFromHtml(rawHtml) {
    const parts = rawHtml.split(/<h3>(.*?)<\/h3>/i);
    const sections = [];
    for (let i = 1; i < parts.length; i += 2) {
        const heading = parts[i].trim();
        const bodyHtml = (parts[i + 1] || '').trim();
        sections.push({ heading, bodyHtml });
    }
    return sections;
}

function styleInnerHtml(htmlStr, accentColor) {
    return htmlStr
        .replace(/<p>/g, '<p style="color:#E2E8F0;line-height:1.8;margin:0 0 12px 0;font-size:0.97rem;">')
        .replace(/<ul>/g, '<ul style="margin:8px 0 12px 20px;color:#E2E8F0;line-height:1.8;font-size:0.96rem;">')
        .replace(/<li>/g, '<li style="margin-bottom:6px;">')
        .replace(/<strong>/g, `<strong style="color:${accentColor};font-weight:700;">`)
        .replace(/`([^`]+)`/g, '<code style="background:rgba(15,23,42,0.85);color:#38BDF8;padding:2px 7px;border-radius:6px;font-family:monospace;font-size:0.9rem;border:1px solid rgba(56,189,248,0.25);">$1</code>');
}

function buildCreativeLessonHtml({ pathData, modData, lessonData, globalLessonIndex, allModules }) {
    const modOrder = modData.order || 1;
    const theme = MODULE_ACCENTS[modOrder] || MODULE_ACCENTS[1];
    const sections = parseSectionsFromHtml(lessonData.full_text_html || '');

    let html = `<div class="ntfk2-creative-lesson" style="font-family:'Inter',system-ui,sans-serif;color:#F8FAFC;max-width:100%;box-sizing:border-box;">`;

    // 1-darsda butun o'quv yo'li haqida umumiy kirish va 8 ta modul vitrinasi
    if (globalLessonIndex === 1) {
        html += `
        <div style="background:linear-gradient(135deg,rgba(30,41,59,0.96),rgba(15,23,42,0.98));border:1px solid rgba(56,189,248,0.35);border-radius:18px;padding:26px;margin-bottom:28px;box-shadow:0 12px 30px rgba(0,0,0,0.35);">
            <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;margin-bottom:14px;">
                <span style="background:rgba(56,189,248,0.15);color:#38BDF8;padding:6px 14px;border-radius:999px;font-size:0.8rem;font-weight:700;letter-spacing:0.4px;">🚀 NTFK1 2 • BARCHA FOYDALANUVCHILAR UCHUN O‘QUV YO‘LI</span>
                <span style="background:rgba(16,185,129,0.15);color:#34D399;padding:6px 14px;border-radius:999px;font-size:0.8rem;font-weight:700;">8 Modul · 32 Dars · 96 Savol · 30+ daqiqa</span>
            </div>
            <h2 style="color:#FFFFFF;font-size:1.45rem;font-weight:800;margin:0 0 10px 0;">${escapeHtml(pathData.title)}</h2>
            <p style="color:#CBD5E1;line-height:1.8;font-size:0.96rem;margin:0 0 20px 0;">${escapeHtml(pathData.full_description)}</p>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;">
                ${allModules.map(m => {
                    const mTheme = MODULE_ACCENTS[m.order] || MODULE_ACCENTS[1];
                    return `
                    <div style="background:rgba(15,23,42,0.8);border:1px solid rgba(148,163,184,0.15);border-left:4px solid ${mTheme.color};border-radius:12px;padding:12px;">
                        <div style="color:${mTheme.color};font-size:0.75rem;font-weight:700;margin-bottom:4px;">${mTheme.icon} ${m.order}-MODUL (${escapeHtml(m.category)})</div>
                        <div style="color:#F8FAFC;font-weight:700;font-size:0.9rem;margin-bottom:4px;">${escapeHtml(m.title)}</div>
                        <div style="color:#94A3B8;font-size:0.8rem;line-height:1.45;">${escapeHtml(m.short_description)}</div>
                    </div>`;
                }).join('')}
            </div>
        </div>`;
    }

    // Dars sarlavhasi (Hero Card)
    html += `
    <div style="background:linear-gradient(135deg,rgba(15,23,42,0.96),rgba(30,41,59,0.92));border:1px solid rgba(148,163,184,0.2);border-left:5px solid ${theme.color};border-radius:16px;padding:22px;margin-bottom:22px;">
        <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;margin-bottom:12px;">
            <span style="background:rgba(59,130,246,0.15);color:${theme.color};padding:5px 12px;border-radius:999px;font-size:0.78rem;font-weight:700;">${theme.icon} ${escapeHtml(modData.title)} • ${lessonData.order}-dars</span>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
                <span style="background:rgba(16,185,129,0.15);color:#34D399;padding:5px 12px;border-radius:999px;font-size:0.78rem;font-weight:700;">⏱ ${lessonData.duration_minutes} daqiqa</span>
                <span style="background:rgba(245,158,11,0.15);color:#FBBF24;padding:5px 12px;border-radius:999px;font-size:0.78rem;font-weight:700;">⚡ +${lessonData.xp} XP</span>
            </div>
        </div>
        <h1 style="color:#FFFFFF;font-size:1.45rem;font-weight:800;margin:0 0 8px 0;line-height:1.35;">${escapeHtml(lessonData.title)}</h1>
        <p style="color:#94A3B8;margin:0;font-size:0.93rem;line-height:1.6;">${escapeHtml(lessonData.short_description)}</p>
    </div>`;

    // Asosiy mavzularni teg chiplari shaklida chiqarish va barcha bo'limlarni chizish
    for (const sec of sections) {
        const st = SECTION_STYLES[sec.heading] || { icon: '🔹', border: theme.color, bg: 'rgba(30,41,59,0.5)' };

        if (sec.heading === 'Asosiy mavzular') {
            const rawTopics = sec.bodyHtml.replace(/<[^>]+>/g, '').split(';').map(t => t.trim().replace(/\.$/, '')).filter(Boolean);
            html += `
            <div style="background:${st.bg};border:1px solid rgba(148,163,184,0.16);border-left:4px solid ${st.border};border-radius:14px;padding:18px 20px;margin-bottom:16px;">
                <h3 style="color:#F8FAFC;font-size:1.1rem;font-weight:700;margin:0 0 12px 0;display:flex;align-items:center;gap:8px;">
                    <span>${st.icon}</span> <span>${escapeHtml(sec.heading)}</span>
                </h3>
                <div style="display:flex;flex-wrap:wrap;gap:8px;">
                    ${rawTopics.map(topic => `<span style="background:rgba(15,23,42,0.85);color:#38BDF8;border:1px solid rgba(56,189,248,0.3);padding:6px 12px;border-radius:8px;font-size:0.86rem;font-weight:600;"># ${escapeHtml(topic)}</span>`).join('')}
                </div>
            </div>`;
        } else {
            html += `
            <div style="background:${st.bg};border:1px solid rgba(148,163,184,0.16);border-left:4px solid ${st.border};border-radius:14px;padding:18px 20px;margin-bottom:16px;">
                <h3 style="color:#F8FAFC;font-size:1.1rem;font-weight:700;margin:0 0 10px 0;display:flex;align-items:center;gap:8px;">
                    <span>${st.icon}</span> <span>${escapeHtml(sec.heading)}</span>
                </h3>
                ${styleInnerHtml(sec.bodyHtml, st.border)}
            </div>`;
        }
    }

    // Dars oxiridagi 3 ta savol, qisqa javoblar va XP bloki
    if (Array.isArray(lessonData.questions) && lessonData.questions.length > 0) {
        html += `
        <div style="background:linear-gradient(135deg,rgba(236,72,153,0.08),rgba(15,23,42,0.92));border:1px solid rgba(236,72,153,0.3);border-left:4px solid #EC4899;border-radius:14px;padding:20px;margin-top:22px;">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:14px;">
                <h3 style="color:#F8FAFC;font-size:1.12rem;font-weight:700;margin:0;display:flex;align-items:center;gap:8px;">
                    <span>❓</span> <span>Nazorat savollari va qisqa javoblar (Bilimni tekshirish)</span>
                </h3>
                <span style="background:rgba(236,72,153,0.18);color:#F472B6;padding:4px 10px;border-radius:999px;font-size:0.78rem;font-weight:700;">3 ta savol · Har biri +10 XP</span>
            </div>
            <div style="display:flex;flex-direction:column;gap:12px;">
                ${lessonData.questions.map((q, idx) => `
                <div style="background:rgba(15,23,42,0.8);border:1px solid rgba(148,163,184,0.18);border-radius:10px;padding:14px;">
                    <div style="color:#F8FAFC;font-weight:700;font-size:0.95rem;margin-bottom:6px;">
                        <span style="color:#F472B6;">${idx + 1}-savol:</span> ${escapeHtml(q.question)}
                        <span style="float:right;color:#34D399;font-size:0.8rem;font-weight:700;">+${q.xp || 10} XP</span>
                    </div>
                    <div style="color:#CBD5E1;font-size:0.9rem;line-height:1.6;background:rgba(16,185,129,0.08);border-left:3px solid #10B981;padding:8px 12px;border-radius:6px;">
                        <strong style="color:#34D399;">Qisqa javob:</strong> ${escapeHtml(q.answer)}
                    </div>
                </div>`).join('')}
            </div>
        </div>`;
    }

    html += `</div>`;
    return html;
}

function findJsonFile() {
    const candidates = [
        'NTFK1_2_oquv_yoli (1)_2.json',
        'NTFK1_2_oquv_yoli (1).json',
        'NTFK1_2_oquv_yoli.json',
        'ntfk1_2.json'
    ];
    for (const name of candidates) {
        const full = path.join(__dirname, name);
        if (fs.existsSync(full)) return full;
    }
    const files = fs.readdirSync(__dirname);
    const match = files.find(f => f.toLowerCase().includes('ntfk1_2') && f.endsWith('.json'));
    if (match) return path.join(__dirname, match);
    throw new Error('NTFK1_2 JSON fayli topilmadi! Fayl shu papkada ekanligini tekshiring.');
}

async function seedDatabase(uri, label, data) {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    await mongoose.connect(uri);
    console.log(`\n🔗 [${label}] bazasiga ulandi. "${data.learning_path.title}" barcha foydalanuvchilar uchun yuklanmoqda...`);

    const pathInfo = data.learning_path;
    const PATH_SLUG = pathInfo.slug; // "ntfk1_2"
    const modules = (data.modules || []).sort((a, b) => (a.order || 0) - (b.order || 0));
    const moduleSlugs = [];
    const createdLessonIds = [];

    let globalLessonCounter = 0;
    let totalQuestionsCounter = 0;

    // 1. Modullar, Darslar va Savollarni ketma-ketlikda (order bo'yicha) yaratish
    for (let mIdx = 0; mIdx < modules.length; mIdx++) {
        const mod = modules[mIdx];
        const modOrder = Number(mod.order) || (mIdx + 1);
        const modSlug = mod.slug;
        moduleSlugs.push(modSlug);

        await Module.findOneAndUpdate(
            { slug: modSlug },
            {
                $set: {
                    title: `${modOrder}-modul. ${mod.title}`,
                    slug: modSlug,
                    pathSlug: PATH_SLUG,
                    description: mod.short_description,
                    category: mod.category || 'Security',
                    order: modOrder,
                    isActive: true
                }
            },
            { upsert: true, new: true }
        );

        const lessons = (mod.lessons || []).sort((a, b) => (a.order || 0) - (b.order || 0));
        for (let lIdx = 0; lIdx < lessons.length; lIdx++) {
            globalLessonCounter++;
            const les = lessons[lIdx];
            const lessonOrder = Number(les.order) || (lIdx + 1);
            const lessonSlug = les.slug;

            const creativeHtml = buildCreativeLessonHtml({
                pathData: pathInfo,
                modData: { ...mod, order: modOrder },
                lessonData: { ...les, order: lessonOrder },
                globalLessonIndex: globalLessonCounter,
                allModules: modules
            });

            const lessonDoc = await Lesson.findOneAndUpdate(
                { moduleSlug: modSlug, slug: lessonSlug },
                {
                    $set: {
                        moduleSlug: modSlug,
                        slug: lessonSlug,
                        title: `${lessonOrder}-dars. ${les.title}`,
                        description: les.short_description,
                        content: creativeHtml,
                        duration: Number(les.duration_minutes) || 35,
                        difficulty: 'beginner',
                        order: lessonOrder,
                        xpReward: Number(les.xp) || 100,
                        isActive: true
                    }
                },
                { upsert: true, new: true }
            );

            createdLessonIds.push(lessonDoc._id);

            // Eski savollarni tozalab, har bir darsga aynan 3 ta savolni yozamiz
            await Question.deleteMany({ lessonId: lessonDoc._id });

            const questions = les.questions || [];
            for (let qIdx = 0; qIdx < questions.length; qIdx++) {
                const q = questions[qIdx];
                const cleanAns = String(q.answer || '').trim();
                const noDotAns = cleanAns.replace(/\.$/, '').trim();
                const acceptedAnswers = Array.from(new Set([cleanAns, noDotAns, noDotAns + '.'])).filter(Boolean);

                await Question.create({
                    lessonId: lessonDoc._id,
                    order: qIdx + 1,
                    prompt: `${q.question} (Javob: ${cleanAns})`,
                    question: q.question,
                    answers: acceptedAnswers,
                    correctAnswer: cleanAns,
                    points: Number(q.xp) || 10,
                    type: 'flag',
                    isMandatory: true
                });
                totalQuestionsCounter++;
            }
        }
    }

    // 2. O'quv yo'lini barcha foydalanuvchilar uchun umumiy va faol qilib saqlash
    await LearningPath.findOneAndUpdate(
        { slug: PATH_SLUG },
        {
            $set: {
                title: pathInfo.title,
                slug: PATH_SLUG,
                description: pathInfo.short_description,
                overview: pathInfo.full_description,
                level: 'beginner',
                difficulty: 'beginner',
                category: 'Network & Linux Security (8 modul · 32 dars)',
                moduleSlugs: moduleSlugs,
                passScore: Number(pathInfo.pass_score) || 80,
                certificateType: 'course_completion',
                certificateTitle: pathInfo.certificate_name || 'NTFK1 2 — Network va Linux xavfsizligi asoslari sertifikati',
                order: Number(pathInfo.order) || 2,
                isActive: true
            }
        },
        { upsert: true, new: true }
    );

    // 3. Agar oldingi skriptdan jasur7 yoki boshqa profil uchun sun'iy progress yozilgan bo'lsa,
    // yangi o'quv yo'li barcha uchun bir xil 1-darsdan boshlanishi uchun uni tozalab qo'yamiz
    const Progress = mongoose.models.Progress || mongoose.model('Progress', new mongoose.Schema({}, { strict: false }));
    await Progress.deleteMany({
        $or: [
            { moduleSlug: { $in: moduleSlugs } },
            { lessonId: { $in: createdLessonIds } }
        ]
    });

    console.log(`✅ [${label}] BARCHA FOYDALANUVCHILAR UCHUN MUVAFFAQIYATLI QO‘SHILDI!`);
    console.log(`   📦 Modullar: ${modules.length} ta | 📖 Darslar: ${globalLessonCounter} ta | ❓ Savollar: ${totalQuestionsCounter} ta`);

    await mongoose.disconnect();
}

async function run() {
    const jsonPath = findJsonFile();
    console.log(`📂 O'qilayotgan fayl: ${jsonPath}`);
    const rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    // 1. Render Production (MongoDB Atlas) bazasiga yozish
    const ATLAS_URI = "mongodb+srv://ctfuz_admin:AKKSAVDON137@ctf-uz-cluster.vtjol3t.mongodb.net/ctf-uz?retryWrites=true&w=majority";
    await seedDatabase(ATLAS_URI, 'RENDER PRODUCTION (MongoDB Atlas)', rawData);

    // 2. Lokal MongoDB bazasiga ham yozish (localhost:3000 da ham ko'rinishi uchun)
    const LOCAL_URI = (process.env.MONGO_URI && !process.env.MONGO_URI.includes('vtjol3t'))
        ? process.env.MONGO_URI
        : 'mongodb://localhost:27017/ctf-uz';
    try {
        await seedDatabase(LOCAL_URI, 'LOCAL MONGODB (localhost)', rawData);
    } catch (e) {
        console.log('ℹ️ Lokal MongoDB ulanishi o‘tkazib yuborildi (faqat Atlas bazaga yozildi).');
    }

    console.log('\n🎉 "NTFK1 2" O‘QUV YO‘LI BARCHA FOYDALANUVCHILAR UCHUN 100% XATOSIZ JOYLASHTIRILDI!');
}

run().catch(err => {
    console.error('❌ Xatolik:', err);
    process.exit(1);
});
