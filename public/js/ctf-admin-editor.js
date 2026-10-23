document.addEventListener('DOMContentLoaded', () => {
    // 1. SPA sahifa yangilanishini to'xtatish
    const originalReload = window.location.reload;
    window.location.reload = function() {
        const cancelBtn = document.getElementById('btn-cancel-custom');
        if(cancelBtn) {
            const modalBody = cancelBtn.closest('.modal') || cancelBtn.closest('div[style*="fixed"]') || document.querySelector('.fixed');
            if (modalBody) modalBody.style.display = 'none';
            if (window.showPage) window.showPage('challenges');
            
            const inputs = document.querySelectorAll('#ch-title, #ch-points, #ch-flag, #ch-desc, #ch-hints, #ch-file');
            inputs.forEach(inp => { if(inp) inp.value = ''; });
            const title = document.getElementById('ch-title');
            if(title) title.removeAttribute('data-id');
        } else {
            originalReload.call(window.location);
        }
    };

    // 2. Modal oynani to'liq qayta qurish (Juda kuchli qidiruv bilan)
    setInterval(() => {
        // Jadval ichida bo'lmagan (faqat modaldagi) FLAG yoki BALL yozuvini qidiramiz
        const targetLabel = Array.from(document.querySelectorAll('label, div, span, p')).find(l => 
            (l.innerText.trim().toUpperCase() === 'FLAG' || l.innerText.trim().toUpperCase() === 'BALL') && 
            !l.closest('table')
        );

        if (targetLabel && !document.getElementById('ch-file')) {
            const modalForm = targetLabel.closest('form') || targetLabel.closest('.p-6') || targetLabel.parentElement.parentElement;
            
            if (modalForm) {
                modalForm.innerHTML = `
                    <div style="display:flex; flex-direction:column; gap:12px; text-align:left;">
                        <div>
                            <label style="font-size:12px; color:#94a3b8; font-weight:700;">CHALLENGE NOMI</label>
                            <input type="text" id="ch-title" placeholder="Masalan: SQL Injection 101" style="width:100%; padding:10px; background:#060B18; border:1px solid #1e293b; border-radius:6px; color:#fff; margin-top:4px;">
                        </div>
                        
                        <div style="display:flex; gap:12px;">
                            <div style="flex:1;">
                                <label style="font-size:12px; color:#94a3b8; font-weight:700;">KATEGORIYA</label>
                                <select id="ch-category" style="width:100%; padding:10px; background:#060B18; border:1px solid #1e293b; border-radius:6px; color:#fff; margin-top:4px;">
                                    <option value="Web">Web</option>
                                    <option value="Crypto">Crypto</option>
                                    <option value="Pwn">Pwn</option>
                                    <option value="Reverse">Reverse</option>
                                    <option value="Forensics">Forensics</option>
                                    <option value="Misc">Misc</option>
                                    <option value="OSINT">OSINT</option>
                                </select>
                            </div>
                            <div style="flex:1;">
                                <label style="font-size:12px; color:#94a3b8; font-weight:700;">QIYINLIK</label>
                                <select id="ch-difficulty" style="width:100%; padding:10px; background:#060B18; border:1px solid #1e293b; border-radius:6px; color:#fff; margin-top:4px;">
                                    <option value="Easy">Easy</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Hard">Hard</option>
                                    <option value="Insane">Insane</option>
                                </select>
                            </div>
                        </div>

                        <div style="display:flex; gap:12px;">
                            <div style="flex:1;">
                                <label style="font-size:12px; color:#94a3b8; font-weight:700;">BALL (POINTS)</label>
                                <input type="number" id="ch-points" value="100" style="width:100%; padding:10px; background:#060B18; border:1px solid #1e293b; border-radius:6px; color:#fff; margin-top:4px;">
                            </div>
                            <div style="flex:1;">
                                <label style="font-size:12px; color:#94a3b8; font-weight:700;">FLAG (JAVOB)</label>
                                <input type="text" id="ch-flag" placeholder="CTF{...}" style="width:100%; padding:10px; background:#060B18; border:1px solid #1e293b; border-radius:6px; color:#fff; margin-top:4px;">
                            </div>
                        </div>

                        <div>
                            <label style="font-size:12px; color:#94a3b8; font-weight:700;">TAVSIF (SHARTLAR)</label>
                            <textarea id="ch-desc" rows="3" placeholder="Challenge vazifasini yozing..." style="width:100%; padding:10px; background:#060B18; border:1px solid #1e293b; border-radius:6px; color:#fff; margin-top:4px;"></textarea>
                        </div>

                        <div>
                            <label style="font-size:12px; color:#94a3b8; font-weight:700;">MASLAHATLAR (Har biri yangi qatorda)</label>
                            <textarea id="ch-hints" rows="2" placeholder="Maslahatlar..." style="width:100%; padding:10px; background:#060B18; border:1px solid #1e293b; border-radius:6px; color:#fff; margin-top:4px;"></textarea>
                        </div>

                        <div>
                            <label style="font-size:12px; color:#94a3b8; font-weight:700;">FAYL YUKLASH (Zip, Png, Pdf...)</label>
                            <input type="file" id="ch-file" style="width:100%; padding:8px; background:#060B18; border:1px dashed #2563eb; border-radius:6px; color:#fff; margin-top:4px;">
                        </div>

                        <label style="display:flex; align-items:center; gap:8px; cursor:pointer; color:#e2e8f0; font-size:14px; margin-top:4px;">
                            <input type="checkbox" id="ch-publish" value="true" checked style="width:16px; height:16px; accent-color:#2563eb;">
                            Darhol Arenada e'lon qilish
                        </label>

                        <div style="display:flex; gap:10px; margin-top:15px;">
                            <button id="btn-save-custom" style="flex:1; padding:12px; background:#2563eb; color:#fff; border:none; border-radius:6px; font-weight:700; cursor:pointer;">Saqlash</button>
                            <button id="btn-cancel-custom" type="button" style="flex:1; padding:12px; background:#1e293b; color:#fff; border:none; border-radius:6px; font-weight:700; cursor:pointer;">Bekor qilish</button>
                        </div>
                    </div>
                `;

                // Eski yashiringan original tugmalarni qidirib olib tashlaymiz
                const oldBtns = modalForm.parentElement.querySelectorAll('button');
                oldBtns.forEach(b => {
                    if(b.innerText.includes('Yaratish') || b.innerText.includes('Bekor')) b.style.display = 'none';
                });

                document.getElementById('btn-cancel-custom').onclick = () => window.location.reload();
                
                document.getElementById('btn-save-custom').onclick = async (e) => {
                    e.preventDefault();
                    const fd = new FormData();
                    fd.append('title', document.getElementById('ch-title').value);
                    fd.append('category', document.getElementById('ch-category').value);
                    fd.append('difficulty', document.getElementById('ch-difficulty').value);
                    fd.append('points', document.getElementById('ch-points').value);
                    fd.append('flag', document.getElementById('ch-flag').value);
                    fd.append('description', document.getElementById('ch-desc').value);
                    fd.append('hints', document.getElementById('ch-hints').value);
                    fd.append('isPublished', document.getElementById('ch-publish').checked);

                    const fileInput = document.getElementById('ch-file');
                    if (fileInput && fileInput.files.length > 0) {
                        fd.append('challengeFile', fileInput.files[0]);
                    }

                    const chId = document.getElementById('ch-title').dataset.id;
                    const url = chId ? `/api/admin/challenges/${chId}` : '/api/admin/challenges';
                    
                    try {
                        const csrfRes = await fetch('/api/csrf-token');
                        let csrfToken = '';
                        if (csrfRes.ok) {
                            const csrfData = await csrfRes.json();
                            csrfToken = csrfData.csrfToken || csrfData.token || '';
                        }
                        
                        const res = await fetch(url, {
                            method: chId ? 'PUT' : 'POST',
                            body: fd,
                            headers: { 'x-csrf-token': csrfToken, 'csrf-token': csrfToken }
                        });
                        const data = await res.json();
                        if(data.success) {
                            alert("✅ Muvaffaqiyatli saqlandi!");
                            window.location.reload();
                        } else {
                            alert("❌ Xatolik: " + (data.message || 'Noma\'lum xato'));
                        }
                    } catch(err) { alert("Server bilan aloqada xatolik yuz berdi."); }
                };
            }
        }

        // Tahrirlash (✏️) tugmalarini jadvalga uzluksiz biriktirish
        const rows = document.querySelectorAll('tbody tr, .table tbody tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length > 2) {
                const isCtf = Array.from(cells).some(c => 
                    ['WEB', 'CRYPTO', 'PWN', 'REVERSE', 'FORENSICS', 'MISC', 'OSINT'].includes(c.innerText.trim().toUpperCase())
                );
                if (isCtf) {
                    const lastCell = cells[cells.length - 1];
                    if (lastCell && !lastCell.querySelector('.btn-edit-ch')) {
                        const editBtn = document.createElement('button');
                        editBtn.className = 'btn-edit-ch';
                        editBtn.innerHTML = '✏️';
                        editBtn.style.marginRight = '10px';
                        editBtn.style.background = 'transparent';
                        editBtn.style.border = 'none';
                        editBtn.style.cursor = 'pointer';
                        editBtn.style.fontSize = '16px';
                        editBtn.title = "Tahrirlash";

                        editBtn.onclick = async (e) => {
                            e.preventDefault();
                            const chTitle = cells[1].innerText.trim();
                            
                            // Formani ochish
                            const newBtns = Array.from(document.querySelectorAll('button')).filter(b => b.innerText.includes('Yangi Challenge') || b.innerText.includes('Yangi'));
                            if (newBtns.length > 0) newBtns[newBtns.length - 1].click();

                            try {
                                const res = await fetch('/api/admin/challenges');
                                const data = await res.json();
                                if (data.challenges) {
                                    const ch = data.challenges.find(c => c.title && c.title.toLowerCase() === chTitle.toLowerCase());
                                    if (ch) {
                                        setTimeout(() => {
                                            const t = document.getElementById('ch-title');
                                            if(t) { t.value = ch.title || ''; t.dataset.id = ch._id || ch.id; }
                                            
                                            const p = document.getElementById('ch-points');
                                            if(p) p.value = ch.points || 100;
                                            
                                            const f = document.getElementById('ch-flag');
                                            if(f) f.value = ch.flag || '';
                                            
                                            const c = document.getElementById('ch-category');
                                            if(c && ch.category) c.value = ch.category;

                                            const diff = document.getElementById('ch-difficulty');
                                            if(diff && ch.difficulty) diff.value = ch.difficulty;

                                            const desc = document.getElementById('ch-desc');
                                            if(desc) desc.value = ch.story || ch.description || '';

                                            const hints = document.getElementById('ch-hints');
                                            if(hints) hints.value = Array.isArray(ch.hints) ? ch.hints.map(h => h.text || h).join('
') : (ch.hints || '');

                                            const pub = document.getElementById('ch-publish');
                                            if(pub) pub.checked = ch.status === 'live' || ch.isPublished;
                                        }, 200);
                                    }
                                }
                            } catch (err) {}
                        };
                        lastCell.insertBefore(editBtn, lastCell.firstChild);
                    }
                }
            }
        });
    }, 300); // 0.3 soniyada bir tekshirib formani yangilab qo'yadi
});