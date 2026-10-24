
const mongoose = require('mongoose');
// DIQQAT: JONLI MONGO_URI MANZILINI SHU YERGA QO'YING
const MONGO_URI = 'mongodb+srv://ctfuz_admin:AKKSAVDON137@ctf-uz-cluster.vtjol3t.mongodb.net/ctf-uz?retryWrites=true&w=majority'; 

const { LearningPath, Module, Lesson } = require('./models/Learn');

async function seedData() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Jonli bazaga ulanildi.');

        // Eski test ma'lumotlarni tozalash (ixtiyoriy)
        await LearningPath.deleteMany({ title: /yo'l/i });
        await Module.deleteMany({ pathSlug: /yol/i });
        await Lesson.deleteMany({ moduleSlug: /yol/i });

        // 1-YO'NALISH (Path)
        const path1 = await LearningPath.create({
            title: "1-yo'l. Asoslar va qonunchilik",
            slug: "1-yol-asoslar",
            description: "Kiberxavfsizlik asoslari, CIA va etik xakerlik",
            order: 1,
            isPublished: true, // Saytda ko'rinishi uchun eng muhim qator
            level: "Beginner",
            certificateTitle: "Kiberxavfsizlik Asoslari Mutaxassisi"
        });

        // MODULLAR (Modules)
        const mod1 = await Module.create({
            title: "Kiberxavfsizlik asoslari (CIA Triadasi)",
            slug: "1-yol-modul-1",
            pathSlug: path1.slug,
            order: 1
        });

        const mod2 = await Module.create({
            title: "Asosiy muhitni tayyorlash",
            slug: "1-yol-modul-2",
            pathSlug: path1.slug,
            order: 2
        });

        // DARSLAR (Lessons)
        await Lesson.create([
            {
                title: "1. Kiberxavfsizlikka kirish va CIA",
                slug: "1-yol-dars-1",
                moduleSlug: mod1.slug,
                order: 1,
                content: "Kiberxavfsizlik faqatgina xakerlikdan iborat emas. U axborotni himoya qilish san'atidir. Eng fundamental tushuncha bu CIA triadasi..."
            },
            {
                title: "2. Etik xakerlik va qonunchilik",
                slug: "1-yol-dars-2",
                moduleSlug: mod1.slug,
                order: 2,
                content: "O'zbekiston qonunchiligiga ko'ra, ruxsatsiz kirish jinoiy javobgarlikka tortiladi. Etik xakerning qoidasi - RUXSATNOMA (Rules of Engagement)..."
            },
            {
                title: "1. VirtualBox o'rnatish va tarmoq izolyatsiyasi",
                slug: "1-yol-dars-3",
                moduleSlug: mod2.slug,
                order: 1,
                content: "Zararli kodlarni sinab ko'rish o'ta xavfli. Biz Type-2 gipervizor (VirtualBox) va NAT/Host-only adapterlaridan foydalanamiz..."
            }
        ]);

        console.log('✅ Barcha darslar to`g`ri arxitektura bilan bazaga yozildi!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Xatolik:', err);
        process.exit(1);
    }
}
seedData();
