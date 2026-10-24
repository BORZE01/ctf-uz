import os

code = """
const mongoose = require('mongoose');
const MONGO_URI = 'mongodb+srv://ctfuz_admin:AKKSAVDON137@ctf-uz-cluster.vtjol3t.mongodb.net/ctf-uz?retryWrites=true&w=majority'; 

const { Question } = require('./models/Learn');

async function forceFix() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Jonli bazaga ulanildi. Mongoose qoidalarini aylanib o`tib, barcha variantlar yozilmoqda...');

        const updates = [
            { match: "CIA triadasining qaysi tamoyilidan", opts: ["Maxfiylik", "Yaxlitlik", "Mavjudlik", "Autentifikatsiya"], ans: "Yaxlitlik" },
            { match: "massiv trafik hujumi", opts: ["Maxfiylik", "Yaxlitlik", "Mavjudlik", "Shifrlash"], ans: "Mavjudlik" },
            { match: "Siyosiy yoki ijtimoiy maqsadlarda", opts: ["Red Hat", "Hacktivistlar", "Script Kiddies", "White Hat"], ans: "Hacktivistlar" },
            { match: "tayyor vositalar orqali zarar", opts: ["Grey Hat", "Black Hat", "Script Kiddie", "Phishers"], ans: "Script Kiddie" },
            { match: "shaxsiy fayllarini shifrlab", opts: ["Spyware", "Ransomware", "Adware", "Trojan"], ans: "Ransomware" },
            { match: "IT dasturlarini yetkazib beruvchi hamkori", opts: ["Phishing", "Supply Chain Attack", "DDoS", "Man-in-the-Middle"], ans: "Supply Chain Attack" },
            { match: "ko'rsatmaning maqsadini tushunishga", opts: ["Fetch", "Decode", "Execute", "Store"], ans: "Decode" },
            { match: "avtomatik tekshiruvchi dastlabki bosqich", opts: ["BIOS", "UEFI", "POST", "CMOS"], ans: "POST" },
            { match: "fayl hajmini oshirmasdan yashirin kod", opts: ["MFT", "ACL", "ADS (Alternate Data Streams)", "EFS"], ans: "ADS (Alternate Data Streams)" },
            { match: "qaysi biri ustunlik", opts: ["Allow", "Deny", "Administrator hal qiladi", "Xato yuz beradi"], ans: "Deny" },
            { match: "ilova sifatida o'rnatiladigan Gipervizor", opts: ["Type-1", "Type-2", "Type-3", "Bare-metal"], ans: "Type-2" },
            { match: "oldingi sog'lom xotira nuqtasiga tezkor", opts: ["Backup", "Clone", "Snapshot", "Restore Point"], ans: "Snapshot" },
            { match: "paketlarni to'g'ri yo'naltirish", opts: ["Switch", "Hub", "Router", "Modem"], ans: "Router" },
            { match: "zavoddan yozilgan o'zgarmas 48-bitli", opts: ["IP manzil", "MAC manzil", "Subnet mask", "Gateway"], ans: "MAC manzil" },
            { match: "tezkor lekin ishonchsiz transport", opts: ["TCP", "UDP", "HTTP", "FTP"], ans: "UDP" },
            { match: "raqamli IP manzilga aylantirib", opts: ["DHCP", "DNS", "ARP", "SMTP"], ans: "DNS" },
            { match: "soxta MAC manzillar bilan to'ldirib", opts: ["ARP Spoofing", "MAC Flooding", "IP Spoofing", "DDoS"], ans: "MAC Flooding" },
            { match: "avtomatik bloklaydigan tizim to'liq", opts: ["Firewall", "IDS", "IPS (Intrusion Prevention System)", "VPN"], ans: "IPS (Intrusion Prevention System)" },
            { match: "haqiqiy tarmoqlarda emas, laboratoriyalarda", opts: ["Qonuniy va xavfsiz bo'lgani uchun", "Arzonroq bo'lgani uchun", "Tezroq ishlagani uchun", "Internet talab qilmagani uchun"], ans: "Qonuniy va xavfsiz bo'lgani uchun" },
            { match: "tayyor virtual muhitlarga ulanish", opts: ["Virtual mashina", "Onlayn platformalar", "Bulutli laboratoriya", "Fizik laboratoriya"], ans: "Onlayn platformalar" },
            { match: "qadam-baqadam o'rgatuvchi eng ommabop", opts: ["Hack The Box", "TryHackMe", "VulnHub", "CTFTime"], ans: "TryHackMe" },
            { match: "yashirin kodlarni izlaydigan musobaqa", opts: ["CTF (Capture The Flag)", "Bug Bounty", "PenTest", "Red Teaming"], ans: "CTF (Capture The Flag)" },
            { match: "paketlarini ushlab qolib", opts: ["Nmap", "Wireshark", "Burp Suite", "Hashcat"], ans: "Wireshark" },
            { match: "yo'lda ushlab (Intercept) tahrirlash", opts: ["Hydra", "Nmap", "Burp Suite", "John the Ripper"], ans: "Burp Suite" },
            { match: "Jarayonlarni filtrlash va matn ichidan", opts: ["ls", "grep", "cd", "mkdir"], ans: "grep" },
            { match: "kirish (login) loglari odatda qaysi faylda", opts: ["/var/log/auth.log", "/etc/shadow", "/var/log/syslog", "/root/login.txt"], ans: "/var/log/auth.log" },
            { match: "SSH orqali to'g'ridan-to'g'ri 'root'", opts: ["Port 22", "PermitRootLogin no", "PasswordAuthentication yes", "AllowUsers root"], ans: "PermitRootLogin no" },
            { match: "maksimal oshirish uchun SSH tizimida", opts: ["Murakkab parollar (12+ belgi)", "Faqat PIN kodlar", "Asimmetrik RSA kalitlari (Key-based)", "Ochiq matn (Clear-text)"], ans: "Asimmetrik RSA kalitlari (Key-based)" },
            { match: "markazlashgan holda boshqarish imkonini", opts: ["Windows Defender", "Active Directory (AD)", "Task Manager", "Registry Editor"], ans: "Active Directory (AD)" },
            { match: "parollari xeshlarini o'zida saqlovchi", opts: ["SAM", "NTDS.DIT", "winlogon.exe", "lsass.exe"], ans: "NTDS.DIT" },
            { match: "operatsion tizim (OS) versiyasini aniqlash", opts: ["-sV", "-O", "-p-", "-A"], ans: "-O" },
            { match: "takta-takror jo'natib", opts: ["Proxy", "Repeater", "Sequencer", "Comparer"], ans: "Repeater" },
            { match: "to'g'ridan-to'g'ri bazaga saqlanib", opts: ["Reflected XSS", "Stored XSS", "DOM-based XSS", "Blind XSS"], ans: "Stored XSS" }
        ];

        let totalFixed = 0;

        for (let u of updates) {
            // Mongoose modelini emas, bevosita MongoDB driverining collection API'sini ishlatamiz
            const res = await Question.collection.updateMany(
                { prompt: { $regex: u.match, $options: 'i' } },
                { $set: { options: u.opts, answers: [u.ans], correctAnswer: u.ans } }
            );
            totalFixed += res.modifiedCount;
        }

        console.log(`✅ Jami ${totalFixed} ta joyda variantlar (options) majburiy ravishda joylandi!`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Xatolik:', err);
        process.exit(1);
    }
}
forceFix();
"""

with open("force_fix_all_questions.js", "w", encoding="utf-8") as f:
    f.write(code)
