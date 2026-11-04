const fs = require('fs');
const path = require('path');

// 1. Исправление фронтенда (u.html)
const uHtmlPath = path.join(__dirname, 'public', 'u.html');
if (fs.existsSync(uHtmlPath)) {
    let html = fs.readFileSync(uHtmlPath, 'utf8');
    
    // Принудительно заменяем старые делители (2000, 500 и т.д.) на 1000 в JS скриптах
    html = html.replace(/(\/\s*)(2000|500)/g, '$1 1000');
    html = html.replace(/Math\.floor\(\s*([^/]+)\s*\/\s*\d+\s*\)/g, 'Math.floor($1 / 1000)');
    
    fs.writeFileSync(uHtmlPath, html, 'utf8');
    console.log("✅ Фронтенд Cyber ID (u.html) исправлен: установлена формула / 1000.");
}

// 2. Исправление бэкенда (routes/users.js)
const usersRoute = path.join(__dirname, 'routes', 'users.js');
if (fs.existsSync(usersRoute)) {
    let code = fs.readFileSync(usersRoute, 'utf8');
    
    // Заменяем остаточные старые расчеты в роутере
    code = code.replace(/(\/\s*)(2000|500)/g, '$1 1000');
    
    fs.writeFileSync(usersRoute, code, 'utf8');
    console.log("✅ Бэкенд маршрутов (routes/users.js) полностью синхронизирован.");
}
