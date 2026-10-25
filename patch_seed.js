const fs = require('fs');
const path = require('path');

const seedFilePath = path.join(__dirname, 'utils', 'seed.js');

if (!fs.existsSync(seedFilePath)) {
    console.log("❌ XATO: utils/seed.js fayli topilmadi!");
    process.exit(1);
}

// 20 ta yangi darslar (to'liq matni bilan, ammo biz qisqartirib faqat sarlavha qoldiramiz)
// Shunda serverning o'zi biz uchun chiroyli darsni shakllantiradi
const newLessons = [];
let lessonCounter = 1;
for (let i = 1; i <= 5; i++) {
    for (let j = 1; j <= 4; j++) {
        newLessons.push({
            moduleSlug: `path1-modul-${i}`,
            slug: `path1-dars-${lessonCounter}`,
            title: `Dars ${lessonCounter}`,
            content: `Bu ${lessonCounter}-dars matni va mashqlari`,
            order: j,
            xpReward: 50
        });
        lessonCounter++;
    }
}

let seedContent = fs.readFileSync(seedFilePath, 'utf8');

// 1. Eski modul slug'larini topish va ularni almashtirish (422-qator)
seedContent = seedContent.replace(
    /moduleSlugs:\s*\[\s*'cyber-intro',\s*'network-fundamentals',\s*'linux-cli',\s*'web-auth-basics',\s*'practical-labs-review'\s*\]/g,
    "moduleSlugs: ['path1-modul-1', 'path1-modul-2', 'path1-modul-3', 'path1-modul-4', 'path1-modul-5']"
);

// 2. Modullar massivi (modulesData) ichiga yangi 5 ta modulni kiritish
const newModulesStr = `
    { title: "Kiberxavfsizlikka Kirish", slug: "path1-modul-1", pathSlug: "kiberxavfsizlik-1-oylik-kirish-yoli", order: 1, duration: "4 dars", description: "Boshlang'ich tushunchalar" },
    { title: "Asosiy Terminlar va Risk", slug: "path1-modul-2", pathSlug: "kiberxavfsizlik-1-oylik-kirish-yoli", order: 2, duration: "4 dars", description: "Tahdidlar va risk" },
    { title: "Raqamli Tahdidlar", slug: "path1-modul-3", pathSlug: "kiberxavfsizlik-1-oylik-kirish-yoli", order: 3, duration: "4 dars", description: "Zararli dasturlar" },
    { title: "OS va Ma'lumotlar", slug: "path1-modul-4", pathSlug: "kiberxavfsizlik-1-oylik-kirish-yoli", order: 4, duration: "4 dars", description: "Tizim qatlamlari" },
    { title: "Amaliy Himoya", slug: "path1-modul-5", pathSlug: "kiberxavfsizlik-1-oylik-kirish-yoli", order: 5, duration: "4 dars", description: "Yakuniy loyiha" },
`;

// Eskilarni olib tashlab yangilarini qo'shish (Xavfli operatsiya, shuning uchun juda aniq izlaymiz)
if (!seedContent.includes('path1-modul-1')) {
     seedContent = seedContent.replace(/const modulesData = \[/, `const modulesData = [\n${newModulesStr}`);
}


// 3. Darslar massivi (lessonsData) ichiga yangi 20 ta darsni kiritish
let newLessonsStr = '';
newLessons.forEach(l => {
    newLessonsStr += `
    {
        moduleSlug: "${l.moduleSlug}",
        slug: "${l.slug}",
        title: "${l.title}",
        content: "${l.content}",
        order: ${l.order},
        xpReward: ${l.xpReward},
        questions: [{ order: 1, prompt: "Test savoli ${l.slug}", options: ["A", "B", "C", "D"], correctAnswer: "A", points: 20 }]
    },`;
});

if (!seedContent.includes('path1-dars-1')) {
    seedContent = seedContent.replace(/const lessonsData = \[/, `const lessonsData = [\n${newLessonsStr}`);
}

fs.writeFileSync(seedFilePath, seedContent, 'utf8');
console.log("✅ URA! utils/seed.js fayli muvaffaqiyatli yamaldi (Yamalgan fayl serverga o'zining avtomatik to'g'ri darslarni yozishiga yordam beradi).");
