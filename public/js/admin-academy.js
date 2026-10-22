window.academyCache = { paths: [], modules: [], lessons: [], questions: [] };

function openAcademyModal(id) {
    if (id === 'adminPathModal') {
        document.getElementById('apEditId').value = '';
        document.getElementById('apSlug').value = '';
        document.getElementById('apTitle').value = '';
        document.getElementById('apSub').value = '';
        document.getElementById('apDesc').value = '';
        document.getElementById('apCertTitle').value = 'CTF.UZ Course Completion Certificate';
    } else if (id === 'adminModModal') {
        document.getElementById('amEditId').value = '';
        document.getElementById('amSlug').value = '';
        document.getElementById('amTitle').value = '';
        document.getElementById('amDesc').value = '';
    } else if (id === 'adminLesModal') {
        document.getElementById('alEditId').value = '';
        document.getElementById('alSlug').value = '';
        document.getElementById('alTitle').value = '';
        document.getElementById('alDesc').value = '';
        document.getElementById('alContent').value = '';
    }
    const el = document.getElementById(id);
    if (el) el.classList.add('open');
}

function closeAcademyModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('open');
}

async function loadAcademyAdminData() {
    const wrap = document.getElementById('adminAcademyWrap') || document.getElementById('academyBody');
    if (!wrap) return;
    wrap.innerHTML = '<div class="spinner"></div>';

    try {
        const res = await fetch('/api/learn/academy/all', { credentials: 'include' }).then(r => r.json());
        if (!res.success) {
            wrap.innerHTML = `<div style="color:var(--red);text-align:center;">${res.message || 'Xatolik'}</div>`;
            return;
        }
        window.academyCache = res;

        const pathSel = document.getElementById('amPathSlug');
        if (pathSel) pathSel.innerHTML = res.paths.map(p => `<option value="${esc(p.slug)}">${esc(p.title)}</option>`).join('');

        const modSel = document.getElementById('alModSlug');
        if (modSel) modSel.innerHTML = res.modules.map(m => `<option value="${esc(m.slug)}">${esc(m.title)} (${esc(m.pathSlug)})</option>`).join('');

        let html = '';
        res.paths.forEach(p => {
            const pMods = res.modules.filter(m => m.pathSlug === p.slug || (p.moduleSlugs || []).includes(m.slug));
            const examQs = p.finalQuestions || [];

            html += `
            <div style="background:var(--card); border:1px solid var(--border-h); border-radius:14px; padding:22px; margin-bottom:18px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px; flex-wrap:wrap; border-bottom:1px solid var(--border); padding-bottom:14px; margin-bottom:16px;">
                    <div>
                        <span class="badge b-blue">${esc(p.level)}</span>
                        <span class="badge b-gold">Min Ball: ${p.finalExamMinPercent || 80}%</span>
                        <h3 style="color:#fff; font-size:1.35rem; margin-top:6px;">${esc(p.title)} <span style="font-size:0.8rem; color:var(--text3); font-family:JetBrains Mono;">(${esc(p.slug)})</span></h3>
                        <div style="color:var(--text2); font-size:0.82rem; margin-top:4px;">Sertifikat: ${esc(p.certificateTitle)}</div>
                    </div>
                    <div style="display:flex; gap:8px; flex-wrap:wrap;">
                        <button class="btn btn-sm btn-primary" onclick="openModModalForPath('${esc(p.slug)}')">+ Modul qo'shish</button>
                        <button class="btn btn-sm btn-secondary" onclick="openExamQModal('${p._id}')">+ Imtihon savoli</button>
                        <button class="btn btn-sm btn-secondary" onclick="editPathModal('${p._id}')">Tahrirlash</button>
                        <button class="btn btn-sm" style="background:rgba(239,68,68,0.15);color:#EF4444;" onclick="deleteAcademyItem('paths', '${p._id}')">O'chirish</button>
                    </div>
                </div>

                <div style="display:flex; flex-direction:column; gap:12px;">
                    ${pMods.length === 0 ? '<div style="color:var(--text3);font-size:0.85rem;">Modullar mavjud emas.</div>' : ''}
                    ${pMods.map(m => {
                        const mLess = res.lessons.filter(l => l.moduleSlug === m.slug);
                        return `
                        <div style="background:var(--bg2); border:1px solid var(--border); border-radius:12px; padding:16px;">
                            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
                                <div>
                                    <strong style="color:var(--cyan); font-size:1.05rem;">Modul #${m.order || 1}: ${esc(m.title)}</strong>
                                    <span style="font-size:0.75rem; color:var(--text3); font-family:JetBrains Mono;"> (${esc(m.slug)})</span>
                                </div>
                                <div style="display:flex; gap:8px;">
                                    <button class="btn btn-sm btn-primary" onclick="openLesModalForMod('${esc(m.slug)}')">+ Dars qo'shish</button>
                                    <button class="btn btn-sm btn-secondary" onclick="editModModal('${m._id}')">Tahrirlash</button>
                                    <button class="btn btn-sm" style="background:rgba(239,68,68,0.15);color:#EF4444;" onclick="deleteAcademyItem('modules', '${m._id}')">O'chirish</button>
                                </div>
                            </div>

                            <div style="display:flex; flex-direction:column; gap:8px; padding-left:12px; border-left:2px solid rgba(74,127,255,0.2);">
                                ${mLess.length === 0 ? '<div style="color:var(--text3);font-size:0.8rem;">Darslar mavjud emas.</div>' : ''}
                                ${mLess.map(l => {
                                    const lQs = res.questions.filter(q => String(q.lessonId) === String(l._id));
                                    return `
                                    <div style="background:#060B18; border:1px solid var(--border); border-radius:10px; padding:12px;">
                                        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                                            <div>
                                                <strong style="color:#fff;">Dars #${l.order || 1}: ${esc(l.title)}</strong>
                                                <span style="font-size:0.75rem; color:var(--text3); font-family:JetBrains Mono;"> (${l.duration || 15} daqiqa | ${l.xpReward || 50} XP)</span>
                                            </div>
                                            <div style="display:flex; gap:6px;">
                                                <button class="btn btn-sm" style="background:rgba(16,185,129,0.15);color:#10B981;" onclick="openQuesModal('${l._id}')">+ Savol</button>
                                                <button class="btn btn-sm btn-secondary" onclick="editLesModal('${l._id}')">Tahrirlash</button>
                                                <button class="btn btn-sm" style="background:rgba(239,68,68,0.15);color:#EF4444;" onclick="deleteAcademyItem('lessons', '${l._id}')">O'chirish</button>
                                            </div>
                                        </div>
                                        ${lQs.length > 0 ? `
                                            <div style="margin-top:10px; padding-top:10px; border-top:1px dashed var(--border); display:grid; gap:6px;">
                                                ${lQs.map(q => `
                                                    <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.82rem; background:rgba(255,255,255,0.02); padding:6px 10px; border-radius:6px;">
                                                        <div><span style="color:var(--text2);">Savol: ${esc(q.prompt)}</span> <strong style="color:var(--green); font-family:JetBrains Mono;">[${esc((q.answers || []).join(', '))}]</strong></div>
                                                        <div style="display:flex; gap:6px;">
                                                            <button class="btn btn-sm btn-secondary" style="padding:3px 8px;" onclick="editQuesModal('${q._id}')">Tahrirlash</button>
                                                            <button class="btn btn-sm" style="padding:3px 8px;background:rgba(239,68,68,0.15);color:#EF4444;" onclick="deleteAcademyItem('questions', '${q._id}')">X</button>
                                                        </div>
                                                    </div>
                                                `).join('')}
                                            </div>
                                        ` : ''}
                                    </div>`;
                                }).join('')}
                            </div>
                        </div>`;
                    }).join('')}
                </div>

                <div style="margin-top:16px; padding:14px; background:#060B18; border:1px solid rgba(245,158,11,0.3); border-radius:12px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <strong style="color:var(--gold); font-size:0.9rem;">Yakuniy Imtihon Savollari (${examQs.length} ta)</strong>
                        <button class="btn btn-sm btn-secondary" onclick="openExamQModal('${p._id}')">+ Imtihon savoli qo'shish</button>
                    </div>
                    ${examQs.length === 0 ? '<div style="color:var(--text3);font-size:0.8rem;">Imtihon savollari mavjud emas.</div>' : ''}
                    <div style="display:grid; gap:6px;">
                        ${examQs.map(eq => `
                            <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.82rem; background:rgba(255,255,255,0.02); padding:8px 10px; border-radius:6px;">
                                <div>
                                    <div style="color:#fff;">${esc(eq.prompt)}</div>
                                    <div style="color:var(--text3); font-size:0.75rem;">Variantlar: ${esc((eq.options || []).join(' | '))} &rarr; <strong style="color:var(--green);">Javob: ${esc(eq.correctAnswer)}</strong></div>
                                </div>
                                <div style="display:flex; gap:6px;">
                                    <button class="btn btn-sm btn-secondary" style="padding:3px 8px;" onclick="editExamQModal('${p._id}', '${esc(eq.id)}')">Tahrirlash</button>
                                    <button class="btn btn-sm" style="padding:3px 8px;background:rgba(239,68,68,0.15);color:#EF4444;" onclick="deleteExamQues('${p._id}', '${esc(eq.id)}')">X</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>`;
        });

        wrap.innerHTML = html || '<div style="text-align:center;color:var(--text3);padding:40px;">Hozircha o`quv yo`llari mavjud emas.</div>';
    } catch (e) {
        wrap.innerHTML = `<div style="color:var(--red);text-align:center;">${e.message}</div>`;
    }
}

async function academyAdminFetch(url, method, body) {
    const token = await getCsrfToken();
    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': token },
        body: body ? JSON.stringify(body) : null,
        credentials: 'include'
    }).then(r => r.json());
    if (res.success) loadAcademyAdminData();
    else alert(res.message || "Xatolik");
    return res;
}

function editPathModal(id) {
    const p = window.academyCache.paths.find(x => x._id === id);
    if (!p) return;
    document.getElementById('apEditId').value = p._id;
    document.getElementById('apSlug').value = p.slug || '';
    document.getElementById('apTitle').value = p.title || '';
    document.getElementById('apSub').value = p.subtitle || '';
    document.getElementById('apDesc').value = p.description || '';
    document.getElementById('apLevel').value = p.level || 'Beginner';
    document.getElementById('apMin').value = p.finalExamMinPercent || 80;
    document.getElementById('apOrder').value = p.order || 1;
    document.getElementById('apCertTitle').value = p.certificateTitle || '';
    openAcademyModal('adminPathModal');
}

async function saveAdminPath() {
    const editId = document.getElementById('apEditId').value;
    const data = {
        slug: document.getElementById('apSlug').value,
        title: document.getElementById('apTitle').value,
        subtitle: document.getElementById('apSub').value,
        description: document.getElementById('apDesc').value,
        level: document.getElementById('apLevel').value,
        finalExamMinPercent: parseInt(document.getElementById('apMin').value) || 80,
        order: parseInt(document.getElementById('apOrder').value) || 1,
        certificateTitle: document.getElementById('apCertTitle').value
    };
    if (!data.slug || !data.title) return alert("Slug va sarlavha majburiy!");
    if (editId) await academyAdminFetch('/api/learn/academy/paths/' + editId, 'PUT', data);
    else await academyAdminFetch('/api/learn/academy/paths', 'POST', data);
    closeAcademyModal('adminPathModal');
}

function openModModalForPath(pathSlug) {
    document.getElementById('amEditId').value = '';
    document.getElementById('amPathSlug').value = pathSlug;
    document.getElementById('amSlug').value = '';
    document.getElementById('amTitle').value = '';
    document.getElementById('amDesc').value = '';
    const el = document.getElementById('adminModModal');
    if (el) el.classList.add('open');
}

function editModModal(id) {
    const m = window.academyCache.modules.find(x => x._id === id);
    if (!m) return;
    document.getElementById('amEditId').value = m._id;
    document.getElementById('amPathSlug').value = m.pathSlug || '';
    document.getElementById('amSlug').value = m.slug || '';
    document.getElementById('amTitle').value = m.title || '';
    document.getElementById('amDesc').value = m.description || '';
    document.getElementById('amCat').value = m.category || 'Cybersecurity';
    document.getElementById('amOrder').value = m.order || 1;
    const el = document.getElementById('adminModModal');
    if (el) el.classList.add('open');
}

async function saveAdminMod() {
    const editId = document.getElementById('amEditId').value;
    const data = {
        pathSlug: document.getElementById('amPathSlug').value,
        slug: document.getElementById('amSlug').value,
        title: document.getElementById('amTitle').value,
        description: document.getElementById('amDesc').value,
        category: document.getElementById('amCat').value,
        order: parseInt(document.getElementById('amOrder').value) || 1
    };
    if (!data.slug || !data.title) return alert("Slug va sarlavha majburiy!");
    if (editId) await academyAdminFetch('/api/learn/academy/modules/' + editId, 'PUT', data);
    else await academyAdminFetch('/api/learn/academy/modules', 'POST', data);
    closeAcademyModal('adminModModal');
}

function openLesModalForMod(modSlug) {
    document.getElementById('alEditId').value = '';
    document.getElementById('alModSlug').value = modSlug;
    document.getElementById('alSlug').value = '';
    document.getElementById('alTitle').value = '';
    document.getElementById('alDesc').value = '';
    document.getElementById('alContent').value = '';
    const el = document.getElementById('adminLesModal');
    if (el) el.classList.add('open');
}

function editLesModal(id) {
    const l = window.academyCache.lessons.find(x => x._id === id);
    if (!l) return;
    document.getElementById('alEditId').value = l._id;
    document.getElementById('alModSlug').value = l.moduleSlug || '';
    document.getElementById('alSlug').value = l.slug || '';
    document.getElementById('alTitle').value = l.title || '';
    document.getElementById('alDesc').value = l.description || '';
    document.getElementById('alContent').value = l.content || '';
    document.getElementById('alDur').value = l.duration || 15;
    document.getElementById('alXP').value = l.xpReward || 50;
    document.getElementById('alOrder').value = l.order || 1;
    const el = document.getElementById('adminLesModal');
    if (el) el.classList.add('open');
}

async function saveAdminLes() {
    const editId = document.getElementById('alEditId').value;
    const data = {
        moduleSlug: document.getElementById('alModSlug').value,
        slug: document.getElementById('alSlug').value,
        title: document.getElementById('alTitle').value,
        description: document.getElementById('alDesc').value,
        content: document.getElementById('alContent').value,
        duration: parseInt(document.getElementById('alDur').value) || 15,
        xpReward: parseInt(document.getElementById('alXP').value) || 50,
        order: parseInt(document.getElementById('alOrder').value) || 1
    };
    if (!data.slug || !data.title) return alert("Slug va sarlavha majburiy!");
    if (editId) await academyAdminFetch('/api/learn/academy/lessons/' + editId, 'PUT', data);
    else await academyAdminFetch('/api/learn/academy/lessons', 'POST', data);
    closeAcademyModal('adminLesModal');
}

function openQuesModal(lessonId) {
    document.getElementById('aqEditId').value = '';
    document.getElementById('aqLessonId').value = lessonId;
    document.getElementById('aqPrompt').value = '';
    document.getElementById('aqAnswers').value = '';
    const el = document.getElementById('adminQModal');
    if (el) el.classList.add('open');
}

function editQuesModal(id) {
    const q = window.academyCache.questions.find(x => x._id === id);
    if (!q) return;
    document.getElementById('aqEditId').value = q._id;
    document.getElementById('aqLessonId').value = q.lessonId;
    document.getElementById('aqPrompt').value = q.prompt || '';
    document.getElementById('aqAnswers').value = (q.answers || []).join(', ');
    document.getElementById('aqPoints').value = q.points || 25;
    const el = document.getElementById('adminQModal');
    if (el) el.classList.add('open');
}

async function saveAdminQues() {
    const editId = document.getElementById('aqEditId').value;
    const data = {
        lessonId: document.getElementById('aqLessonId').value,
        prompt: document.getElementById('aqPrompt').value,
        answers: document.getElementById('aqAnswers').value,
        points: parseInt(document.getElementById('aqPoints').value) || 25
    };
    if (!data.prompt || !data.answers) return alert("Savol va javobni kiriting!");
    if (editId) await academyAdminFetch('/api/learn/academy/questions/' + editId, 'PUT', data);
    else await academyAdminFetch('/api/learn/academy/questions', 'POST', data);
    closeAcademyModal('adminQModal');
}

function openExamQModal(pathId) {
    document.getElementById('axPathId').value = pathId;
    document.getElementById('axEditQId').value = '';
    document.getElementById('axPrompt').value = '';
    document.getElementById('axOptions').value = '';
    document.getElementById('axCorrect').value = '';
    const el = document.getElementById('adminExamQModal');
    if (el) el.classList.add('open');
}

function editExamQModal(pathId, qId) {
    const p = window.academyCache.paths.find(x => x._id === pathId);
    if (!p) return;
    const eq = (p.finalQuestions || []).find(item => item.id === qId);
    if (!eq) return;
    document.getElementById('axPathId').value = pathId;
    document.getElementById('axEditQId').value = qId;
    document.getElementById('axPrompt').value = eq.prompt || '';
    document.getElementById('axOptions').value = (eq.options || []).join(', ');
    document.getElementById('axCorrect').value = eq.correctAnswer || '';
    document.getElementById('axPoints').value = eq.points || 25;
    const el = document.getElementById('adminExamQModal');
    if (el) el.classList.add('open');
}

async function saveAdminExamQues() {
    const pathId = document.getElementById('axPathId').value;
    const editQId = document.getElementById('axEditQId').value;
    const data = {
        prompt: document.getElementById('axPrompt').value,
        options: document.getElementById('axOptions').value,
        correctAnswer: document.getElementById('axCorrect').value,
        points: parseInt(document.getElementById('axPoints').value) || 25
    };
    if (!data.prompt || !data.correctAnswer) return alert("Savol va to'g'ri javob majburiy!");
    if (editQId) await academyAdminFetch(`/api/learn/academy/paths/${pathId}/exam-questions/${editQId}`, 'PUT', data);
    else await academyAdminFetch(`/api/learn/academy/paths/${pathId}/exam-questions`, 'POST', data);
    closeAcademyModal('adminExamQModal');
}

async function deleteExamQues(pathId, qId) {
    if (!confirm("Imtihon savolini o'chirasizmi?")) return;
    await academyAdminFetch(`/api/learn/academy/paths/${pathId}/exam-questions/${qId}`, 'DELETE');
}

async function deleteAcademyItem(type, id) {
    if (!confirm("Haqiqatan ham o'chirmoqchimisiz?")) return;
    await academyAdminFetch(`/api/learn/academy/${type}/${id}`, 'DELETE');
}

window.loadAcademy = loadAcademyAdminData;