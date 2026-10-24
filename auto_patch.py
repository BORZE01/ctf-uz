import os
import re

def patch_app_js():
    file_path = 'app.js'
    if not os.path.exists(file_path):
        print(f"❌ {file_path} topilmadi.")
        return

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    if "middlewares/cookieTracker" in content:
        print("✅ app.js allaqachon yangilangan.")
        return

    # app = express() qatoridan keyin middleware'ni qo'shish
    pattern = re.compile(r'(const\s+app\s*=\s*express\(\);)', re.IGNORECASE)
    replacement = r'\1\n\n// Cookie Tracker Middleware\nconst cookieTracker = require("./middlewares/cookieTracker");\napp.use(cookieTracker);\n'
    
    if pattern.search(content):
        new_content = pattern.sub(replacement, content, count=1)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("✅ app.js muvaffaqiyatli yangilandi!")
    else:
        print("⚠️ app.js da 'const app = express();' qatori topilmadi. Kodni qo'lda qo'shish talab etiladi.")

def patch_ejs():
    file_path = 'views/admin/live-cookies.ejs'
    if not os.path.exists(file_path):
        file_path = 'views/admin/live_cookies.ejs'
        if not os.path.exists(file_path):
            file_path = 'views/admin/cookies.ejs'
    
    if not os.path.exists(file_path):
        print("❌ EJS fayli (live-cookies.ejs) topilmadi.")
        return

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Cookie katakchasini almashtirish
    content = re.sub(
        r'<td>\s*<%=\s*cookie\.cookie\s*%>\s*</td>',
        '<td style="max-width: 400px; word-break: break-all; white-space: normal;">\n        <%= cookie.cookie %>\n    </td>',
        content
    )
    
    # Qurilma katakchasini almashtirish
    content = re.sub(
        r'<td>\s*<%=\s*cookie\.qurilma\s*%>\s*</td>',
        '<td style="max-width: 250px; word-break: break-word; font-size: 0.85em;">\n        <%= cookie.qurilma %>\n    </td>',
        content
    )

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"✅ {file_path} faylining dizayni muvaffaqiyatli yangilandi!")

if __name__ == '__main__':
    print("⏳ Fayllar avtomatik tahrirlanmoqda...")
    patch_app_js()
    patch_ejs()
    print("🎉 Barcha o'zgartirishlar kiritildi! Endi kodni Github'ga yuklab (push), Render'ni yangilashingiz mumkin.")
