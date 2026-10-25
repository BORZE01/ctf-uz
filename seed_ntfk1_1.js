require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { LearningPath, Module, Lesson, Question } = require('./models/Learn');

const PATH_SLUG = 'ntfk1-1';
const PATH_TITLE = 'NTFK1 1';

const MODULE_META = {
    1: { shortTitle: '1-modul. Kiberxavfsizlikka kirish', duration: '4 dars · 30–35 daqiqadan', summary: 'Kiberxavfsizlik, CIA triadasi, xavfsizlik yo‘nalishlari va etik qoidalar.', accent: '#3B82F6' },
    2: { shortTitle: '2-modul. Asosiy terminlar va risk', duration: '4 dars · 35–40 daqiqadan', summary: 'Aktiv, tahdid, zaiflik, hujum, ekspluatatsiya, risk va xavfsizlik hisoboti.', accent: '#8B5CF6' },
    3: { shortTitle: '3-modul. Raqamli tahdidlar', duration: '4 dars · 40–45 daqiqadan', summary: 'Phishing, zararli dasturlar, parollar, MFA, brauzer va havolalar xavfsizligi.', accent: '#EC4899' },
    4: { shortTitle: '4-modul. Operatsion tizim va ma’lumotlar', duration: '4 dars · 45–50 daqiqadan', summary: 'OT, fayl ruxsatlari, jarayonlar, yangilanishlar, loglar va backup.', accent: '#10B981' },
    5: { shortTitle: '5-modul. Amaliy himoya va yakuniy loyiha', duration: '4 dars · 50–60 daqiqadan', summary: 'Tarmoq asoslari, qurilmani himoyalash, hodisani tahlil qilish va yakuniy xavfsizlik auditi.', accent: '#F59E0B' }
};

function escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderParagraphsAndLists(text) {
    const lines = text.trim().split('\n');
    let html = '';
    let inUl = false, inOl = false;
    const closeLists = () => { if (inUl) { html += '</ul>'; inUl = false; } if (inOl) { html += '</ol>'; inOl = false; } };
    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) { closeLists(); continue; }
        if (line.startsWith('#### ')) { closeLists(); html += `<h4 style="color:#F8FAFC;font-size:1.08rem;font-weight:700;margin:18px 0 8px 0;display:flex;align-items:center;gap:8px;"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#38BDF8;"></span>${escapeHtml(line.replace(/^####\s*/, ''))}</h4>`; }
        else if (line.startsWith('### ')) { closeLists(); html += `<h3 style="color:#38BDF8;font-size:1.2rem;font-weight:700;margin:20px 0 10px 0;">${escapeHtml(line.replace(/^###\s*/, ''))}</h3>`; }
        else if (line.startsWith('## ')) { closeLists(); html += `<h2 style="color:#F8FAFC;font-size:1.35rem;font-weight:800;margin:22px 0 10px 0;">${escapeHtml(line.replace(/^##\s*/, ''))}</h2>`; }
        else if (line.startsWith('- ')) { if (inOl) { html += '</ol>'; inOl = false; } if (!inUl) { html += '<ul style="margin:10px 0 14px 20px;color:#E2E8F0;line-height:1.75;">'; inUl = true; } html += `<li style="margin-bottom:6px;">${escapeHtml(line.replace(/^-\s*/, ''))}</li>`; }
        else if (/^\d+\.\s+/.test(line)) { if (inUl) { html += '</ul>'; inUl = false; } if (!inOl) { html += '<ol style="margin:10px 0 14px 20px;color:#E2E8F0;line-height:1.75;">'; inOl = true; } html += `<li style="margin-bottom:6px;">${escapeHtml(line.replace(/^\d+\.\s+/, ''))}</li>`; }
        else { closeLists(); html += `<p style="color:#CBD5E1;line-height:1.8;margin:0 0 12px 0;font-size:0.98rem;">${escapeHtml(line)}</p>`; }
    }
    closeLists();
    return html;
}

function buildCreativeLessonHtml({ lessonNum, modNum, modTitle, modIntro, lessonTitle, metaLine, sections, courseIntroMd, courseFooterMd }) {
    const modMeta = MODULE_META[modNum] || MODULE_META[1];
    let html = `<div class="ntfk-creative-lesson" style="font-family:Inter,system-ui,sans-serif;color:#E2E8F0;max-width:100%;box-sizing:border-box;">`;
    if (lessonNum === 1 && courseIntroMd) {
        html += `
        <div style="background:linear-gradient(135deg,rgba(30,41,59,0.95),rgba(15,23,42,0.98));border:1px solid rgba(56,189,248,0.3);border-radius:16px;padding:24px;margin-bottom:28px;">
            <div style="display:inline-flex;align-items:center;gap:8px;background:rgba(56,189,248,0.15);color:#38BDF8;padding:6px 14px;border-radius:999px;font-size:0.8rem;font-weight:700;margin-bottom:14px;">🚀 NTFK1 1 • TO‘LIQ O‘QUV DASTURI VA KIRISH</div>
            ${renderParagraphsAndLists(courseIntroMd.replace(/^#\s+.*\n?/, ''))}
            <div style="margin-top:20px;padding-top:18px;border-top:1px solid rgba(148,163,184,0.18);">
                <h4 style="color:#F8FAFC;margin:0 0 12px 0;font-size:1.05rem;">📚 Kurs tarkibi (5 modul · 20 dars)</h4>
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;">
                    ${Object.entries(MODULE_META).map(([num, m]) => `
                        <div style="background:rgba(15,23,42,0.75);border-left:4px solid ${m.accent};border-radius:10px;padding:12px;">
                            <div style="color:#F8FAFC;font-weight:700;font-size:0.92rem;">${escapeHtml(m.shortTitle)}</div>
                            <div style="color:${m.accent};font-size:0.78rem;font-weight:600;margin:4px 0;">⏱ ${escapeHtml(m.duration)}</div>
                            <div style="color:#94A3B8;font-size:0.82rem;line-height:1.5;">${escapeHtml(m.summary)}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>`;
    }
    html += `
    <div style="background:linear-gradient(135deg,rgba(15,23,42,0.95),rgba(30,41,59,0.9));border:1px solid rgba(148,163,184,0.2);border-left:5px solid ${modMeta.accent};border-radius:16px;padding:22px;margin-bottom:24px;">
        <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;margin-bottom:10px;">
            <span style="background:rgba(59,130,246,0.18);color:#60A5FA;padding:4px 12px;border-radius:999px;font-size:0.8rem;font-weight:700;">${escapeHtml(modTitle)} (${escapeHtml(modMeta.duration)})</span>
            <span style="background:rgba(16,185,129,0.15);color:#34D399;padding:4px 12px;border-radius:999px;font-size:0.8rem;font-weight:600;">⏱ ${escapeHtml(metaLine)}</span>
        </div>
        <h1 style="color:#FFFFFF;font-size:1.5rem;font-weight:800;margin:6px 0 8px 0;line-height:1.35;">${escapeHtml(lessonTitle)}</h1>
        <p style="color:#94A3B8;margin:0;font-size:0.92rem;line-height:1.6;">${escapeHtml(modIntro)}</p>
    </div>`;

    const sectionStyles = {
        'Dars maqsadi': { icon: '🎯', border: '#38BDF8', bg: 'rgba(56,189,248,0.07)' },
        'Darsni o‘rganamiz': { icon: '📖', border: '#6366F1', bg: 'rgba(99,102,241,0.07)' },
        'Hayotiy vaziyat': { icon: '💡', border: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
        'Amaliy mashq': { icon: '🛠️', border: '#10B981', bg: 'rgba(16,185,129,0.08)' },
        'Dars oxiridagi savollar': { icon: '❓', border: '#EC4899', bg: 'rgba(236,72,153,0.07)' },
        'Qisqa javoblar': { icon: '✅', border: '#14B8A6', bg: 'rgba(20,184,166,0.07)' },
        'Uyga vazifa / qo‘shimcha topshiriq': { icon: '📌', border: '#8B5CF6', bg: 'rgba(139,92,246,0.08)' },
        'Qo‘shimcha chaqiriq': { icon: '🔥', border: '#EF4444', bg: 'rgba(239,68,68,0.08)' }
    };

    for (const sec of sections) {
        const st = sectionStyles[sec.key] || { icon: '🔹', border: '#64748B', bg: 'rgba(100,116,139,0.08)' };
        html += `
        <div style="background:${st.bg};border:1px solid rgba(148,163,184,0.16);border-left:4px solid ${st.border};border-radius:14px;padding:20px;margin-bottom:18px;">
            <h3 style="color:#F8FAFC;font-size:1.15rem;font-weight:700;margin:0 0 12px 0;display:flex;align-items:center;gap:10px;"><span>${st.icon}</span> <span>${escapeHtml(sec.heading)}</span></h3>
            ${renderParagraphsAndLists(sec.body)}
        </div>`;
    }
    if (lessonNum === 20 && courseFooterMd) {
        html += `
        <div style="background:linear-gradient(135deg,rgba(16,185,129,0.12),rgba(15,23,42,0.95));border:1px solid rgba(16,185,129,0.35);border-radius:16px;padding:24px;margin-top:26px;">
            <div style="display:inline-flex;align-items:center;gap:8px;background:rgba(16,185,129,0.2);color:#34D399;padding:6px 14px;border-radius:999px;font-size:0.8rem;font-weight:700;margin-bottom:12px;">🏆 YAKUNIY BAHOLASH VA SERTIFIKAT MEZONLARI</div>
            ${renderParagraphsAndLists(courseFooterMd)}
        </div>`;
    }
    html += `</div>`;
    return html;
}

function normalizeSectionKey(heading) {
    const h = heading.toLowerCase();
    if (h.includes('dars maqsadi')) return 'Dars maqsadi';
    if (h.includes('darsni o')) return 'Darsni o‘rganamiz';
    if (h.includes('hayotiy vaziyat')) return 'Hayotiy vaziyat';
    if (h.includes('amaliy mashq')) return 'Amaliy mashq';
    if (h.includes('dars oxiridagi savollar')) return 'Dars oxiridagi savollar';
    if (h.includes('qisqa javoblar')) return 'Qisqa javoblar';
    if (h.includes('uyga vazifa')) return 'Uyga vazifa / qo‘shimcha topshiriq';
    if (h.includes('qo‘shimcha chaqiriq') || h.includes("qo'shimcha chaqiriq") || h.includes('chaqiriq')) return 'Qo‘shimcha chaqiriq';
    return null;
}

function parseLessonSections(lessonRawBody) {
    const lines = lessonRawBody.split('\n');
    let metaLine = '';
    const sections = [];
    let currentSection = null;
    for (const line of lines) {
        const trimmed = line.trim();
        if (!metaLine && trimmed.startsWith('Taxminiy vaqt:')) { metaLine = trimmed; continue; }
        if (trimmed.startsWith('#### ')) {
            const rawHeading = trimmed.replace(/^####\s+/, '').trim();
            const key = normalizeSectionKey(rawHeading);
            if (key) {
                if (currentSection) sections.push(currentSection);
                currentSection = { key, heading: rawHeading, body: '' };
                continue;
            }
        }
        if (currentSection) { currentSection.body += line + '\n'; }
    }
    if (currentSection) sections.push(currentSection);

    const qSec = sections.find(s => s.key === 'Dars oxiridagi savollar');
    const aSec = sections.find(s => s.key === 'Qisqa javoblar');
    const questionsList = qSec ? qSec.body.split('\n').map(l => l.trim()).filter(l => /^\d+\.\s+/.test(l)).map(l => l.replace(/^\d+\.\s+/, '').trim()) : [];
    const answersList = aSec ? aSec.body.split('\n').map(l => l.trim()).filter(l => /^-\s+/.test(l)).map(l => l.replace(/^-\s+/, '').replace(/\.$/, '').trim()) : [];

    const qaPairs = questionsList.map((qText, idx) => {
        const fullAns = answersList[idx] || '';
        const noDotAns = fullAns.replace(/\.$/, '').trim();
        return { order: idx + 1, prompt: qText, correctAnswer: noDotAns, answers: Array.from(new Set([noDotAns, fullAns + '.'])).filter(Boolean) };
    });
    return { metaLine, sections, qaPairs };
}

async function seedToDatabase(uri, label, courseIntroMd, courseFooterMd, moduleBlocks) {
    if (mongoose.connection.readyState !== 0) { await mongoose.disconnect(); }
    await mongoose.connect(uri);
    console.log(`\n🔗 [${label}] bazasiga ulandi. "NTFK1 1" yuklanmoqda...`);

    const moduleSlugs = [];
    let globalLessonNum = 0, totalQuestionsSaved = 0;

    for (let mIdx = 0; mIdx < moduleBlocks.length; mIdx++) {
        const modNum = mIdx + 1;
        const modBlock = moduleBlocks[mIdx].trim();
        const lessonSplits = modBlock.split(/\n(?=### \d+-dars\.)/);
        const modHeaderLines = lessonSplits[0].trim().split('\n');
        const modTitle = modHeaderLines[0].replace(/^##\s*/, '').trim();
        const modIntro = modHeaderLines.slice(1).join(' ').trim();
        const modMeta = MODULE_META[modNum];
        const modSlug = `${PATH_SLUG}-modul-${modNum}`;
        moduleSlugs.push(modSlug);

        await Module.findOneAndUpdate({ slug: modSlug }, {
            $set: { title: `${modMeta.shortTitle} (${modTitle})`, slug: modSlug, pathSlug: PATH_SLUG, description: `${modMeta.duration} • ${modMeta.summary} ${modIntro}`, category: modMeta.duration, order: modNum }
        }, { upsert: true, new: true });

        const lessonBlocks = lessonSplits.slice(1);
        for (let lIdx = 0; lIdx < lessonBlocks.length; lIdx++) {
            globalLessonNum++;
            const lesLines = lessonBlocks[lIdx].trim().split('\n');
            const lessonTitle = lesLines[0].replace(/^###\s*/, '').trim();
            const lessonRawBody = lesLines.slice(1).join('\n');
            const { metaLine, sections, qaPairs } = parseLessonSections(lessonRawBody);
            const lessonSlug = `${PATH_SLUG}-dars-${globalLessonNum}`;
            const durationMinutes = parseInt((metaLine.match(/(\d+)/) || [])[1], 10) || 35;

            const creativeHtml = buildCreativeLessonHtml({ lessonNum: globalLessonNum, modNum, modTitle, modIntro, lessonTitle, metaLine, sections, courseIntroMd, courseFooterMd });

            const lessonDoc = await Lesson.findOneAndUpdate({ moduleSlug: modSlug, slug: lessonSlug }, {
                $set: { moduleSlug: modSlug, slug: lessonSlug, title: lessonTitle, description: `${metaLine} • ${sections[0]?.body.trim() || ''}`, content: creativeHtml, duration: durationMinutes, difficulty: 'beginner', order: lIdx + 1, xpReward: 50 }
            }, { upsert: true, new: true });

            for (const qa of qaPairs) {
                await Question.findOneAndUpdate({ lessonId: lessonDoc._id, order: qa.order }, {
                    $set: { lessonId: lessonDoc._id, order: qa.order, prompt: `${qa.prompt} (Qisqa javob: ${qa.correctAnswer})`, question: qa.prompt, answers: qa.answers, correctAnswer: qa.correctAnswer, points: 20, type: 'flag', isMandatory: true }
                }, { upsert: true, new: true });
                totalQuestionsSaved++;
            }
        }
    }

    const pathDescription = ['Boshlang‘ich daraja • 5 modul • 20 dars • nazariya + xavfsiz amaliyot.', '1-modul: Kiberxavfsizlikka kirish | 2-modul: Asosiy terminlar va risk | 3-modul: Raqamli tahdidlar | 4-modul: Operatsion tizim va ma’lumotlar | 5-modul: Amaliy himoya va yakuniy loyiha.'].join(' ');

    await LearningPath.findOneAndUpdate({ slug: PATH_SLUG }, {
        $set: { title: PATH_TITLE, slug: PATH_SLUG, description: pathDescription, overview: `${courseIntroMd}\n\n${courseFooterMd}`, level: 'beginner', difficulty: 'beginner', category: 'Kiberxavfsizlik (1-oylik to‘liq kurs)', moduleSlugs: moduleSlugs, certificateType: 'course_completion', certificateTitle: 'CTF.UZ — NTFK1 1 Certificate', order: 0, isActive: true }
    }, { upsert: true, new: true });

    console.log(`✅ [${label}] MUVAFFAQIYATLI SAQLANDI! Modullar: 5 ta | Darslar: ${globalLessonNum} ta | Savollar: ${totalQuestionsSaved} ta`);
    await mongoose.disconnect();
}

async function run() {
    const mdFilePath = path.join(__dirname, 'CTF-UZ_Kiberxavfsizlik_1-oy_Kirish_yoli.md');
    if (!fs.existsSync(mdFilePath)) throw new Error('MD fayl topilmadi!');
    const rawMd = fs.readFileSync(mdFilePath, 'utf8').replace(/\r\n/g, '\n');
    const footerSplit = rawMd.split(/\n(?=## Yakuniy baholash va sertifikat mezonlari)/);
    const mainMd = footerSplit[0];
    const courseFooterMd = footerSplit[1] ? footerSplit[1].trim() : '';
    const modParts = mainMd.split(/\n(?=## \d+-MODUL\.)/);
    const courseIntroMd = modParts[0].trim();
    const moduleBlocks = modParts.slice(1);

    const ATLAS_URI = "mongodb+srv://ctfuz_admin:AKKSAVDON137@ctf-uz-cluster.vtjol3t.mongodb.net/ctf-uz?retryWrites=true&w=majority";
    await seedToDatabase(ATLAS_URI, 'RENDER PRODUCTION (MongoDB Atlas)', courseIntroMd, courseFooterMd, moduleBlocks);
    console.log('\n🎉 BARCHA IMPORT VA TEKSHIRUVLAR 100% YAKUNLANDI!');
}

run().catch(err => { console.error('❌ Xatolik:', err); process.exit(1); });
