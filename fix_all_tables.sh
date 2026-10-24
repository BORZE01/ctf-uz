#!/bin/bash
echo "⏳ Tizim fayllari qidirilmoqda..."

# 1. Admin JS (Foydalanuvchilar jadvali) faylini tuzatish
JS_FILE="public/js/admin.js"
if [ -f "$JS_FILE" ]; then
    # JS ichidagi oxirgi cookie ustunini uslub bilan almashtiramiz
    sed -i 's/max-width: 200px;/max-width: 400px; white-space: normal !important;/' "$JS_FILE"
    echo "✅ $JS_FILE muvaffaqiyatli yangilandi!"
fi

# 2. Barcha EJS / HTML fayllardagi jadvallarga avtomatik CSS qo'shish
find . -type f \( -name "*.ejs" -o -name "*.html" \) -not -path "*/node_modules/*" -exec grep -l "table" {} + | while read FILE; do
    if ! grep -q "table tbody tr td:nth-child(4)" "$FILE"; then
        # Agar fayl HTML bo'lsa oxiriga, EJS bo'lsa ham oxiriga qo'shamiz
        echo -e "\n<style>\n  table tbody tr td:nth-child(4) { max-width: 400px; word-break: break-all; white-space: normal !important; }\n  table tbody tr td:nth-child(6) { max-width: 250px; word-break: break-word; white-space: normal !important; font-size: 0.85em; }\n</style>" >> "$FILE"
        echo "✅ CSS qoidasi qo'shildi: $FILE"
    fi
done

echo "⏳ Github'ga avtomatik yuklanmoqda..."
git add .
git commit -m "force update all tables css and device columns"
git push
echo "🎉 Barchasi tayyor! Render avtomatik yangilangandan so'ng saytda matnlar to'liq ko'rinadi."
