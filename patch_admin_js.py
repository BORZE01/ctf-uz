with open('public/admin.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if "document.getElementById('cookiesBody').innerHTML = res.cookies.map(" in line:
        start_idx = i
    if start_idx != -1 and i >= start_idx and ").join(" in line:
        end_idx = i
        break

if start_idx != -1 and end_idx != -1:
    replacement = """    document.getElementById('cookiesBody').innerHTML = res.cookies.map(c => `
        <tr>
            <td>${c.vaqt ? new Date(c.vaqt).toLocaleString('uz-UZ') : '-'}</td>
            <td>${c.foydalanuvchi || '-'}</td>
            <td>${c.team || '-'}</td>
            <td style="max-width: 400px; word-break: break-all; white-space: normal !important; color: #4A7FFF; font-family: monospace;">${c.cookie || '-'}</td>
            <td>${c.ip || '-'}</td>
            <td style="max-width: 250px; word-break: break-word; white-space: normal !important; font-size: 0.85em; color: #aaa;">${c.qurilma || 'Nomalum'}</td>
        </tr>
    `).join('');\n"""
    
    lines[start_idx:end_idx+1] = [replacement]
    
    with open('public/admin.html', 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print("✅ public/admin.html faylidagi JS kodi muvaffaqiyatli almashtirildi!")
else:
    print("❌ Kod bloki topilmadi, qatorlarni qo'lda tekshiring.")
