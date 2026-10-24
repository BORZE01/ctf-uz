import os

print("⏳ EJS fayli qidirilmoqda...")
patched = False

for root, dirs, files in os.walk('.'):
    if 'node_modules' in dirs: dirs.remove('node_modules')
    for file in files:
        if file.endswith('.ejs'):
            p = os.path.join(root, file)
            try:
                with open(p, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Jadval sarlavhalari orqali to'g'ri faylni topamiz
                if "FOYDALANUVCHI" in content.upper() and "COOKIE" in content.upper() and "QURILMA" in content.upper():
                    if "word-break: break-all;" in content:
                        print(f"✅ {p} fayliga allaqachon dizayn qo'shilgan.")
                        patched = True
                        break
                        
                    # 4 va 6-ustunlar uchun CSS kod
                    css = """
<style>
  table tbody tr td:nth-child(4) { max-width: 400px; word-break: break-all; white-space: normal; }
  table tbody tr td:nth-child(6) { max-width: 250px; word-break: break-word; white-space: normal; font-size: 0.85em; }
</style>
"""
                    with open(p, 'a', encoding='utf-8') as f_append:
                        f_append.write(css)
                        
                    print(f"✅ {p} faylining oxiriga CSS dizayn muvaffaqiyatli qo'shildi!")
                    patched = True
                    break
            except Exception as e:
                pass
    if patched:
        break

if not patched:
    print("❌ Fayl topilmadi. Qidiruv so'zlari mos kelmadi.")
else:
    print("🎉 Tayyor! Endi Git orqali push qilib, Render'ni yangilang (git add . && git commit -m 'css fix' && git push).")
