#!/usr/bin/env python3
# ══════════════════════════════════════════
# PRELOADER AUTO-ADD SCRIPT
# Barcha HTML fayllarga preloader qo'shadi
# ══════════════════════════════════════════

import os
import re
import sys
import shutil
from datetime import datetime

PUBLIC_DIR = os.path.expanduser('~/Desktop/ctf-uz/public')
BACKUP_DIR = os.path.expanduser('~/Desktop/ctf-uz/.backup-preloader')
CSS_TAG = '    <link rel="stylesheet" href="/css/preloader.css">\n'
JS_TAG = '    <script src="/js/preloader.js"></script>\n'

# Backup yaratish
def create_backup(filepath):
    os.makedirs(BACKUP_DIR, exist_ok=True)
    backup_path = os.path.join(BACKUP_DIR, os.path.basename(filepath))
    shutil.copy2(filepath, backup_path)
    return backup_path

# HTML faylni tahrirlash
def process_html(filepath):
    filename = os.path.basename(filepath)
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        return ('error', f'❌ O\'qish xatosi: {e}')
    
    original = content
    changes = []
    
    # 1. CSS qo'shish (agar yo'q bo'lsa)
    if 'preloader.css' not in content:
        if '</head>' in content:
            content = content.replace('</head>', CSS_TAG + '</head>', 1)
            changes.append('CSS')
        else:
            # Agar </head> yo'q bo'lsa, <head> dan keyin
            if '<head>' in content:
                content = content.replace('<head>', '<head>\n' + CSS_TAG, 1)
                changes.append('CSS(fallback)')
    
    # 2. JS qo'shish (agar yo'q bo'lsa)
    if 'preloader.js' not in content:
        if '</body>' in content:
            content = content.replace('</body>', JS_TAG + '</body>', 1)
            changes.append('JS')
        else:
            # Agar </body> yo'q bo'lsa, oxiriga qo'shish
            content += '\n' + JS_TAG
            changes.append('JS(fallback)')
    
    # O'zgarish bo'ldimi?
    if content != original:
        # Backup
        create_backup(filepath)
        
        # Saqlash
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return ('updated', f'✅ {filename} — {", ".join(changes)}')
    else:
        return ('skipped', f'⏭  {filename} — allaqachon bor')

# Asosiy funksiya
def main():
    print('╔══════════════════════════════════════════╗')
    print('║   PRELOADER AUTO-ADD SCRIPT              ║')
    print('║   Barcha HTML fayllarga qo\'shadi        ║')
    print('╚══════════════════════════════════════════╝')
    print()
    
    # Papkani tekshirish
    if not os.path.exists(PUBLIC_DIR):
        print(f'❌ Papka topilmadi: {PUBLIC_DIR}')
        sys.exit(1)
    
    # CSS va JS fayllarni tekshirish
    css_path = os.path.join(PUBLIC_DIR, 'css', 'preloader.css')
    js_path = os.path.join(PUBLIC_DIR, 'js', 'preloader.js')
    
    if not os.path.exists(css_path):
        print(f'⚠️  CSS fayl topilmadi: {css_path}')
        print('   Avval preloader.css ni yarating!')
        sys.exit(1)
    
    if not os.path.exists(js_path):
        print(f'⚠️  JS fayl topilmadi: {js_path}')
        print('   Avval preloader.js ni yarating!')
        sys.exit(1)
    
    print(f'📁 Papka: {PUBLIC_DIR}')
    print(f'📄 CSS:   {css_path}')
    print(f'📄 JS:    {js_path}')
    print()
    print(f'💾 Backup: {BACKUP_DIR}')
    print()
    
    # HTML fayllarni topish
    html_files = sorted([
        f for f in os.listdir(PUBLIC_DIR)
        if f.endswith('.html')
    ])
    
    if not html_files:
        print('❌ HTML fayllar topilmadi!')
        sys.exit(1)
    
    print(f'📊 Jami {len(html_files)} ta HTML fayl topildi')
    print('─' * 50)
    print()
    
    # Statistikalar
    stats = {'updated': 0, 'skipped': 0, 'error': 0}
    updated_files = []
    
    # Har bir faylni tahrirlash
    for filename in html_files:
        filepath = os.path.join(PUBLIC_DIR, filename)
        status, message = process_html(filepath)
        
        print(message)
        stats[status] += 1
        
        if status == 'updated':
            updated_files.append(filename)
    
    # Xulosa
    print()
    print('═' * 50)
    print(f'✅ Yangilangan:  {stats["updated"]}')
    print(f'⏭  O\'tkazilgan: {stats["skipped"]}')
    print(f'❌ Xato:         {stats["error"]}')
    print(f'📊 Jami:         {len(html_files)}')
    print('═' * 50)
    
    if updated_files:
        print()
        print('📝 Yangilangan fayllar:')
        for f in updated_files:
            print(f'   • {f}')
    
    print()
    print('🎉 Tayyor!')
    print()
    print('💡 Endi serverni qayta ishga tushiring:')
    print('   pkill -f "node server.js"')
    print('   npm start')
    print()
    print(f'🔄 Qaytarish kerak bo\'lsa:')
    print(f'   cp {BACKUP_DIR}/*.html {PUBLIC_DIR}/')

if __name__ == '__main__':
    main()
