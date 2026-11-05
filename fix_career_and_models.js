const fs = require('fs');
const path = require('path');

console.log("⏳ Vakansiya tizimi tuzatilmoqda...");

// 1. Job modelini to'g'rilash (Routes bilan moslashtirish)
const jobModelPath = path.join(__dirname, 'models', 'Job.js');
const fixedJobCode = `
const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
    title: { type: String, required: true },
    employerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employer', required: true }, // To'g'rilandi
    level: { type: String, default: 'Junior' }, // experienceLevel o'rniga
    jobType: { type: String, default: 'Full-time' }, // employmentType o'rniga
    description: { type: String, required: true },
    requiredSkills: [{ type: String }],
    featured: { type: Boolean, default: false },
    viewsCount: { type: Number, default: 0 },
    applicationsCount: { type: Number, default: 0 },
    status: { type: String, enum: ['draft', 'pending', 'published', 'closed'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Job', JobSchema);
`;
if(fs.existsSync(jobModelPath)) fs.writeFileSync(jobModelPath, fixedJobCode.trim(), 'utf8');

// 2. Application modelini to'g'rilash
const appModelPath = path.join(__dirname, 'models', 'Application.js');
const fixedAppCode = `
const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    employerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employer', required: true },
    applicantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    coverLetter: { type: String },
    portfolioSnapshot: { type: String },
    status: { type: String, enum: ['submitted', 'reviewed', 'accepted', 'rejected'], default: 'submitted' },
    createdAt: { type: Date, default: Date.now }
});
// 1 ta user 1 ta vakansiyaga 1 marta topshira oladi
ApplicationSchema.index({ jobId: 1, applicantId: 1 }, { unique: true });

module.exports = mongoose.model('Application', ApplicationSchema);
`;
if(fs.existsSync(appModelPath)) fs.writeFileSync(appModelPath, fixedAppCode.trim(), 'utf8');

// 3. Frontenddagi yolg'on so'rovni (apply-simulation) to'g'rilash
const careerHtmlPath = path.join(__dirname, 'public', 'career.html');
if (fs.existsSync(careerHtmlPath)) {
    let html = fs.readFileSync(careerHtmlPath, 'utf8');
    // apply-simulation ni haqiqiy endpointga o'zgartirish
    html = html.replace(/\/api\/jobs\/apply-simulation/g, '/api/career/apply');
    // if (!res.ok) shartini qo'shish orqali xatolarni yutib yuborishni oldini olish
    html = html.replace(/\.catch\(\(\) => null\)/g, ".catch(err => { alert('Xatolik yuz berdi'); console.error(err); })");
    fs.writeFileSync(careerHtmlPath, html, 'utf8');
}

console.log("✅ Vakansiya va Ariza modellari birxillashtirildi. Frontenddagi yolg'on so'rov haqiqiy API ga ulandi!");
