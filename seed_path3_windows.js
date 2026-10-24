
const mongoose = require('mongoose');
const MONGO_URI = 'mongodb+srv://ctfuz_admin:AKKSAVDON137@ctf-uz-cluster.vtjol3t.mongodb.net/ctf-uz?retryWrites=true&w=majority'; 

const { LearningPath, Module, Lesson, Question } = require('./models/Learn');

async function seedPath3() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Jonli bazaga ulanildi. 3-yo`l (Windows Xavfsizligi) yozilmoqda...');

        const oldPath = await LearningPath.findOne({ slug: '3-yol-windows' });
        if (oldPath) {
            const oldLessons = await Lesson.find({ moduleSlug: { $regex: /^3-yol/ } });
            const lessonIds = oldLessons.map(l => l._id);
            await Question.deleteMany({ lessonId: { $in: lessonIds } });
            await Lesson.deleteMany({ moduleSlug: { $regex: /^3-yol/ } });
            await Module.deleteMany({ pathSlug: '3-yol-windows' });
            await LearningPath.deleteOne({ slug: '3-yol-windows' });
        }

        const finalQs = [
            // 10 ta Linux (2-yo'l) savollari
            { id: "f3q1", prompt: "Linuxda haqiqiy parol xeshlarini saqlaydigan xavfsiz fayl qaysi?", options: ["/etc/passwd", "/etc/shadow", "/etc/group", "/var/log/auth.log"], answers: ["/etc/shadow"], correctAnswer: "/etc/shadow", points: 10 },
            { id: "f3q2", prompt: "Fayl bajarilganda, u doimo fayl egasining (owner) huquqlari bilan ishlashini ta'minlovchi bit nima?", options: ["Sticky bit", "SGID", "SUID", "Umask"], answers: ["SUID"], correctAnswer: "SUID", points: 10 },
            { id: "f3q3", prompt: "Child process tugagach, parent uni wait() qilmasa, u qanday holatga tushadi?", options: ["Orphan", "Zombie", "Sleeping", "Running"], answers: ["Zombie"], correctAnswer: "Zombie", points: 10 },
            { id: "f3q4", prompt: "Cron ishiga PATH noto'g'ri o'rnatilganida qilinadigan hujum turi qaysi?", options: ["PATH Hijacking", "Wildcard Injection", "SUID Exploitation", "SQL Injection"], answers: ["PATH Hijacking"], correctAnswer: "PATH Hijacking", points: 10 },
            { id: "f3q5", prompt: "Nmap orqali ulanishni to'liq o'rnatmasdan qilinadigan 'yashirin' (stealth) skanerlash turi qaysi?", options: ["TCP Connect Scan (-sT)", "UDP Scan (-sU)", "TCP SYN Scan (-sS)", "NULL Scan (-sN)"], answers: ["TCP SYN Scan (-sS)"], correctAnswer: "TCP SYN Scan (-sS)", points: 10 },
            { id: "f3q6", prompt: "Matn faylida so'zlarni katta-kichik harfga e'tibor bermasdan qidirish uchun qaysi opsiyadan foydalaniladi?", options: ["grep -v", "grep -i", "grep -c", "grep -n"], answers: ["grep -i"], correctAnswer: "grep -i", points: 10 },
            { id: "f3q7", prompt: "Fayldagi satrlar va so'zlar sonini hisoblaydigan buyruqni ko'rsating.", options: ["cut", "sort", "uniq", "wc"], answers: ["wc"], correctAnswer: "wc", points: 10 },
            { id: "f3q8", prompt: "Arxivdan fayllarni xavfsiz chiqarishda, ularning egasi root bo'lib qolmasligi uchun qaysi opsiya shart?", options: ["--no-same-owner", "--acls", "-xzvf", "-cjf"], answers: ["--no-same-owner"], correctAnswer: "--no-same-owner", points: 10 },
            { id: "f3q9", prompt: "NFS serverda mijozning root foydalanuvchisini 'nobody' ga aylantiruvchi himoya sozlamasi nima?", options: ["no_root_squash", "root_squash", "async", "rw"], answers: ["root_squash"], correctAnswer: "root_squash", points: 10 },
            { id: "f3q10", prompt: "Samba serverida parolsiz, anonim kirishga ruxsat beruvchi xavfli parametr nima?", options: ["guest ok = yes", "read only = yes", "browseable = yes", "server min protocol = SMB3"], answers: ["guest ok = yes"], correctAnswer: "guest ok = yes", points: 10 },
            // 10 ta Windows (3-yo'l) savollari
            { id: "f3q11", prompt: "Windows fayl tizimida barcha fayl va kataloglar haqidagi metama'lumotlarni saqlovchi markaziy baza nima deb ataladi?", options: ["FAT32", "MFT", "PBS", "ACL"], answers: ["MFT"], correctAnswer: "MFT", points: 10 },
            { id: "f3q12", prompt: "Faylning hajmini o'zgartirmasdan, unga yashirin zararli kod biriktirish imkonini beruvchi NTFS xususiyati qaysi?", options: ["MFT Mirror", "Journaling", "Alternate Data Streams (ADS)", "EFS"], answers: ["Alternate Data Streams (ADS)"], correctAnswer: "Alternate Data Streams (ADS)", points: 10 },
            { id: "f3q13", prompt: "Windows tizimi foydalanuvchilarni ularning nomlari bilan emas, balki qanday o'zgarmas identifikator orqali taniydi?", options: ["PID", "UID", "SID", "MAC"], answers: ["SID"], correctAnswer: "SID", points: 10 },
            { id: "f3q14", prompt: "Xavfsizlik Deskriptorida (Security Descriptor) audit qilishni va jurnallarga yozishni qaysi qism belgilaydi?", options: ["DACL", "SACL", "Owner", "Primary Group"], answers: ["SACL"], correctAnswer: "SACL", points: 10 },
            { id: "f3q15", prompt: "Tizim ruxsatlarni tekshirayotganda bitta guruhdan 'Allow' va boshqa guruhdan 'Deny' bo'lsa, qaysi qoida ishlaydi?", options: ["Allow Wins", "Deny Wins", "Inherited Wins", "Admin Hal Qiladi"], answers: ["Deny Wins"], correctAnswer: "Deny Wins", points: 10 },
            { id: "f3q16", prompt: "Administrator huquqiga ega bo'lmasa-da, fayl tizimi ruxsatlarini aylanib o'tib SAM xeshlarini o'qiy oladigan guruh qaysi?", options: ["Power Users", "Guests", "Backup Operators", "Remote Desktop Users"], answers: ["Backup Operators"], correctAnswer: "Backup Operators", points: 10 },
            { id: "f3q17", prompt: "RDP (Masofaviy ish stoli) ulanish sessiyasi ochilishidan avval autentifikatsiyani talab qiluvchi himoya xususiyati nima?", options: ["UAC", "NLA", "ACL", "SMB"], answers: ["NLA"], correctAnswer: "NLA", points: 10 },
            { id: "f3q18", prompt: "Qaysi Windows siyosati yoqilgan bo'lsa, oddiy foydalanuvchi ishga tushirgan har qanday .msi o'rnatish fayli avtomatik SYSTEM huquqida bajariladi?", options: ["UAC Bypass", "AlwaysInstallElevated", "Unquoted Service Path", "AppLocker"], answers: ["AlwaysInstallElevated"], correctAnswer: "AlwaysInstallElevated", points: 10 },
            { id: "f3q19", prompt: "Windows parollarini qattiq himoyalangan qaysi ma'lumotlar bazasida (NTLM xeshlarida) saqlaydi?", options: ["LSASS", "SAM", "Unattend.xml", "Registry"], answers: ["SAM"], correctAnswer: "SAM", points: 10 },
            { id: "f3q20", prompt: "Zararli fayl yopilganda aloqa uzilib qolmasligi uchun Meterpreter sessiyasini ishonchli jarayonga (masalan, services.exe) ko'chiruvchi buyruq nima?", options: ["lsa_dump", "hashdump", "migrate", "sysinfo"], answers: ["migrate"], correctAnswer: "migrate", points: 10 }
        ];

        const pathDoc = new LearningPath({
            title: "3-yo'l. Windows Xavfsizligi va Infratuzilma",
            slug: "3-yol-windows",
            description: "Windows operatsion tizimining chuqur xavfsizlik arxitekturasi, NTFS fayl tizimi, ruxsatlar (ACL, SID), RDP hamda mahalliy imtiyozlarni oshirish (LPE) texnikalarini o'rganish.",
            order: 3,
            isPublished: true,
            level: "Advanced",
            certificateTitle: "Windows Xavfsizligi Mutaxassisi",
            finalQuestions: finalQs
        });
        await pathDoc.save();

        const modulesData = [
            {
                title: "Modul 1: Windows Fayl Tizimi va NTFS Arxitekturasi",
                slug: "3-yol-m1",
                lessons: [
                    {
                        title: "1. Windows Fayl Tizimlari va NTFS Asoslari",
                        content: `<p>Windows muhitida bir necha fayl tizimlari ishlatiladi. <b>FAT32</b> eng eskisi bo'lib, 4GB dan katta fayllarni ko'tara olmaydi. <b>exFAT</b> katta fayllar uchun moslashgan, lekin xavfsizlik qatlami past.</p><p><b>NTFS (New Technology File System)</b> zamonaviy Windowsning asosi bo'lib, jurnallash (Journaling), shifrlash (EFS), siqish va qat'iy <b>ACL (ruxsatnomalar)</b> orqali xavfsizlikni to'liq ta'minlaydi.</p>`,
                        q: [
                            { prompt: "4GB dan katta fayllarni qo'llab-quvvatlamaydigan va xavfsizlik funksiyalari yo'q eski fayl tizimi qaysi?", opts: ["NTFS", "FAT32", "exFAT", "ReFS"], ans: "FAT32" },
                            { prompt: "Jurnallash, shifrlash va qat'iy ACL ruxsatnomalarini o'z ichiga olgan asosiy Windows fayl tizimi qaysi?", opts: ["FAT32", "NTFS", "exFAT", "ext4"], ans: "NTFS" }
                        ]
                    },
                    {
                        title: "2. NTFS Komponentlari: PBS va MFT",
                        content: `<p>NTFS strukturasi <b>PBS (Partition Boot Sector)</b> dan boshlanadi, u yuklash kodlarini va asosiy jadvallar manzilini saqlaydi. Eng muhim qism — <b>MFT (Master File Table)</b>.</p><p>MFT har bir fayl va papkaning metama'lumotlarini (yaratilish vaqti, joylashuvi, o'zgarishlar tarixi) saqlaydi. Kriminalistika (Forensika) mutaxassislari MFT ni tahlil qilib, xakerlar qanday fayllarni o'chirib yuborganini osongina aniqlaydilar.</p>`,
                        q: [
                            { prompt: "Fayllarning yaratilish vaqti, joylashuvi va o'zgarishlar tarixini o'zida saqlovchi markaziy baza nima deb ataladi?", opts: ["PBS", "MFT", "Registry", "Boot Sector"], ans: "MFT" },
                            { prompt: "O'chirilgan fayllarni topish va hujum vaqtini aniqlash uchun forensika mutaxassislari qaysi jadvalni tahlil qiladi?", opts: ["MFT", "FAT32", "SACL", "SAM"], ans: "MFT" }
                        ]
                    },
                    {
                        title: "3. Tizim Fayllari va $MFTMirr",
                        content: `<p>NTFS ichki jarayonlarni boshqarish uchun maxsus yashirin tizim fayllaridan foydalanadi. Ularning eng asosiylari: <b>$MFT</b>, <b>$LogFile</b> (fayl amaliyotlari tranzaksiyalarini saqlaydi) va <b>$Bitmap</b> (qaysi xotira klasterlari bo'sh yoki band ekanligini kuzatadi).</p><p>Tizim buzilishiga qarshi himoya sifatida <b>$MFTMirr</b> mavjud — u MFT'ning zaxira nusxasi bo'lib, asosiy jadval ishdan chiqqanda ma'lumotlarni qayta tiklashga yordam beradi.</p>`,
                        q: [
                            { prompt: "Fayl tizimida qaysi xotira klasterlari bo'sh yoki band ekanligini kuzatib boruvchi yashirin fayl nima?", opts: ["$LogFile", "$Bitmap", "$MFTMirr", "$BadClus"], ans: "$Bitmap" },
                            { prompt: "Asosiy MFT jadvali zarar ko'rganda, ma'lumotlarni tiklash uchun ishlatiladigan zaxira fayli qaysi?", opts: ["$LogFile", "$MFT", "$MFTMirr", "$Boot"], ans: "$MFTMirr" }
                        ]
                    },
                    {
                        title: "4. Alternate Data Streams (ADS) Xavfi",
                        content: `<p>NTFS tizimining o'ziga xos xususiyatlaridan biri bu <b>Alternate Data Streams (ADS)</b>. U bitta faylga bir nechta mustaqil ma'lumot oqimlarini biriktirish imkonini beradi.</p><p>Xavfsizlik nuqtai nazaridan, xakerlar ADS orqali oddiy matnli faylning (masalan, <code>readme.txt</code>) orqasiga yashirin zararli kodni (masalan, <code>virus.exe</code>) biriktirishadi. Natijada asosiy fayl hajmi umuman o'zgarmaydi va troyan ko'zdan yashiriladi.</p>`,
                        q: [
                            { prompt: "Faylning ko'rinadigan hajmini o'zgartirmasdan, unga yashirin kodlarni biriktirish imkonini beruvchi NTFS xususiyati nima?", opts: ["MFT", "EFS", "Alternate Data Streams (ADS)", "Journaling"], ans: "Alternate Data Streams (ADS)" },
                            { prompt: "Nima uchun kiberjinoyatchilar ADS'dan faol foydalanadilar?", opts: ["Ma'lumotni siqish uchun", "Zararli kodni fayl ichiga yashirish uchun", "Tezlikni oshirish uchun", "Ruxsatlarni o'zgartirish uchun"], ans: "Zararli kodni fayl ichiga yashirish uchun" }
                        ]
                    },
                    {
                        title: "5. Fayl Ma'lumotlari Maydoni (File Data Area)",
                        content: `<p><b>File Data Area</b> — haqiqiy foydalanuvchi ma'lumotlari (fayl mazmuni) saqlanadigan joy. Kichik fayllar bevosita MFT ichida (resident) saqlansa, kattalari alohida klasterlarga (non-resident) taqsimlanadi.</p><p>Vaqt o'tishi bilan klasterlarga taqsimlangan fayllar tarqoq holatga keladi (Fragmentatsiya). Forensika mutaxassislari faylning oxirgi qismi bilan klaster chegarasi orasidagi bo'shliqni (Slack space) tekshirishadi, chunki bu joyda qolib ketgan eski va qimmatli ma'lumotlarni tiklash mumkin.</p>`,
                        q: [
                            { prompt: "Kichik hajmdagi fayllar to'g'ridan-to'g'ri qayerda saqlanishi mumkin?", opts: ["Slack space'da", "MFT jadvali ichida (resident)", "Faqat RAM xotirada", "$Bitmap ichida"], ans: "MFT jadvali ichida (resident)" },
                            { prompt: "Fayl oxiri va klaster chegarasi orasidagi bo'shliqda (Slack space) nimani topish mumkin?", opts: ["O'chirib yuborilgan qoldiq ma'lumotlarni", "Yangi parollarni", "Tizim drayverlarini", "Faqat bo'sh nollarni"], ans: "O'chirib yuborilgan qoldiq ma'lumotlarni" }
                        ]
                    }
                ]
            },
            {
                title: "Modul 2: Windows Ruxsatlar Modeli (ACL va SID)",
                slug: "3-yol-m2",
                lessons: [
                    {
                        title: "1. Security Descriptor (Xavfsizlik Deskriptori)",
                        content: `<p>Windowsda har bir ob'ekt (fayl, xizmat, registratura) o'zining <b>Security Descriptor (Xavfsizlik Deskriptori)</b> pasportiga ega. U to'rt qismdan iborat: <b>Owner (Ega)</b>, Primary Group, <b>DACL</b> va <b>SACL</b>.</p><p>Owner doimiy ravishda ob'ekt ustidan to'liq nazoratga ega bo'lib, xatto ruxsati bo'lmasa ham o'ziga ruxsatlarni (DACL) qayta yoza oladi. Agar hujumchi ob'ekt egasi bo'lib olsa (takeown), demak tizimni to'liq boshqaradi.</p>`,
                        q: [
                            { prompt: "Windows'da fayl va xizmatlarning 'xavfsizlik pasporti' nima deb ataladi?", opts: ["MFT Table", "Security Descriptor", "Registry Hive", "SAM Database"], ans: "Security Descriptor" },
                            { prompt: "Ob'ekt ruxsatlari qanday bo'lishidan qat'i nazar, ruxsatlarni istalgan vaqtda qayta yoza oladigan sub'ekt qaysi?", opts: ["Primary Group", "Guest", "Owner (Ega)", "System Auditor"], ans: "Owner (Ega)" }
                        ]
                    },
                    {
                        title: "2. SID (Security Identifier) va RID",
                        content: `<p>Windows foydalanuvchilarini nomlari bilan emas, balki noyob <b>SID (Security Identifier)</b> bilan taniydi. Masalan: <code>S-1-5-21-...-1001</code>. Shuning uchun nom o'zgarsa ham huquqlar saqlanib qoladi.</p><p>SID'ning eng oxirgi raqamlari <b>RID (Relative Identifier)</b> deb ataladi. RID <b>500</b> har doim o'chirilmaydigan Mahalliy Administratorni, <b>501</b> esa Guest hisobini bildiradi. Oddiy foydalanuvchilar RID 1000 dan boshlanadi.</p>`,
                        q: [
                            { prompt: "Windows tizimi foydalanuvchi huquqlarini tekshirishda ism o'rniga nima ishlatadi?", opts: ["MAC manzil", "SID (Security Identifier)", "PID", "Token ID"], ans: "SID (Security Identifier)" },
                            { prompt: "SID strukturasidagi '500' (RID) qanday tizim hisobini ifodalaydi?", opts: ["Oddiy foydalanuvchi", "Guest", "Mahalliy Administrator", "Network Service"], ans: "Mahalliy Administrator" }
                        ]
                    },
                    {
                        title: "3. Well-known (Taniqli) SID'lar",
                        content: `<p>Tizimda hamma kompyuterlar uchun bir xil bo'lgan taniqli SID'lar bor. Ulardan <b>S-1-1-0</b> (Everyone - har kim) SID'i ob'ektda 'Write' (yozish) huquqida ko'rinsa — bu xavf belgisidir.</p><p>Eng yuqori va kiberhujumlarning yakuniy maqsadi bo'lgan SID bu <b>S-1-5-18 (NT AUTHORITY\SYSTEM)</b>. Bu imtiyoz orqali barcha jarayonlarni nazorat qilish va hatto xavfsizlik cheklovlarini to'liq aylanib o'tish mumkin.</p>`,
                        q: [
                            { prompt: "Windows operatsion tizimidagi eng yuqori imtiyozli SID (S-1-5-18) qaysi hisobga tegishli?", opts: ["Administrators", "SYSTEM", "Everyone", "Authenticated Users"], ans: "SYSTEM" },
                            { prompt: "Tizimdagi har qanday shaxsni (shuningdek ruxsatsizlarni) ifodalovchi 'S-1-1-0' SID qaysi?", opts: ["SYSTEM", "Guests", "Everyone", "Interactive"], ans: "Everyone" }
                        ]
                    },
                    {
                        title: "4. DACL va ACE Qoidalari",
                        content: `<p><b>DACL (Discretionary Access Control List)</b> ob'ektga kim kirishini (Allow yoki Deny) belgilaydi. DACL tarkibidagi har bir alohida qoida <b>ACE (Access Control Entry)</b> deb ataladi.</p><p>Eng muhim chegara holatlari: agar <b>DACL butunlay yo'q bo'lsa (NULL DACL)</b>, hammaga to'liq ruxsat beriladi (bu xavfli zaiflik). Lekin <b>DACL bor, ammo ichi bo'sh bo'lsa</b> (0 ta ACE), hech kimga kirishga ruxsat berilmaydi (implicit deny).</p>`,
                        q: [
                            { prompt: "Xavfsizlik Descriptorining qaysi qismi ob'ektga kirishga ruxsat berish yoki rad etishni belgilaydi?", opts: ["SACL", "DACL", "Owner", "RID"], ans: "DACL" },
                            { prompt: "Agar ob'ektda DACL umuman yo'q (NULL DACL) bo'lsa nima sodir bo'ladi?", opts: ["Hech kim kirmaydi", "Faqat admin kiradi", "Hammaga to'liq ruxsat beriladi", "Tizim qotadi"], ans: "Hammaga to'liq ruxsat beriladi" }
                        ]
                    },
                    {
                        title: "5. Samarali Ruxsatlar va Deny Wins qoidasi",
                        content: `<p>Foydalanuvchi bir nechta guruhlarda bo'lsa, uning yakuniy huquqi <b>Effective Permissions (Samarali ruxsatlar)</b> deb ataladi. Buning eng asosiy qoidasi: <b>Deny Wins (Rad etish ustunligi)</b>. Bitta guruh 'Allow' deb, ikkinchisi 'Deny' desa, tizim darhol rad etadi.</p><p>Shuningdek, to'g'ridan-to'g'ri berilgan ruxsatlar (Explicit) ota-papkadan meros olingan (Inherited) ruxsatlardan ustun turadi. Ya'ni, 'Explicit Allow', 'Inherited Deny' dan kuchliroq bo'ladi.</p>`,
                        q: [
                            { prompt: "Bitta foydalanuvchiga bitta guruhdan 'Allow' va boshqasidan 'Deny' kelganda qanday qoida ishlaydi?", opts: ["Allow Wins", "Deny Wins", "Inherited Wins", "Xato yuz beradi"], ans: "Deny Wins" },
                            { prompt: "Meros qilib olingan Rad etish (Inherited Deny) bilan to'g'ridan-to'g'ri berilgan Ruxsat (Explicit Allow) to'qnashsa qaysi biri ustun keladi?", opts: ["Inherited Deny", "Explicit Allow", "Ikkalasi ham bekor qilinadi", "Faqat Admin hal qiladi"], ans: "Explicit Allow" }
                        ]
                    }
                ]
            },
            {
                title: "Modul 3: Audit, icacls va Mahalliy Guruhlar",
                slug: "3-yol-m3",
                lessons: [
                    {
                        title: "1. SACL va Kuzatuv (Audit) Siyosatlari",
                        content: `<p><b>SACL (System Access Control List)</b> kirishga ruxsat bermaydi, u faqat hodisalarni Security (Xavfsizlik) Jurnaliga yozishni nazorat qiladi. Audit yoqilganidan so'ng, ruxsatsiz kirishga urinishlar yozib boriladi.</p><p>Himoyachilar (Blue Team) uchun eng muhim Event ID'lar: <b>4663</b> (SACL ishlab, ob'ektga kirishga urinilgani), <b>4670</b> (Kimgadir ACL o'zgartirilgani) va <b>4660</b> (Ob'ekt o'chirilgani). Hujumchilar doim buni tekshiradilar.</p>`,
                        q: [
                            { prompt: "Qaysi xavfsizlik ro'yxati ob'ektga kirishni emas, balki harakatlarni jurnalga yozishni (kuzatishni) ta'minlaydi?", opts: ["DACL", "SACL", "MFT", "ACE"], ans: "SACL" },
                            { prompt: "Security jurnalida ob'ekt ruxsatnomalari (ACL) xaker tomonidan o'zgartirilganligini anglatuvchi Event ID qaysi?", opts: ["4663", "4624", "4670", "4740"], ans: "4670" }
                        ]
                    },
                    {
                        title: "2. NTFS Kengaytirilgan Ruxsatlari (Advanced)",
                        content: `<p>Basic (asosiy) ruxsatlardan tashqari, Advanced ruxsatlar xavfsizlik uchun juda muhimdir. Kiberxavfsizlikda eng xavfli huquqlar bu <b>WO (Write Owner - Egasini o'zgartirish)</b> va <b>WDAC (Write DACL - Ruxsatlarni o'zgartirish)</b> hisoblanadi.</p><p>Agar xakerda Full Control bo'lmasa-da, faqat WDAC huquqi bo'lsa, u ruxsatlar ro'yxatini qayta yozib, o'ziga 'Full Control' berib oladi. Shu sababli bu ruxsatlarni faqat Administratorlarga qoldirish kerak.</p>`,
                        q: [
                            { prompt: "Ob'ekt ruxsatnomalarini (DACL) o'zgartirish huquqini beruvchi, xakerlarga o'ziga 'Full Control' yozib olishga imkon beruvchi kengaytirilgan ruxsat qaysi?", opts: ["Delete", "Write Attributes", "WDAC (Write DACL)", "Read"], ans: "WDAC (Write DACL)" },
                            { prompt: "WO (Write Owner) huquqi nima qilishga ruxsat beradi?", opts: ["Faylni o'chirishga", "Ob'ekt egasini almashtirishga", "Jurnalni tozalashga", "Shifrlashga"], ans: "Ob'ekt egasini almashtirishga" }
                        ]
                    },
                    {
                        title: "3. icacls va Merosxo'rlik (Inheritance)",
                        content: `<p>Merosxo'rlik (Inheritance) — yuqori papkadagi ruxsatlarning avtomatik quyi ob'ektlarga o'tishidir (OI va CI bayroqlari). Agar papkada meros uzilsa (Disable inheritance), xavfsizlik zanjiri buzilishi mumkin va ko'pincha bu yerda ortiqcha xavfli ruxsatlar qolib ketadi.</p><p>Buyruqlar qatorida ACL'ni boshqarish uchun <b>icacls</b> vositasi ishlatiladi. Masalan, <code>icacls papka /grant "Users:(OI)(CI)F"</code> buyrug'i foydalanuvchiga to'liq nazoratni meros bilan beradi. Bu GUI bo'lmagan serverlarda yagona boshqaruv yo'lidir.</p>`,
                        q: [
                            { prompt: "Windows'da yuqori papkadagi ruxsatlarning avtomatik ravishda quyi papka va fayllarga o'tkazilishi nima deyiladi?", opts: ["Inheritance (Merosxo'rlik)", "Encapsulation", "Sub-folder sharing", "Virtualization"], ans: "Inheritance (Merosxo'rlik)" },
                            { prompt: "GUI yo'q serverlarda (CLI orqali) NTFS ruxsatlarini ko'rish va o'zgartirish uchun qaysi buyruq ishlatiladi?", opts: ["ifconfig", "icacls", "chmod", "chown"], ans: "icacls" }
                        ]
                    },
                    {
                        title: "4. Mahalliy Guruhlar va Ularning Xavfsizligi",
                        content: `<p>Windows har bir kishiga emas, balki <b>Guruhlarga</b> ruxsat beradi (RBAC tamoyili). Har bir foydalanuvchi tizimda <b>Least Privilege (eng kam imtiyoz)</b> tamoyili asosida ish tutishi kerak: faqat kerakli minimal guruhga a'zo bo'lishi shart.</p><p>Yangi foydalanuvchi guruhga qo'shilgach, bu o'zgarish kuchga kirishi uchun u albatta tizimdan chiqib qayta kirishi (Logoff/Logon) kerak, shundagina yangi SID uning Access Token'iga yoziladi.</p>`,
                        q: [
                            { prompt: "Foydalanuvchilar guruhlarga biriktirilganda, faqat o'z vazifasini bajarish uchun eng kerakli minimal ruxsatlarni berish qoidasi nima?", opts: ["Zero Trust", "Least Privilege (Eng kam imtiyoz)", "Admin Rule", "Default Deny"], ans: "Least Privilege (Eng kam imtiyoz)" },
                            { prompt: "Foydalanuvchi yangi guruhga qo'shilganda, ruxsatlar darhol kuchga kirishi uchun nima qilinishi kerak?", opts: ["Kompyuterni buzish kerak", "Logoff qilib qayta kirish (Logon) kerak", "Parolni almashtirish kerak", "Kutib turish yetarli"], ans: "Logoff qilib qayta kirish (Logon) kerak" }
                        ]
                    },
                    {
                        title: "5. Kritik Guruhlar: Admins va Backup Operators",
                        content: `<p><b>Administrators</b> guruhi tizimda to'liq nazoratga ega, shu sababli Red Team'ning doimiy nishonidir. Lekin yana bir xavfli guruh bor: <b>Backup Operators</b>.</p><p>Bu guruhga <i>SeBackupPrivilege</i> va <i>SeRestorePrivilege</i> imtiyozlari berilgan bo'lib, ular barcha DACL xavfsizlik ruxsatlarini chetlab o'tib, istalgan faylni o'qiy oladi. Xaker bu guruh orqali SAM (parol xeshlar bazasi) va SYSTEM registrlarining nusxasini ko'chirib, osonlikcha admin huquqiga erishadi.</p>`,
                        q: [
                            { prompt: "Administrator bo'lmasa-da, ruxsatlarni (ACL) chetlab o'tib, maxfiy tizim fayllarini (SAM) o'qiy oladigan guruh qaysi?", opts: ["Power Users", "Guests", "Backup Operators", "Network Service"], ans: "Backup Operators" },
                            { prompt: "Backup Operators guruhi qanday imtiyoz orqali DACL cheklovlarini aylanib o'tadi?", opts: ["SeBackupPrivilege", "SeDebugPrivilege", "SeTakeOwnershipPrivilege", "SeImpersonatePrivilege"], ans: "SeBackupPrivilege" }
                        ]
                    }
                ]
            },
            {
                title: "Modul 4: RDP Xavfsizligi va Hujum Zanjiri",
                slug: "3-yol-m4",
                lessons: [
                    {
                        title: "1. Guests, Power Users va RDP Guruhlari",
                        content: `<p><b>Guests (Mehmon)</b> hisobi faqat vaqtinchalik kirish uchun bo'lib, ko'pincha o'chirib qo'yiladi. Ammo xaker uni buzib kirsa, tizim ichida boshqa kompyuterlarga hujum qilish uchun tayanch nuqta sifatida ishlatadi.</p><p><b>Remote Desktop Users</b> guruhi RDP orqali ulanish huquqini beradi, biroq admin huquqini avtomatik bermaydi. Shunday bo'lsa ham, bu eng ko'p ekspluatatsiya qilinadigan guruhdir.</p>`,
                        q: [
                            { prompt: "Masofadan ish stoliga (RDP) ulanish huquqini beruvchi, lekin o'z-o'zidan Administrator qilib qo'ymaydigan guruh qaysi?", opts: ["Backup Operators", "Power Users", "Remote Desktop Users", "Guests"], ans: "Remote Desktop Users" },
                            { prompt: "Qaysi hisob tizimda faqat cheklangan va vaqtinchalik huquqlarga ega bo'lib, odatda xavfsizlik sababli o'chirib qo'yiladi?", opts: ["System", "Admin", "Guests", "Service"], ans: "Guests" }
                        ]
                    },
                    {
                        title: "2. Foydalanuvchilarni Yaratish (CMD va PowerShell)",
                        content: `<p>Windows'da foydalanuvchi yaratishning tezkor klassik usuli <code>net user UserA P@ssw0rd1 /add</code> bo'lib, u ko'pincha hujum vaqtida ham qulaydir. Ammo bu usul parolni ochiq holda loglarda qoldiradi.</p><p>Xavfsizroq va zamonaviy usul PowerShell'ning <b>New-LocalUser</b> buyrug'i bo'lib, bunda parol <b>SecureString</b> yordamida himoyalangan formatda uzatiladi. Past darajadagi ADSI (WinNT) orqali foydalanuvchi yaratish esa antivirus tizimlarini chalg'itishda qo'llaniladi.</p>`,
                        q: [
                            { prompt: "CMD da tezkor foydalanuvchi yaratish uchun eng mashhur, ammo parolni ochiq ko'rsatuvchi buyruq qaysi?", opts: ["New-LocalUser", "net user", "adduser", "Create-User"], ans: "net user" },
                            { prompt: "PowerShell'da xavfsizlikni ta'minlash uchun parol qanday maxsus formatda uzatiladi?", opts: ["ClearText", "SecureString", "MD5 Hash", "PlainString"], ans: "SecureString" }
                        ]
                    },
                    {
                        title: "3. RDP Asoslari va NLA Himoyasi",
                        content: `<p><b>RDP (Remote Desktop Protocol)</b> TCP 3389 portida ishlab, masofadan to'liq grafik oynada ishlash imkonini beradi. Uning eng katta xavfi doimo internetga ochiq qoldirilishidir.</p><p>Himoyaning asosi <b>NLA (Network Level Authentication)</b>. NLA yoqilganda ulanuvchi tizim ekrani ochilishidan oldin tarmoq darajasida autentifikatsiyadan o'tishga majbur bo'ladi, bu esa turli zero-day (BlueKeep) va brute-force hujumlarini sezilarli darajada qiyinlashtiradi.</p>`,
                        q: [
                            { prompt: "Standart bo'yicha RDP (Masofaviy ish stoli) xizmati qaysi TCP portida ishlaydi?", opts: ["22", "80", "443", "3389"], ans: "3389" },
                            { prompt: "RDP sessiyasi ekrani ochilishidan oldin autentifikatsiyani majburiy talab qiluvchi, resurslarni tejaydigan himoya mexanizmi nima?", opts: ["ACL", "NLA (Network Level Authentication)", "VPN", "UAC"], ans: "NLA (Network Level Authentication)" }
                        ]
                    },
                    {
                        title: "4. RDP Hujum Zanjiri: Recon va Brute-Force",
                        content: `<p>RDP hujumi zanjiri <code>nmap -p 3389</code> orqali maqsadli tizimni kashf qilishdan (Recon) boshlanadi. Agar port ochiq bo'lsa, xaker <b>Hydra</b> vositasi yordamida katta lug'at fayli (masalan, rockyou.txt) asosida minglab parollarni tinimsiz sinab ko'radi (Brute-force).</p><p>Muvaffaqiyatli parolni topgach, xaker Linux terminalidan to'g'ridan-to'g'ri <b>xfreerdp</b> mijozi orqali Windows ish stoliga ulanadi va grafik interfeysni qo'lga kiritadi.</p>`,
                        q: [
                            { prompt: "RDP kabi xizmatlarga katta lug'at (wordlist) yordamida parollarni avtomatik taxmin qilish (brute-force) hujumini uyushtiruvchi vosita qaysi?", opts: ["Nmap", "Wireshark", "Hydra", "Icacls"], ans: "Hydra" },
                            { prompt: "Kali Linux operatsion tizimidan Windows RDP'ga grafik oynada ulanish imkonini beruvchi mijoz dasturi qaysi?", opts: ["ssh", "xfreerdp", "telnet", "netcat"], ans: "xfreerdp" }
                        ]
                    },
                    {
                        title: "5. RDP Loglari va Account Lockout Siyosati",
                        content: `<p>Brute-force hujumlariga qarshi eng samarali himoya bu <b>Account Lockout Policy</b> (Hisobni bloklash siyosati). Masalan, 5 marta noto'g'ri parol terilsa, hisob 10 daqiqaga qulflanadi. Bu hujumni butunlay to'xtatadi.</p><p>Monitoring uchun Security Jurnal (Event Viewer) ga qaraymiz. Muvaffaqiyatli RDP ulanish <b>4624 (Type 10)</b> orqali yoziladi. Tinimsiz <b>4625</b> (Failed Logon) va uning ketidan <b>4740</b> (Account Lockout) yozuvlarining paydo bo'lishi tizimga Brute-force qilinayotganining yorqin isbotidir.</p>`,
                        q: [
                            { prompt: "Ketma-ket noto'g'ri parol terilgandan so'ng hisobni vaqtincha bloklab, Brute-force'ni to'xtatuvchi siyosat nima deb ataladi?", opts: ["Audit Policy", "Account Lockout Policy", "Firewall Policy", "UAC Policy"], ans: "Account Lockout Policy" },
                            { prompt: "Security jurnalida hisob muvaffaqiyatli bloklanganini (Lockout ishga tushganini) bildiruvchi Event ID qaysi?", opts: ["4624", "4625", "4740", "4663"], ans: "4740" }
                        ]
                    }
                ]
            },
            {
                title: "Modul 5: Windows Local Privilege Escalation (LPE)",
                slug: "3-yol-m5",
                lessons: [
                    {
                        title: "1. LPE Asoslari va Enumeration",
                        content: `<p><b>LPE (Local Privilege Escalation)</b> — bu cheklangan foydalanuvchi hisobidan (Initial Access) eng yuqori darajadagi <b>NT AUTHORITY\SYSTEM</b> imtiyozini qo'lga kiritish jarayonidir. Har qanday hujum Tizimni Tekshirish (Enumeration) dan boshlanadi.</p><p>Hujumchilar qimmatbaho vaqtni tejash uchun <b>PowerUp.ps1</b> yoki <b>WinPEAS.exe</b> kabi avtomatlashtirilgan skriptlarni ishga tushiradilar. Bu vositalar soniyalar ichida yuzlab zaif ruxsatlarni (xizmatlar va registratura xatolarini) topib beradi.</p>`,
                        q: [
                            { prompt: "Past imtiyozli foydalanuvchi hisobidan tizimdagi eng yuqori SYSTEM huquqiga ko'tarilish jarayoni (qisqartmasi) nima?", opts: ["RCE", "LPE (Local Privilege Escalation)", "DDoS", "MITM"], ans: "LPE (Local Privilege Escalation)" },
                            { prompt: "Windows muhitida imtiyozlarni oshirish uchun ruxsatlardagi xatolarni va zaifliklarni avtomatik qidiruvchi mashhur PowerShell skripti qaysi?", opts: ["Nmap", "Hydra", "PowerUp.ps1", "Burp Suite"], ans: "PowerUp.ps1" }
                        ]
                    },
                    {
                        title: "2. AlwaysInstallElevated Siyosati",
                        content: `<p><b>AlwaysInstallElevated</b> — bu Windows Installer ishini tezlatish uchun o'ylab topilgan, biroq xavfsizlikka jiddiy tahdid soluvchi siyosatdir. Agar Registrning ikkala (HKLM va HKCU) qismida ushbu qiymat '1' qilib qo'yilsa, har qanday foydalanuvchi <code>.msi</code> faylini SYSTEM huquqida o'rnata oladi.</p><p>Hujumchi Metasploit yordamida zararli <code>.msi</code> yuklama (payload) yaratadi va nishonga tashlab uni ishga tushiradi. O'rnatish jarayonida xaker darhol eng yuqori imtiyozni qo'lga kiritadi.</p>`,
                        q: [
                            { prompt: "Qaysi Windows siyosati yoqilgan bo'lsa, oddiy foydalanuvchi ishga tushirgan har qanday .msi fayli avtomatik SYSTEM huquqida bajariladi?", opts: ["UAC Bypass", "AlwaysInstallElevated", "Unquoted Service Path", "AppLocker"], ans: "AlwaysInstallElevated" },
                            { prompt: "Ushbu zaiflik ish berishi uchun qaysi ma'lumotlar bazasida (Settings markazida) o'zgarish 1 ga teng bo'lishi kerak?", opts: ["Registry (HKLM va HKCU)", "MFT", "SACL", "Active Directory"], ans: "Registry (HKLM va HKCU)" }
                        ]
                    },
                    {
                        title: "3. Modifiable Service Binary Zaifligi",
                        content: `<p>Tizim xizmatlari (Services) fonga joylashib, odatda avtomatik yuklanadi va SYSTEM imtiyozi bilan ishlaydi. Eng xavfli holat shuki, administrator xizmatning ijrochi fayliga (masalan, <code>service.exe</code>) "Users" guruhi uchun <b>Write (Yozish)</b> huquqini berib qo'yishi mumkin.</p><p>Bunday vaziyatda xaker shunchaki asl faylni o'chirib, uning o'rniga xuddi shu nomli o'zining zararli faylini (payload) nusxalaydi. Xizmat qayta ishga tushganda, tizim o'zining fayli o'rniga virusni SYSTEM sifatida ishga tushiradi.</p>`,
                        q: [
                            { prompt: "Xizmatning ijrochi (.exe) fayliga oddiy foydalanuvchilar yoza oladigan bo'lsa, bu zaiflik qanday ataladi?", opts: ["Unquoted Path", "AlwaysInstallElevated", "Modifiable Service Binary", "UAC Bypass"], ans: "Modifiable Service Binary" },
                            { prompt: "Hujum muvaffaqiyatli bo'lishi uchun xaker zararli faylni joylashtirgandan so'ng nima qilishi kerak?", opts: ["Faylni shifrlashi kerak", "Xizmatni to'xtatib qayta ishga tushirishi kerak", "Internetni o'chirishi kerak", "DACL ni o'chirishi kerak"], ans: "Xizmatni to'xtatib qayta ishga tushirishi kerak" }
                        ]
                    },
                    {
                        title: "4. Unquoted Service Path Hujumi",
                        content: `<p>Windows xizmatlarining joylashuv manzili ba'zan bo'shliqlar saqlaydi, lekin qo'shtirnoqqa olinmagan bo'ladi (masalan, <code>C:\Program Files\My App\service.exe</code>). Tizim bunday manzilni o'qishda har bir bo'shliqqacha bo'lgan joyni alohida bajariladigan fayl deb o'ylaydi.</p><p>U avval <code>C:\Program.exe</code>, keyin <code>C:\Program Files\My.exe</code> borligini qidiradi. Agar xaker oraliq katalogga yozish ruxsatiga ega bo'lsa, u aynan <b>My.exe</b> nomli virus yaratadi va kompyuter haqiqiy xizmatgacha yetib bormasdan, xakerning faylini ishga tushirib yuboradi.</p>`,
                        q: [
                            { prompt: "Agar xizmatning ishlash manzili qo'shtirnoqsiz bo'lsa, xaker bo'shliqgacha bo'lgan qismda qanday hujumni amalga oshiradi?", opts: ["Modifiable Binary", "Unquoted Service Path", "Registry Injection", "DDoS"], ans: "Unquoted Service Path" },
                            { prompt: "BinPath = C:\Program Files\My App\svc.exe holatida, tizim ikkinchi navbatda qaysi soxta faylni ishga tushirishga urinadi?", opts: ["C:\Program.exe", "C:\Program Files\My.exe", "svc.exe", "App.exe"], ans: "C:\Program Files\My.exe" }
                        ]
                    },
                    {
                        title: "5. UAC Bypass va Kernel Ekspluatatsiyasi",
                        content: `<p>Administrator bo'lib tursangiz ham, xavfli harakatlarda <b>UAC (User Account Control)</b> tasdiq oynasi chiqadi. Xakerlar buni aylanib o'tish (Bypass) uchun <code>fodhelper.exe</code> kabi avtomatik tasdiqlanadigan (auto-elevate) dasturlarning registr qiymatlarini o'zgartiradilar va UAC oyna chiqarmasdan o'z zararli kodlarini bajaradilar.</p><p>Agar tizimda hech qanday oddiy zaiflik bo'lmasa, so'nggi chora sifatida yamoqlanmagan (eskirgan) Windows yadrolari (Kernel) ga qarshi <b>MS16-032</b> kabi eksploytlar ishlatiladi. Lekin bu juda ishonchsiz va osonlikcha ushlanadigan shovqinli usuldir.</p>`,
                        q: [
                            { prompt: "Auto-elevate xususiyatiga ega dasturlar yordamida Administrator tasdiq oynasini ko'rsatmasdan aylanib o'tish usuli nima?", opts: ["Kernel Exploit", "UAC Bypass", "RDP Hijacking", "Port Forwarding"], ans: "UAC Bypass" },
                            { prompt: "Barcha xavfsizlik choralari joyida bo'lganda, faqat yangilanmagan tizimlarda ishlaydigan eng so'nggi va shovqinli chora nima?", opts: ["Unquoted Path", "Kernel (Yadro) zaifliklari va eksploytlari", "ACL Manipulation", "Phishing"], ans: "Kernel (Yadro) zaifliklari va eksploytlari" }
                        ]
                    }
                ]
            },
            {
                title: "Modul 6: Post-Exploitation va Hisob Ma'lumotlari",
                slug: "3-yol-m6",
                lessons: [
                    {
                        title: "1. Metasploit va Post-Exploitation Asoslari",
                        content: `<p>Tizimga to'liq (SYSTEM) kirish qo'lga kiritilgach, <b>Post-Exploitation</b> (hujumdan keyingi harakatlar) bosqichi boshlanadi. Bu bosqichda hujumchi sessiyani mustahkamlash, tarmoqning boshqa qismlariga o'tish (Lateral Movement) va maxfiy ma'lumotlarni qidirishni amalga oshiradi.</p><p>Ushbu jarayonlarning barchasi <b>Metasploit Framework</b> orqali <code>exploit/multi/handler</code> tinglovchisida qabul qilingan kuchli va iz qoldirmaydigan <b>Meterpreter</b> sessiyasi yordamida osonlashtiriladi.</p>`,
                        q: [
                            { prompt: "Tizimni muvaffaqiyatli buzib kirgandan so'ng amalga oshiriladigan harakatlar (ma'lumot yig'ish, tarmoqda tarqalish) qanday nomlanadi?", opts: ["Reconnaissance", "Initial Access", "Post-Exploitation", "Weaponization"], ans: "Post-Exploitation" },
                            { prompt: "Kali Linuxda qurbonning ulanishini kutib oluvchi va Meterpreter sessiyasini taqdim etuvchi asosiy Metasploit moduli qaysi?", opts: ["multi/handler", "msfvenom", "local_exploit_suggester", "nmap"], ans: "multi/handler" }
                        ]
                    },
                    {
                        title: "2. Migrate: Sessiyani Barqarorlashtirish",
                        content: `<p>Hujum natijasida olingan sessiya ko'pincha foydalanuvchi ochgan oddiy jarayon (masalan, <code>privesc.exe</code>) ichida bo'ladi. Agar foydalanuvchi bu dasturni yopsa, hujumchining aloqasi uzilib qoladi. Buning oldini olish uchun Meterpreter'da <b>migrate</b> buyrug'idan foydalaniladi.</p><p>Migrate zararli kodni tizim ishga tushgandan to o'chguncha doimiy ishlaydigan ishonchli jarayon (masalan, <b>services.exe</b>) xotirasiga yashirincha ko'chiradi. Bu barqarorlik, himoyadan yashirinish va SYSTEM imtiyozini saqlab qolishni kafolatlaydi.</p>`,
                        q: [
                            { prompt: "Foydalanuvchi zararli dasturni yopganda aloqa uzilmasligi uchun sessiyani boshqa doimiy jarayonga ko'chiruvchi buyruq nima?", opts: ["sysinfo", "hashdump", "migrate", "upload"], ans: "migrate" },
                            { prompt: "Nima uchun xakerlar ko'pincha aynan services.exe ga migratsiya qiladilar?", opts: ["Bu eng katta fayl bo'lgani uchun", "Tizim o'chguncha barqaror ishlagani va doim SYSTEM huquqida bo'lgani uchun", "Oson o'chirilishi mumkin bo'lgani uchun", "RAM'ni kam sarflagani uchun"], ans: "Tizim o'chguncha barqaror ishlagani va doim SYSTEM huquqida bo'lgani uchun" }
                        ]
                    },
                    {
                        title: "3. Credential Dumping (SAM Xeshlarini O'g'irlash)",
                        content: `<p>Windows tizimi barcha mahalliy foydalanuvchilarning parollarini to'g'ridan-to'g'ri matn o'rniga, qattiq himoyalangan <b>SAM</b> (Security Account Manager) bazasida NTLM xeshlari ko'rinishida saqlaydi.</p><p>SYSTEM huquqiga ega hujumchi Meterpreter ichida kiwi (mimikatz) kengaytmasi orqali <code>lsa_dump_sam</code> buyrug'ini berib, ushbu bazadagi barcha parol xeshlarini tortib oladi. Bu xeshlar keyinchalik Hashcat yordamida oflayn buzilishi yoki Pass-the-Hash hujumi uchun ishlatilishi mumkin.</p>`,
                        q: [
                            { prompt: "Windows barcha mahalliy foydalanuvchilarning parol xeshlarini (NTLM) qaysi maxsus bazada saqlaydi?", opts: ["Registry", "SAM (Security Account Manager)", "LSASS", "MFT"], ans: "SAM (Security Account Manager)" },
                            { prompt: "Meterpreter orqali ushbu xeshlarni to'kib olish (dump) uchun qaysi maxsus vosita/kengaytma qatoridan foydalaniladi?", opts: ["Hydra", "Mimikatz / Kiwi", "John the Ripper", "Nmap"], ans: "Mimikatz / Kiwi" }
                        ]
                    },
                    {
                        title: "4. LSASS va lsa_dump_secrets",
                        content: `<p>Foydalanuvchilar tizimga kirganida, ularning faol autentifikatsiya sessiyalari xotiradagi <b>LSASS</b> (Local Security Authority Subsystem Service) jarayonida saqlanadi. Hujumchilar ushbu jarayonni ham nishonga oladilar.</p><p>Maxsus <code>lsa_dump_secrets</code> buyrug'i yordamida LSA Secrets ichidan avtomatik tizimga kirish (autologin) uchun saqlangan parollar hatto <b>ochiq matn ko'rinishida (cleartext)</b>, ya'ni xeshlanmagan asl holatida o'g'irlanishi mumkin.</p>`,
                        q: [
                            { prompt: "Faol sessiyalar va autentifikatsiya ma'lumotlarini o'z ichiga oluvchi Windows xotira jarayoni qaysi?", opts: ["explorer.exe", "services.exe", "LSASS", "cmd.exe"], ans: "LSASS" },
                            { prompt: "LSA Secrets orqali topilgan parollar qanday holatda bo'lishi xakerlar uchun eng katta o'lja hisoblanadi?", opts: ["Kuchli shifrlangan holatda", "Ochiq matn ko'rinishida (Cleartext)", "Faqat xesh shaklida", "O'qib bo'lmaydigan kodda"], ans: "Ochiq matn ko'rinishida (Cleartext)" }
                        ]
                    },
                    {
                        title: "5. Unattended Install Fayllar (Unattend.xml)",
                        content: `<p>Tizim administratorlari ko'plab kompyuterlarga Windowsni avtomatik ravishda, birma-bir parol kiritmasdan o'rnatish uchun <b>Unattend.xml</b> yoki <code>sysprep.inf</code> kabi maxsus fayllardan foydalanadilar.</p><p>Agar o'rnatish jarayoni yakunlangach, bu fayllar xavfsiz o'chirib tashlanmasa, ularning ichida mahalliy administratorning paroli ochiq matnda qolib ketadi. <code>PowerUp.ps1</code> bu kabi qoldiq fayllarni birinchi soniyadayoq aniqlab beradi va bu hujumchiga bir zumda admin huquqini taqdim etadi.</p>`,
                        q: [
                            { prompt: "Windowsni avtomatik o'rnatishda ishlatiladigan, lekin o'chirilmay qolib ichida ochiq admin parolini saqlaydigan fayl qaysi?", opts: ["SAM", "Unattend.xml", "shadow", "hosts"], ans: "Unattend.xml" },
                            { prompt: "Bu kabi xatolarni oldini olish uchun tizim administratorlari (Blue Team) o'rnatishdan so'ng nima qilishi shart?", opts: ["Fayllarni boshqa nomga o'zgartirish", "Fayllarni darhol xavfsiz o'chirib tashlash", "Kompyuterni tarmoqdan uzish", "UAC ni o'chirish"], ans: "Fayllarni darhol xavfsiz o'chirib tashlash" }
                        ]
                    }
                ]
            }
        ];

        let modules = [];
        let allLessons = [];
        let allQuestions = [];

        for (let i = 0; i < modulesData.length; i++) {
            const mData = modulesData[i];
            const mod = new Module({
                title: mData.title,
                slug: mData.slug,
                pathSlug: pathDoc.slug,
                order: i + 1
            });
            modules.push(mod);

            for (let j = 0; j < mData.lessons.length; j++) {
                const lData = mData.lessons[j];
                const lessonId = new mongoose.Types.ObjectId();
                const lesson = new Lesson({
                    _id: lessonId,
                    title: lData.title,
                    slug: `${mData.slug}-l${j + 1}`,
                    moduleSlug: mod.slug,
                    order: j + 1,
                    xpReward: 50,
                    content: lData.content
                });
                allLessons.push(lesson);

                for (let k = 0; k < lData.q.length; k++) {
                    const q = lData.q[k];
                    allQuestions.push({
                        lessonId: lessonId,
                        prompt: q.prompt,
                        options: q.opts,
                        answers: [q.ans],
                        correctAnswer: q.ans,
                        points: 20
                    });
                }
            }
        }

        await Module.insertMany(modules);
        await Lesson.insertMany(allLessons);
        
        // Mongoose qat'iy cheklovlarini aylanib o'tish
        await Question.collection.insertMany(allQuestions);

        console.log(`✅ Jami ${modules.length} ta modul, ${allLessons.length} ta dars, ${allQuestions.length} ta dars savollari va ${finalQs.length} ta imtihon savollari muvaffaqiyatli yuklandi!`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Xatolik yuz berdi:', err);
        process.exit(1);
    }
}

seedPath3();
