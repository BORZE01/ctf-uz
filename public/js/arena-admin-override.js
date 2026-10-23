
// 1. Sahifa yuklanganda eski formni yangisiga almashtiramiz
window.addEventListener('load', () => {
    // Rasmdagi "CTF{...}" inputini qidirib topib, o'sha divni to'liq yangilaymiz
    const flagInput = document.querySelector('input[placeholder="CTF{...}"]');
    if (flagInput) {
        const modalBody = flagInput.closest('div'); 
        if (modalBody) {
            modalBody.innerHTML = `
                <div style="display:flex; flex-direction:column; gap:12px; text-align:left; padding:5px;">
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
                        <label style="font-size:12px; color:#94a3b8; font-weight:700;">MASLAHATLAR (Ixtiyoriy: Har bir hint alohida qatorda)</label>
                        <textarea id="ch-hints" rows="2" placeholder="Maslahatlar..." style="width:100%; padding:10px; background:#060B18; border:1px solid #1e293b; border-radius:6px; color:#fff; margin-top:4px;"></textarea>
                    </div>

                    <div>
                        <label style="font-size:12px; color:#94a3b8; font-weight:700;">FAYL YUKLASH (Zip, Txt, Pdf...)</label>
                        <input type="file" id="ch-file" style="width:100%; padding:8px; background:#060B18; border:1px dashed #2563eb; border-radius:6px; color:#fff; margin-top:4px;">
                    </div>

                    <label style="display:flex; align-items:center; gap:8px; cursor:pointer; color:#e2e8f0; font-size:14px; margin-top:4px;">
                        <input type="checkbox" id="ch-publish" value="true" checked style="width:16px; height:16px; accent-color:#2563eb;">
                        Darhol Arenada e'lon qilish
                    </label>

                    <div style="display:flex; gap:10px; margin-top:15px;">
                        <button id="btn-save-challenge" style="flex:1; padding:12px; background:#2563eb; color:#fff; border:none; border-radius:6px; font-weight:700; cursor:pointer;">Saqlash</button>
                        <button onclick="window.location.reload();" style="flex:1; padding:12px; background:#1e293b; color:#fff; border:none; border-radius:6px; font-weight:700; cursor:pointer;">Bekor qilish</button>
                    </div>
                </div>
            `;

            // Eski "Yaratish" tugmasi ikkita bo'lib qolmasligi uchun yashiramiz
            const oldButtons = modalBody.parentElement.querySelectorAll('button');
            oldButtons.forEach(btn => {
                if(btn.innerText.includes('Yaratish') || btn.innerText.includes('Bekor')) {
                    btn.style.display = 'none';
                }
            });

            // 2. Yangi yaratilgan saqlash tugmasiga FormData funksiyasini ulaymiz
            document.getElementById('btn-save-challenge').addEventListener('click', async () => {
                const formData = new FormData();
                formData.append('title', document.getElementById('ch-title').value);
                formData.append('category', document.getElementById('ch-category').value);
                formData.append('difficulty', document.getElementById('ch-difficulty').value);
                formData.append('points', document.getElementById('ch-points').value);
                formData.append('flag', document.getElementById('ch-flag').value);
                formData.append('description', document.getElementById('ch-desc').value);
                formData.append('hints', document.getElementById('ch-hints').value);
                formData.append('isPublished', document.getElementById('ch-publish').checked);

                const fileInput = document.getElementById('ch-file');
                if (fileInput && fileInput.files.length > 0) {
                    formData.append('challengeFile', fileInput.files[0]); // Fayl qo'shish
                }

                // Tahrirlash (Edit) yoki Yangi ekanligini ID bor-yo'qligidan aniqlaymiz
                const chId = document.getElementById('ch-title').dataset.id;
                const url = chId ? `/api/arena-admin/challenges/${chId}` : '/api/arena-admin/challenges';
                const method = chId ? 'PUT' : 'POST';

                try {
                    const res = await fetch(url, { method: method, body: formData }); // Headers Yozilmaydi!
                    const data = await res.json();
                    if(data.success) {
                        alert("✅ Muvaffaqiyatli saqlandi!");
                        window.location.reload();
                    } else {
                        alert("❌ Xatolik: " + data.message);
                    }
                } catch(e) {
                    console.error(e);
                    alert("Server bilan aloqada xatolik yuz berdi.");
                }
            });
        }
    }
});

// 3. Tahrirlash tugmasi uchun ma'lumotlarni avtomatik to'ldirib beruvchi funksiya
window.editChallenge = function(challenge) {
    // Formaga ma'lumotlarni yozamiz
    setTimeout(() => {
        const titleEl = document.getElementById('ch-title');
        if(titleEl) {
            titleEl.value = challenge.title;
            titleEl.dataset.id = challenge._id; // O'zgartirish u-n ID saqlab qolinadi
            document.getElementById('ch-category').value = challenge.category || 'Web';
            document.getElementById('ch-difficulty').value = challenge.difficulty || 'Easy';
            document.getElementById('ch-points').value = challenge.points || 100;
            document.getElementById('ch-flag').value = challenge.flag || '';
            document.getElementById('ch-desc').value = challenge.description || '';
            if(challenge.hints) {
                document.getElementById('ch-hints').value = Array.isArray(challenge.hints) ? challenge.hints.join('\n') : challenge.hints;
            }
            document.getElementById('ch-publish').checked = challenge.isPublished;
        }
    }, 100);
};
