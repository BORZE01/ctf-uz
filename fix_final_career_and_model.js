const fs = require('fs');
const path = require('path');

// 1. routes/career.js dan aniq o'sha ortiqcha blokni qirqib olib tashlash
const careerFile = path.join(__dirname, 'routes', 'career.js');
if (fs.existsSync(careerFile)) {
    let code = fs.readFileSync(careerFile, 'utf8');
    
    // Aynan biz qo'shgan blokni aniq belgilab o'chirish
    const duplicateRouteRegex = /\/\/\s*Ariza \(Application\) yuborish \(Yagona endpoint\)[\s\S]*?router\.post\('\/apply'[\s\S]*?res\.status\(500\)\.json\(\{ success: false, message: "Server xatosi" \}\);\s*\}\s*\}\);/i;
    
    if (duplicateRouteRegex.test(code)) {
        code = code.replace(duplicateRouteRegex, '');
        fs.writeFileSync(careerFile, code, 'utf8');
        console.log("✅ routes/career.js: Ortiqcha /apply marshruti va 'Job' e'loni to'liq o'chirildi.");
    } else {
        // Agar birinchi regex topolmasa, kengroq qidiruv
        const fallbackRegex = /router\.post\('\/apply'[\s\S]*?const Job = require\('\.\.\/models\/Job'\);[\s\S]*?\}\);/i;
        if (fallbackRegex.test(code)) {
            code = code.replace(fallbackRegex, '');
            fs.writeFileSync(careerFile, code, 'utf8');
            console.log("✅ routes/career.js: /apply marshruti (fallback) orqali tozalandi.");
        } else {
            console.log("⚠️ routes/career.js: O'chirilishi kerak bo'lgan /apply marshruti topilmadi.");
        }
    }
}

// 2. models/Application.js ga legacy maydonlarni to'g'ri nom bilan qo'shish
const modelFile = path.join(__dirname, 'models', 'Application.js');
if (fs.existsSync(modelFile)) {
    let modelCode = fs.readFileSync(modelFile, 'utf8');
    
    if (!modelCode.includes('job: {')) {
        // appSchema o'rniga universal qidiruv (\w*Schema) ishlatamiz
        modelCode = modelCode.replace(/(const\s+\w*Schema\s*=\s*new\s+mongoose\.Schema\(\{)/, "$1\n    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },\n    employer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },\n    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },");
        fs.writeFileSync(modelFile, modelCode, 'utf8');
        console.log("✅ models/Application.js: 'job', 'employer', 'candidate' legacy maydonlari muvaffaqiyatli qo'shildi!");
    } else {
        console.log("ℹ️ models/Application.js: Legacy maydonlar allaqachon mavjud.");
    }
}
