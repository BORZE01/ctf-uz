const fs = require('fs');
const path = require('path');

// Server.js ni yangilash
let serverCode = fs.readFileSync('server.js', 'utf8');
if (serverCode.indexOf('/api/ai') === -1) {
    serverCode = serverCode.replace(/app\.use\('\/api\/auth',/g, "app.use('/api/ai', require('./routes/ai'));\napp.use('/api/auth',");
    fs.writeFileSync('server.js', serverCode, 'utf8');
    console.log('✅ routes/ai.js server.js fayliga ulandi!');
}

// HTML fayllarga widgetni ulash
const publicDir = path.join(__dirname, 'public');
fs.readdirSync(publicDir).forEach(file => {
    if (file.endsWith('.html')) {
        const fullPath = path.join(publicDir, file);
        let content = fs.readFileSync(fullPath, 'utf8');
        if (content.indexOf('ai-assistant.js') === -1) {
            content = content.replace('</body>', '    <script src="/js/ai-assistant.js"></script>\n</body>');
            fs.writeFileSync(fullPath, content, 'utf8');
            console.log('✅ AI Widget ulandi: ' + file);
        }
    }
});
