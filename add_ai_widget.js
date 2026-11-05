const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
    console.error("❌ 'public' papkasi topilmadi!");
    process.exit(1);
}

const files = fs.readdirSync(publicDir).filter(f => f.endsWith('.html'));

const widgetCode = `
<!-- AI WIDGET BOSHLANISHI -->
<style>
.thm-ai-widget { position: fixed; bottom: 30px; right: 30px; z-index: 9999; cursor: grab; user-select: none; touch-action: none; display: flex; align-items: center; }
.thm-ai-widget:active { cursor: grabbing; }
.thm-ai-button { width: 65px; height: 65px; background: linear-gradient(135deg, #2b95ff, #0a66c2); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3); position: relative; transition: transform 0.2s ease; }
.thm-ai-button:hover { transform: scale(1.05); }
.thm-ai-badge { position: absolute; top: 0; right: -5px; background: #10b981; color: white; font-size: 11px; font-weight: bold; padding: 3px 6px; border-radius: 8px; border: 2px solid #1a1e23; letter-spacing: 0.5px; }
.thm-ai-tooltip { position: absolute; right: 85px; background: #1e293b; color: #e2e8f0; padding: 10px 15px; border-radius: 8px; font-size: 14px; font-weight: 500; box-shadow: 0 4px 10px rgba(0,0,0,0.2); white-space: nowrap; pointer-events: none; border: 1px solid #334155; animation: thmBounce 2s infinite ease-in-out; transition: opacity 0.3s; }
.thm-ai-tooltip::after { content: ''; position: absolute; right: -6px; top: 50%; transform: translateY(-50%); border-top: 6px solid transparent; border-bottom: 6px solid transparent; border-left: 6px solid #1e293b; }
@keyframes thmBounce { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(-10px); } }
</style>
<div id="thm-ai-widget" class="thm-ai-widget">
    <div class="thm-ai-tooltip" id="thmAiTooltip"><span>Yordam kerakmi? AI dan so'rang! 🤖</span></div>
    <div class="thm-ai-button" id="thmAiButton">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="16" r="1"></circle><path d="M12 7v4"></path><line x1="8" y1="6" x2="8" y2="7"></line><line x1="16" y1="6" x2="16" y2="7"></line>
        </svg>
        <span class="thm-ai-badge">AI</span>
    </div>
</div>
<script>
(function(){
    const widget = document.getElementById('thm-ai-widget');
    const tooltip = document.getElementById('thmAiTooltip');
    if(!widget) return;
    let isDragging = false, currentX, currentY, initialX, initialY, xOffset = 0, yOffset = 0, hasMoved = false;
    
    widget.addEventListener('pointerdown', e => {
        initialX = e.clientX - xOffset; initialY = e.clientY - yOffset;
        isDragging = true; hasMoved = false;
        widget.setPointerCapture(e.pointerId);
        widget.addEventListener('pointermove', drag);
        widget.addEventListener('pointerup', dragEnd);
    });
    
    function drag(e) {
        if (!isDragging) return;
        currentX = e.clientX - initialX; currentY = e.clientY - initialY;
        if (Math.abs(currentX - xOffset) > 5 || Math.abs(currentY - yOffset) > 5) { hasMoved = true; tooltip.style.opacity = '0'; }
        xOffset = currentX; yOffset = currentY;
        widget.style.transform = \`translate3d(\${currentX}px, \${currentY}px, 0)\`;
    }
    
    function dragEnd(e) {
        initialX = currentX; initialY = currentY; isDragging = false;
        widget.releasePointerCapture(e.pointerId);
        widget.removeEventListener('pointermove', drag); 
        widget.removeEventListener('pointerup', dragEnd);
        
        if (!hasMoved) { 
            // AI Chatni ochish mantiqini shu yerga yozasiz
            console.log("AI Chat bosildi!"); 
        }
        setTimeout(() => { tooltip.style.opacity = '1'; }, 2000);
    }
})();
</script>
<!-- AI WIDGET TUGASHI -->
`;

files.forEach(file => {
    const filePath = path.join(publicDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    if (!content.includes('thm-ai-widget') && content.includes('</body>')) {
        content = content.replace('</body>', widgetCode + '\n</body>');
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ ${file} : AI Widget muvaffaqiyatli qo'shildi!`);
    } else if (content.includes('thm-ai-widget')) {
        console.log(`ℹ️ ${file} : AI Widget allaqachon mavjud.`);
    }
});
