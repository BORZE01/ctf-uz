const fs = require('fs');
const path = require('path');

const usersRoutePath = path.join(__dirname, 'routes', 'users.js');
if (fs.existsSync(usersRoutePath)) {
    let code = fs.readFileSync(usersRoutePath, 'utf8');
    
    // Переименовываем локальную функцию, чтобы избежать конфликта
    code = code.replace(/const escapeHtml = \(unsafe\)/g, 'const safeEscapeHtml = (unsafe)');
    code = code.replace(/escapeHtml\(targetUser\.name/g, 'safeEscapeHtml(targetUser.name');
    code = code.replace(/escapeHtml\(targetUser\.bio/g, 'safeEscapeHtml(targetUser.bio');
    
    fs.writeFileSync(usersRoutePath, code, 'utf8');
    console.log("✅ Бэкенд исправлен: устранен конфликт имен 'escapeHtml'.");
}
