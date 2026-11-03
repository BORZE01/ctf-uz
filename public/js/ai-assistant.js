(function () {
    // 1. CSS uslublarini qo'shish
    const style = document.createElement('style');
    style.innerHTML = `
        .ai-chat-btn {
            position: fixed;
            bottom: 24px;
            right: 24px;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: linear-gradient(135deg, #2563EB, #22D3EE);
            border: none;
            box-shadow: 0 8px 25px rgba(37,99,235,0.45);
            cursor: pointer;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .ai-chat-btn:hover {
            transform: scale(1.08) translateY(-2px);
            box-shadow: 0 12px 30px rgba(34,211,238,0.5);
        }
        .ai-chat-btn svg { width: 28px; height: 28px; stroke: #fff; fill: none; }
        .ai-chat-btn .ai-badge {
            position: absolute;
            top: -3px;
            right: -3px;
            background: #10B981;
            color: #fff;
            font-size: 10px;
            font-weight: 800;
            padding: 2px 6px;
            border-radius: 10px;
            border: 2px solid #060B18;
        }

        .ai-modal-window {
            position: fixed;
            bottom: 92px;
            right: 24px;
            width: 380px;
            height: 540px;
            max-width: calc(100vw - 32px);
            max-height: calc(100vh - 120px);
            background: #0B132B;
            border: 1px solid rgba(74,127,255,0.25);
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.6), 0 0 20px rgba(37,99,235,0.15);
            display: none;
            flex-direction: column;
            z-index: 9999;
            overflow: hidden;
            font-family: 'Inter', -apple-system, sans-serif;
            animation: aiSlideUp 0.25s ease-out;
        }
        @keyframes aiSlideUp {
            from { opacity: 0; transform: translateY(20px) scale(0.96); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .ai-header {
            padding: 16px;
            background: linear-gradient(135deg, rgba(37,99,235,0.2), rgba(34,211,238,0.1));
            border-bottom: 1px solid rgba(255,255,255,0.08);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .ai-header-info { display: flex; align-items: center; gap: 10px; }
        .ai-avatar {
            width: 34px;
            height: 34px;
            border-radius: 10px;
            background: #2563EB;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .ai-avatar svg { width: 20px; height: 20px; stroke: #fff; }
        .ai-title { font-weight: 800; color: #fff; font-size: 15px; margin: 0; font-family: 'Manrope', sans-serif; }
        .ai-status { font-size: 11px; color: #10B981; margin: 0; }
        .ai-close-btn {
            background: transparent;
            border: none;
            color: #94A3B8;
            font-size: 20px;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 6px;
        }
        .ai-close-btn:hover { color: #fff; background: rgba(255,255,255,0.1); }

        .ai-messages {
            flex: 1;
            padding: 16px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .ai-msg {
            max-width: 82%;
            padding: 10px 14px;
            border-radius: 14px;
            font-size: 13.5px;
            line-height: 1.5;
            word-break: break-word;
        }
        .ai-msg-bot {
            align-self: flex-start;
            background: rgba(30, 41, 59, 0.8);
            color: #E2E8F0;
            border: 1px solid rgba(255,255,255,0.06);
            border-bottom-left-radius: 4px;
        }
        .ai-msg-user {
            align-self: flex-end;
            background: #2563EB;
            color: #fff;
            border-bottom-right-radius: 4px;
        }

        .ai-input-area {
            padding: 12px;
            border-top: 1px solid rgba(255,255,255,0.08);
            background: #060B18;
            display: flex;
            gap: 8px;
        }
        .ai-input-area input {
            flex: 1;
            background: #0F1629;
            border: 1px solid rgba(74,127,255,0.2);
            border-radius: 10px;
            padding: 10px 14px;
            color: #fff;
            font-size: 13.5px;
            outline: none;
        }
        .ai-input-area input:focus { border-color: #22D3EE; }
        .ai-send-btn {
            background: #2563EB;
            border: none;
            color: #fff;
            border-radius: 10px;
            width: 42px;
            height: 42px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;
        }
        .ai-send-btn:hover { background: #1D4ED8; }
        .ai-send-btn svg { width: 18px; height: 18px; stroke: #fff; }
    `;
    document.head.appendChild(style);

    // 2. Chat Widget HTML strukturasi
    const widget = document.createElement('div');
    widget.innerHTML = `
        <button class="ai-chat-btn" id="aiToggleBtn" title="CyberAI Yordamchi">
            <span class="ai-badge">AI</span>
            <svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/>
                <rect x="4" y="6" width="16" height="12" rx="4"/>
                <circle cx="9" cy="12" r="1.5"/>
                <circle cx="15" cy="12" r="1.5"/>
                <path d="M9 16h6"/>
            </svg>
        </button>

        <div class="ai-modal-window" id="aiModalWindow">
            <div class="ai-header">
                <div class="ai-header-info">
                    <div class="ai-avatar">
                        <svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="4" y="6" width="16" height="12" rx="4"/>
                            <circle cx="9" cy="12" r="1"/>
                            <circle cx="15" cy="12" r="1"/>
                        </svg>
                    </div>
                    <div>
                        <h4 class="ai-title">CyberAI Mentor</h4>
                        <p class="ai-status">● Faol yordamchi</p>
                    </div>
                </div>
                <button class="ai-close-btn" id="aiCloseBtn">&times;</button>
            </div>
            <div class="ai-messages" id="aiMessages">
                <div class="ai-msg ai-msg-bot">
                    Salom! Men CTF-UZ platformasining AI kiber-yordamchisiman. Arena topshiriqlari, xavfsizlik vositalari yoki tushunarsiz metodologiya bo'yicha savolingiz bormi?
                </div>
            </div>
            <form class="ai-input-area" id="aiForm">
                <input type="text" id="aiInput" placeholder="Maslahat yoki savol so'rang..." autocomplete="off" required />
                <button type="submit" class="ai-send-btn" id="aiSendBtn">
                    <svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                </button>
            </form>
        </div>
    `;
    document.body.appendChild(widget);

    // 3. Hodisalar va so'rov mantig'i
    const toggleBtn = document.getElementById('aiToggleBtn');
    const closeBtn = document.getElementById('aiCloseBtn');
    const modal = document.getElementById('aiModalWindow');
    const form = document.getElementById('aiForm');
    const input = document.getElementById('aiInput');
    const msgContainer = document.getElementById('aiMessages');

    toggleBtn.addEventListener('click', () => {
        const isOpen = modal.style.display === 'flex';
        modal.style.display = isOpen ? 'none' : 'flex';
        if (!isOpen) input.focus();
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;

        // Foydalanuvchi xabari
        const uMsg = document.createElement('div');
        uMsg.className = 'ai-msg ai-msg-user';
        uMsg.textContent = text;
        msgContainer.appendChild(uMsg);
        input.value = '';
        msgContainer.scrollTop = msgContainer.scrollHeight;

        // Kutish ko'rsatkichi
        const typing = document.createElement('div');
        typing.className = 'ai-msg ai-msg-bot';
        typing.textContent = 'O\'ylanmoqda...';
        msgContainer.appendChild(typing);
        msgContainer.scrollTop = msgContainer.scrollHeight;

        try {
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });
            const data = await res.json();
            typing.textContent = data.reply || "Xatolik yuz berdi.";
        } catch (err) {
            typing.textContent = "Tarmoq xatosi. Qaytadan urinib ko'ring.";
        }
        msgContainer.scrollTop = msgContainer.scrollHeight;
    });
})();
