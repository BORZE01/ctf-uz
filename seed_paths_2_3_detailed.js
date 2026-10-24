
const mongoose = require('mongoose');
const MONGO_URI = 'mongodb+srv://ctfuz_admin:AKKSAVDON137@ctf-uz-cluster.vtjol3t.mongodb.net/ctf-uz?retryWrites=true&w=majority'; 

const { LearningPath, Module, Lesson, Question } = require('./models/Learn');

async function seedData() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Jonli bazaga ulanildi.');

        // 2 va 3-yo'llarni tozalash
        const oldPaths = await LearningPath.find({ slug: { $in: ['2-yol-linux', '3-yol-windows'] } });
        for (let p of oldPaths) {
            const oldLessons = await Lesson.find({ moduleSlug: { $regex: new RegExp('^' + p.slug.split('-')[0]) } });
            const lessonIds = oldLessons.map(l => l._id);
            await Question.deleteMany({ lessonId: { $in: lessonIds } });
            await Lesson.deleteMany({ moduleSlug: { $regex: new RegExp('^' + p.slug.split('-')[0]) } });
            await Module.deleteMany({ pathSlug: p.slug });
        }
        await LearningPath.deleteMany({ slug: { $in: ['2-yol-linux', '3-yol-windows'] } });

        // ==========================================
        // 2-YO'L: LINUX OS
        // ==========================================
        const path2 = await LearningPath.create({
            title: "2-yo'l. Linux OS",
            slug: "2-yol-linux",
            description: "Bash arxitekturasi, serverlarni himoyalash va tarmoq trafigini chuqur tahlil qilish.",
            order: 2,
            isPublished: true,
            level: "Intermediate",
            certificateTitle: "Linux Xavfsizlik Mutaxassisi",
            finalQuestions: [
                { id: "p2q1", prompt: "Siz serverda UFW orqali 22-portni yopdingiz, lekin SSH baribir ishlayapti. Bunga nima sabab bo'lishi mumkin?", options: ["UFW yoqilmagan (ufw enable qilinmagan)", "SSH 80-portda ishlaydi", "UFW faqat Windowsda ishlaydi", "SSH protokoli UFW ga bo'ysunmaydi"], correctAnswer: "UFW yoqilmagan (ufw enable qilinmagan)", points: 10 },
                { id: "p2q2", prompt: "Wireshark orqali tarmoqni eshitib turibsiz (sniffing). Qaysi holatda parollarni ochiq matnda ko'ra olmaysiz?", options: ["Foydalanuvchi HTTP saytga kirganda", "Foydalanuvchi FTP orqali fayl yuklaganda", "Foydalanuvchi SSH orqali serverga ulanganda", "Telnet orqali routerga ulanganda"], correctAnswer: "Foydalanuvchi SSH orqali serverga ulanganda", points: 10 }
            ]
        });

        const mod2_1 = await Module.create({ title: "Bash Scriptlar va Avtomatlashtirish", slug: "2-yol-modul-1", pathSlug: path2.slug, order: 1 });
        
        const l2_1 = await Lesson.create({
            title: "1. Bash asoslari va loglarni o'qish", slug: "2-yol-m1-d1", moduleSlug: mod2_1.slug, order: 1, xpReward: 50,
            content: `<h3>Xaker nega sichqonchadan foydalanmaydi?</h3>
            <p>Linux operatsion tizimida barcha jarayonlar matnli fayllar orqali boshqariladi. Grafik interfeys (GUI) serverni sekinlashtiradi, shuning uchun real serverlarda faqat terminal (CLI) mavjud.</p>
            <p>Xavfsizlik mutaxassisi sifatida kunlik vazifangiz serverga kim kirishga uringanini bilishdir. Buni qo'lda qilish imkonsiz. <code>/var/log/auth.log</code> faylida minglab qatorlar bor. Biz <b>grep</b> va <b>awk</b> buyruqlaridan foydalanamiz.</p>
            <p>Ssenariy: Serveringizga Xitoydan SSH orqali Brute-force hujum bo'lmoqda. Siz quyidagi buyruqni yozasiz:<br>
            <code>cat /var/log/auth.log | grep 'Failed password' | awk '{print $11}'</code><br>
            Bu buyruq tizimga noto'g'ri parol bilan kirishga uringan barcha IP manzillarni ajratib beradi.</p>`
        });
        await Question.create([
            { lessonId: l2_1._id, prompt: "Jarayonlarni filtrlash va matn ichidan kerakli so'zni qidirish uchun qaysi Linux buyrug'i ishlatiladi?", options: ["ls", "grep", "cd", "mkdir"], correctAnswer: "grep", points: 20 },
            { lessonId: l2_1._id, prompt: "Ubuntu/Debian tizimlarida foydalanuvchilarning tizimga kirish (login) loglari odatda qaysi faylda saqlanadi?", options: ["/var/log/auth.log", "/etc/shadow", "/var/log/syslog", "/root/login.txt"], correctAnswer: "/var/log/auth.log", points: 20 }
        ]);

        const l2_2 = await Lesson.create({
            title: "2. SSH Xavfsizligi (Hardening)", slug: "2-yol-m1-d2", moduleSlug: mod2_1.slug, order: 2, xpReward: 50,
            content: `<h3>Nega standart 22-port xavfli?</h3>
            <p>SSH (Secure Shell) serverni masofadan boshqarish uchun eng muhim vositadir. Ammo ko'pchilik uni standart 22-portda qoldiradi. Butun dunyodagi botnetlar doimiy ravishda internetdagi ochiq 22-portlarni qidiradi va parollarni taxmin qilib ko'radi.</p>
            <p><b>Serverni himoyalash qadamlari:</b></p>
            <ul>
                <li><code>/etc/ssh/sshd_config</code> fayliga kiramiz.</li>
                <li><code>Port 22</code> ni <code>Port 2244</code> kabi nostandart portga o'zgartiramiz.</li>
                <li><code>PermitRootLogin no</code> qilib qo'yamiz. Chunki root nomini hamma biladi, agar biz uni taqiqlasak, xaker avval loginingizni topishi, keyin parolingizni topishi, keyin esa root huquqiga ko'tarilishi kerak bo'ladi.</li>
                <li>Parol orqali kirishni butunlay o'chirib, faqat <b>RSA SSH kalitlari (Key-based auth)</b> orqali kirishni yoqamiz.</li>
            </ul>`
        });
        await Question.create([
            { lessonId: l2_2._id, prompt: "SSH orqali to'g'ridan-to'g'ri 'root' bo'lib kirishni taqiqlash uchun konfiguratsiya faylida qaysi parametr o'zgartirilishi kerak?", options: ["Port 22", "PermitRootLogin no", "PasswordAuthentication yes", "AllowUsers root"], correctAnswer: "PermitRootLogin no", points: 20 },
            { lessonId: l2_2._id, prompt: "Xavfsizlikni maksimal oshirish uchun SSH tizimida qanday turdagi autentifikatsiyadan foydalanish tavsiya etiladi?", options: ["Murakkab parollar (12+ belgi)", "Faqat PIN kodlar", "Asimmetrik RSA kalitlari (Key-based)", "Ochiq matn (Clear-text)"], correctAnswer: "Asimmetrik RSA kalitlari (Key-based)", points: 20 }
        ]);

        // ==========================================
        // 3-YO'L: WINDOWS OS
        // ==========================================
        const path3 = await LearningPath.create({
            title: "3-yo'l. Windows OS",
            slug: "3-yol-windows",
            description: "Active Directory, Kerberos protokoli, Imtiyozlarni oshirish (PrivEsc) va xotira tahlili.",
            order: 3,
            isPublished: true,
            level: "Advanced",
            certificateTitle: "Windows Infratuzilma Xavfsizligi",
            finalQuestions: [
                { id: "p3q1", prompt: "Xaker tizim xotirasidan ochiq parollarni (clear-text credentials) ajratib olish uchun qaysi vositadan foydalanadi?", options: ["Nmap", "Mimikatz", "Wireshark", "Burp Suite"], correctAnswer: "Mimikatz", points: 10 },
                { id: "p3q2", prompt: "Active Directory tizimida parollar bazasi (NTLM xeshlar) qaysi faylda saqlanadi?", options: ["/etc/shadow", "SAM faylida", "NTDS.DIT faylida", "system32/config.txt"], correctAnswer: "NTDS.DIT faylida", points: 10 }
            ]
        });

        const mod3_1 = await Module.create({ title: "Active Directory va Kerberos", slug: "3-yol-modul-1", pathSlug: path3.slug, order: 1 });

        const l3_1 = await Lesson.create({
            title: "1. Active Directory arxitekturasi", slug: "3-yol-m1-d1", moduleSlug: mod3_1.slug, order: 1, xpReward: 50,
            content: `<h3>Yirik kompaniyalar tarmog'i qanday ishlaydi?</h3>
            <p>Agar kompaniyada 500 ta kompyuter bo'lsa, IT xodim har bir kompyuterga alohida parol qo'yib chiqmaydi. Buning o'rniga <b>Active Directory (AD)</b> o'rnatiladi. AD — bu butun kompaniya foydalanuvchilari, kompyuterlari va ruxsatlarini bitta joydan (Domain Controller) boshqaruvchi markazlashgan tizim.</p>
            <p>AD ichidagi eng qimmatli narsa bu <b>NTDS.DIT</b> faylidir. Ushbu faylda barcha xodimlarning va tizim administratorlarining parollari xesh (hash) ko'rinishida saqlanadi. Agar xaker Domen Kontrollerga (DC) ulanib, ushbu faylni o'g'irlasa, butun kompaniya tarmog'i uning qo'liga o'tadi.</p>`
        });
        await Question.create([
            { lessonId: l3_1._id, prompt: "Kompaniyadagi barcha foydalanuvchilar va resurslarni markazlashgan holda boshqarish imkonini beruvchi Windows xizmati nima deb ataladi?", options: ["Windows Defender", "Active Directory (AD)", "Task Manager", "Registry Editor"], correctAnswer: "Active Directory (AD)", points: 20 },
            { lessonId: l3_1._id, prompt: "Domen Kontrollerda (DC) barcha foydalanuvchilarning parollari xeshlarini o'zida saqlovchi asosiy ma'lumotlar bazasi fayli qanday nomlanadi?", options: ["SAM", "NTDS.DIT", "winlogon.exe", "lsass.exe"], correctAnswer: "NTDS.DIT", points: 20 }
        ]);

        console.log('✅ 2 va 3-yo`nalishlar muvaffaqiyatli yozildi!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Xatolik:', err);
        process.exit(1);
    }
}
seedData();
