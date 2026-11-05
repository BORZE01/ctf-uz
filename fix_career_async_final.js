const fs = require('fs');
const file = 'routes/career.js';
let code = fs.readFileSync(file, 'utf8');

let lines = code.split('\n');

for (let i = 0; i < lines.length; i++) {
    // Xato berayotgan qatorni topamiz
    if (lines[i].includes('await Job.findById')) {
        // Shu qatordan yuqoriga qarab yurib, funksiyaning boshlanishini qidiramiz
        for (let j = i; j >= 0; j--) {
            // Agar (req, res) => topsak va unda async yo'q bo'lsa
            if (lines[j].match(/\(\s*req\s*,\s*res\s*\)\s*=>/) && !lines[j].includes('async')) {
                lines[j] = lines[j].replace(/\(\s*req\s*,\s*res\s*\)\s*=>/, 'async (req, res) =>');
                break;
            }
        }
    }
}

fs.writeFileSync(file, lines.join('\n'));
console.log("✅ routes/career.js dagi yetishmayotgan 'async' aqlli usulda topilib qo'shildi!");
