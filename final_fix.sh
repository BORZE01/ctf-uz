#!/bin/bash

echo "⏳ Fayl rasmdagi matn orqali qidirilmoqda..."

# Rasmdagi "Live yangilanadi" yoki "Live Cookies" yozuvi orqali faylni aniq topamiz
FILE=$(grep -rl "Live yangilanadi\|Live Cookies" . 2>/dev/null | grep "\.ejs" | head -n 1)

if [ -n "$FILE" ]; then
    echo -e "\n<style>\n  table tbody tr td:nth-child(4) { max-width: 400px; word-break: break-all; white-space: normal; }\n  table tbody tr td:nth-child(6) { max-width: 250px; word-break: break-word; white-space: normal; font-size: 0.85em; }\n</style>" >> "$FILE"
    echo "✅ To'g'ri fayl topildi: $FILE"
    echo "✅ CSS uslubi fayl oxiriga muvaffaqiyatli qo'shildi!"
    
    echo "⏳ Github'ga avtomatik yuklanmoqda..."
    git add .
    git commit -m "cookie table css fix"
    git push
    
    echo "🎉 Barchasi tayyor! Render avtomatik yangilangandan so'ng saytda matnlar to'liq ko'rinadi."
else
    echo "❌ Fayl topilmadi. Admin paneldagi cookie ko'rinadigan faylning aniq nomini yoki papkasini yozib yuboring."
fi
