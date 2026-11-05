const fs = require('fs');
const path = require('path');

console.log("⏳ Career ariza yuborish mantiqlari to'g'rilanmoqda...");

// 1. Backend (routes/career.js) ga /api/career/apply umumiy endpoint qo'shish
const careerRoutePath = path.join(__dirname, 'routes', 'career.js');
if (fs.existsSync(careerRoutePath)) {
    let code = fs.readFileSync(careerRoutePath, 'utf8');
    
    // Agar api/career/apply hali yo'q bo'lsa, uni fayl oxirirog'iga qo'shamiz
    if (!code.includes("router.post('/apply'")) {
        const applyLogic = `
// Ariza (Application) yuborish (Yagona endpoint)
router.post('/apply', requireAuth, async (req, res) => {
    try {
        const { jobId, coverLetter } = req.body;
        if (!jobId) return res.status(400).json({ success: false, message: "Vakansiya ID si ko'rsatilmagan" });

        const Job = require('../models/Job');
        const Application = require('../models/Application');
        
        const job = await Job.findById(jobId);
        if (!job) return res.status(404).json({ success: false, message: "Vakansiya topilmadi" });

        const existingApp = await Application.findOne({ jobId: job._id, applicantId: req.user._id });
        if (existingApp) {
            return res.status(400).json({ success: false, message: "Siz bu vakansiyaga allaqachon ariza yuborgansiz!" });
        }

        await Application.create({
            jobId: job._id,
            employerId: job.employerId,
            applicantId: req.user._id,
            coverLetter: coverLetter || ''
        });

        // Vakansiyadagi arizalar sonini oshirish
        await Job.findByIdAndUpdate(jobId, { $inc: { applicationsCount: 1 } });

        res.json({ success: true, message: "Arizangiz muvaffaqiyatli yuborildi!" });
    } catch (err) {
        console.error("Ariza yuborishda xato:", err);
        res.status(500).json({ success: false, message: "Server xatosi" });
    }
});
`;
        code = code.replace(/(module\.exports\s*=\s*router;)/, applyLogic.trim() + "\n\n$1");
        fs.writeFileSync(careerRoutePath, code, 'utf8');
        console.log("✅ routes/career.js ga haqiqiy yagona ariza jo'natish API'si (/apply) qo'shildi.");
    }
}

// 2. Frontend (career.html) da ma'lumotlarni to'g'ri yig'ib jo'natishni sozlash
const careerHtmlPath = path.join(__dirname, 'public', 'career.html');
if (fs.existsSync(careerHtmlPath)) {
    let html = fs.readFileSync(careerHtmlPath, 'utf8');
    
    // Yuborilayotgan requestni to'g'rilash (faqat POST emas, body ham kerak)
    html = html.replace(/const\s+res\s*=\s*await\s+fetch\('\/api\/career\/apply',\s*\{\s*method:\s*'POST',\s*headers:.*?\}\);/s,
        `// Ariza jo'natish mantig'i
        const jobId = window.currentJobId || document.getElementById('jobIdInput')?.value;
        const coverLetter = document.getElementById('coverLetter')?.value || '';
        
        const res = await fetch('/api/career/apply', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content || ''
            },
            body: JSON.stringify({ jobId, coverLetter })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Xato yuz berdi');
        `);
        
    fs.writeFileSync(careerHtmlPath, html, 'utf8');
    console.log("✅ Frontenddagi ariza jo'natish JSON formatda to'g'rilandi.");
}
