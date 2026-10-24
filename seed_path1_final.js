
const mongoose = require('mongoose');
const MONGO_URI = 'mongodb+srv://ctfuz_admin:AKKSAVDON137@ctf-uz-cluster.vtjol3t.mongodb.net/ctf-uz?retryWrites=true&w=majority'; 

const { LearningPath, Module, Lesson, Question } = require('./models/Learn');

async function seedData() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Jonli bazaga ulanildi.');

        const oldPaths = await LearningPath.find({ slug: '1-yol-asoslar' });
        for (let p of oldPaths) {
            const oldLessons = await Lesson.find({ moduleSlug: { $regex: /^1-yol/ } });
            const lessonIds = oldLessons.map(l => l._id);
            await Question.deleteMany({ lessonId: { $in: lessonIds } });
            await Lesson.deleteMany({ moduleSlug: { $regex: /^1-yol/ } });
            await Module.deleteMany({ pathSlug: p.slug });
        }
        await LearningPath.deleteMany({ slug: '1-yol-asoslar' });

        const path1 = await LearningPath.create({
            title: "1-yo'l. Kiberxavfsizlik asoslari va Infratuzilma",
            slug: "1-yol-asoslar",
            description: "Kiberxavfsizlik poydevori, xakerlik turlari, operatsion tizimlar, tarmoqlar va laboratoriya vositalarini o'zlashtirish.",
            order: 1,
            isPublished: true,
            level: "Beginner",
            certificateTitle: "Kiberxavfsizlik Asoslari Mutaxassisi (Red Teamer)",
            finalQuestions: [
                { id: "fq1", prompt: "Ma'lumotlarning kiberhujumlar natijasida ruxsatsiz o'zgartirilmasligini kafolatlovchi tamoyil CIA triadasining qaysi qismiga taalluqli?", options: ["Maxfiylik", "Yaxlitlik", "Mavjudlik", "Autentifikatsiya"], correctAnswer: "Yaxlitlik", points: 10 },
                { id: "fq2", prompt: "Kompaniyalarga ruxsat bilan tizim zaifliklarini topishda yordam beruvchi mutaxassislar (Etik xakerlar) qanday nomlanadi?", options: ["Qora qalpoqlar", "Kulrang qalpoqlar", "Oq qalpoqlar", "Hacktivistlar"], correctAnswer: "Oq qalpoqlar", points: 10 },
                { id: "fq3", prompt: "Tashkilotga IT xizmatlari yetkazib beruvchi boshqa ishonchli hamkor tarmog'ini buzish orqali amalga oshiriladigan strategik hujum (masalan, SolarWinds) qanday ataladi?", options: ["Phishing", "Supply Chain Attack", "Ransomware", "DDoS"], correctAnswer: "Supply Chain Attack", points: 10 },
                { id: "fq4", prompt: "Zararli dasturlarni xavfsiz muhitda ishga tushirish uchun kompyuter apparat resurslarini mantiqiy bo'lib beruvchi texnologiya nima deb nomlanadi?", options: ["Virtualizatsiya", "Shifrlash", "Konteynerizatsiya", "Marshrutlash"], correctAnswer: "Virtualizatsiya", points: 10 },
                { id: "fq5", prompt: "Protsessor (CPU) siklida (Fetch-Decode-Execute-Store) xotiradan olib kelingan buyruqni bevosita amalga oshirish jarayoni qaysi bosqichda yuz beradi?", options: ["Fetch", "Decode", "Execute", "Store"], correctAnswer: "Execute", points: 10 },
                { id: "fq6", prompt: "Windows tizimida ACL (ruxsatlar) va MFT orqali xavfsizlikni ta'minlaydigan zamonaviy fayl tizimi qaysi?", options: ["FAT32", "exFAT", "NTFS", "ext4"], correctAnswer: "NTFS", points: 10 },
                { id: "fq7", prompt: "OSI modelining 3-qatlamida ishlaydigan, IP manzillar asosida paketlarni uzatishni ta'minlovchi tarmoq qurilmasini toping.", options: ["Switch", "Hub", "Router", "Modem"], correctAnswer: "Router", points: 10 },
                { id: "fq8", prompt: "Ulanishni to'liq o'rnatmasdan ishlaydigan, natijada juda tez bo'lgani uchun video-striming va DNS so'rovlarida keng qo'llaniladigan transport qatlami protokoli qanday nomlanadi?", options: ["TCP", "HTTP", "UDP", "SSH"], correctAnswer: "UDP", points: 10 },
                { id: "fq9", prompt: "O'z kompyuterida ataylab zaiflashtirilgan operatsion tizimlarni (VM) oflayn yuklab olib, buzishni mashq qilish imkonini beruvchi platforma qaysi?", options: ["TryHackMe", "Hack The Box", "VulnHub", "PortSwigger"], correctAnswer: "VulnHub", points: 10 },
                { id: "fq10", prompt: "Tarmoqdagi kompyuterlarda qaysi portlar ochiq ekanligini aniqlash maqsadida keng qo'llaniladigan asosiy tarmoq skaneri qanday ataladi?", options: ["Wireshark", "Burp Suite", "Nmap", "John the Ripper"], correctAnswer: "Nmap", points: 10 }
            ]
        });

        const mod1 = await Module.create({ title: "Modul 1: Kiberxavfsizlik Falsafasi", slug: "1-yol-m1", pathSlug: path1.slug, order: 1 });
        const mod2 = await Module.create({ title: "Modul 2: Operatsion Tizimlar va Virtualizatsiya", slug: "1-yol-m2", pathSlug: path1.slug, order: 2 });
        const mod3 = await Module.create({ title: "Modul 3: Tarmoq Asoslari va Protokollar", slug: "1-yol-m3", pathSlug: path1.slug, order: 3 });
        const mod4 = await Module.create({ title: "Modul 4: Laboratoriyalar va Arsenal", slug: "1-yol-m4", pathSlug: path1.slug, order: 4 });

        // MODUL 1
        const l1_1 = await Lesson.create({ title: "1. Kiberxavfsizlik nima va CIA Triadasi", slug: "1-yol-m1-l1", moduleSlug: mod1.slug, order: 1, xpReward: 50,
            content: "Kiberxavfsizlik — bu kompyuter tizimlari, tarmoqlari va elektron ma'lumotlarni ruxsatsiz kirishdan himoya qilish. Uning poydevori CIA triadasi (Maxfiylik, Yaxlitlik, Mavjudlik). Maxfiylik SSL/TLS kabi shifrlash va 2FA orqali, Yaxlitlik Hash funksiyalari orqali ta'minlanadi. Mavjudlikka eng katta tahdid bu DDoS hujumlaridir." });
        await Question.create([
            { lessonId: l1_1._id, prompt: "Ma'lumotlarning tranzit vaqtida o'zgartirilmaganini tasdiqlash uchun CIA triadasining qaysi tamoyilidan foydalaniladi?", options: ["Maxfiylik", "Yaxlitlik", "Mavjudlik", "Autentifikatsiya"], correctAnswer: "Yaxlitlik", points: 20 },
            { lessonId: l1_1._id, prompt: "Tizimga qilingan massiv trafik hujumi (DDoS) qaysi xavfsizlik tamoyilini bevosita ishdan chiqarishga qaratilgan?", options: ["Maxfiylik", "Yaxlitlik", "Mavjudlik", "Shifrlash"], correctAnswer: "Mavjudlik", points: 20 }
        ]);

        const l1_2 = await Lesson.create({ title: "2. Xakerlar turlari va Ijtimoiy Muhandislik", slug: "1-yol-m1-l2", moduleSlug: mod1.slug, order: 2, xpReward: 50,
            content: "Xakerlar: Oq qalpoqlar (White Hat) qonuniy mutaxassislar. Qora qalpoqlar (Black Hat) jinoyatchilar. Kulrang qalpoqlar (Grey Hat) ruxsatsiz kirib, mukofot so'raydi. Red Hat qora qalpoqlilarga qarshi kurashadi. Hacktivistlar siyosiy maqsadlarni ko'zlaydi, Script Kiddie'lar esa tayyor skriptlarni tushunmasdan ishlatadi." });
        await Question.create([
            { lessonId: l1_2._id, prompt: "Siyosiy yoki ijtimoiy maqsadlarda tizimlarni buzuvchi guruhlar qanday nomlanadi?", options: ["Red Hat", "Hacktivistlar", "Script Kiddies", "White Hat"], correctAnswer: "Hacktivistlar", points: 20 },
            { lessonId: l1_2._id, prompt: "O'zlashtirilgan bilimi bo'lmagan holda, tayyor vositalar orqali zarar yetkazishga urinadigan shaxslar kimlar?", options: ["Grey Hat", "Black Hat", "Script Kiddie", "Phishers"], correctAnswer: "Script Kiddie", points: 20 }
        ]);

        const l1_3 = await Lesson.create({ title: "3. Kiberxavfsizlik tahdidlari va Ta'sir doirasi", slug: "1-yol-m1-l3", moduleSlug: mod1.slug, order: 3, xpReward: 50,
            content: "Shaxsiy tahdidlar: Identity Theft, Phishing, Ransomware (fayllarni shifrlab pul talab qilish). Korporativ: Supply Chain Attacks (hamkor orqali hujum, masalan SolarWinds) va BEC. Milliy: Kiberjosuslik (APT) va elektr stansiyalariga xurujlar." });
        await Question.create([
            { lessonId: l1_3._id, prompt: "Foydalanuvchining shaxsiy fayllarini shifrlab qo'yib, to'lov talab qiluvchi dastur qanday ataladi?", options: ["Spyware", "Ransomware", "Adware", "Trojan"], correctAnswer: "Ransomware", points: 20 },
            { lessonId: l1_3._id, prompt: "Yirik tashkilotga uning IT dasturlarini yetkazib beruvchi hamkori tizimini buzish orqali qilinadigan hujum turi qaysi?", options: ["Phishing", "Supply Chain Attack", "DDoS", "Man-in-the-Middle"], correctAnswer: "Supply Chain Attack", points: 20 }
        ]);

        // MODUL 2
        const l2_1 = await Lesson.create({ title: "1. Kompyuter va Operatsion tizimlar arxitekturasi", slug: "1-yol-m2-l1", moduleSlug: mod2.slug, order: 1, xpReward: 50,
            content: "OT kompyuterning apparat va dasturiy qismlari o'rtasidagi vositachi (Yadro, Fayl tizimi, Drayverlar). CPU Fetch-Decode-Execute-Store siklida ko'rsatmalarni bajaradi. POST (Power-On Self-Test) kompyuter yoqilganda barcha apparatlarni tekshiradi." });
        await Question.create([
            { lessonId: l2_1._id, prompt: "Protsessor siklida ko'rsatmaning maqsadini tushunishga qaratilgan bosqich qaysi?", options: ["Fetch", "Decode", "Execute", "Store"], correctAnswer: "Decode", points: 20 },
            { lessonId: l2_1._id, prompt: "Kompyuter yoqilganda RAM, protsessor kabi qismlarning sozligini avtomatik tekshiruvchi dastlabki bosqich nima?", options: ["BIOS", "UEFI", "POST", "CMOS"], correctAnswer: "POST", points: 20 }
        ]);

        const l2_2 = await Lesson.create({ title: "2. Windows Fayl Tizimi (NTFS)", slug: "1-yol-m2-l2", moduleSlug: mod2.slug, order: 2, xpReward: 50,
            content: "NTFS Windows'ning asosiy fayl tizimi. Uning yadrosi MFT bo'lib, metama'lumotlarni saqlaydi. NTFS xavfsizligi ACL orqali boshqariladi. ADS (Alternate Data Streams) orqali faylning orqasiga yashirin zararli kod biriktirish mumkin." });
        await Question.create([
            { lessonId: l2_2._id, prompt: "Qaysi NTFS xususiyati orqali fayl hajmini oshirmasdan yashirin kod qo'shish mumkin?", options: ["MFT", "ACL", "ADS (Alternate Data Streams)", "EFS"], correctAnswer: "ADS (Alternate Data Streams)", points: 20 },
            { lessonId: l2_2._id, prompt: "Agar bitta guruh orqali 'Allow', boshqa guruh orqali 'Deny' belgilangan bo'lsa, qaysi biri ustunlik qiladi?", options: ["Allow", "Deny", "Administrator hal qiladi", "Xato yuz beradi"], correctAnswer: "Deny", points: 20 }
        ]);

        const l2_3 = await Lesson.create({ title: "3. Virtualizatsiya va Hypervisor", slug: "1-yol-m2-l3", moduleSlug: mod2.slug, order: 3, xpReward: 50,
            content: "Virtualizatsiya bitta Host'da bir nechta VM ishga tushirish imkonini beradi. Buni Hypervisor boshqaradi. Type-1 to'g'ridan-to'g'ri apparatga, Type-2 mavjud OT ustiga o'rnatiladi. Snapshot funksiyasi VM'ning holatini muzlatib saqlaydi va tez tiklash (Revert) imkonini beradi." });
        await Question.create([
            { lessonId: l2_3._id, prompt: "Mavjud OT ustiga ilova sifatida o'rnatiladigan Gipervizor (masalan, VirtualBox) qaysi turga kiradi?", options: ["Type-1", "Type-2", "Type-3", "Bare-metal"], correctAnswer: "Type-2", points: 20 },
            { lessonId: l2_3._id, prompt: "Virtual tizim ishdan chiqqanda, uni oldingi sog'lom xotira nuqtasiga tezkor qaytaruvchi funksiya nima deb ataladi?", options: ["Backup", "Clone", "Snapshot", "Restore Point"], correctAnswer: "Snapshot", points: 20 }
        ]);

        // MODUL 3
        const l3_1 = await Lesson.create({ title: "1. Tarmoq modellari (OSI va TCP/IP)", slug: "1-yol-m3-l1", moduleSlug: mod3.slug, order: 1, xpReward: 50,
            content: "Tarmoq muhitlari LAN, WAN, MAN, PAN larga bo'linadi. 7 qatlamli OSI va TCP/IP modellari mavjud. Kanal qatlamida Switch MAC manzillar orqali, Tarmoq qatlamida Router IP manzillar bo'yicha paketlarni marshrutlaydi." });
        await Question.create([
            { lessonId: l3_1._id, prompt: "OSI modelining 3-qatlamida paketlarni to'g'ri yo'naltirish uchun qaysi qurilma ishlatiladi?", options: ["Switch", "Hub", "Router", "Modem"], correctAnswer: "Router", points: 20 },
            { lessonId: l3_1._id, prompt: "Faqat mahalliy tarmoq (LAN) ichida ishlatiladigan va zavoddan yozilgan o'zgarmas 48-bitli manzil nima?", options: ["IP manzil", "MAC manzil", "Subnet mask", "Gateway"], correctAnswer: "MAC manzil", points: 20 }
        ]);

        const l3_2 = await Lesson.create({ title: "2. Tarmoq Protokollari (TCP vs UDP)", slug: "1-yol-m3-l2", moduleSlug: mod3.slug, order: 2, xpReward: 50,
            content: "TCP (uch tomonlama qo'l siqish) ishonchli ulanish o'rnatadi (HTTP, SSH). UDP esa ulanish o'rnatmasdan ishlaydigan o'ta tezkor protokol bo'lib, DNS va video-strimingda qo'llaniladi." });
        await Question.create([
            { lessonId: l3_2._id, prompt: "DNS va onlayn o'yinlarda ishlatiladigan, tezkor lekin ishonchsiz transport protokoli qaysi?", options: ["TCP", "UDP", "HTTP", "FTP"], correctAnswer: "UDP", points: 20 },
            { lessonId: l3_2._id, prompt: "Matnli domenni (google.com) raqamli IP manzilga aylantirib beruvchi protokol qanday nomlanadi?", options: ["DHCP", "DNS", "ARP", "SMTP"], correctAnswer: "DNS", points: 20 }
        ]);

        const l3_3 = await Lesson.create({ title: "3. Tarmoq Hujumlari va Himoya", slug: "1-yol-m3-l3", moduleSlug: mod3.slug, order: 3, xpReward: 50,
            content: "Tarmoq hujumlari: Layer 2 da MAC Flooding, ARP Spoofing. Layer 3 da IP Spoofing. Ilova qatlamida SQL Injection, XSS. Himoya uchun Firewall va IDS/IPS (hujumni aniqlab bloklovchi tizim) vositalaridan foydalaniladi." });
        await Question.create([
            { lessonId: l3_3._id, prompt: "Switch xotirasini soxta MAC manzillar bilan to'ldirib yuborish hujumi nima deb ataladi?", options: ["ARP Spoofing", "MAC Flooding", "IP Spoofing", "DDoS"], correctAnswer: "MAC Flooding", points: 20 },
            { lessonId: l3_3._id, prompt: "Tarmoq trafigini kuzatib, xavfli naqshlarni avtomatik bloklaydigan tizim to'liq qanday nomlanadi?", options: ["Firewall", "IDS", "IPS (Intrusion Prevention System)", "VPN"], correctAnswer: "IPS (Intrusion Prevention System)", points: 20 }
        ]);

        // MODUL 4
        const l4_1 = await Lesson.create({ title: "1. Xavfsiz Laboratoriya Qurish", slug: "1-yol-m4-l1", moduleSlug: mod4.slug, order: 1, xpReward: 50,
            content: "Kiberxavfsizlik ko'nikmalari sun'iy Laboratoriyalarda o'rganiladi. Onlayn platformalar brauzer orqali ishlaydi. Virtual mashinalar asosidagi local laboratoriyalar (VMware/VirtualBox) to'liq nazorat va oflayn ishlash imkonini beradi." });
        await Question.create([
            { lessonId: l4_1._id, prompt: "Nima uchun kiberxavfsizlik hujumlarini haqiqiy tarmoqlarda emas, laboratoriyalarda sinash talab etiladi?", options: ["Qonuniy va xavfsiz bo'lgani uchun", "Arzonroq bo'lgani uchun", "Tezroq ishlagani uchun", "Internet talab qilmagani uchun"], correctAnswer: "Qonuniy va xavfsiz bo'lgani uchun", points: 20 },
            { lessonId: l4_1._id, prompt: "Brauzer va VPN orqali tayyor virtual muhitlarga ulanish imkonini beruvchi laboratoriya turi qaysi?", options: ["Virtual mashina", "Onlayn platformalar", "Bulutli laboratoriya", "Fizik laboratoriya"], correctAnswer: "Onlayn platformalar", points: 20 }
        ]);

        const l4_2 = await Lesson.create({ title: "2. Ta'lim Platformalari", slug: "1-yol-m4-l2", moduleSlug: mod4.slug, order: 2, xpReward: 50,
            content: "TryHackMe (THM) yangi boshlovchilar uchun interaktiv 'xonalar' orqali o'rgatadi. Hack The Box (HTB) haqiqiy zaifliklarga ega 'mashinalar' taqdim etadi. VulnHub orqali ataylab zaiflashtirilgan VMlarni oflayn test qilish mumkin. CTF musobaqalari flaglarni topishga asoslangan." });
        await Question.create([
            { lessonId: l4_2._id, prompt: "Yangi boshlovchilarga qadam-baqadam o'rgatuvchi eng ommabop platforma qaysi?", options: ["Hack The Box", "TryHackMe", "VulnHub", "CTFTime"], correctAnswer: "TryHackMe", points: 20 },
            { lessonId: l4_2._id, prompt: "Tizimlardagi zaifliklarni topish orqali yashirin kodlarni izlaydigan musobaqa formati qanday ataladi?", options: ["CTF (Capture The Flag)", "Bug Bounty", "PenTest", "Red Teaming"], correctAnswer: "CTF (Capture The Flag)", points: 20 }
        ]);

        const l4_3 = await Lesson.create({ title: "3. Professional Xakerlik Vositalari", slug: "1-yol-m4-l3", moduleSlug: mod4.slug, order: 3, xpReward: 50,
            content: "Nmap tarmoqni skanerlaydi, Wireshark paketlarni tahlil qiladi. Veb-xavfsizlik uchun Burp Suite (Proxy va Repeater) ishlatiladi. Parollarni oflayn buzish uchun Hashcat, tarmoq orqali hujum uchun Hydra ishlatiladi." });
        await Question.create([
            { lessonId: l4_3._id, prompt: "Tarmoq paketlarini ushlab qolib, ularni chuqur tahlil qiluvchi dastur qaysi?", options: ["Nmap", "Wireshark", "Burp Suite", "Hashcat"], correctAnswer: "Wireshark", points: 20 },
            { lessonId: l4_3._id, prompt: "Veb-saytga yuborilayotgan so'rovlarni yo'lda ushlab (Intercept) tahrirlash uchun ishlatiladigan vosita nima?", options: ["Hydra", "Nmap", "Burp Suite", "John the Ripper"], correctAnswer: "Burp Suite", points: 20 }
        ]);

        console.log('✅ 1-yol barcha 4 ta modul, 12 ta dars, va 34 ta savoli bilan muvaffaqiyatli yuklandi!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Xatolik:', err);
        process.exit(1);
    }
}
seedData();
