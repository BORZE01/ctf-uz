const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'routes', 'career.js');
let code = fs.readFileSync(file, 'utf8');

// 1. requireAuth xavfsizlik qatlami borligini kafolatlash
if (!code.includes('const { requireAuth }')) {
    code = "const { requireAuth } = require('../middleware/auth');\n" + code;
}

// 2. Havoda qolib ketgan (singan) blokni topish
const startSnippet = "const job = await Job.findById(jobId);";
const startIndex = code.indexOf(startSnippet);
const endIndex = code.lastIndexOf("module.exports = router;");

if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
    // Agar oldida biz qoldirgan "TOZALANDI" izohlari bo'lsa, ularni ham qoshib qirqish
    let cutStart = startIndex;
    const commentMatch = code.substring(0, startIndex).match(/\/\/\s*const Job = require.*\n\/\/\s*const Application = require.*\n\s*$/);
    if (commentMatch) {
        cutStart = startIndex - commentMatch[0].length;
    }

    // 3. Mukammal va yangi marshrut!
    const cleanRoute = `
// Mukammal va xatosiz Ariza (Apply) marshruti
router.post('/jobs/:id/apply', requireAuth, async (req, res) => {
    try {
        const jobId = req.params.id;
        const { coverLetter } = req.body;
        
        // E'lonlar takrorlanmasligi uchun Model nomlarini maxsus o'zgartirib chaqiramiz
        const JobModel = require('../models/Job');
        const AppModel = require('../models/Application');
        
        const job = await JobModel.findById(jobId);
        if (!job) {
            return res.status(404).json({ success: false, message: "Vakansiya topilmadi." });
        }
        
        // Takroriy arizalarni tekshirish
        const existingApp = await AppModel.findOne({ jobId: job._id, applicantId: req.user._id });
        if (existingApp) {
            return res.status(400).json({ success: false, message: "Siz bu vakansiyaga allaqachon ariza yuborgansiz!" });
        }
        
        // Yangi ariza yaratish (Professor so'ragan barcha maydonlar bilan)
        const newApp = new AppModel({
            jobId: job._id,
            employerId: job.employerId || job.employer || null,
            applicantId: req.user._id,
            coverLetter: coverLetter || '',
            status: 'submitted'
        });
        
        await newApp.save();
        return res.status(200).json({ success: true, message: "Arizangiz muvaffaqiyatli yuborildi!" });
    } catch (e) {
        console.error("Apply xatosi:", e);
        return res.status(500).json({ success: false, message: e.message });
    }
});

`;
    
    // Singan kodni olib tashlab, mukammal kodni ulaymiz
    code = code.substring(0, cutStart) + cleanRoute + code.substring(endIndex);
    fs.writeFileSync(file, code, 'utf8');
    console.log("✅ routes/career.js: Yagona va xatosiz /apply marshruti to'liq qayta tiklandi!");
} else {
    console.log("⚠️ Xato blokni aniqlab bo'lmadi.");
}
