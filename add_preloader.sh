#!/bin/bash
# ══════════════════════════════════════════
# PRELOADER AUTO-ADD — Bash versiyasi
# ══════════════════════════════════════════

set -e

PUBLIC_DIR="$HOME/Desktop/ctf-uz/public"
BACKUP_DIR="$HOME/Desktop/ctf-uz/.backup-preloader"

echo "╔══════════════════════════════════════════╗"
echo "║   PRELOADER AUTO-ADD (Bash)              ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# Papka tekshirish
if [ ! -d "$PUBLIC_DIR" ]; then
    echo "❌ Papka topilmadi: $PUBLIC_DIR"
    exit 1
fi

# CSS/JS tekshirish
if [ ! -f "$PUBLIC_DIR/css/preloader.css" ]; then
    echo "❌ CSS topilmadi: $PUBLIC_DIR/css/preloader.css"
    exit 1
fi

if [ ! -f "$PUBLIC_DIR/js/preloader.js" ]; then
    echo "❌ JS topilmadi: $PUBLIC_DIR/js/preloader.js"
    exit 1
fi

# Backup yaratish
mkdir -p "$BACKUP_DIR"
echo "💾 Backup: $BACKUP_DIR"
echo ""

# Hisoblagichlar
UPDATED=0
SKIPPED=0
ERRORS=0

# Har bir HTML faylni tahrirlash
cd "$PUBLIC_DIR"
for file in *.html; do
    if [ ! -f "$file" ]; then
        continue
    fi
    
    # Backup
    cp "$file" "$BACKUP_DIR/$file"
    
    CHANGED=0
    
    # CSS qo'shish
    if ! grep -q "preloader.css" "$file"; then
        if grep -q "</head>" "$file"; then
            sed -i 's|</head>|    <link rel="stylesheet" href="/css/preloader.css">\n</head>|' "$file"
            CHANGED=1
        fi
    fi
    
    # JS qo'shish
    if ! grep -q "preloader.js" "$file"; then
        if grep -q "</body>" "$file"; then
            sed -i 's|</body>|    <script src="/js/preloader.js"></script>\n</body>|' "$file"
            CHANGED=1
        fi
    fi
    
    if [ $CHANGED -eq 1 ]; then
        echo "✅ $file"
        UPDATED=$((UPDATED + 1))
    else
        echo "⏭  $file (allaqachon bor)"
        SKIPPED=$((SKIPPED + 1))
    fi
done

echo ""
echo "══════════════════════════════════════════════════"
echo "✅ Yangilangan:  $UPDATED"
echo "⏭  O'tkazilgan: $SKIPPED"
echo "📊 Jami:         $((UPDATED + SKIPPED))"
echo "══════════════════════════════════════════════════"
echo ""
echo "🎉 Tayyor!"
echo ""
echo "💡 Serverni qayta ishga tushiring:"
echo "   pkill -f 'node server.js' && npm start"
