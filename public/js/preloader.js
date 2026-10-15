// ══════════════════════════════════════════
// CYBER PRELOADER
// Birinchi kirishda ko'rsatiladi (sessionStorage)
// ══════════════════════════════════════════

(function() {
    'use strict';

    const PRELOADER_KEY = 'ctf_uz_preloader_shown';
    const MIN_DURATION = 2500; // 2.5 sekund minimal ko'rsatish

    // Session ichida allaqachon ko'rsatilganmi?
    if (sessionStorage.getItem(PRELOADER_KEY) === '1') {
        return; // Qayta ko'rsatmaymiz
    }

    // HTML ni yaratish
    function createPreloader() {
        const preloader = document.createElement('div');
        preloader.id = 'cyber-preloader';
        preloader.innerHTML = `
            <div class="loader-content">
                <!-- Logo (SVG) -->
                <svg class="loader-logo" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <polygon 
                        class="logo-path" 
                        points="50,10 85,30 85,70 50,90 15,70 15,30" 
                        fill="transparent" 
                        stroke="#4A7FFF" 
                        stroke-width="3"
                        stroke-linejoin="round"
                    />
                    <polygon 
                        class="logo-fill" 
                        points="50,25 70,37 70,63 50,75 30,63 30,37" 
                        fill="rgba(74, 127, 255, 0.2)" 
                        stroke="#22D3EE" 
                        stroke-width="2"
                    />
                    <circle cx="50" cy="50" r="6" fill="#22D3EE" style="filter: drop-shadow(0 0 8px #22D3EE);"/>
                </svg>

                <!-- Glitch Text -->
                <div class="glitch-text" data-text="CTF.UZ">CTF.UZ</div>

                <!-- Loading Bar -->
                <div class="loading-bar">
                    <div class="loading-progress"></div>
                </div>

                <!-- Terminal Text -->
                <div class="preloader-terminal" id="preloader-terminal"></div>
            </div>
        `;
        document.body.insertBefore(preloader, document.body.firstChild);
        return preloader;
    }

    // Terminal matnini yozish
    function typeTerminal(text, element) {
        let i = 0;
        element.textContent = '';
        const timer = setInterval(() => {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
            } else {
                clearInterval(timer);
            }
        }, 40);
    }

    // Preloaderni yashirish
    function hidePreloader(preloader) {
        preloader.classList.add('hidden');
        sessionStorage.setItem(PRELOADER_KEY, '1');
        setTimeout(() => {
            if (preloader.parentNode) {
                preloader.parentNode.removeChild(preloader);
            }
        }, 700);
    }

    // Sahifa tayyor bo'lganda
    function init() {
        const preloader = createPreloader();
        const terminal = document.getElementById('preloader-terminal');
        
        // Terminal matnlar
        const messages = [
            '> Initializing CTF.UZ...',
            '> Loading challenges...',
            '> Connecting to server...',
            '> Ready.'
        ];
        
        // Ketma-ket xabarlar
        let msgIndex = 0;
        function nextMessage() {
            if (msgIndex < messages.length) {
                typeTerminal(messages[msgIndex], terminal);
                msgIndex++;
                setTimeout(nextMessage, 600);
            }
        }
        setTimeout(nextMessage, 200);

        // Sahifa yuklangandan keyin + minimal vaqt
        const startTime = Date.now();

        function tryHide() {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, MIN_DURATION - elapsed);
            
            setTimeout(() => {
                hidePreloader(preloader);
            }, remaining);
        }

        if (document.readyState === 'complete') {
            tryHide();
        } else {
            window.addEventListener('load', tryHide);
            
            // Xavfsizlik: agar load 5 sekunddan keyin ishlamasa
            setTimeout(() => {
                if (document.getElementById('cyber-preloader') && 
                    !document.getElementById('cyber-preloader').classList.contains('hidden')) {
                    tryHide();
                }
            }, 5000);
        }
    }

    // DOM tayyor bo'lganda
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
