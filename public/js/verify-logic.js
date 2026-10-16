window.verifyCertificate = function() {
    const input = document.getElementById('verify-input') || document.querySelector('input[type="text"]');
    const resBox = document.getElementById('verify-result') || document.createElement('div');
    if(!document.getElementById('verify-result')) {
        resBox.id = 'verify-result';
        resBox.style.marginTop = '20px';
        resBox.style.padding = '15px';
        resBox.style.borderRadius = '8px';
        input.parentNode.parentNode.appendChild(resBox);
    }
    
    const id = input.value.trim();
    if(!id) {
        resBox.innerHTML = '<div style="color: #ef4444; background: rgba(239,68,68,0.1); padding: 12px; border-radius: 8px;">❌ Iltimos, Sertifikat ID raqamini kiriting!</div>';
        return;
    }
    
    resBox.innerHTML = '<div style="color: #22D3EE;">⏳ Baza bilan bog\'lanilmoqda... kuting.</div>';
    
    // API simulyatsiyasi
    setTimeout(() => {
        if(id === 'CTF-998877') {
            resBox.innerHTML = `
                <div style="background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.3); padding: 20px; border-radius: 12px; text-align: left;">
                    <div style="display: flex; align-items: center; gap: 10px; color: #22c55e; font-weight: bold; font-size: 1.1rem; margin-bottom: 15px;">
                        ✅ Sertifikat Haqiqiy!
                    </div>
                    <div style="color: #F1F5F9; margin-bottom: 8px;">Egasining ismi: <b style="color:#22D3EE;">Sizning Ismingiz</b></div>
                    <div style="color: #F1F5F9; margin-bottom: 8px;">Yo'nalish: <b style="color:#22D3EE;">CTF.UZ Boshlang'ich Bosqich</b></div>
                    <div style="color: #94A3B8; font-size: 0.85rem;">Berilgan sana: ${new Date().toLocaleDateString('uz-UZ')}</div>
                </div>
            `;
        } else {
            resBox.innerHTML = '<div style="color: #ef4444; background: rgba(239,68,68,0.1); padding: 12px; border-radius: 8px;">❌ Baza bo\'yicha bunday ID raqamli sertifikat topilmadi.</div>';
        }
    }, 1200);
};
