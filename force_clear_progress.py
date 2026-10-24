import os

code = """
const mongoose = require('mongoose');
const MONGO_URI = 'mongodb+srv://ctfuz_admin:AKKSAVDON137@ctf-uz-cluster.vtjol3t.mongodb.net/ctf-uz?retryWrites=true&w=majority'; 

const { LearnSubmission, Progress, PathEnrollment, AssessmentAttempt } = require('./models/Learn');

async function forceClear() {
    try {
        await mongoose.connect(MONGO_URI);
        const subRes = await LearnSubmission.deleteMany({});
        const progRes = await Progress.deleteMany({});
        const pathRes = await PathEnrollment.deleteMany({});
        const attRes = await AssessmentAttempt.deleteMany({});
        
        console.log(`✅ Başarıyla silindi: ${subRes.deletedCount} submissions, ${progRes.deletedCount} progress, ${pathRes.deletedCount} enrollments.`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Hata:', err);
        process.exit(1);
    }
}
forceClear();
"""

with open("force_clear_progress.js", "w", encoding="utf-8") as f:
    f.write(code)
