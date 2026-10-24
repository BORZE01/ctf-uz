#!/bin/bash

FILE="public/admin.html"

if [ -f "$FILE" ]; then
    echo "⏳ $FILE fayliga CSS uslubi qo'shilmoqda..."
    echo -e "\n<style>\n  table tbody tr td:nth-child(4) { max-width: 400px; word-break: break-all; white-space: normal; }\n  table tbody tr td:nth-child(6) { max-width: 250px; word-break: break-word; white-space: normal; font-size: 0.85em; }\n</style>" >> "$FILE"
    echo "✅ CSS uslubi muvaffaqiyatli qo'shildi!"
    
    echo "⏳ Github'ga avtomatik yuklanmoqda..."
    git add .
    git commit -m "admin.html cookie table css fix"
    git push
    
    echo "🎉 Barchasi tayyor! Render avtomatik yangilangandan so'ng saytda matnlar to'liq ko'rinadi."
else
    echo "❌ $FILE topilmadi. Terminalda to'g'ri papkada turganingizga ishonch hosil qiling."
fi
