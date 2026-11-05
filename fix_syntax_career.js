const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'routes', 'career.js');

let lines = fs.readFileSync(filePath, 'utf8').split('\n');
let seenJob = false;
let seenApp = false;

for (let i = 0; i < lines.length; i++) {
    // Job modelini qidirish
    if (lines[i].match(/const\s+Job\s*=\s*require\(['"]\.\.\/models\/Job['"]\)/)) {
        if (seenJob) {
            lines[i] = '// ' + lines[i] + ' // TOZALANDI: Takroriy e\'lon';
        } else {
            seenJob = true;
        }
    }
    // Application modelini qidirish
    if (lines[i].match(/const\s+Application\s*=\s*require\(['"]\.\.\/models\/Application['"]\)/)) {
        if (seenApp) {
            lines[i] = '// ' + lines[i] + ' // TOZALANDI: Takroriy e\'lon';
        } else {
            seenApp = true;
        }
    }
}

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log("✅ routes/career.js dagi takroriy 'Job' va 'Application' chaqiruvlari muvaffaqiyatli tozalandi!");
