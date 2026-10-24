
const mongoose = require('mongoose');
const MONGO_URI = 'mongodb+srv://ctfuz_admin:AKKSAVDON137@ctf-uz-cluster.vtjol3t.mongodb.net/ctf-uz?retryWrites=true&w=majority'; 

const { Lesson, Question } = require('./models/Learn');

async function fixRemaining() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Jonli bazaga ulanildi. 2, 3 va 4-modul savollari qayta yozilmoqda...');

        const lessonsData = {
            "1-yol-m2-l1": [
                { prompt: "Protsessor siklida ko'rsatmaning maqsadini tushunishga qaratilgan bosqich qaysi?", options: ["Fetch", "Decode", "Execute", "Store"], answers: ["Decode"], correctAnswer: "Decode", points: 20 },
                { prompt: "Kompyuter yoqilganda RAM, protsessor kabi qismlarning sozligini avtomatik tekshiruvchi dastlabki bosqich nima?", options: ["BIOS", "UEFI", "POST", "CMOS"], answers: ["POST"], correctAnswer: "POST", points: 20 }
            ],
            "1-yol-m2-l2": [
                { prompt: "Qaysi NTFS xususiyati orqali fayl hajmini oshirmasdan yashirin kod qo'shish mumkin?", options: ["MFT", "ACL", "ADS (Alternate Data Streams)", "EFS"], answers: ["ADS (Alternate Data Streams)"], correctAnswer: "ADS (Alternate Data Streams)", points: 20 },
                { prompt: "Agar bitta guruh orqali 'Allow', boshqa guruh orqali 'Deny' belgilangan bo'lsa, qaysi biri ustunlik qiladi?", options: ["Allow", "Deny", "Administrator hal qiladi", "Xato yuz beradi"], answers: ["Deny"], correctAnswer: "Deny", points: 20 }
            ],
            "1-yol-m2-l3": [
                { prompt: "Mavjud OT ustiga ilova sifatida o'rnatiladigan Gipervizor (masalan, VirtualBox) qaysi turga kiradi?", options: ["Type-1", "Type-2", "Type-3", "Bare-metal"], answers: ["Type-2"], correctAnswer: "Type-2", points: 20 },
                { prompt: "Virtual tizim ishdan chiqqanda, uni oldingi sog'lom xotira nuqtasiga tezkor qaytaruvchi funksiya nima deb ataladi?", options: ["Backup", "Clone", "Snapshot", "Restore Point"], answers: ["Snapshot"], correctAnswer: "Snapshot", points: 20 }
            ],
            "1-yol-m3-l1": [
                { prompt: "OSI modelining 3-qatlamida paketlarni to'g'ri yo'naltirish uchun qaysi qurilma ishlatiladi?", options: ["Switch", "Hub", "Router", "Modem"], answers: ["Router"], correctAnswer: "Router", points: 20 },
                { prompt: "Faqat mahalliy tarmoq (LAN) ichida ishlatiladigan va zavoddan yozilgan o'zgarmas 48-bitli manzil nima?", options: ["IP manzil", "MAC manzil", "Subnet mask", "Gateway"], answers: ["MAC manzil"], correctAnswer: "MAC manzil", points: 20 }
            ],
            "1-yol-m3-l2": [
                { prompt: "DNS va onlayn o'yinlarda ishlatiladigan, tezkor lekin ishonchsiz transport protokoli qaysi?", options: ["TCP", "UDP", "HTTP", "FTP"], answers: ["UDP"], correctAnswer: "UDP", points: 20 },
                { prompt: "Matnli domenni (google.com) raqamli IP manzilga aylantirib beruvchi protokol qanday nomlanadi?", options: ["DHCP", "DNS", "ARP", "SMTP"], answers: ["DNS"], correctAnswer: "DNS", points: 20 }
            ],
            "1-yol-m3-l3": [
                { prompt: "Switch xotirasini soxta MAC manzillar bilan to'ldirib yuborish hujumi nima deb ataladi?", options: ["ARP Spoofing", "MAC Flooding", "IP Spoofing", "DDoS"], answers: ["MAC Flooding"], correctAnswer: "MAC Flooding", points: 20 },
                { prompt: "Tarmoq trafigini kuzatib, xavfli naqshlarni avtomatik bloklaydigan tizim to'liq qanday nomlanadi?", options: ["Firewall", "IDS", "IPS (Intrusion Prevention System)", "VPN"], answers: ["IPS (Intrusion Prevention System)"], correctAnswer: "IPS (Intrusion Prevention System)", points: 20 }
            ],
            "1-yol-m4-l1": [
                { prompt: "Nima uchun kiberxavfsizlik hujumlarini haqiqiy tarmoqlarda emas, laboratoriyalarda sinash talab etiladi?", options: ["Qonuniy va xavfsiz bo'lgani uchun", "Arzonroq bo'lgani uchun", "Tezroq ishlagani uchun", "Internet talab qilmagani uchun"], answers: ["Qonuniy va xavfsiz bo'lgani uchun"], correctAnswer: "Qonuniy va xavfsiz bo'lgani uchun", points: 20 },
                { prompt: "Brauzer va VPN orqali tayyor virtual muhitlarga ulanish imkonini beruvchi laboratoriya turi qaysi?", options: ["Virtual mashina", "Onlayn platformalar", "Bulutli laboratoriya", "Fizik laboratoriya"], answers: ["Onlayn platformalar"], correctAnswer: "Onlayn platformalar", points: 20 }
            ],
            "1-yol-m4-l2": [
                { prompt: "Yangi boshlovchilarga qadam-baqadam o'rgatuvchi eng ommabop platforma qaysi?", options: ["Hack The Box", "TryHackMe", "VulnHub", "CTFTime"], answers: ["TryHackMe"], correctAnswer: "TryHackMe", points: 20 },
                { prompt: "Tizimlardagi zaifliklarni topish orqali yashirin kodlarni izlaydigan musobaqa formati qanday ataladi?", options: ["CTF (Capture The Flag)", "Bug Bounty", "PenTest", "Red Teaming"], answers: ["CTF (Capture The Flag)"], correctAnswer: "CTF (Capture The Flag)", points: 20 }
            ],
            "1-yol-m4-l3": [
                { prompt: "Tarmoq paketlarini ushlab qolib, ularni chuqur tahlil qiluvchi dastur qaysi?", options: ["Nmap", "Wireshark", "Burp Suite", "Hashcat"], answers: ["Wireshark"], correctAnswer: "Wireshark", points: 20 },
                { prompt: "Veb-saytga yuborilayotgan so'rovlarni yo'lda ushlab (Intercept) tahrirlash uchun ishlatiladigan vosita nima?", options: ["Hydra", "Nmap", "Burp Suite", "John the Ripper"], answers: ["Burp Suite"], correctAnswer: "Burp Suite", points: 20 }
            ]
        };

        for (const [slug, questions] of Object.entries(lessonsData)) {
            const lesson = await Lesson.findOne({ slug });
            if (lesson) {
                await Question.deleteMany({ lessonId: lesson._id });
                const qData = questions.map(q => ({ ...q, lessonId: lesson._id }));
                await Question.create(qData);
            }
        }

        console.log('✅ Barcha qolgan modullardagi savollar xatosiz formatda (variantli) qayta yozildi!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Xatolik:', err);
        process.exit(1);
    }
}
fixRemaining();
