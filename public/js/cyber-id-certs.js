document.addEventListener('DOMContentLoaded', () => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    document.head.appendChild(script);

    // Cyber ID containerini topamiz (Radar joylashgan container)
    const profileContainer = document.querySelector('.card-glass') || document.querySelector('.container-narrow');
    if(!profileContainer) return;

    const certSectionHtml = `
        <div class="card-glass fade-in-up" style="padding: 24px; margin-top: 24px; background: rgba(15, 22, 41, 0.4);">
            <h3 style="margin-bottom: 20px; display: flex; align-items: center; gap: 8px; color: #F1F5F9; font-family: 'Manrope', sans-serif;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>
                Olingan Sertifikatlar
            </h3>
            
            <div style="background: rgba(37,99,235,0.05); border: 1px solid rgba(74,127,255,0.2); padding: 20px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                <div style="display: flex; gap: 16px; align-items: center;">
                    <div style="width: 55px; height: 55px; background: linear-gradient(135deg, #2563EB, #22D3EE); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 28px;">🏆</div>
                    <div>
                        <h4 style="margin: 0; color: #F1F5F9; font-size: 1.1rem; font-weight: 700;">CTF.UZ Boshlang'ich Bosqich</h4>
                        <p style="margin: 4px 0 0; font-size: 0.85rem; color: #94A3B8;">Berilgan sana: ${new Date().toLocaleDateString('uz-UZ')} | ID: CTF-998877</p>
                    </div>
                </div>
                <button onclick="downloadMyCert('Sizning Ismingiz', 'CTF.UZ Boshlang\\'ich Bosqich', 'CTF-998877', '${new Date().toLocaleDateString('uz-UZ')}')" class="btn btn-primary" style="background: rgba(37,99,235,0.1); border-color: rgba(37,99,235,0.3); color: #22D3EE;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
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

    // Cyber ID profilining pastiga qo'shamiz
    profileContainer.insertAdjacentHTML('afterend', certSectionHtml);
});

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
