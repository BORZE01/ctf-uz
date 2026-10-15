// ══════════════════════════════════════════
// 50 ta Challenge ni MongoDB ga yuklash
// Ishlatish: node seeds/seed-challenges.js
// ══════════════════════════════════════════

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Challenge = require('../models/Challenge');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ctf-uz';

async function seed() {
    try {
        console.log('🔄 MongoDB ga ulanmoqda...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ MongoDB ulandi');

        // JSON o'qish
        const dataPath = path.join(__dirname, 'challenges.json');
        const challenges = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        console.log(`📦 ${challenges.length} ta challenge topildi`);

        let created = 0;
        let skipped = 0;
        let updated = 0;

               for (const c of challenges) {
            // Hints ni to'g'ri formatga o'tkazish (string → object)
            const hintsArray = (c.hints || []).map((h, i) => ({
                text: typeof h === 'string' ? h : (h.text || String(h)),
                cost: 0,
                order: i + 1
            }));

            // Mavjudligini tekshirish
            const exists = await Challenge.findOne({ title: c.title });

            if (exists) {
                // Yangilash
                exists.story = c.story;
                exists.objective = c.objective;
                exists.category = c.category;
                exists.difficulty = c.difficulty;
                exists.points = c.points;
                exists.flag = c.flag;
                exists.hints = hintsArray;
                exists.status = 'live';
                exists.authorName = 'CTF.UZ';
                await exists.save();
                updated++;
                console.log(`  ↻ Yangilandi: ${c.title}`);
            } else {
                // Yaratish
                await Challenge.create({
                    title: c.title,
                    story: c.story,
                    objective: c.objective,
                    category: c.category,
                    difficulty: c.difficulty,
                    points: c.points,
                    flag: c.flag,
                    hints: hintsArray,
                    authorName: 'CTF.UZ',
                    solves: 0,
                    status: 'live',
                    createdAt: new Date()
                });
                created++;
                console.log(`  ✓ Yaratildi: ${c.title}`);
            }
        }

        console.log('');
        console.log('═══════════════════════════════════════');
        console.log(`✅ Yaratilgan:  ${created}`);
        console.log(`↻ Yangilangan: ${updated}`);
        console.log(`⏭  O'tkazilgan: ${skipped}`);
        console.log(`📊 Jami:       ${challenges.length}`);
        console.log('═══════════════════════════════════════');
        console.log('');

        // Kategoriya bo'yicha hisobot
        const stats = await Challenge.aggregate([
            { $match: { status: 'live' } },
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        console.log('📊 Kategoriya bo\'yicha:');
        stats.forEach(s => console.log(`  ${s._id}: ${s.count} ta`));

        await mongoose.disconnect();
        console.log('✅ MongoDB uzildi');
        process.exit(0);
    } catch (err) {
        console.error('❌ Xato:', err.message);
        process.exit(1);
    }
}

seed();
