document.addEventListener('DOMContentLoaded', () => {
    // 1. "Xavfsizlik" yorlig'ini topamiz (uning yoniga qo'shamiz)
    const securityTabBtn = Array.from(document.querySelectorAll('button, a, div')).find(el => el.textContent.trim() === 'Xavfsizlik' || el.textContent.trim() === 'Xavfsizlik');
    
    if (securityTabBtn && securityTabBtn.parentNode && !document.getElementById('tab-cert')) {
        // "Sertifikatlar" tugmasini xuddi Xavfsizlik tugmasi kabi yaratib yoniga qo'shamiz
        const certBtn = document.createElement(securityTabBtn.tagName);
        certBtn.id = 'tab-cert';
        certBtn.className = securityTabBtn.className;
        // Agar hover yoki activelik klasslari bo'lsa tozalab qo'yamiz (masalan, active klassi bo'lsa)
        certBtn.className = certBtn.className.replace('active', '').replace('bg-blue-600', ''); 
        certBtn.innerHTML = '🎓 Sertifikatlar';
        certBtn.onclick = () => switchProfileTab('certificates');
        certBtn.style.cursor = 'pointer';
        
        securityTabBtn.parentNode.appendChild(certBtn);
    } else {
        // Agar topolmasa, shunchaki menyu ro'yxatini oxiriga qidirib qo'shishga harakat qilamiz
        const menuContainer = document.querySelector('.flex.space-x-4') || document.querySelector('.grid.grid-cols-4') || document.querySelector('[role="tablist"]');
        if(menuContainer && !document.getElementById('tab-cert')) {
            const btnHtml = `<button id="tab-cert" onclick="switchProfileTab('certificates')" style="padding: 10px 20px; color: #94A3B8; border-radius: 8px; font-weight: 500;">🎓 Sertifikatlar</button>`;
            menuContainer.insertAdjacentHTML('beforeend', btnHtml);
        }
    }

    // 2. Sertifikatlar panelini yaratish (HTML)
    const certSectionHtml = `
        <div id="certificates-tab" class="tab-content hidden" style="padding: 24px; animation: fadeIn 0.3s ease;">
            <h3 style="margin-bottom: 20px; color: #F1F5F9; font-size: 1.25rem; font-weight: bold;">🎓 Olingan Sertifikatlar</h3>
            
            <div style="background: rgba(37,99,235,0.05); border: 1px solid rgba(74,127,255,0.2); padding: 20px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                <div style="display: flex; gap: 16px; align-items: center;">
                    <div style="width: 55px; height: 55px; background: linear-gradient(135deg, #2563EB, #22D3EE); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 28px;">🏆</div>
                    <div>
                        <h4 style="margin: 0; color: #F1F5F9; font-size: 1.1rem; font-weight: 700;">CTF.UZ Boshlang'ich Bosqich</h4>
                        <p style="margin: 4px 0 0; font-size: 0.85rem; color: #94A3B8;">Berilgan sana: ${new Date().toLocaleDateString('uz-UZ')} | ID: CTF-998877</p>
                    </div>
                </div>
                <button onclick="downloadMyCert('Sizning Ismingiz', 'CTF.UZ Boshlang\\'ich Bosqich', 'CTF-998877', '${new Date().toLocaleDateString('uz-UZ')}')" class="btn btn-primary" style="background: rgba(37,99,235,0.1); border: 1px solid rgba(37,99,235,0.3); color: #22D3EE; padding: 8px 16px; border-radius: 8px; cursor: pointer;">
                    PDF Yuklash
                </button>
            </div>
        </div>

        <!-- YASHIRIN A4 SERTIFIKAT SHABLONI -->
        <div id="cert-print-container" style="display: none; position: absolute; left: -9999px;">
            <div id="a4-certificate" style="width: 297mm; height: 210mm; padding: 15mm; background: #ffffff; position: relative; font-family: 'Arial', sans-serif; color: #0f1629; box-sizing: border-box;">
                <div style="position: absolute; top: 12mm; left: 12mm; right: 12mm; bottom: 12mm; border: 4px double #2563eb; padding: 40px; text-align: center;">
                    <div style="font-size: 70px; margin-bottom: 10px;">🛡️</div>
                    <h1 style="font-size: 45px; font-weight: 800; color: #0f1629; margin-bottom: 10px; text-transform: uppercase;">Muvaffaqiyat Sertifikati</h1>
                    <p style="font-size: 20px; color: #475569; margin-bottom: 35px; font-style: italic;">Ushbu rasmiy sertifikat tasdiqlaydi ki</p>
                    <h2 id="cert-user-name" style="font-size: 55px; font-weight: 700; color: #2563eb; border-bottom: 3px solid #cbd5e1; padding-bottom: 10px; display: inline-block; margin-bottom: 40px;">Ism Familiya</h2>
                    <p style="font-size: 22px; color: #334155; line-height: 1.6; max-width: 80%; margin: 0 auto;">
                        CTF.UZ platformasida <b id="cert-course-name">Kurs Nomi</b> bo'yicha belgilangan barcha amaliy kiberxavfsizlik topshiriqlarini muvaffaqiyatli yakunladi va tegishli ko'nikmalarni amalda namoyish etdi.
                    </p>
                    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 70px; text-align: left; padding: 0 40px;">
                        <div>
                            <p style="font-size: 16px; color: #64748b; margin-bottom: 5px;">Sana:</p>
                            <strong id="cert-date" style="font-size: 22px;">Sana</strong>
                        </div>
                        <div style="text-align: center;">
                            <img id="cert-qr-img" src="" style="width: 110px; height: 110px; border: 2px solid #e2e8f0; padding: 5px; background: #fff; margin-bottom: 10px;">
                            <p style="font-size: 15px; color: #64748b; font-family: monospace;">ID: <span id="cert-id" style="font-weight: bold;">ID</span></p>
                        </div>
                        <div style="text-align: center;">
                            <h3 style="margin: 0; font-size: 38px; color: #0f1629; font-style: italic;">CTF.UZ Team</h3>
                            <div style="border-top: 2px solid #000; padding-top: 8px; margin-top: 8px; font-size: 18px; font-weight: bold;">Platforma Rahbariyati</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Content yashiringan joyni (Overview, Ko'nikmalar turgan joy) topib oxiriga qo'shamiz
    const contentContainer = document.getElementById('overview-tab') ? document.getElementById('overview-tab').parentNode : document.querySelector('.card-glass:last-child');
    
    if(contentContainer && !document.getElementById('certificates-tab')) {
        contentContainer.insertAdjacentHTML('beforeend', certSectionHtml);
    }
});

window.switchProfileTab = function(tabName) {
    // Profilingizdagi mavjud tab o'zgartirish funksiyasini chaqiramiz (agar mavjud bo'lsa)
    if(typeof switchTab === 'function') {
        switchTab(tabName);
    } else {
        // Aks holda qo'lda almashtiramiz
        const tabs = ['overview', 'skills', 'activity', 'security', 'certificates'];
        
        // Tugmalar rangini o'zgartirish
        tabs.forEach(t => {
            const btn = document.getElementById('tab-' + t) || Array.from(document.querySelectorAll('button')).find(el => el.textContent.toLowerCase().includes(t));
            if(btn) {
                if(t === tabName) {
                    btn.classList.add('bg-blue-600', 'text-white');
                    btn.classList.remove('bg-gray-800/50', 'text-gray-400');
                    btn.style.background = '#2563EB';
                    btn.style.color = '#fff';
                } else {
                    btn.classList.remove('bg-blue-600', 'text-white');
                    btn.classList.add('bg-gray-800/50', 'text-gray-400');
                    btn.style.background = 'transparent';
                    btn.style.color = '#94A3B8';
                }
            }
        });

        // Contentlarni yashirish/ko'rsatish
        tabs.forEach(t => {
            const content = document.getElementById(t + '-tab');
            if(content) {
                if(t === tabName) {
                    content.classList.remove('hidden');
                } else {
                    content.classList.add('hidden');
                }
            }
        });
    }
};

window.downloadMyCert = async function(userName, courseName, certId, date) {
    if(typeof html2pdf === 'undefined') { alert("Kutubxona yuklanmoqda... 2 soniya kuting."); return; }
    document.getElementById('cert-user-name').innerText = userName;
    document.getElementById('cert-course-name').innerText = courseName;
    document.getElementById('cert-id').innerText = certId;
    document.getElementById('cert-date').innerText = date;
    const verifyUrl = 'https://ctf-uz.onrender.com/certificate-verify?id=' + certId;
    document.getElementById('cert-qr-img').src = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' + encodeURIComponent(verifyUrl);
    
    const element = document.getElementById('a4-certificate');
    const container = document.getElementById('cert-print-container');
    container.style.display = 'block';
    
    const opt = {
        margin: 0, filename: `Sertifikat_${certId}.pdf`,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };
    try { await html2pdf().set(opt).from(element).save(); } catch(e) { console.error(e); }
    container.style.display = 'none';
};
