import os

code = """
const mongoose = require('mongoose');
const MONGO_URI = 'mongodb+srv://ctfuz_admin:AKKSAVDON137@ctf-uz-cluster.vtjol3t.mongodb.net/ctf-uz?retryWrites=true&w=majority'; 

const { LearnSubmission, Progress, PathEnrollment, AssessmentAttempt } = require('./models/Learn');

async function clearData() {
    try {
        await mongoose.connect(MONGO_URI);
        await LearnSubmission.deleteMany({});
        await Progress.deleteMany({});
        await PathEnrollment.deleteMany({});
        await AssessmentAttempt.deleteMany({});
        console.log('✅ Eski progress muvaffaqiyatli tozalandi!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Xatolik:', err);
        process.exit(1);
    }
}
clearData();
"""

with open("clear_progress_path3.js", "w", encoding="utf-8") as f:
    f.write(code)
