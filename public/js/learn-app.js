let csrfToken = null;
let activePathSlug = null;
let activePathObj = null;
let activeModuleSlug = null;
let activeLessonObj = null;

function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

async function getCsrf() {
    if (csrfToken) return csrfToken;
    try {
        const r = await fetch('/api/csrf-token', { credentials: 'include' });
        const d = await r.json();
        csrfToken = d.csrfToken;
        return csrfToken;
    } catch (e) {
        return '';
    }
}

function showView(viewId) {
    document.querySelectorAll('.learn-view').forEach(v => v.classList.remove('active'));
    const target = document.getElementById(viewId);
    if (target) target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function loadPathsList() {
    const grid = document.getElementById('paths-grid');
    if (!grid) return;
    try {
        const res = await fetch('/api/learn/paths', { credentials: 'include' });
        const data = await res.json();

        if (!data.success || !data.paths || data.paths.length === 0) {
            grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 60px; color: var(--text-muted);">Hozircha o`quv yo`llari mavjud emas.</div>';
            return;
        }

        grid.innerHTML = data.paths.map(p => {
            const st = p.userState || {};
            const pct = st.progressPercent || 0;
            const isCertified = !!st.isCompletedAndCertified;
            const statusLabel = isCertified ? "Yo'l to'liq tugatilgan" : (st.enrolled ? "Jarayonda" : "Yangi yo'nalish");
            const actionLabel = isCertified ? "SERTIFIKATNI KO'RISH" : (st.enrolled ? "DAVOM ETTIRISH" : "YO'LNI BOSHLASH");

            return `
            <div class="challenge-card ${isCertified ? 'solved' : ''} fade-in-up" style="display:flex; flex-direction:column; justify-content:space-between; cursor:pointer;" onclick="enterPath('${escapeHtml(p.slug)}')">
                <div>
                    <div class="challenge-header" style="margin-bottom: 12px;">
                        <div class="challenge-title">${escapeHtml(p.title)}</div>
                        <span class="badge badge-${p.level === 'Beginner' ? 'easy' : 'medium'}">${escapeHtml(p.level)}</span>
                    </div>

                    <div class="challenge-meta" style="margin-bottom: 14px;">
                        <span class="badge badge-web">${p.modulesCount || 0} modul</span>
                        <span class="badge badge-crypto">${st.totalLessons || 0} dars</span>
                        ${isCertified ? `
                            <span class="badge badge-easy" style="display:inline-flex;align-items:center;gap:4px;">
                                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="width:12px;height:12px;"><polyline points="20 6 9 17 4 12"/></svg>
                                SERTIFIKAT OLINGAN
                            </span>
                        ` : ''}
                    </div>

                    <div class="challenge-story" style="margin-bottom: 16px;">${escapeHtml(p.description || p.subtitle)}</div>
                </div>

                <div>
                    <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:#94A3B8; font-family:'JetBrains Mono',monospace;">
                        <span>Progress</span>
                        <span style="color:#4A7FFF; font-weight:700;">${pct}%</span>
                    </div>
                    <div class="prog-track">
                        <div class="prog-bar-fill" style="width:${pct}%;"></div>
                    </div>

                    <div class="challenge-footer" style="margin-top: 14px;">
                        <span style="color: var(--text-muted); font-size: 0.75rem;">${statusLabel}</span>
                        <span style="color: var(--uz-blue); font-weight: 700; font-size: 0.85rem; display: flex; align-items: center; gap: 6px;">
                            ${actionLabel}
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:14px;height:14px;">
                                <path d="M5 12h14M12 5l7 7-7 7"/>
                            </svg>
                        </span>
                    </div>
                </div>
            </div>`;
        }).join('');
    } catch (e) {
        console.error('loadPathsList error:', e);
    }
}

async function enterPath(slug) {
    activePathSlug = slug;
    const token = await getCsrf();
    await fetch(`/api/learn/paths/${encodeURIComponent(slug)}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': token },
        credentials: 'include'
    });

    const res = await fetch(`/api/learn/paths/${encodeURIComponent(slug)}`, { credentials: 'include' });
    const data = await res.json();
    if (!data.success) return alert(data.message || "Xatolik");

    activePathObj = data.path;
    renderPathDetail();
    showView('view-path-detail');
}

function backToCurrentPath() {
    if (activePathSlug) enterPath(activePathSlug);
    else showView('view-paths');
}

function renderPathDetail() {
    const p = activePathObj;
    const prog = p.progress || {};
    const hasCert = !!p.certificate;

    document.getElementById('path-header-meta').innerText =
        `MODULLAR: ${prog.completedModules || 0}/${prog.totalModules || 0}  |  DARSLAR: ${prog.completedLessons || 0}/${prog.totalLessons || 0}`;

    let certTopSection = '';
    if (hasCert) {
        const c = p.certificate;
        certTopSection = `
        <div class="cert-showcase">
            <div>
                <div style="display:inline-flex; align-items:center; gap:8px; color:#10B981; font-family:'JetBrains Mono',monospace; font-size:0.8rem; font-weight:700; text-transform:uppercase; margin-bottom:8px;">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:18px;height:18px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    USHBU O'QUV YO'LI TO'LIQ YAKUNLANGAN VA SERTIFIKATLANGAN
                </div>
                <h2 style="font-family:Manrope; font-size:1.6rem; color:#fff; margin-bottom:6px;">${escapeHtml(c.courseName)}</h2>
                <div style="color:#94A3B8; font-size:0.88rem; font-family:'JetBrains Mono',monospace;">
                    Sertifikat ID: <strong style="color:#22D3EE;">${escapeHtml(c.certId)}</strong> &middot; Natija: <strong style="color:#10B981;">${c.scorePercent}%</strong> &middot; Sana: ${new Date(c.issueDate).toLocaleDateString('uz-UZ')}
                </div>
            </div>
            <div style="display:flex; gap:12px; flex-wrap:wrap;">
                <a href="/verify-certificate/${escapeHtml(c.certId)}" class="btn btn-primary" style="display:inline-flex;align-items:center;gap:8px;">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    Sertifikatni ko'rish va Yuklab olish
                </a>
                <a href="/profile" class="btn btn-secondary">Profilda ko'rish</a>
            </div>
        </div>`;
    }

    const modulesList = p.modules || [];
    const modulesHtml = modulesList.map((m, idx) => {
        const isDone = m.isCompleted;
        const isLocked = m.isLocked;
        const btnText = isDone ? "Qayta ko'rish" : "Modulni boshlash";
        return `
        <div class="step-card ${isDone ? 'completed-item' : ''} ${isLocked ? 'locked-item' : ''}">
            <div style="display:flex; align-items:center; gap:18px;">
                <div class="step-num">
                    ${isDone
                        ? `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="width:20px;height:20px;"><polyline points="20 6 9 17 4 12"/></svg>`
                        : (isLocked
                            ? `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`
                            : `0${idx + 1}`)}
                </div>
                <div>
                    <div style="font-family:Manrope; font-size:1.15rem; font-weight:800; color:#fff; margin-bottom:4px;">${escapeHtml(m.title)}</div>
                    <div style="color:#94A3B8; font-size:0.85rem;">${escapeHtml(m.description || m.category)} &middot; <span style="font-family:'JetBrains Mono',monospace; color:#4A7FFF;">${m.completedLessons}/${m.totalLessons} dars yakunlangan</span></div>
                </div>
            </div>
            <div>
                ${isLocked
                    ? `<button class="btn btn-secondary btn-sm" disabled style="opacity:0.6;cursor:not-allowed;">Oldingi modulni tugating</button>`
                    : `<button class="btn ${isDone ? 'btn-secondary' : 'btn-primary'} btn-sm" onclick="enterModule('${escapeHtml(m.slug)}')" style="display:inline-flex;align-items:center;gap:6px;">
                        ${btnText}
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:14px;height:14px;"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                       </button>`}
            </div>
        </div>`;
    }).join('');

    const canStartExam = prog.allModulesCompleted;
    const examCardHtml = `
    <div class="step-card ${hasCert ? 'completed-item' : (!canStartExam ? 'locked-item' : '')}" style="border-width: 2px; margin-top: 24px;">
        <div style="display:flex; align-items:center; gap:18px;">
            <div class="step-num" style="background:rgba(245,158,11,0.15); border-color:rgba(245,158,11,0.4); color:#F59E0B;">
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="width:22px;height:22px;">
                    <path d="M6 9H4a2 2 0 0 1-2-2V5h4M18 9h2a2 2 0 0 0 2-2V5h-4M6 5h12v6a6 6 0 0 1-12 0V5zM12 17v3M8 21h8"/>
                </svg>
            </div>
            <div>
                <div style="font-family:Manrope; font-size:1.2rem; font-weight:800; color:#fff; margin-bottom:4px;">Yakuniy Sertifikat Imtihoni</div>
                <div style="color:#94A3B8; font-size:0.85rem;">
                    O'tish bali: <strong style="color:#F59E0B;">${p.finalExamMinPercent || 80}%</strong> &middot; Savollar soni: ${(p.finalQuestions || []).length} ta
                </div>
            </div>
        </div>
        <div>
            ${!canStartExam
                ? `<button class="btn btn-secondary btn-sm" disabled style="cursor:not-allowed; display:inline-flex; align-items:center; gap:6px;">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    Barcha modullarni tugating
                   </button>`
                : `<button class="btn btn-primary btn-sm" onclick="openFinalExamView()" style="background:#F59E0B; color:#060B18; font-weight:800;">
                    Imtihonni boshlash
                   </button>`}
        </div>
    </div>`;

    const emptyModMsg = '<div style="padding:30px; text-align:center; color:#64748B;">Ushbu yo`lga hali modullar qo`shilmagan.</div>';

    document.getElementById('path-detail-container').innerHTML = `
        <div style="margin-bottom: 24px;">
            <h1 style="font-family:Manrope; font-size:2rem; margin-bottom:8px;">${escapeHtml(p.title)}</h1>
            <p style="color:var(--text-secondary);">${escapeHtml(p.description)}</p>
        </div>

        ${certTopSection}

        <div class="completed-path-wrapper">
            ${hasCert ? `
                <div class="completed-lock-overlay">
                    <div class="completed-lock-badge">
                        <div style="width:52px; height:52px; border-radius:50%; background:rgba(16,185,129,0.18); border:1px solid rgba(16,185,129,0.5); display:flex; align-items:center; justify-content:center; margin:0 auto 14px; color:#10B981;">
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:26px;height:26px;">
                                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                            </svg>
                        </div>
                        <h3 style="font-family:Manrope; font-size:1.35rem; color:#fff; margin-bottom:8px;">Yo'l muvaffaqiyatli tugatilgan</h3>
                        <p style="color:#94A3B8; font-size:0.88rem; line-height:1.6; margin-bottom:18px;">
                            Siz ushbu o'quv yo'lining barcha modullarini va yakuniy imtihonini topshirib, rasmiy sertifikatni qo'lga kiritgansiz.
                        </p>
                        <a href="/verify-certificate/${escapeHtml(p.certificate.certId)}" class="btn btn-primary btn-sm">Sertifikatni ochish</a>
                    </div>
                </div>
            ` : ''}

            <div class="${hasCert ? 'completed-path-blur' : ''}">
                <h3 style="font-family:Manrope; font-size:1.1rem; color:#94A3B8; text-transform:uppercase; letter-spacing:1px; margin-bottom:16px;">O'quv Modullari</h3>
                ${modulesHtml || emptyModMsg}
                ${examCardHtml}
            </div>
        </div>
    `;
}

function enterModule(moduleSlug) {
    activeModuleSlug = moduleSlug;
    const m = (activePathObj?.modules || []).find(item => item.slug === moduleSlug);
    if (!m) return;

    document.getElementById('module-header-meta').innerText =
        `MODUL DARSLARI: ${m.completedLessons}/${m.totalLessons}`;

    const lessonsHtml = (m.lessons || []).map((l, i) => {
        const btnText = l.completed ? "Qayta o'qish" : "Darsni boshlash";
        return `
        <div class="step-card ${l.completed ? 'completed-item' : ''} ${l.locked ? 'locked-item' : ''}">
            <div style="display:flex; align-items:center; gap:16px;">
                <div class="step-num">
                    ${l.completed
                        ? `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="width:18px;height:18px;"><polyline points="20 6 9 17 4 12"/></svg>`
                        : (i + 1)}
                </div>
                <div>
                    <div style="font-family:Manrope; font-size:1.1rem; font-weight:700; color:#fff; margin-bottom:4px;">${escapeHtml(l.title)}</div>
                    <div style="font-size:0.8rem; color:#94A3B8; font-family:'JetBrains Mono',monospace;">
                        Davomiyligi: ${l.duration || 15} daqiqa &middot; Savollar: ${l.questionsCount || 0} ta &middot; Mukofot: ${l.xpReward || 50} XP
                    </div>
                </div>
            </div>
            <div>
                ${l.locked
                    ? `<button class="btn btn-secondary btn-sm" disabled style="cursor:not-allowed;">Oldingi darsni tugating</button>`
                    : `<button class="btn ${l.completed ? 'btn-secondary' : 'btn-primary'} btn-sm" onclick="enterLesson('${escapeHtml(l.slug)}')">${btnText}</button>`}
            </div>
        </div>`;
    }).join('');

    const emptyLesMsg = '<div style="padding:30px;text-align:center;color:#64748B;">Bu modulda hozircha darslar mavjud emas.</div>';

    document.getElementById('module-detail-container').innerHTML = `
        <div style="margin-bottom: 24px;">
            <span class="badge badge-web" style="margin-bottom:8px;">MODUL</span>
            <h1 style="font-family:Manrope; font-size:1.85rem; margin-bottom:6px;">${escapeHtml(m.title)}</h1>
            <p style="color:var(--text-secondary);">${escapeHtml(m.description || '')}</p>
        </div>
        <div>${lessonsHtml || emptyLesMsg}</div>
    `;
    showView('view-module-detail');
}

async function backToCurrentModule() {
    if (!activePathSlug || !activeModuleSlug) return backToCurrentPath();
    const res = await fetch(`/api/learn/paths/${encodeURIComponent(activePathSlug)}`, { credentials: 'include' });
    const data = await res.json();
    if (data.success) {
        activePathObj = data.path;
        const currentMod = (activePathObj.modules || []).find(m => m.slug === activeModuleSlug);
        if (currentMod && currentMod.isCompleted) {
            renderPathDetail();
            showView('view-path-detail');
            return;
        }
        enterModule(activeModuleSlug);
    }
}

async function enterLesson(lessonSlug) {
    const res = await fetch(`/api/learn/lesson/${encodeURIComponent(lessonSlug)}`, { credentials: 'include' });
    const data = await res.json();
    if (!data.success) return alert(data.message || "Dars yuklanmadi");

    activeLessonObj = data;
    renderLessonView();
    showView('view-lesson-detail');
}

function renderLessonView() {
    const l = activeLessonObj.lesson;
    const questions = activeLessonObj.questions || [];
    const answeredSet = new Set((activeLessonObj.progress && activeLessonObj.progress.answeredQuestions) || []);

    document.getElementById('lesson-header-meta').innerText =
        `SAVOLLAR: ${answeredSet.size}/${questions.length} YECHILGAN`;

    let questionsHtml = '';
    if (questions.length === 0) {
        questionsHtml = `
            <div class="question-box" style="text-align:center;">
                <p style="color:#94A3B8; margin-bottom:14px;">Ushbu mavzu bo'yicha nazariy ma'lumotni o'qib bo'lgan bo'lsangiz, darsni yakunlang.</p>
                <button class="btn btn-primary" onclick="submitAnswer('${l._id}', null)">Darsni yakunlash va qaytish</button>
            </div>`;
    } else {
        questionsHtml = questions.map((q, idx) => {
            const isSolved = answeredSet.has(q._id);
            return `
            <div class="question-box ${isSolved ? 'solved-q' : ''}" id="qbox-${q._id}">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <strong style="color:#fff; font-size:1rem;">Savol #${idx + 1}: ${escapeHtml(q.prompt)}</strong>
                    <span class="badge ${isSolved ? 'badge-easy' : 'badge-web'}">${isSolved ? 'YECHILGAN' : (q.points + ' XP')}</span>
                </div>
                <div style="display:flex; gap:10px; flex-wrap:wrap;">
                    <input type="text" class="q-input" id="qinput-${q._id}" placeholder="Javobni kiriting..." ${isSolved ? 'disabled value="Javob tasdiqlangan"' : ''}>
                    ${!isSolved ? `<button class="btn btn-primary" onclick="submitAnswer('${l._id}', '${q._id}')">Tekshirish</button>` : ''}
                </div>
                <div id="qmsg-${q._id}" style="margin-top:8px; font-size:0.84rem; font-weight:600;"></div>
            </div>`;
        }).join('');
    }

    document.getElementById('lesson-detail-container').innerHTML = `
        <div class="lesson-reader">
            <h1 style="font-family:Manrope; font-size:1.8rem; color:#fff; margin-bottom:16px; padding-bottom:14px; border-bottom:1px solid rgba(74,127,255,0.16);">${escapeHtml(l.title)}</h1>
            <div>${l.content || `<p>${escapeHtml(l.description)}</p>`}</div>
        </div>

        <h3 style="font-family:Manrope; font-size:1.25rem; color:#fff; margin-bottom:16px;">Mavzu bo'yicha topshiriq va savollar</h3>
        ${questionsHtml}
    `;
}

async function submitAnswer(lessonId, questionId) {
    const inputEl = questionId ? document.getElementById('qinput-' + questionId) : null;
    const msgEl = questionId ? document.getElementById('qmsg-' + questionId) : null;
    const answer = inputEl ? inputEl.value.trim() : '';

    if (questionId && !answer) {
        if (msgEl) { msgEl.style.color = '#EF4444'; msgEl.innerText = "Javobni kiriting!"; }
        return;
    }

    const token = await getCsrf();
    const res = await fetch('/api/learn/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': token },
        credentials: 'include',
        body: JSON.stringify({ lessonId, questionId, answer })
    });
    const data = await res.json();

    if (!data.correct) {
        if (msgEl) { msgEl.style.color = '#EF4444'; msgEl.innerText = data.message || "Javob xato!"; }
        else alert(data.message || "Javob xato");
        return;
    }

    if (msgEl) { msgEl.style.color = '#10B981'; msgEl.innerText = data.message; }

    if (data.lessonCompleted) {
        setTimeout(() => {
            backToCurrentModule();
        }, 650);
    } else {
        enterLesson(activeLessonObj.lesson.slug);
    }
}

// YANGILANGAN VA KAFOLATLANGAN IMTIHON LOGIKASI
function openFinalExamView() {
    if (!activePathObj) return;
    const qs = activePathObj.finalQuestions || [];

    const qsHtml = qs.map((q, i) => {
        const qIdStr = escapeHtml(q.id || (q._id ? q._id.toString() : ''));
        return `
        <div class="question-box" style="margin-bottom: 20px;">
            <div style="font-weight:700; color:#fff; font-size:1.05rem; margin-bottom:12px;">
                ${i + 1}. ${escapeHtml(q.prompt)}
            </div>
            <div style="display:flex; flex-direction:column; gap:10px;">
                ${(q.options && q.options.length > 0)
                    ? q.options.map((opt, optIdx) => `
                        <label class="exam-opt" style="display:flex; align-items:center; gap:12px; cursor:pointer; background:#060B18; padding:12px; border:1px solid rgba(74,127,255,0.2); border-radius:8px;">
                            <input type="radio" name="exam_q_${qIdStr}" value="${optIdx}" style="width:18px;height:18px;">
                            <span style="color:#E2E8F0;">${escapeHtml(opt)}</span>
                        </label>
                    `).join('')
                    : `<input type="text" class="q-input" data-exam-qid="${qIdStr}" placeholder="Javobingizni yozing...">`
                }
            </div>
        </div>
        `;
    }).join('');

    document.getElementById('exam-detail-container').innerHTML = `
        <div class="lesson-reader" style="margin-bottom:24px;">
            <h2 style="margin-top:0;">${escapeHtml(activePathObj.title)} — Yakuniy Imtihon</h2>
            <p style="color:#94A3B8;">Sertifikat olish uchun kamida <strong>${activePathObj.finalExamMinPercent || 80}%</strong> to'plashingiz lozim.</p>
        </div>
        ${qsHtml}
        <button class="btn btn-primary" style="width:100%; padding:16px; font-size:1.05rem; margin-top:20px; font-weight:800;" onclick="submitFinalExamAnswers()">
            Imtihonni yakunlash va Sertifikat olish
        </button>
    `;
    showView('view-final-exam');
}

async function submitFinalExamAnswers() {
    if (!activePathObj) return;
    const answers = {};
    (activePathObj.finalQuestions || []).forEach((q, i) => {
        const qIdStr = q.id || (q._id ? q._id.toString() : '');
        
        let rFallback = document.querySelectorAll(`input[name="exam_q_${i}"]:checked`);
        if (rFallback.length > 0) {
            answers[i] = rFallback[0].value;
            answers[qIdStr] = rFallback[0].value;
        } else {
            let rStr = document.querySelectorAll(`input[name="exam_q_${qIdStr}"]:checked`);
            if (rStr.length > 0) {
                answers[i] = rStr[0].value;
                answers[qIdStr] = rStr[0].value;
            } else {
                let txt = document.querySelector(`input[data-exam-qid="${i}"]`);
                if (!txt) txt = document.querySelector(`input[data-exam-qid="${qIdStr}"]`);
                if (txt) {
                    answers[i] = txt.value;
                    answers[qIdStr] = txt.value;
                }
            }
        }
    });

    const token = await getCsrf();
    const res = await fetch(`/api/learn/paths/${encodeURIComponent(activePathObj.slug)}/final-assessment/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': token },
        credentials: 'include',
        body: JSON.stringify({ answers })
    });
    const data = await res.json();

    if (data.passed && data.certificate) {
        // MUHIM QISM: Sertifikat tasdiqlangach to'g'ridan-to'g'ri o'sha sahifaga yo'naltiramiz
        window.location.href = data.certificate.verifyUrl || `/verify-certificate/${data.certificate.certId}`;
    } else if (data.passed) {
        alert(data.message);
        await enterPath(activePathObj.slug);
    } else {
        alert(data.message);
    }
}

window.addEventListener('load', async () => {
    try {
        const authRes = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' });
        if (!authRes.ok) { window.location.replace('/welcome'); return; }
        const authData = await authRes.json();
        if (!authData.success || !authData.user) { window.location.replace('/welcome'); return; }

        const authLink = document.getElementById('auth-link');
        if (authLink) {
            authLink.innerHTML = `<img src="${authData.user.avatar || '/assets/default-avatar.svg'}" style="width:22px;height:22px;border-radius:50%;object-fit:cover;vertical-align:middle;margin-right:6px;border:1px solid #2563EB;" onerror="this.src='/assets/default-avatar.svg'">${authData.user.username}`;
        }
    } catch (e) {
        window.location.replace('/welcome');
        return;
    }
    loadPathsList();
});
