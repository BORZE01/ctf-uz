document.addEventListener('DOMContentLoaded', () => {
    function renderCertUI() {
        // Tizimda hozir qaysi bo'lim ochiq (display: none Emas) ekanligini topamiz
        const activeSection = Array.from(document.querySelectorAll('section, .page-content, .admin-section, div')).find(s => 
            s.style.display !== 'none' && 
            s.id !== 'sidebar' && 
            s.id !== 'header' &&
            (s.id === 'sertifikatlar' || s.id === 'certificates' || (s.innerText && s.innerText.trim().startsWith('Sertifikatlar')))
        );

        if (activeSection && !document.getElementById('cert-table-body')) {
            // Ochiq bo'limning ichini to'liq tozalab, bizning jadvalni joylashtiramiz
            activeSection.innerHTML = `
                <div style="padding:20px; color:#e2e8f0; width: 100%; text-align:left;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                        <h2 style="font-size:24px; font-weight:bold; color:#fff;">🎓 Sertifikatlar Boshqaruvi</h2>
                        <button id="btn-add-cert" style="padding:12px 24px; background:#2563eb; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:bold;">
                            + Sertifikat Berish
                        </button>
                    </div>
                    <div style="background:#060B18; border:1px solid #1e293b; border-radius:8px; overflow:hidden;">
                        <table style="width:100%; border-collapse:collapse; text-align:left;">
                            <thead style="background:#0f172a; border-bottom:1px solid #1e293b;">
                                <tr>
                                    <th style="padding:15px; color:#94a3b8; font-size:12px; font-weight:700;">CERT ID</th>
                                    <th style="padding:15px; color:#94a3b8; font-size:12px; font-weight:700;">FOYDALANUVCHI</th>
                                    <th style="padding:15px; color:#94a3b8; font-size:12px; font-weight:700;">YONALISH / KURS NOMI</th>
                                    <th style="padding:15px; color:#94a3b8; font-size:12px; font-weight:700;">BERILGAN SANA</th>
                                    <th style="padding:15px; color:#94a3b8; font-size:12px; font-weight:700; text-align:center;">AMAL</th>
                                </tr>
                            </thead>
                            <tbody id="cert-table-body">
                                <tr><td colspan="5" style="text-align:center; padding:30px; color:#94a3b8;">Ma'lumotlar yuklanmoqda...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            `;

            // Yangi sertifikat qo'shish funksiyasi
            document.getElementById('btn-add-cert').onclick = () => {
                const username = prompt("Sertifikat oluvchi foydalanuvchi logini (Username):");
                if(!username) return;
                const title = prompt("Sertifikat turini kiriting (Masalan: Kiberxavfsizlik asoslari):");
                if(!title) return;

                fetch('/api/admin/certificates', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({username, title})
                }).then(r => r.json()).then(data => {
                    if(data.success) {
                        alert("✅ Muvaffaqiyatli topshirildi!");
                        loadCertificates();
                    } else {
                        alert("❌ Xatolik: " + data.message);
                    }
                }).catch(() => alert("Server bilan aloqada xatolik yuz berdi."));
            };
            
            // Jadvalni to'ldirishni boshlash
            loadCertificates();
        }
    }

    // API orqali bazadan ma'lumotlarni olish
    async function loadCertificates() {
        const tbody = document.getElementById('cert-table-body');
        if(!tbody) return;
        try {
            const res = await fetch('/api/admin/certificates');
            const data = await res.json();
            
            if(data.success) {
                tbody.innerHTML = '';
                if(data.certificates.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:30px; color:#94a3b8;">Hali hech kimga sertifikat berilmagan.</td></tr>';
                    return;
                }
                
                data.certificates.forEach(cert => {
                    const tr = document.createElement('tr');
                    tr.style.borderBottom = '1px solid #1e293b';
                    tr.innerHTML = `
                        <td style="padding:15px; font-family:monospace; color:#3b82f6; font-weight:600;">${cert.certId || cert._id.substring(0,8)}</td>
                        <td style="padding:15px; font-weight:bold; color:#e2e8f0;">${cert.userId ? cert.userId.username : '<span style="color:#ef4444">O\'chirilgan</span>'}</td>
                        <td style="padding:15px; color:#cbd5e1;">${cert.title || 'Umumiy yo\'nalish'}</td>
                        <td style="padding:15px; color:#94a3b8;">${new Date(cert.issueDate || cert.createdAt).toLocaleDateString('uz-UZ')}</td>
                        <td style="padding:15px; text-align:center;">
                            <button class="btn-delete-cert" data-id="${cert._id}" style="background:transparent; border:none; cursor:pointer; font-size:18px;">🗑️</button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });

                // O'chirish funksiyasi
                document.querySelectorAll('.btn-delete-cert').forEach(btn => {
                    btn.onclick = async (e) => {
                        if(confirm("Haqiqatan ham sertifikatni bekor qilmoqchimisiz?")) {
                            const id = e.target.dataset.id;
                            const res = await fetch('/api/admin/certificates/' + id, { method: 'DELETE' });
                            const d = await res.json();
                            if(d.success) loadCertificates();
                        }
                    };
                });
            }
        } catch(e) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:30px; color:#ef4444;">Serverga ulanishda xatolik yuz berdi.</td></tr>';
        }
    }

    // Har 0.5 soniyada ekrandagi bo'limni tekshirib (SPA ga qarshi) jadvalni chizadi
    setInterval(renderCertUI, 500);
});