const fs = require('fs');
let code = fs.readFileSync('routes/ai.js', 'utf8');

// Ochiq kalitni process.env ga o'zgartirish
code = code.replace(/const apiKey = "gsk_[a-zA-Z0-9]+";/, 'const apiKey = process.env.GROQ_API_KEY;');
fs.writeFileSync('routes/ai.js', code, 'utf8');
console.log("✅ 2. API kalit maxfiylashtirildi! Uni .env faylga qo'shishni unutmang.");
