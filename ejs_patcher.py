import os
import re

print("⏳ EJS fayllari qidirilmoqda...")

patched = False
for root, dirs, files in os.walk('.'):
    if 'node_modules' in dirs: dirs.remove('node_modules')
    for file in files:
        if file.endswith('.ejs'):
            p = os.path.join(root, file)
            try:
                with open(p, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Istalgan o'zgaruvchi nomini topish uchun moslashuvchan regex (masalan: item.cookie, c.cookie)
                pattern_cookie = re.compile(r'<td>\s*<%\s*=\s*([a-zA-Z0-9_]+)\.cookie\s*%>\s*</td>')
                pattern_qurilma = re.compile(r'<td>\s*<%\s*=\s*([a-zA-Z0-9_]+)\.qurilma\s*%>\s*</td>')
                
                if pattern_cookie.search(content) or pattern_qurilma.search(content):
                    # Cookie katakchasini uslub bilan almashtirish
                    content = pattern_cookie.sub(
                        r'<td style="max-width: 400px; word-break: break-all; white-space: normal;">\n        <%= \1.cookie %>\n    </td>',
                        content
                    )
                    # Qurilma katakchasini uslub bilan almashtirish
                    content = pattern_qurilma.sub(
                        r'<td style="max-width: 250px; word-break: break-word; font-size: 0.85em;">\n        <%= \1.qurilma %>\n    </td>',
                        content
                    )
                    
                    with open(p, 'w', encoding='utf-8') as f:
                        f.write(content)
                    print(f"✅ EJS fayli ({p}) muvaffaqiyatli yangilandi!")
                    patched = True
            except Exception as e:
                pass

if not patched:
    print("❌ Mos keluvchi EJS fayli topilmadi. Jadval qatorlari boshqacha yozilgan bo'lishi mumkin.")
else:
    print("🎉 Tayyor! Endi terminalda Githubga yuklang (git add ., git commit -m \"cookie fix\", git push).")
