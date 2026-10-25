const mongoose = require('mongoose');

const MONGO_URI = "mongodb+srv://ctfuz_admin:AKKSAVDON137@ctf-uz-cluster.vtjol3t.mongodb.net/ctf-uz?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI).then(async () => {
    console.log("Bazaga ulandi. Eskirgan va ziddiyatli kurslar tozalanmoqda...");
    const db = mongoose.connection.db;

    // 'order: 1' bo'lgan yoki nomida '1-yo'l' qatnashgan barcha eski kurslarni topish
    const allPaths = await db.collection('learningpaths').find({
        $or: [
            { order: 1 },
            { order: "1" },
            { title: { $regex: /1-yo'l/i } },
            { title: { $regex: /Kiberxavfsizlik/i } }
        ]
    }).toArray();

    for (let path of allPaths) {
        console.log(`O'chirilmoqda: ${path.title}`);
        const mods = await db.collection('modules').find({ pathId: path._id }).toArray();
        const modIds = mods.map(m => m._id);

        const lessons = await db.collection('lessons').find({
            $or: [{ moduleId: { $in: modIds } }, { pathId: path._id }]
        }).toArray();
        const lessonIds = lessons.map(l => l._id);

        await db.collection('questions').deleteMany({ lessonId: { $in: lessonIds } });
        await db.collection('lessons').deleteMany({ _id: { $in: lessonIds } });
        await db.collection('modules').deleteMany({ _id: { $in: modIds } });
        await db.collection('learningpaths').deleteOne({ _id: path._id });
    }

    console.log("✅ Eski kurs qoldiqlari to'liq tozalandi.");
    process.exit(0);
});
