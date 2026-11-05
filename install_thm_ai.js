const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
    console.error("❌ 'public' papkasi topilmadi!");
    process.exit(1);
}

const files = fs.readdirSync(publicDir).filter(f => f.endsWith('.html'));

const widgetCode = `
<!-- TRYHACKME AI WIDGET -->
<style>
/* Eski qotib qolgan AI tugmasini yashirish (agar class'i shunday bo'lsa) */
.ai-assistant-btn, .chat-btn, .floating-btn { display: none !important; }

/* Yangi suriladigan Widget */
.thm-draggable-container { 
    position: fixed; 
    bottom: 30px; 
    right: 30px; 
    z-index: 999999; /* Hamma narsadan ustida turishi uchun */
    cursor: grab; 
    touch-action: none; 
    display: flex; 
    align-items: center; 
}
.thm-draggable-container:active { cursor: grabbing; }

/* AI Tugmasi */
.thm-btn { 
    width: 60px; 
    height: 60px; 
    background: linear-gradient(135deg, #2b95ff, #0a66c2); 
    border-radius: 50%; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    color: #fff; 
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4); 
    position: relative; 
    transition: transform 0.2s; 
}
.thm-btn:hover { transform: scale(1.05); }

/* AI Yashil Yorlig'i */
.thm-badge { 
    position: absolute; 
    top: -2px; 
    right: -2px; 
    background: #10b981; 
    color: white; 
    font-size: 11px; 
    font-weight: 900; 
    padding: 3px 6px; 
    border-radius: 8px; 
    border: 2px solid #0f172a; 
}

/* Animatsiyali Pufakcha (Tooltip) */
.thm-tooltip { 
    position: absolute; 
    right: 80px; 
    background: #1e293b; 
    color: #e2e8f0; 
    padding: 10px 15px; 
    border-radius: 8px; 
    font-size: 14px; 
    font-weight: 500; 
    white-space: nowrap; 
    pointer-events: none; 
    border: 1px solid #334155; 
    box-shadow: 0 4px 10px rgba(0,0,0,0.3);
    /* Sakrab turish animatsiyasi */
    animation: thmBounce 2s infinite ease-in-out; 
    transition: opacity 0.3s ease;
}
.thm-tooltip::after { 
    content: ''; 
    position: absolute; 
    right: -6px; 
    top: 50%; 
    transform: translateY(-50%); 
    border-top: 6px solid transparent; 
    border-bottom: 6px solid transparent; 
    border-left: 6px solid #1e293b; 
}

@keyframes thmBounce { 
    0%, 100% { transform: translateX(0); } 
    50% { transform: translateX(-10px); } 
}
</style>

<div id="thmAiWidget" class="thm-draggable-container">
    <div class="thm-tooltip" id="thmTooltip"><span>Yordam kerakmi? AI dan so'rang! 🤖</span></div>
    <div class="thm-btn">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="16" r="1"></circle><path d="M12 7v4"></path><line x1="8" y1="6" x2="8" y2="7"></line><line x1="16" y1="6" x2="16" y2="7"></line>
        </svg>
        <span class="thm-badge">AI</span>
    </div>
</div>

<script>
(function() {
    const widget = document.getElementById('thmAiWidget');
    const tooltip = document.getElementById('thmTooltip');
    if(!widget) return;
    
    let isDragging = false;
    let currentX = 0, currentY = 0;
    let initialX, initialY;
    let hasMoved = false;

    widget.addEventListener('pointerdown', (e) => {
        initialX = e.clientX - currentX;
        initialY = e.clientY - currentY;
        isDragging = true;
        hasMoved = false;
        widget.setPointerCapture(e.pointerId);
    });

    widget.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        
        const dx = e.clientX - initialX;
        const dy = e.clientY - initialY;
        
        if (Math.abs(dx - currentX) > 3 || Math.abs(dy - currentY) > 3) {
            hasMoved = true;
            tooltip.style.opacity = '0'; // Surilayotganda matnni yashirish
        }
        
        currentX = dx;
        currentY = dy;
        widget.style.transform = \`translate3d(\${currentX}px, \${currentY}px, 0)\`;
    });

    widget.addEventListener('pointerup', (e) => {
        isDragging = false;
        widget.releasePointerCapture(e.pointerId);
        
        if (!hasMoved) {
            // BOSILGANDA NIMA BO'LISHI (Shu yerga ulanadi)
            console.log("AI Chat ochildi!");
        }
        
        // Surib bo'lingach, matnni yana chiqarish
        setTimeout(() => { tooltip.style.opacity = '1'; }, 1000);
    });
})();
</script>
<!-- TRYHACKME AI WIDGET END -->
`;

files.forEach(file => {
    const filePath = path.join(publicDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Eski qo'shilgan kodlarni tozalash (xavfsizlik uchun)
    content = content.replace(/<!-- TRYHACKME AI WIDGET -->[\s\S]*?<!-- TRYHACKME AI WIDGET END -->\n?/g, '');
    
    // Yangisini </body> dan oldin qo'shish
    if (content.includes('</body>')) {
        content = content.replace('</body>', widgetCode + '\n</body>');
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ ${file}: Yangi animatsiyali AI Widget o'rnatildi!`);
    }
});
