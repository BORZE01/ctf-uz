document.addEventListener('DOMContentLoaded', () => {
    const careerHeader = document.querySelector('.career-header') || document.querySelector('.container');
    if(!careerHeader) return;

    const bannerHtml = `
        <div class="fade-in-up" style="background: linear-gradient(90deg, rgba(37,99,235,0.1) 0%, rgba(34,211,238,0.1) 100%); border: 1px solid rgba(34,211,238,0.2); border-radius: 12px; padding: 16px 24px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
            <div style="display: flex; align-items: center; gap: 16px;">
                <div style="width: 48px; height: 48px; background: rgba(34,211,238,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #22D3EE;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                </div>
                <div>
                    <h4 style="margin: 0; color: #F1F5F9; font-size: 1.05rem;">Kompaniyangiz uchun mutaxassis qidiryapsizmi?</h4>
                    <p style="margin: 4px 0 0; color: #94A3B8; font-size: 0.85rem;">Vakansiyalar joylashtiring va Cyber ID orqali eng kuchli kadrlarni toping.</p>
                </div>
            </div>
            <button onclick="window.location.href='/employer'" class="btn btn-primary" style="background: #2563EB; box-shadow: 0 4px 15px rgba(37,99,235,0.3);">
                Ish Beruvchi Paneliga O'tish 💼
            </button>
        </div>
    `;

    careerHeader.insertAdjacentHTML('afterend', bannerHtml);
});
