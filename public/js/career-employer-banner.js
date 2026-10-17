
(function() {
    // Agar oldindan eski xunuk banner yuklangan bo'lsa, uni yashiramiz
    const oldBanner = document.getElementById('employer-banner-fixed') || document.querySelector('.employer-banner') || document.querySelector('[style*="fixed"]');
    if (oldBanner && oldBanner.innerHTML.includes("Kompaniyangiz")) oldBanner.remove();

    const bannerHtml = `
        <div style="background: linear-gradient(135deg, rgba(15,22,41,0.95), rgba(20,30,60,0.95)); border: 1px solid rgba(74,127,255,0.2); border-radius: 20px; padding: 36px 48px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 24px; box-shadow: 0 15px 40px rgba(0,0,0,0.25); position: relative; overflow: hidden; margin-top: 40px; margin-bottom: 40px;">
            
            <!-- Orqa fondagi chiroyli nur effektlari -->
            <div style="position: absolute; top: -50%; left: -5%; width: 300px; height: 300px; background: radial-gradient(circle, rgba(37,99,235,0.1) 0%, transparent 70%); border-radius: 50%; pointer-events: none;"></div>
            <div style="position: absolute; bottom: -50%; right: -5%; width: 300px; height: 300px; background: radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%); border-radius: 50%; pointer-events: none;"></div>

            <div style="display: flex; align-items: center; gap: 24px; position: relative; z-index: 1;">
                <div style="width: 64px; height: 64px; border-radius: 16px; background: rgba(37,99,235,0.15); display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid rgba(37,99,235,0.3); box-shadow: 0 0 20px rgba(37,99,235,0.1);">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4A7FFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                    </svg>
                </div>
                <div>
                    <h3 style="font-family: Manrope; font-weight: 800; font-size: 1.4rem; color: #fff; margin-bottom: 8px;">Kompaniyangiz uchun mutaxassis qidiryapsizmi?</h3>
                    <p style="color: #94A3B8; font-size: 1rem; margin: 0; max-width: 600px; line-height: 1.5;">Vakansiyalar joylashtiring va <b style="color: #fff;">Cyber ID</b> orqali eng kuchli kadrlarni oson toping.</p>
                </div>
            </div>
            
            <a href="/employer" style="position: relative; z-index: 1; background: linear-gradient(135deg, #2563EB, #7C3AED); border: none; padding: 16px 32px; font-weight: 700; font-family: Manrope; border-radius: 14px; color: white; text-decoration: none; display: inline-block; font-size: 1.05rem; transition: all 0.3s ease; box-shadow: 0 8px 25px rgba(37,99,235,0.3);" onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 12px 35px rgba(37,99,235,0.5)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 8px 25px rgba(37,99,235,0.3)'">
                Ish Beruvchi Paneliga O'tish &rarr;
            </a>
        </div>
    `;

    function renderBanner() {
        const existings = document.querySelectorAll('.modern-employer-banner');
        existings.forEach(e => e.remove());

        const wrapper = document.createElement('div');
        wrapper.className = 'modern-employer-banner';
        wrapper.innerHTML = bannerHtml;
        
        // Bannerni markazdagi 1200px li container ichiga solamiz
        const container = document.querySelector('.container');
        if (container) {
            container.appendChild(wrapper);
        } else {
            document.body.appendChild(wrapper);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderBanner);
    } else {
        renderBanner();
    }
})();
