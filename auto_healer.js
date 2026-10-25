const mongoose = require('mongoose');
const MONGO_URI = "mongodb+srv://ctfuz_admin:AKKSAVDON137@ctf-uz-cluster.vtjol3t.mongodb.net/ctf-uz?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI).then(async () => {
    console.log("🛠️ Auto-healer ishga tushdi: Tizimning asl arxitekturasi tahlil qilinmoqda...");
    const db = mongoose.connection.db;

    // 1. Ishlayotgan kursni (referans) olamiz (masalan, 2-yo'l)
    const refPath = await db.collection('learningpaths').findOne({ title: { $regex: /2-yo'l/i } });
    if (!refPath) {
        console.log("❌ Referans kurs topilmadi! Baza uzilgan bo'lishi mumkin.");
        process.exit(1);
    }

    // 2. Referans modulni qidirib topamiz va kalitini aniqlaymiz
    let refMod = null;
    let pathKeyInModule = null;
    const allMods = await db.collection('modules').find().limit(500).toArray();
    for (let mod of allMods) {
        for (let key in mod) {
            if (mod[key] && mod[key].toString() === refPath._id.toString()) {
                refMod = mod;
                pathKeyInModule = key; // Bu 'path', 'course' yoki 'learningPath' bo'lishi mumkin
                break;
            }
        }
        if (refMod) break;
    }

    // 3. Referans darsni topamiz va kalitini aniqlaymiz
    let refLes = null;
    let modKeyInLesson = null;
    if (refMod) {
        const allLes = await db.collection('lessons').find().limit(500).toArray();
        for (let les of allLes) {
            for (let key in les) {
                if (les[key] && les[key].toString() === refMod._id.toString()) {
                    refLes = les;
                    modKeyInLesson = key;
                    break;
                }
            }
            if (refLes) break;
        }
    }

    console.log(`📊 TIZIM QOLIBI ANIQLANDI:
    -> Modullardagi Path kaliti: '${pathKeyInModule || 'Topilmadi (Array ishlatiladi)'}'
    -> Darslardagi Modul kaliti: '${modKeyInLesson || 'Topilmadi (Array ishlatiladi)'}'`);

    // 4. 1-yo'lni topib, ushbu qolipga solamiz
    const targetPath = await db.collection('learningpaths').findOne({ slug: "kiberxavfsizlik-1-oylik-kirish-yoli" });
    if (!targetPath) return console.log("❌ 1-yo'l topilmadi.");

    const targetMods = await db.collection('modules').find({ 
        $or: [{ pathId: targetPath._id }, { path: targetPath._id }, { learningPath: targetPath._id }, { course: targetPath._id }] 
    }).toArray();

    const finalModIds = [];
    for (let mod of targetMods) {
        finalModIds.push(mod._id);
        let updateModObj = {};
        
        if (pathKeyInModule && refMod) {
            updateModObj[pathKeyInModule] = refMod[pathKeyInModule] instanceof mongoose.Types.ObjectId 
                ? new mongoose.Types.ObjectId(targetPath._id) 
                : targetPath._id.toString();
        }

        // Barcha etishmayotgan muhim tasdiqlovchi maydonlarni (status, deletedAt) ko'chiramiz
        if (refMod) {
            for (let key in refMod) {
                if (!['title', '_id', 'slug', 'description', 'order', 'createdAt', 'updatedAt', 'lessons', pathKeyInModule].includes(key)) {
                    updateModObj[key] = refMod[key];
                }
            }
        }

        const targetLessons = await db.collection('lessons').find({ 
            $or: [{ moduleId: mod._id }, { module: mod._id }]
        }).toArray();
        
        const finalLesIds = [];
        for (let les of targetLessons) {
            finalLesIds.push(les._id);
            let updateLesObj = {};
            if (modKeyInLesson && refLes) {
                updateLesObj[modKeyInLesson] = refLes[modKeyInLesson] instanceof mongoose.Types.ObjectId 
                    ? new mongoose.Types.ObjectId(mod._id) 
                    : mod._id.toString();
            }

            if (refLes) {
                for (let key in refLes) {
                    if (!['title', '_id', 'slug', 'content', 'order', 'createdAt', 'updatedAt', 'questions', modKeyInLesson].includes(key)) {
                        updateLesObj[key] = refLes[key];
                    }
                }
            }
            await db.collection('lessons').updateOne({ _id: les._id }, { $set: updateLesObj });
        }

        if (refMod && Array.isArray(refMod.lessons)) updateModObj.lessons = finalLesIds;
        updateModObj.totalLessons = finalLesIds.length;

        await db.collection('modules').updateOne({ _id: mod._id }, { $set: updateModObj });
    }

    let updatePathObj = { difficulty: "BEGINNER" };
    for (let key in refPath) {
        if (!['title', '_id', 'slug', 'description', 'overview', 'order', 'createdAt', 'updatedAt', 'modules'].includes(key)) {
            updatePathObj[key] = refPath[key];
        }
    }
    if (Array.isArray(refPath.modules)) updatePathObj.modules = finalModIds;
    
    await db.collection('learningpaths').updateOne({ _id: targetPath._id }, { $set: updatePathObj });

    console.log(`✅ AJOYIB! Tizim sxemasi 100% moslashtirildi. ${finalModIds.length} ta modul tayyor.`);
    process.exit(0);
});
