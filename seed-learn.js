const mongoose = require('mongoose');
const { Lesson, Question } = require('./models/Learn');

// Mongoose schema yangilanishi (Modul sxemasini qo'shamiz)
const moduleSchema = new mongoose.Schema({
    slug: { type: String, unique: true },
    title: String,
    order: Number
});
const Module = mongoose.models.Module || mongoose.model('Module', moduleSchema);

const curriculum = [
    {
        title: "1-modul. Asoslar va qonunchilik", slug: "module-1", order: 1,
        lessons: [
            {
                title: "CIA Triadasi", slug: "cia-triad", order: 1,
                content: `<h3>CIA Triadasi (Axborot Xavfsizligi Ustunlari)</h3><p>Axborot xavfsizligining fundamental poydevori CIA triadasi deb ataluvchi uchta asosiy prinsipga tayanadi: <b>Maxfiylik (Confidentiality)</b>, <b>Yaxlitlik (Integrity)</b>, <b>Mavjudlik (Availability)</b>.</p>`,
                questions: [
                    { prompt: "Tizimdagi ma'lumotlarning tranzit va saqlash vaqtida ruxsatsiz o'zgartirilmaganligini kafolatlovchi CIA prinsipi nima?", answers: ["integrity", "yaxlitlik"], points: 20 },
                    { prompt: "DDoS hujumi CIA triadasining aynan qaysi elementini ishdan chiqarishga qaratilgan?", answers: ["availability", "mavjudlik"], points: 20 }
                ]
            },
            {
                title: "Etik Xakerlik", slug: "ethical-hacking", order: 2,
                content: `<h3>Etik Xakerlik va Qonunchilik</h3><p>Xakerlik faoliyati niyat va ruxsatga ko'ra toifalarga bo'linadi: White Hat, Black Hat, Grey Hat.</p><ul><li><b>Rules of Engagement (RoE):</b> Tekshiruv boshlanishidan oldin imzolanadigan rasmiy hujjat.</li><li><b>O'zbekiston Respublikasi JK XX¹ bobi:</b> 278-4, 278-5, 278-6 moddalari axborot texnologiyalari sohasidagi jinoyatlarni belgilaydi.</li></ul>`,
                questions: [
                    { prompt: "Penetratsion test paytida qaysi serverlarni tekshirish mumkinligi va qaysilari taqiqlanganligini belgilab beruvchi rasmiy kelishuv hujjati nima deb ataladi?", answers: ["rules of engagement", "roe", "scope"], points: 20 },
                    { prompt: "O'zbekiston Respublikasi Jinoyat Kodeksida 'Kompyuter axborotidan qonunga xilof ravishda (ruxsatsiz) foydalanish' qaysi moddada bayon etilgan?", answers: ["278-4", "278 prim 4", "278 4"], points: 20 }
                ]
            },
            {
                title: "Kali Linux", slug: "kali-linux", order: 3,
                content: `<h3>Kali Linux</h3><p>Kali Linux — Debian asosida yaratilgan, penetratsion testlar uchun maxsus yig'ilgan distributiv.</p>`,
                questions: [
                    { prompt: "Kali Linux qaysi ommabop Linux distributivi bazasiga asoslangan?", answers: ["debian"], points: 20 },
                    { prompt: "Kali Linux tizimida mashhur so'zlar ro'yxati (masalan, rockyou.txt) standart bo'yicha qaysi katalogda saqlanadi?", answers: ["/usr/share/wordlists", "/usr/share/wordlists/"], points: 20 }
                ]
            },
            {
                title: "VirtualBox", slug: "virtualbox", order: 4,
                content: `<h3>VirtualBox</h3><p>Type-2 gipervizorlari orqali izolyatsiyalangan laboratoriya yaratiladi. Tarmoq rejimlari: NAT, Bridged, Internal Network, Host-Only.</p>`,
                questions: [
                    { prompt: "Virtual mashinaning ayni damdagi holatini xotirada saqlab, keyinchalik xatolar sodir bo'lganda unga qaytish imkonini beruvchi funksiya nima?", answers: ["snapshot"], points: 20 },
                    { prompt: "VirtualBox-dagi qaysi tarmoq rejimi tashqi internetni to'liq uzgan holda faqat virtual mashinalarning o'zaro xavfsiz aloqasini ta'minlaydi?", answers: ["internal network", "internal"], points: 20 }
                ]
            }
        ]
    },
    {
        title: "2-modul. Linux OS", slug: "module-2", order: 2,
        lessons: [
            {
                title: "Bash Scriptlar", slug: "bash-scripts", order: 1,
                content: `<h3>Bash Scriptlar</h3><p>Bash (Bourne Again Shell) xavfsizlik mutaxassisiga vazifalarni avtomatlashtirishda qo'l keladi.</p>`,
                questions: [
                    { prompt: "Linux skriptlarining eng boshida interpretator yo'lini ko'rsatish uchun ishlatiladigan #! belgilar juftligi qanday ataladi?", answers: ["shebang"], points: 20 },
                    { prompt: "Bash skriptida oldingi buyruq xatosiz muvaffaqiyatli yakunlanganini tekshirish uchun qaysi maxsus o'zgaruvchi tekshiriladi?", answers: ["$?"], points: 20 }
                ]
            },
            {
                title: "SSH", slug: "ssh", order: 2,
                content: `<h3>SSH (Secure Shell)</h3><p>SSH (Port 22) — masofaviy serverlarni xavfsiz boshqarish protokoli.</p>`,
                questions: [
                    { prompt: "SSH protokoli standart sozlamalarga ko'ra qaysi TCP port orqali ishlaydi?", answers: ["22"], points: 20 },
                    { prompt: "Foydalanuvchining ochiq SSH kalitlari serverning qaysi fayliga joylashtirilishi kerak?", answers: ["authorized_keys"], points: 20 }
                ]
            },
            {
                title: "UFW", slug: "ufw", order: 3,
                content: `<h3>UFW (Uncomplicated Firewall)</h3><p>Linux yadrosida tarmoq paketlarini filtrlashni osonlashtirish uchun UFW ishlatiladi.</p>`,
                questions: [
                    { prompt: "Standart bo'yicha barcha kiruvchi ulanishlarni bloklab qo'yish uchun UFW-da qanday buyruq beriladi?", answers: ["sudo ufw default deny incoming", "ufw default deny incoming"], points: 20 },
                    { prompt: "UFW xavfsizlik devori qoidalarini raqamlari bilan birga ko'rish uchun status parametriga qaysi kalit qo'shiladi?", answers: ["numbered"], points: 20 }
                ]
            },
            {
                title: "Wireshark", slug: "wireshark", order: 4,
                content: `<h3>Wireshark bilan Tarmoq Tahlili</h3><p>Wireshark — paket analizatori (Sniffer).</p>`,
                questions: [
                    { prompt: "Wireshark-da faqat DNS so'rov va javoblarini saralab olish uchun qanday oddiy filtr yoziladi?", answers: ["dns"], points: 20 },
                    { prompt: "Tarmoq kartasiga unga tegishli bo'lmagan boshqa qurilmalar paketlarini ham o'qish imkonini beruvchi rejim qanday ataladi?", answers: ["promiscuous mode", "promiscuous"], points: 20 }
                ]
            }
        ]
    },
    {
        title: "3-modul. Windows OS", slug: "module-3", order: 3,
        lessons: [
            {
                title: "Active Directory", slug: "active-directory", order: 1,
                content: `<h3>Active Directory (AD)</h3><p>AD — Microsoft katalog xizmati. Asosiy elementlari: DC, Kerberos, GPO, LDAP.</p>`,
                questions: [
                    { prompt: "Active Directory domenida barcha autentifikatsiya so'rovlarini qabul qilib, ma'lumotlar bazasini saqlovchi bosh server nima deb ataladi?", answers: ["domain controller", "dc"], points: 20 },
                    { prompt: "Active Directory tizimida standart autentifikatsiya sifatida ishlatiladigan chiptalarga asoslangan protokol qaysi?", answers: ["kerberos"], points: 20 }
                ]
            },
            {
                title: "Mimikatz", slug: "mimikatz", order: 2,
                content: `<h3>Mimikatz</h3><p>Windows xotirasidan autentifikatsiya ma'lumotlarini o'g'irlash uchun vosita.</p>`,
                questions: [
                    { prompt: "Mimikatz Windows operatsion tizimidagi qaysi tizim jarayoni (process) xotirasidan parollar va xesh ma'lumotlarini chiqarib oladi?", answers: ["lsass.exe", "lsass"], points: 20 },
                    { prompt: "Foydalanuvchi parolini topmasdan, faqat uning NTLM xeshi yordamida tarmoqdagi boshqa tizimlarga kirish texnikasi nima deyiladi?", answers: ["pass-the-hash", "pth", "pass the hash"], points: 20 }
                ]
            },
            {
                title: "Privilege Escalation", slug: "privilege-escalation", order: 3,
                content: `<h3>Privilege Escalation</h3><p>Tizimga past huquqli foydalanuvchi sifatida kirgandan so'ng administrator darajasiga ko'tarilish.</p>`,
                questions: [
                    { prompt: "Windows-da joriy foydalanuvchiga berilgan huquq va imtiyozlar ro'yxatini ko'rish uchun qaysi buyruq ishlatiladi?", answers: ["whoami /priv"], points: 20 },
                    { prompt: "Windows muhitida eng yuqori tizim darajasidagi imtiyozga ega bo'lgan maxsus foydalanuvchi hisobi qanday nomlanadi?", answers: ["nt authority\\system", "system"], points: 20 }
                ]
            }
        ]
    },
    {
        title: "4-modul. Tarmoq asoslari va hujumlar", slug: "module-4", order: 4,
        lessons: [
            {
                title: "OSI", slug: "osi", order: 1,
                content: `<h3>OSI Modeli</h3><p>OSI modeli — tarmoq orqali qanday bog'lanishni standartlashtiruvchi 7 bosqichli model.</p>`,
                questions: [
                    { prompt: "Routerlar va IP manzillar OSI modelining nechanchi (qaysi nomdagi) qatlamida ishlaydi?", answers: ["network", "3", "tarmoq"], points: 20 },
                    { prompt: "2-qatlamda (Data Link) tarmoq orqali uzatilayotgan ma'lumot bloklari qanday ataladi?", answers: ["frame", "freym"], points: 20 }
                ]
            },
            {
                title: "TCP/IP", slug: "tcp-ip", order: 2,
                content: `<h3>TCP/IP Staki va 3-Way Handshake</h3><p>TCP vs UDP farqlari hamda 3 bosqichli aloqa.</p>`,
                questions: [
                    { prompt: "TCP 3-Way Handshake mexanizmining ikkinchi bosqichida server mijozga qanday flaglar kombinatsiyasini yuboradi?", answers: ["syn-ack", "syn ack"], points: 20 },
                    { prompt: "DNS so'rovlari odatda tezlik ustun bo'lgani uchun qaysi transport protokolidan foydalanadi?", answers: ["udp"], points: 20 }
                ]
            },
            {
                title: "Nmap", slug: "nmap", order: 3,
                content: `<h3>Nmap (Network Mapper)</h3><p>Ochiq portlarni topish va xizmatlarni aniqlash.</p>`,
                questions: [
                    { prompt: "Nmap vositasida ochiq portlarda ishlayotgan dasturlar versiyasini aniqlash uchun qaysi kalit ishlatiladi?", answers: ["-sv", "sv"], points: 20 },
                    { prompt: "Nmap-da ulanishni to'liq yakunlamay yashirincha skanerlash qiluvchi 'SYN Stealth Scan' kaliti qaysi?", answers: ["-ss", "ss"], points: 20 }
                ]
            },
            {
                title: "MITM", slug: "mitm", order: 4,
                content: `<h3>MITM va ARP Spoofing</h3><p>MITM (O'rtadagi odam) va soxta ARP paketlarini tarmoqqa yuborish.</p>`,
                questions: [
                    { prompt: "Mahalliy tarmoqda IP manzilni MAC manzilga bog'lash uchun qaysi protokol xizmat qiladi?", answers: ["arp"], points: 20 },
                    { prompt: "Tarmoq svichlarida soxta ARP javoblarini aniqlab bloklaydigan himoya mexanizmi nima deyiladi?", answers: ["dynamic arp inspection", "dai"], points: 20 }
                ]
            },
            {
                title: "DNS Spoofing", slug: "dns-spoofing", order: 5,
                content: `<h3>DNS Spoofing</h3><p>Qurbon brauzeriga soxta IP manzil yuborish orqali fishing hujumi.</p>`,
                questions: [
                    { prompt: "DNS so'rovlariga kriptografik imzo qo'yish orqali javoblarning soxtalashtirilmaganini kafolatlovchi kengaytma?", answers: ["dnssec"], points: 20 },
                    { prompt: "DNS so'rovlarini shifrlangan HTTPS protokoli ichiga o'rab jo'natuvchi texnologiyaning qisqartmasi nima?", answers: ["doh"], points: 20 }
                ]
            }
        ]
    }
];

mongoose.connect('mongodb://localhost:27017/ctf-uz').then(async () => {
    console.log("Ma'lumotlar bazasiga ulandi, o'rganish modullari yozilmoqda...");
    await Module.deleteMany({});
    await Lesson.deleteMany({});
    await Question.deleteMany({});

    for (let mod of curriculum) {
        let createdMod = await Module.create({ title: mod.title, slug: mod.slug, order: mod.order });
        for (let les of mod.lessons) {
            let createdLes = await Lesson.create({ moduleSlug: mod.slug, slug: les.slug, title: les.title, content: les.content, order: les.order });
            for (let q of les.questions) {
                await Question.create({ lessonId: createdLes._id, prompt: q.prompt, answers: q.answers, points: q.points });
            }
        }
    }
    console.log("✅ 4 ta modul va barcha darslar to'liq bazaga yozildi!");
    process.exit();
});
