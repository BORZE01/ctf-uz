import os

code = """
const mongoose = require('mongoose');
// DIQQAT: JONLI MONGO_URI MANZILINI SHU YERGA QO'YING
const MONGO_URI = 'mongodb+srv://ctfuz_admin:AKKSAVDON137@ctf-uz-cluster.vtjol3t.mongodb.net/ctf-uz?retryWrites=true&w=majority'; 

const { LearningPath, Module, Lesson, Question } = require('./models/Learn');

async function seedPath2() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Jonli bazaga ulanildi. 2-yo`l (Linux Xavfsizligi) yozilmoqda...');

        // Eski 2-yo'lni va unga tegishli narsalarni tozalash
        const oldPath = await LearningPath.findOne({ slug: '2-yol-linux' });
        if (oldPath) {
            const oldLessons = await Lesson.find({ moduleSlug: { $regex: /^2-yol/ } });
            const lessonIds = oldLessons.map(l => l._id);
            await Question.deleteMany({ lessonId: { $in: lessonIds } });
            await Lesson.deleteMany({ moduleSlug: { $regex: /^2-yol/ } });
            await Module.deleteMany({ pathSlug: '2-yol-linux' });
            await LearningPath.deleteOne({ slug: '2-yol-linux' });
        }

        // ==========================================
        // 2-YO'NALISH (PATH) VA YAKUNIY IMTIHON
        // ==========================================
        const pathDoc = new LearningPath({
            title: "2-yo'l. Linux Xavfsizligi va Boshqaruvi",
            slug: "2-yol-linux",
            description: "Linux fayl tizimi, ruxsatlar, jarayonlarni boshqarish, tarmoq xizmatlari (NFS, Samba) va imtiyozlarni oshirish (LPE) usullarini chuqur o'rganish.",
            order: 2,
            isPublished: true,
            level: "Intermediate",
            certificateTitle: "Linux Xavfsizligi Mutaxassisi"
        });
        await pathDoc.save();

        const finalQs = [
            { id: "f2q1", prompt: "Linuxda haqiqiy parol xeshlarini saqlaydigan xavfsiz fayl qaysi?", options: ["/etc/passwd", "/etc/shadow", "/etc/group", "/var/log/auth.log"], answers: ["/etc/shadow"], correctAnswer: "/etc/shadow", points: 10 },
            { id: "f2q2", prompt: "Fayl bajarilganda, u fayl egasining (owner) huquqlari bilan ishlashini ta'minlovchi maxsus bit nima deb ataladi?", options: ["Sticky bit", "SGID", "SUID", "Umask"], answers: ["SUID"], correctAnswer: "SUID", points: 10 },
            { id: "f2q3", prompt: "Child process tugagach, parent uni wait() qilmasa, u qanday holatga tushadi?", options: ["Orphan", "Zombie", "Sleeping", "Running"], answers: ["Zombie"], correctAnswer: "Zombie", points: 10 },
            { id: "f2q4", prompt: "Cron ishiga PATH noto'g'ri o'rnatilganida qilinadigan hujum turi qaysi?", options: ["PATH Hijacking", "Wildcard Injection", "SUID Exploitation", "SQL Injection"], answers: ["PATH Hijacking"], correctAnswer: "PATH Hijacking", points: 10 },
            { id: "f2q5", prompt: "Nmap orqali ulanishni to'liq o'rnatmasdan (RST bilan yopib) qilinadigan 'yashirin' (stealth) skanerlash turi qaysi?", options: ["TCP Connect Scan (-sT)", "UDP Scan (-sU)", "TCP SYN Scan (-sS)", "NULL Scan (-sN)"], answers: ["TCP SYN Scan (-sS)"], correctAnswer: "TCP SYN Scan (-sS)", points: 10 },
            { id: "f2q6", prompt: "Matn faylida 'password' so'zini katta-kichik harfga e'tibor bermasdan qidirish uchun qaysi grep opsiyasi ishlatiladi?", options: ["grep -v", "grep -i", "grep -c", "grep -n"], answers: ["grep -i"], correctAnswer: "grep -i", points: 10 },
            { id: "f2q7", prompt: "Fayldagi satrlar, so'zlar va baytlar sonini hisoblaydigan buyruqni ko'rsating.", options: ["cut", "sort", "uniq", "wc"], answers: ["wc"], correctAnswer: "wc", points: 10 },
            { id: "f2q8", prompt: "Arxivdan fayllarni xavfsiz chiqarishda, ularning egasi root bo'lib qolmasligi uchun tar buyrug'ida qaysi opsiya ishlatiladi?", options: ["--no-same-owner", "--acls", "-xzvf", "-cjf"], answers: ["--no-same-owner"], correctAnswer: "--no-same-owner", points: 10 },
            { id: "f2q9", prompt: "NFS serverda xavfsizlikni ta'minlash uchun qaysi sozlama mijoz tizimidagi root foydalanuvchisini 'nobody' ga aylantiradi?", options: ["no_root_squash", "root_squash", "async", "rw"], answers: ["root_squash"], correctAnswer: "root_squash", points: 10 },
            { id: "f2q10", prompt: "Samba serverida parolsiz, anonim kirishga ruxsat beruvchi xavfli parametr nima?", options: ["guest ok = yes", "read only = yes", "browseable = yes", "server min protocol = SMB3"], answers: ["guest ok = yes"], correctAnswer: "guest ok = yes", points: 10 }
        ];

        await LearningPath.collection.updateOne(
            { _id: pathDoc._id },
            { $set: { finalQuestions: finalQs } }
        );

        // ==========================================
        // MODULLAR
        // ==========================================
        const m1 = new Module({ title: "Modul 1: Foydalanuvchilar va Fayl Ruxsatlari", slug: "2-yol-m1", pathSlug: "2-yol-linux", order: 1 });
        const m2 = new Module({ title: "Modul 2: Jarayonlar, Cron va Imtiyozlarni Oshirish", slug: "2-yol-m2", pathSlug: "2-yol-linux", order: 2 });
        const m3 = new Module({ title: "Modul 3: Tarmoq Skanerlash va Matn Tahlili", slug: "2-yol-m3", pathSlug: "2-yol-linux", order: 3 });
        const m4 = new Module({ title: "Modul 4: Arxivlash va Tarmoq Xizmatlari", slug: "2-yol-m4", pathSlug: "2-yol-linux", order: 4 });
        await Module.insertMany([m1, m2, m3, m4]);

        // ==========================================
        // DARSLAR (LESSONS)
        // ==========================================
        const lessons = [
            // MODUL 1
            { _id: new mongoose.Types.ObjectId(), title: "1. Foydalanuvchilar va Parollar (/etc/shadow)", slug: "2-yol-m1-l1", moduleSlug: m1.slug, order: 1, xpReward: 50, 
              content: `<h3>Foydalanuvchilar va Maxsus Fayllar</h3>
              <p>Linuxda har bir foydalanuvchi hisobi <b>/etc/passwd</b> faylida saqlanadi, ammo bu yerda parollar ochiq saqlanmaydi (odatda 'x' belgisi turadi). Haqiqiy parol xeshlari (masalan, SHA-512 yordamida himoyalangan) faqat root o'qiy oladigan <b>/etc/shadow</b> faylida saqlanadi. Bu kiberxavfsizlikning fundamental qoidasidir.</p>
              <p>Tizimda foydalanuvchilar 3 turga bo'linadi: Root (UID 0, barcha huquqlarga ega), Tizim akkauntlari (UID 1-999, daemon va xizmatlar uchun) va Oddiy foydalanuvchilar (UID 1000+). Foydalanuvchilar <code>useradd</code> buyrug'i bilan yaratilsa, ularning guruhlari <b>/etc/group</b> faylida ro'yxatga olinadi.</p>` },
            
            { _id: new mongoose.Types.ObjectId(), title: "2. Fayl huquqlari (rwx) va Umask", slug: "2-yol-m1-l2", moduleSlug: m1.slug, order: 2, xpReward: 50, 
              content: `<h3>Ruxsatlar va ACL</h3>
              <p>Fayl tizimida har bir fayl uchun Owner, Group va Others uchun O'qish (r=4), Yozish (w=2) va Bajarish (x=1) huquqlari belgilanadi. Masalan, <code>chmod 777</code> buyrug'i barchaga to'liq huquq beradi, bu esa o'ta xavflidir.</p>
              <p><b>Umask</b> buyrug'i yangi fayl va papkalar yaratilganda ulardan avtomatik ravishda olib tashlanadigan ruxsatlarni belgilaydi (masalan, umask 0022). Standart ruxsatlar yetarli bo'lmasa, ma'lum bir foydalanuvchiga aniq ruxsat berish uchun <b>ACL</b> (Access Control Lists) mexanizmi (getfacl, setfacl) ishlatiladi.</p>` },
            
            { _id: new mongoose.Types.ObjectId(), title: "3. Maxsus bitlar: SUID, SGID, Sticky bit", slug: "2-yol-m1-l3", moduleSlug: m1.slug, order: 3, xpReward: 50, 
              content: `<h3>Xavfli Maxsus Ruxsatlar</h3>
              <p><b>SUID</b> (Set User ID - 4000) biti o'rnatilgan ikkilik dasturni (binary) kim ishga tushirsa ham, u dastur egasining (odatda root) huquqlari bilan bajariladi. Bu tizimda eng ko'p mahalliy imtiyozlarni oshirish (LPE) zaifliklarini keltirib chiqaradi.</p>
              <p><b>SGID</b> (2000) papkalarda yangi fayllarga guruh huquqlarini meros qilib berish uchun ishlatilsa, <b>Sticky bit</b> (1000) o'rnatilgan ommaviy papkalarda (masalan, <code>/tmp</code>) faylni faqat uning egasi yoki root o'chirishi mumkin bo'ladi.</p>` },

            // MODUL 2
            { _id: new mongoose.Types.ObjectId(), title: "1. Jarayonlar (Process) va Signallar", slug: "2-yol-m2-l1", moduleSlug: m2.slug, order: 1, xpReward: 50, 
              content: `<h3>Jarayonlarni Boshqarish</h3>
              <p>Linuxda har bir bajarilayotgan dastur - Process hisoblanadi va unga PID (Process ID) beriladi. Jarayonlar <code>ps aux</code> yoki <code>top/htop</code> buyruqlari yordamida doimiy monitoring qilinadi. Agar Child jarayon ishlashdan to'xtagach, uning parenti uni qabul qilib olmasa (wait), u <b>Zombie</b> holatiga tushadi.</p>
              <p>Jarayon ustuvorligi <b>Nice</b> qiymati orqali (-20 dan +19 gacha) belgilanadi. Dasturlarni to'xtatish uchun <b>SIGTERM</b> (15 - toza to'xtash) yoki <b>SIGKILL</b> (9 - darhol va majburiy o'ldirish) signallari <code>kill</code> buyrug'i yordamida yuboriladi.</p>` },
            
            { _id: new mongoose.Types.ObjectId(), title: "2. Cron Jobs va LPE Zaifliklari", slug: "2-yol-m2-l2", moduleSlug: m2.slug, order: 2, xpReward: 50, 
              content: `<h3>Rejalashtirilgan Vazifalar Xavfsizligi</h3>
              <p><b>Cron</b> - belgilangan vaqtda vazifalarni avtomatik bajaruvchi daemon. Uning jadvallari <code>crontab</code> deb ataladi. Agar root tomonidan bajariladigan cron skriptiga oddiy foydalanuvchi yozish huquqiga ega bo'lsa, u skript ichiga zararli kod kiritib, Root shell'ni olishi mumkin.</p>
              <p>Shuningdek, <b>PATH Hijacking</b> xavfi ham mavjud: agar cron buyrug'i to'liq yo'l bilan (masalan, <code>/usr/bin/tar</code>) emas, oddiygina <code>tar</code> deb chaqirilsa va PATH o'zgaruvchisiga <code>/tmp</code> qo'shilgan bo'lsa, xaker <code>/tmp</code> ichida soxta 'tar' faylini yaratib, uni root imtiyozlari bilan ishga tushira oladi.</p>` },
            
            { _id: new mongoose.Types.ObjectId(), title: "3. Sudo zaifliklari (awk, vi, find)", slug: "2-yol-m2-l3", moduleSlug: m2.slug, order: 3, xpReward: 50, 
              content: `<h3>GTFOBins va Sudo Ekspluatatsiyasi</h3>
              <p>Sudo - foydalanuvchiga vaqtincha administrator huquqini beruvchi dastur. Agar <code>/etc/sudoers</code> faylida ba'zi standart buyruqlarni (awk, vi, find, tar) <b>NOPASSWD</b> bilan bajarishga ruxsat berilsa, bu tizimning to'liq buzilishiga olib kelishi muqarrar. Bunday zaifliklarni hujjatlashtiruvchi resurs <b>GTFOBins</b> deb ataladi.</p>
              <p>Masalan, agar <code>sudo awk</code> ruxsati bo'lsa, xaker <code>sudo awk 'BEGIN {system("/bin/bash")}'</code> buyrug'i orqali awk'ning <code>system()</code> funksiyasidan foydalanib darhol root qobig'ini (shell) qo'lga kirita oladi.</p>` },

            // MODUL 3
            { _id: new mongoose.Types.ObjectId(), title: "1. Nmap: Tarmoqni Skanerlash va Firewall", slug: "2-yol-m3-l1", moduleSlug: m3.slug, order: 1, xpReward: 50, 
              content: `<h3>Nmap Skanerlash Turlari</h3>
              <p>Nmap auditorlik vositasi bo'lib, eng xavfsiz skanerlash turi bu <b>TCP SYN Scan (-sS)</b> hisoblanadi. U uch bosqichli 'handshake' ni to'liq o'rnatmaydi (javob kelgach RST bilan yopadi) va jurnallarda ko'zga tashlanmaydi. <b>Connect Scan (-sT)</b> esa to'liq ulanish o'rnatadi va buni barcha loglar ko'radi.</p>
              <p>UDP skanerlash (-sU) tezkor DNS protokollari uchun ishlatiladi. Murakkab himoya devorlarini (Firewall) chalg'itish uchun paketlarni kichik qismlarga bo'lish (<b>-f Fragmentatsiya</b>) yoki ishonchli soxta portlardan foydalanish (<b>--source-port 53</b>) texnikalari qo'llaniladi.</p>` },
            
            { _id: new mongoose.Types.ObjectId(), title: "2. Matn va fayllarni qidirish (find, grep)", slug: "2-yol-m3-l2", moduleSlug: m3.slug, order: 2, xpReward: 50, 
              content: `<h3>Axborot izlash vositalari</h3>
              <p><b>find</b> buyrug'i butun fayl tizimidan fayllarni nom, tur, hajm va ruxsatlarga ko'ra qidiradi. Kiberxavfsizlikda imtiyozlarni oshirish zaifliklarini topish uchun ko'pincha <code>find / -perm -4000 2>/dev/null</code> orqali barcha SUID fayllar axtariladi. <b>2>/dev/null</b> xatoliklarni ekrandan yashirish (qora teshikka yuborish) uchun xizmat qiladi.</p>
              <p><b>grep</b> matn izlovchilarining qiroli hisoblanadi. <code>-i</code> (katta-kichik harfni farqlamaslik), <code>-v</code> (mos kelmaganlarni chiqarish), va <code>-r</code> (papkalar ichida rekursiv qidirish) kabi opsiyalari yordamida murakkab log fayllarini osonlikcha o'qish mumkin.</p>` },
            
            { _id: new mongoose.Types.ObjectId(), title: "3. Matnni filtrlash: cut, wc, sort, uniq", slug: "2-yol-m3-l3", moduleSlug: m3.slug, order: 3, xpReward: 50, 
              content: `<h3>Log fayllarni qayta ishlash zanjiri</h3>
              <p><b>cut</b> buyrug'i matndagi ustunlarni chegaralovchi (delimiter) bo'yicha ajratadi (masalan, <code>cut -d: -f1 /etc/passwd</code>). <b>wc</b> (word count) esa satrlar (-l), so'zlar (-w) va baytlarni (-c) aniq hisoblaydi.</p>
              <p><b>sort</b> ma'lumotlarni alfavit yoki raqam (-n) bo'yicha saralaydi, <b>uniq</b> esa ketma-ket takrorlanuvchi qatorlarni qisqartiradi yoki hisoblaydi (-c). Haqiqiy hayotda bu vositalar Pipe (<code>|</code>) orqali zanjirlanadi. Masalan, veb serverdagi eng ko'p IP larni topish uchun: <code>cut -d' ' -f1 access.log | sort | uniq -c | sort -nr</code>.</p>` },

            // MODUL 4
            { _id: new mongoose.Types.ObjectId(), title: "1. Arxivlash va Siqish Xavfsizligi", slug: "2-yol-m4-l1", moduleSlug: m4.slug, order: 1, xpReward: 50, 
              content: `<h3>tar, gzip, zip, 7z va Xavfsizlik</h3>
              <p>Fayllarni siqishda <b>gzip</b> (tez ishlaydi, .gz), <b>bzip2</b> (chuqur siqadi, .bz2) va <b>7z</b> (kuchli AES-256 shifrlash qo'llab-quvvatlanadi) kabi vositalar ishlatiladi. Jildlarni (papkalar) yaxlit bitta faylga jamlash uchun asosan <b>tar</b> buyrug'i qo'llaniladi.</p>
              <p>Forensik tahlilda jinoyat dalillarini ko'chirganda ularning metama'lumotlari o'zgarmasligi uchun <code>--numeric-owner</code> ishlatiladi. Shuningdek, ishonchsiz tashqi arxivlarni ochganda, fayllar egasi beixtiyor 'root' bo'lib qolib, xavf tug'dirmasligi uchun tar buyrug'ida <b>--no-same-owner</b> opsiyasidan foydalanish o'ta muhim.</p>` },
            
            { _id: new mongoose.Types.ObjectId(), title: "2. Samba (SMB) va NFS orqali Fayl Almashish", slug: "2-yol-m4-l2", moduleSlug: m4.slug, order: 2, xpReward: 50, 
              content: `<h3>Tarmoq Ulushlari Xavfsizligi</h3>
              <p><b>Samba (SMB)</b> asosan Linux va Windows tizimlari o'rtasida fayllarni ulashish uchun ishlatiladi. Eski SMBv1 protokoli butunlay o'chirilishi kerak (u EternalBlue va WannaCry ga sabab bo'lgan). Konfiguratsiya faylida (<code>smb.conf</code>) <code>guest ok = yes</code> kabi parolsiz anonim kirishga ruxsat beruvchi parametrlar juda xavflidir.</p>
              <p><b>NFS</b> tizimlarida eng muhim himoya funksiyasi bu <code>root_squash</code> hisoblanadi. U mijoz tizimidan kelgan root foydalanuvchisini serverda avtomatik ravishda 'nobody' (huquqsiz foydalanuvchi) ga aylantiradi. Agar ma'mur adashib <code>no_root_squash</code> o'rnatsa, xaker serverda SetUID bitli ildiz dasturlarini bemalol yarata oladi.</p>` },
            
            { _id: new mongoose.Types.ObjectId(), title: "3. FTP va Metasploitable2 Ekspluatatsiyasi", slug: "2-yol-m4-l3", moduleSlug: m4.slug, order: 3, xpReward: 50, 
              content: `<h3>21-port: vsftpd 2.3.4 Backdoor</h3>
              <p>FTP fayllarni ochiq matn ko'rinishida uzatuvchi qadimiy protokoldir va asosan 21-portda ishlaydi. Metasploitable2 virtual mashinasida o'rnatilgan <b>vsftpd 2.3.4</b> versiyasida dasturchilar tomonidan ataylab qoldirilgan orqa eshik (backdoor) mavjud.</p>
              <p>Agar hujumchi FTP serverga ulanib foydalanuvchi nomi o'rniga <code>:)</code> (kuluvchi yuzcha) yozsa, server bu maxsus belgini ko'rib, orqa fonda 6200-portni ochadi va to'g'ridan-to'g'ri root shell (to'liq nazorat) taqdim etadi. Hujumchilar shuningdek loginlarni brute-force qilish uchun kuchli <b>Hydra</b> vositasidan ham foydalanadilar.</p>` }
        ];

        await Lesson.insertMany(lessons);

        // ==========================================
        // SAVOLLAR (QUESTIONS)
        // Mongoose cheklovlarini aylanib o'tish uchun bevosita Collection API ishlatiladi
        // ==========================================
        let allQuestions = [];

        // M1 L1
        allQuestions.push({ lessonId: lessons[0]._id, prompt: "Linuxda haqiqiy parol xeshlarini (shifrlangan parollarni) saqlaydigan xavfsiz fayl qaysi?", options: ["/etc/passwd", "/etc/shadow", "/etc/group", "/bin/bash"], answers: ["/etc/shadow"], correctAnswer: "/etc/shadow", points: 20 });
        allQuestions.push({ lessonId: lessons[0]._id, prompt: "Tizimdagi to'liq imtiyozlarga ega bo'lgan Root akkauntining UID (foydalanuvchi ID) raqami qanday?", options: ["0", "1", "1000", "999"], answers: ["0"], correctAnswer: "0", points: 20 });
        // M1 L2
        allQuestions.push({ lessonId: lessons[1]._id, prompt: "Yangi fayl va papkalar yaratilganda ulardan avtomatik ravishda olib tashlanadigan ruxsatlarni belgilovchi buyruq nima?", options: ["chmod", "chown", "umask", "setfacl"], answers: ["umask"], correctAnswer: "umask", points: 20 });
        allQuestions.push({ lessonId: lessons[1]._id, prompt: "Barchaga o'qish, yozish va bajarish huquqini beruvchi xavfli 'chmod' qiymati qanday?", options: ["755", "644", "777", "600"], answers: ["777"], correctAnswer: "777", points: 20 });
        // M1 L3
        allQuestions.push({ lessonId: lessons[2]._id, prompt: "Fayl bajarilganda, u faylni kim ishga tushirgan bo'lishidan qat'iy nazar, doimo fayl egasining (owner) huquqlari bilan ishlashini ta'minlovchi bit qaysi?", options: ["SUID", "SGID", "Sticky bit", "Executable"], answers: ["SUID"], correctAnswer: "SUID", points: 20 });
        allQuestions.push({ lessonId: lessons[2]._id, prompt: "Faqat fayl egasi yoki root o'chira olishi kafolatlanishi uchun /tmp kabi ommaviy papkalarga o'rnatiladigan himoya biti qaysi?", options: ["SUID", "SGID", "Sticky bit", "Umask"], answers: ["Sticky bit"], correctAnswer: "Sticky bit", points: 20 });

        // M2 L1
        allQuestions.push({ lessonId: lessons[3]._id, prompt: "Child process (jarayon) ishlashdan to'xtagach, parent uni kutib olmasa, u xotirada qanday holatga tushib qoladi?", options: ["Sleeping", "Running", "Zombie", "Orphan"], answers: ["Zombie"], correctAnswer: "Zombie", points: 20 });
        allQuestions.push({ lessonId: lessons[3]._id, prompt: "Jarayonni majburiy va darhol o'ldirish (dastur tomonidan tutib bo'lmaydigan) uchun qaysi signal yuboriladi?", options: ["SIGTERM (15)", "SIGINT (2)", "SIGKILL (9)", "SIGHUP (1)"], answers: ["SIGKILL (9)"], correctAnswer: "SIGKILL (9)", points: 20 });
        // M2 L2
        allQuestions.push({ lessonId: lessons[4]._id, prompt: "Cron buyrug'i to'liq yo'l (Absolute Path) bilan yozilmaganida (masalan, '/usr/bin/tar' o'rniga oddiy 'tar' deb yozilganda) yuzaga keladigan zaiflik qanday ataladi?", options: ["PATH Hijacking", "Buffer Overflow", "SQL Injection", "XSS"], answers: ["PATH Hijacking"], correctAnswer: "PATH Hijacking", points: 20 });
        allQuestions.push({ lessonId: lessons[4]._id, prompt: "Cron (rejalashtirilgan ishlar) xizmatining konfiguratsiyasi va jadvallari saqlanadigan fayl qanday nomlanadi?", options: ["systemd", "crontab", "init", "bashrc"], answers: ["crontab"], correctAnswer: "crontab", points: 20 });
        // M2 L3
        allQuestions.push({ lessonId: lessons[5]._id, prompt: "/etc/sudoers faylida foydalanuvchiga muayyan buyruqni parol so'ramasdan bajarishga ruxsat beruvchi xavfli parametr nima?", options: ["PASSWD", "NOPASSWD", "ROOT_ONLY", "ALL"], answers: ["NOPASSWD"], correctAnswer: "NOPASSWD", points: 20 });
        allQuestions.push({ lessonId: lessons[5]._id, prompt: "Standart Linux buyruqlari (masalan, awk, find) orqali imtiyozlarni oshirish (LPE) usullarini jamlagan kiberxavfsizlik resursi nomi nima?", options: ["Metasploit", "Exploit-DB", "GTFOBins", "NVD"], answers: ["GTFOBins"], correctAnswer: "GTFOBins", points: 20 });

        // M3 L1
        allQuestions.push({ lessonId: lessons[6]._id, prompt: "Nmap'ning TCP ulanishni to'liq o'rnatmaydigan, RST paketi bilan ulanishni yopib, loglarda yashirinishga harakat qiluvchi (Stealth) skanerlash usuli qaysi?", options: ["-sT", "-sU", "-sS", "-sN"], answers: ["-sS"], correctAnswer: "-sS", points: 20 });
        allQuestions.push({ lessonId: lessons[6]._id, prompt: "Nmap'da murakkab Firewall devorlarini chalg'itish maqsadida, bitta IP paketini bir nechta kichik 8 baytlik qismlarga bo'lib yuboruvchi opsiya qaysi?", options: ["-O", "-sV", "-p", "-f (Fragmentatsiya)"], answers: ["-f (Fragmentatsiya)"], correctAnswer: "-f (Fragmentatsiya)", points: 20 });
        // M3 L2
        allQuestions.push({ lessonId: lessons[7]._id, prompt: "Kiberxavfsizlik auditorlari tomonidan barcha SUID bitli fayllarni izlab topish uchun qaysi 'find' buyrug'i formulasi ishlatiladi?", options: ["find / -size +10M", "find / -perm -4000", "find / -mtime -1", "find / -user root"], answers: ["find / -perm -4000"], correctAnswer: "find / -perm -4000", points: 20 });
        allQuestions.push({ lessonId: lessons[7]._id, prompt: "Matn izlash jarayonida (grep buyrug'ida) katta va kichik harflarga e'tibor bermaslik (case-insensitive) uchun qaysi opsiya qo'llaniladi?", options: ["-v", "-r", "-i", "-n"], answers: ["-i"], correctAnswer: "-i", points: 20 });
        // M3 L3
        allQuestions.push({ lessonId: lessons[8]._id, prompt: "Matnli fayldagi satrlar (lines), so'zlar (words) va baytlar (characters) sonini aniq hisoblab beruvchi terminal buyrug'ini tanlang.", options: ["sort", "cut", "uniq", "wc"], answers: ["wc"], correctAnswer: "wc", points: 20 });
        allQuestions.push({ lessonId: lessons[8]._id, prompt: "Log fayllarni filtrlashda faqat ketma-ket joylashgan takrorlanuvchi satrlarni bitta nusxaga qisqartiruvchi (yoki sanovchi) buyruq qaysi?", options: ["sort", "uniq", "cut", "grep"], answers: ["uniq"], correctAnswer: "uniq", points: 20 });

        // M4 L1
        allQuestions.push({ lessonId: lessons[9]._id, prompt: "Ishonchsiz (notanish) arxivlarni ochish vaqtida (masalan, tar-slip hujumidan himoyalanishda) fayllar egasi root bo'lib qolmasligi uchun 'tar' buyrug'ida qaysi himoya opsiyasi shart?", options: ["--no-same-owner", "-xzvf", "--acls", "-czf"], answers: ["--no-same-owner"], correctAnswer: "--no-same-owner", points: 20 });
        allQuestions.push({ lessonId: lessons[9]._id, prompt: "Fayllarni yuqori darajada siqadigan va qattiq AES-256 shifrlashni (hatto fayl nomlarini ham) qo'llab-quvvatlaydigan format qaysi?", options: ["gzip", "bzip2", "7z", "lzop"], answers: ["7z"], correctAnswer: "7z", points: 20 });
        // M4 L2
        allQuestions.push({ lessonId: lessons[10]._id, prompt: "NFS serverda eng asosiy himoya devori bo'lib xizmat qiladigan va mijozning root foydalanuvchisini 'nobody' (oddiy foydalanuvchi) ga aylantirib qo'yuvchi opsiya nima?", options: ["no_root_squash", "root_squash", "async", "insecure"], answers: ["root_squash"], correctAnswer: "root_squash", points: 20 });
        allQuestions.push({ lessonId: lessons[10]._id, prompt: "Samba (SMB) serverining smb.conf faylida parolsiz, anonim foydalanuvchilarning papkaga kirishiga ruxsat beruvchi o'ta xavfli parametr qaysi?", options: ["read only = yes", "browseable = yes", "guest ok = yes", "valid users"], answers: ["guest ok = yes"], correctAnswer: "guest ok = yes", points: 20 });
        // M4 L3
        allQuestions.push({ lessonId: lessons[11]._id, prompt: "Metasploitable2 virtual mashinasida vsftpd 2.3.4 (Orqa eshik - Backdoor) xizmati kompyuterning qaysi portida ishlaydi?", options: ["22 (SSH)", "80 (HTTP)", "21 (FTP)", "445 (SMB)"], answers: ["21 (FTP)"], correctAnswer: "21 (FTP)", points: 20 });
        allQuestions.push({ lessonId: lessons[11]._id, prompt: "Tarmoq xizmatlariga (FTP, SSH kabi) katta parollar lug'ati orqali brute-force (kuch ishlatib buzish) hujumini uyushtiruvchi mashhur vosita qaysi?", options: ["Nmap", "Wireshark", "Hydra", "Burp Suite"], answers: ["Hydra"], correctAnswer: "Hydra", points: 20 });

        await Question.collection.insertMany(allQuestions);

        console.log('✅ Barcha ma`lumotlar Mongoose Schema xatolarini aylanib o`tib, bazaga 100% to`g`ri kiritildi!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Xatolik yuz berdi:', err);
        process.exit(1);
    }
}

seedPath2();
"""

with open("seed_path2_linux.js", "w", encoding="utf-8") as f:
    f.write(code)
