const fs = require('fs');
const path = require('path');

// 1. career.html ni tuzatish
const htmlPath = path.join(__dirname, 'public', 'career.html');
if (fs.existsSync(htmlPath)) {
    let html = fs.readFileSync(htmlPath, 'utf8');
    
    // jobs-list-container ID sini qo'shish
    if (!html.includes('id="jobs-list-container"')) {
        html = html.replace(/<div\s+class="([^"]*jobs-list[^"]*|[^"]*row[^"]*)"/i, '<div id="jobs-list-container" class="$1"');
    }
    
    // textarea ga apply-cover-letter ID qo'shish
    if (!html.includes('id="apply-cover-letter"')) {
        html = html.replace(/<textarea([^>]*)>/i, '<textarea id="apply-cover-letter" $1>');
    }
    
    fs.writeFileSync(htmlPath, html, 'utf8');
    console.log("✅ public/career.html: Container va Textarea ID'lari to'g'rilandi.");
}

// 2. Application.js modelini tuzatish
const appModelPath = path.join(__dirname, 'models', 'Application.js');
if (fs.existsSync(appModelPath)) {
    let modelCode = fs.readFileSync(appModelPath, 'utf8');
    
    // Enum ga 'withdrawn' va 'submitted' qo'shish
    modelCode = modelCode.replace(/enum:\s*\[([^\]]+)\]/, (match, p1) => {
        let items = p1.split(',').map(s => s.trim().replace(/'/g, '').replace(/"/g, ''));
        if (!items.includes('withdrawn')) items.push('withdrawn');
        if (!items.includes('submitted')) items.push('submitted');
        return `enum: ['${items.join("', '")}']`;
    });
    
    // portfolioSnapshot turini String dan Mixed (Obyekt) ga o'zgartirish
    modelCode = modelCode.replace(/portfolioSnapshot:\s*\{\s*type:\s*String\s*\}/, "portfolioSnapshot: { type: mongoose.Schema.Types.Mixed }");
    
    // Eski (legacy) maydonlarni saqlab qolish
    if (!modelCode.includes('job: {')) {
        modelCode = modelCode.replace(/(const\s+appSchema\s*=\s*new\s+mongoose\.Schema\(\{)/, "$1\n    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },\n    employer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },\n    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },");
    }
    
    fs.writeFileSync(appModelPath, modelCode, 'utf8');
    console.log("✅ models/Application.js: Legacy maydonlar, enum statuslari va portfolioSnapshot to'g'rilandi.");
}

// 3. Ortiqcha /apply route'ni tozalash
const careerRoutePath = path.join(__dirname, 'routes', 'career.js');
if (fs.existsSync(careerRoutePath)) {
    let routeCode = fs.readFileSync(careerRoutePath, 'utf8');
    const duplicateApplyRegex = /\/\/ Ariza \(Application\) yuborish \(Yagona endpoint\)[\s\S]*?router\.post\('\/apply'[\s\S]*?\}\);/i;
    
    if (duplicateApplyRegex.test(routeCode)) {
        routeCode = routeCode.replace(duplicateApplyRegex, '');
        fs.writeFileSync(careerRoutePath, routeCode, 'utf8');
        console.log("✅ routes/career.js: Ortiqcha /apply route tozalandi, asl /jobs/:id/apply saqlab qolindi.");
    }
}
