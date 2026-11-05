const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'routes', 'challenges.js');
let code = fs.readFileSync(filePath, 'utf8');

// Obyekt importini requireAuth ga almashtiramiz
code = code.replace(/const authModule.*?\nconst auth =.*?\n/s, "const { requireAuth } = require('../middleware/auth');\n");

// Routerda ishlatilgan auth ni requireAuth ga almashtiramiz
code = code.replace(/router\.post\('\/:id\/submit',\s*auth,/g, "router.post('/:id/submit', requireAuth,");

fs.writeFileSync(filePath, code, 'utf8');
console.log("✅ challenges.js da requireAuth to'g'ri import qilindi.");
