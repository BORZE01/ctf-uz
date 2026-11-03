const express = require('express');
const router = express.Router();

const SYSTEM_PROMPT = `Sen CTF-UZ platformasining aqlli kiberxavfsizlik yordamchisi va mentorisan (isming: CyberAI). 
Vazifang: Foydalanuvchilarga CTF topshiriqlari, Web xavfsizlik, Kriptografiya va Reverse Engineering bo'yicha yordam berish.
QAT'IY QOIDA: Hech qachon tayyor flagni to'g'ridan-to'g'ri bermang.
Javoblarni qisqa, aniq va O'ZBEK TILIDA yozing.`;

router.post('/chat', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ success: false, reply: "Savol bo'sh." });

        const apiKey = process.env.GROQ_API_KEY;

        // 1-qadam: Kalitdagi barcha modellarni olish
        const modelsRes = await fetch('https://api.groq.com/openai/v1/models', {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        const modelsData = await modelsRes.json();
        
        if (!modelsData.data || modelsData.data.length === 0) {
            throw new Error("Kalitda model ruxsati yo'q.");
        }

        // 2-qadam: Keraksiz (audio, guard, orpheus) modellarni ro'yxatdan olib tashlash
        const badKeywords = ['guard', 'orpheus', 'whisper', 'vision', 'tool'];
        let candidates = modelsData.data
            .map(m => m.id)
            .filter(id => !badKeywords.some(bad => id.toLowerCase().includes(bad)));

        let finalReply = null;
        let usedModel = null;

        // 3-qadam: Ishlaydigan modelni topguncha avtomatik sinab ko'rish
        for (const modelId of candidates) {
            try {
                const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: modelId,
                        messages: [
                            { role: "system", content: SYSTEM_PROMPT },
                            { role: "user", content: message }
                        ],
                        temperature: 0.7,
                        max_tokens: 500
                    })
                });

                const data = await response.json();
                
                if (data.choices && data.choices.length > 0) {
                    finalReply = data.choices[0].message.content;
                    usedModel = modelId;
                    break; // Ishladi! Siklni to'xtatamiz va javobni olamiz.
                }
            } catch (e) {
                console.log(`⚠️ ${modelId} xato berdi yoki ruxsat yo'q, keyingisiga o'tilmoqda...`);
            }
        }

        if (finalReply) {
            console.log(`✅ Muvaffaqiyatli ulangan model: ${usedModel}`);
            return res.json({ success: true, reply: finalReply });
        } else {
            throw new Error("Hech qaysi chat model javob bermadi yoki ruxsat yo'q.");
        }

    } catch (error) {
        console.error("AI xatosi:", error.message);
        
        const q = req.body.message.toLowerCase();
        let fallbackReply = "Hozircha AI serveri bilan ulanishda muammo bor. Maslahatim: Wireshark yoki Burp Suite orqali trafikni tahlil qiling.";
        if (q.includes("web") || q.includes("xss") || q.includes("sql")) fallbackReply = "Web masalalarida: URL parametrlari, Cookie fayllar va Input maydonlarini tekshiring.";
        else if (q.includes("crypto") || q.includes("shifr")) fallbackReply = "Kriptografiya bo'yicha: Matn Base64 yoki MD5 bo'lishi mumkin. CyberChef orqali tekshiring.";
        
        return res.json({ success: true, reply: `🤖 Oflayn Mentor: ${fallbackReply}` });
    }
});

module.exports = router;
