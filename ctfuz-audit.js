#!/usr/bin/env node
/**
 * CTF.UZ Security Audit  (faqat O'Z saytingizni tekshirish uchun)
 *
 * Ishlatish (loyiha papkasida, Node 18+):
 *   node ctfuz-audit.js                          -> statik + http://localhost:3000
 *   node ctfuz-audit.js --url http://localhost:3000
 *   node ctfuz-audit.js --static-only
 *   node ctfuz-audit.js --dynamic-only
 *   node ctfuz-audit.js --url https://ctf-uz.onrender.com --i-own-this
 *
 * Hech narsani o'zgartirmaydi va o'chirmaydi. Faqat o'qiydi va oddiy test so'rovlar yuboradi.
 * Natija: konsol + audit-report.json + audit-report.md
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ───────────── argumentlar ─────────────
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf('--' + n); return i > -1 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : d; };
const flag = (n) => args.includes('--' + n);
const ROOT = path.resolve(opt('dir', process.cwd()));
const URL_BASE = opt('url', 'http://localhost:3000').replace(/\/+$/, '');
const RUN_STATIC = !flag('dynamic-only');
const RUN_DYNAMIC = !flag('static-only');
const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?/i.test(URL_BASE);

if (RUN_DYNAMIC && !isLocal && !flag('i-own-this')) {
  console.error('Bu manzil localhost emas. Faqat o\'zingizga tegishli saytni tekshiring va --i-own-this bayrog\'ini qo\'shing.');
  process.exit(1);
}

// ───────────── hisobot ─────────────
const findings = [];
const SEV = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1, INFO: 0 };
const COLORS = { CRITICAL: '\x1b[1;41m', HIGH: '\x1b[1;31m', MEDIUM: '\x1b[1;33m', LOW: '\x1b[1;36m', INFO: '\x1b[1;90m' };
const R = '\x1b[0m';
function add(sev, id, title, where, detail, fix, ref) {
  findings.push({ sev, id, title, where, detail, fix, ref });
  console.log(`${COLORS[sev]} ${sev.padEnd(8)} ${R} ${title}${where ? '  \x1b[90m[' + where + ']' + R : ''}`);
}
const section = (t) => console.log('\n\x1b[1;34m══ ' + t + ' ══' + R);

// ───────────── fayl yordamchilari ─────────────
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'coverage', '.next']);
function walk(dir, out = []) {
  let items;
  try { items = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const it of items) {
    if (SKIP_DIRS.has(it.name)) continue;
    const p = path.join(dir, it.name);
    if (it.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}
const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');
const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } };
function lineOf(text, idx) { return text.slice(0, idx).split('\n').length; }
function mask(s) { return s.length > 10 ? s.slice(0, 4) + '…' + s.slice(-2) : '***'; }

// ═════════════════════════ 1. STATIK TAHLIL ═════════════════════════
function staticScan() {
  section('STATIK TAHLIL: ' + ROOT);
  if (!fs.existsSync(ROOT)) { console.log('Papka topilmadi'); return; }
  const files = walk(ROOT);
  const jsFiles = files.filter(f => /\.(js|mjs|cjs)$/.test(f) && !/\/public\/.*\.min\.js$/.test(rel(f)));
  const htmlFiles = files.filter(f => /\.html?$/.test(f));
  const serverSide = jsFiles.filter(f => !/^public\//.test(rel(f)));

  // ---- 1.1 maxfiy kalitlar ----
  const secretRules = [
    ['Telegram bot tokeni', /\b\d{8,10}:[A-Za-z0-9_-]{35}\b/g, 'CRITICAL'],
    ['Google OAuth Client Secret', /GOCSPX-[A-Za-z0-9_-]{20,}/g, 'CRITICAL'],
    ['GitHub token', /\bgh[pousr]_[A-Za-z0-9]{30,}\b/g, 'CRITICAL'],
    ['Private key', /-----BEGIN (RSA |EC |OPENSSH |)PRIVATE KEY-----/g, 'CRITICAL'],
    ['AWS Access Key', /\bAKIA[0-9A-Z]{16}\b/g, 'CRITICAL'],
    ['MongoDB URI (login:parol bilan)', /mongodb(\+srv)?:\/\/[^\s'"`:@/]+:[^\s'"`@]+@/g, 'CRITICAL'],
    ['Qotirilgan sessiya/JWT sirri', /(secret|SESSION_SECRET|JWT_SECRET)\s*[:=]\s*['"`](?!process)[^'"`]{3,}['"`]/gi, 'HIGH'],
    ['Qotirilgan parol', /(password|passwd|pwd)\s*[:=]\s*['"`][^'"`\s]{4,}['"`]/gi, 'MEDIUM'],
  ];
  for (const f of [...jsFiles, ...htmlFiles]) {
    const t = read(f);
    const rp = rel(f);
    for (const [name, re, sev] of secretRules) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(t))) {
        if (/test|example|placeholder|your_|changeme|xxx|bcrypt\.compare|req\.body|hashed|hash\b/i.test(t.slice(Math.max(0, m.index - 40), m.index + m[0].length + 20)) && sev === 'MEDIUM') continue;
        if (name === 'Qotirilgan parol' && /(req\.|body\.|data\.|input|value|\.password|=== |!== )/.test(m[0])) continue;
        add(sev, 'SECRET', name + ' kodga yozilgan: ' + mask(m[0]), rp + ':' + lineOf(t, m.index),
          'Kalit kod ichida turibdi; repozitoriyga tushsa hamma ko\'radi.', '.env ga ko\'chiring, kalitni almashtiring (revoke/rotate), git tarixidan o\'chiring.', 'CWE-798');
      }
    }
  }
  // client_id fallback'lar (oddiy, faqat INFO)
  // ---- 1.2 .env va git ----
  const gi = read(path.join(ROOT, '.gitignore'));
  if (!/(^|\n)\s*\.env(\*|\.\*)?\s*($|\n)/.test(gi)) {
    add('HIGH', 'GIT-ENV', '.env .gitignore da yo\'q', '.gitignore', '.env (tokenlar, parollar) git\'ga tushib ketishi mumkin.', '.gitignore ga ".env*" qo\'shing.', 'CWE-540');
  }
  if (!/node_modules/.test(gi)) add('LOW', 'GIT-NM', 'node_modules .gitignore da yo\'q', '.gitignore', '', 'node_modules/ qo\'shing.');
  for (const f of files) {
    if (/(^|\/)\.env(\..+)?$/.test(rel(f)) && !/\.example$|\.sample$/.test(f)) {
      if (/\.(bak|old|orig|backup|save|swp)|bak/.test(rel(f))) {
        add('HIGH', 'ENV-BAK', 'Zaxira .env fayli mavjud: ' + rel(f), rel(f), 'Ichida haqiqiy tokenlar bo\'ladi, tasodifan commit/deploy bo\'lib ketishi mumkin.', 'O\'chiring yoki papkadan tashqariga chiqaring.', 'CWE-538');
      }
    }
    if (/\.(bak|old|orig|swp|sql|dump|zip|tar|gz)$|\.bak-\d+$|~$/.test(rel(f)) && rel(f).startsWith('public/')) {
      add('HIGH', 'PUB-BAK', 'public/ ichida zaxira/dump fayl: ' + rel(f), rel(f), 'public/ hamma uchun ochiq.', 'public/ dan olib tashlang.', 'CWE-530');
    }
  }
  try {
    const tracked = execSync('git ls-files', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().split('\n');
    const bad = tracked.filter(x => /(^|\/)\.env(\..+)?$/.test(x) && !/example|sample/.test(x));
    for (const b of bad) add('CRITICAL', 'GIT-TRACKED', '.env git\'ga qo\'shilgan: ' + b, b, 'Tokenlar repozitoriya tarixida.', 'git rm --cached ' + b + '; barcha kalitlarni almashtiring.', 'CWE-312');
  } catch { /* git yo'q */ }

  // ---- 1.3 server kodi qoidalari ----
  const rules = [
    { id: 'EVAL', sev: 'CRITICAL', re: /\beval\s*\(|new Function\s*\(/g, t: 'eval / new Function ishlatilgan', fix: 'Olib tashlang.', ref: 'CWE-95', server: true },
    { id: 'CMD-INJ', sev: 'CRITICAL', re: /\b(exec|execSync|spawn|spawnSync)\s*\([^)]*(req\.|\$\{|\+\s*[a-zA-Z_])/g, t: 'Buyruq bajarishda foydalanuvchi kiritgan qiymat bo\'lishi mumkin', fix: 'execFile + argument massivi ishlating, kirishni oq ro\'yxatdan tekshiring.', ref: 'CWE-78', server: true },
    { id: 'NOSQL-WHERE', sev: 'HIGH', re: /\$where\s*:/g, t: 'MongoDB $where ishlatilgan', fix: '$where ni olib tashlang.', ref: 'CWE-943', server: true },
    { id: 'NOSQL-BODY', sev: 'HIGH', re: /\.(find|findOne|findOneAndUpdate|updateOne|updateMany|deleteOne|deleteMany|countDocuments)\s*\(\s*(req\.(body|query|params)\b|\{\s*[a-zA-Z_]+\s*:\s*req\.(body|query)\.[a-zA-Z_]+\s*\})/g, t: 'So\'rov ma\'lumoti to\'g\'ridan-to\'g\'ri Mongo so\'roviga berilgan (NoSQL injection)', fix: 'String(x) ga aylantiring yoki express-mongo-sanitize / Joi bilan tekshiring ({"$ne":null} hujumi).', ref: 'CWE-943', server: true },
    { id: 'MASS-ASSIGN', sev: 'HIGH', re: /(new\s+\w+\s*\(\s*req\.body\s*\)|\.create\s*\(\s*req\.body\s*\)|Object\.assign\s*\([^)]*req\.body|findByIdAndUpdate\s*\([^,]+,\s*(\{\s*\$set\s*:\s*)?req\.body)/g, t: 'Mass Assignment: req.body butunlay modelga berilgan (role: "admin" yuborib ko\'tarilish mumkin)', fix: 'Faqat ruxsat etilgan maydonlarni oq ro\'yxat bilan oling.', ref: 'CWE-915', server: true },
    { id: 'RES-REFLECT', sev: 'MEDIUM', re: /res\.(send|write)\s*\([^)]*req\.(query|params|body)/g, t: 'So\'rov ma\'lumoti javobga to\'g\'ridan-to\'g\'ri chiqarilgan (Reflected XSS)', fix: 'Chiqarishdan oldin escape qiling, res.json ishlating.', ref: 'CWE-79', server: true },
    { id: 'PATH-TRAV', sev: 'HIGH', re: /(sendFile|readFile|readFileSync|createReadStream|res\.download)\s*\([^)]*req\.(query|params|body)/g, t: 'Fayl yo\'li foydalanuvchi kiritgan qiymatdan olinadi (Path Traversal)', fix: 'path.basename + belgilangan papka ichida ekanini tekshiring.', ref: 'CWE-22', server: true },
    { id: 'OPEN-REDIR', sev: 'MEDIUM', re: /res\.redirect\s*\(\s*(req\.(query|body|params)|[^)]*\+\s*req\.(query|body))/g, t: 'Redirect manzili foydalanuvchidan olinadi (Open Redirect)', fix: 'Faqat "/" bilan boshlanadigan ichki yo\'llarga ruxsat bering.', ref: 'CWE-601', server: true },
    { id: 'SSRF', sev: 'HIGH', re: /(fetch|axios\.(get|post)|request|http\.get|https\.get)\s*\(\s*(req\.(query|body|params)|`[^`]*\$\{\s*req\.)/g, t: 'Tashqi so\'rov manzili foydalanuvchidan olinadi (SSRF)', fix: 'Domenlarni oq ro\'yxat bilan cheklang, ichki IP larni bloklang.', ref: 'CWE-918', server: true },
    { id: 'REDOS', sev: 'MEDIUM', re: /new RegExp\s*\(\s*(req\.|[a-zA-Z_.]*(query|search|q|term|keyword)\b)/g, t: 'Foydalanuvchi kiritgan matndan RegExp yaratilgan (ReDoS / regex injection)', fix: 'Matnni escape qiling: s.replace(/[.*+?^${}()|[\]\\]/g,"\\\\$&").', ref: 'CWE-1333', server: true },
    { id: 'WEAK-RAND', sev: 'MEDIUM', re: /Math\.random\s*\(\)/g, t: 'Math.random xavfsizlik uchun yaroqsiz (kod/token/flag uchun ishlatilsa)', fix: 'crypto.randomInt / crypto.randomBytes ishlating.', ref: 'CWE-338', server: true },
    { id: 'WEAK-HASH', sev: 'MEDIUM', re: /createHash\s*\(\s*['"](md5|sha1)['"]/gi, t: 'Zaif xesh (MD5/SHA1)', fix: 'Parol uchun bcrypt/argon2, boshqasi uchun SHA-256+.', ref: 'CWE-328', server: true },
    { id: 'CORS-ANY', sev: 'MEDIUM', re: /origin\s*:\s*(true|['"]\*['"])|Access-Control-Allow-Origin['"]\s*,\s*['"]\*/g, t: 'CORS hamma domenlarga ochiq', fix: 'Faqat o\'z domeningizni ruxsat etilgan ro\'yxatga qo\'ying.', ref: 'CWE-942', server: true },
    { id: 'TLS-OFF', sev: 'HIGH', re: /rejectUnauthorized\s*:\s*false|NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*['"]?0/g, t: 'TLS sertifikat tekshiruvi o\'chirilgan', fix: 'Yoqing.', ref: 'CWE-295', server: true },
    { id: 'JWT-NONE', sev: 'HIGH', re: /jwt\.decode\s*\(|algorithms\s*:\s*\[[^\]]*none/g, t: 'JWT imzosiz decode qilinmoqda (tekshirilmaydi)', fix: 'jwt.verify / jose.jwtVerify ishlating (Apple/Google tokenlari uchun ham).', ref: 'CWE-347', server: true },
    { id: 'LOG-SENS', sev: 'LOW', re: /console\.(log|info|error)\s*\([^)]*(password|token|secret|otp|code\b|phone|telefon|\+998)/gi, t: 'Maxfiy ma\'lumot logga yozilishi mumkin', fix: 'Telefon, kod, token va parollarni logga chiqarmang.', ref: 'CWE-532', server: true },
    { id: 'HTTP-FETCH', sev: 'LOW', re: /['"`]http:\/\/(?!localhost|127\.0\.0\.1)[a-z0-9.-]+/gi, t: 'Shifrlanmagan HTTP manzili', fix: 'HTTPS ishlating.', ref: 'CWE-319', server: false },
    { id: 'DOM-XSS', sev: 'MEDIUM', re: /\.(innerHTML|outerHTML)\s*=[^=]|document\.write\s*\(|insertAdjacentHTML\s*\(/g, t: 'innerHTML / document.write: ma\'lumot escape qilinmasa DOM XSS', fix: 'textContent ishlating yoki DOMPurify bilan tozalang.', ref: 'CWE-79', server: false, clientOnly: true },
    { id: 'STORAGE-TOKEN', sev: 'MEDIUM', re: /localStorage\.setItem\s*\(\s*['"][^'"]*(token|jwt|session|secret)[^'"]*['"]/gi, t: 'Token localStorage da saqlanmoqda (XSS bilan o\'g\'irlanadi)', fix: 'httpOnly cookie ishlating.', ref: 'CWE-922', server: false, clientOnly: true },
    { id: 'POSTMSG', sev: 'MEDIUM', re: /addEventListener\s*\(\s*['"]message['"]/g, t: 'postMessage tinglovchisi: origin tekshirilishi kerak', fix: 'event.origin ni tekshiring.', ref: 'CWE-346', server: false, clientOnly: true },
  ];
  const scanTargets = [...jsFiles, ...htmlFiles];
  for (const f of scanTargets) {
    const rp = rel(f);
    const t = read(f);
    const isClient = /^public\//.test(rp) || /\.html?$/.test(rp);
    for (const r of rules) {
      if (r.clientOnly && !isClient) continue;
      if (r.server && isClient) continue;
      r.re.lastIndex = 0;
      let m, count = 0;
      while ((m = r.re.exec(t)) && count < 5) {
        count++;
        add(r.sev, r.id, r.t, rp + ':' + lineOf(t, m.index), '`' + m[0].replace(/\s+/g, ' ').slice(0, 90) + '`', r.fix, r.ref);
      }
    }
    // SRI: tashqi skriptlar
    if (/\.html?$/.test(rp)) {
      const re = /<script[^>]+src=["'](https?:\/\/[^"']+)["'][^>]*>/gi;
      let m;
      while ((m = re.exec(t))) {
        if (!/integrity=/i.test(m[0])) add('LOW', 'NO-SRI', 'Tashqi skriptda integrity (SRI) yo\'q: ' + m[1].slice(0, 60), rp + ':' + lineOf(t, m.index), 'CDN buzilsa, saytingizga zararli kod kiradi.', 'integrity va crossorigin="anonymous" qo\'shing.', 'CWE-829');
      }
      const re2 = /<a[^>]+target=["']_blank["'][^>]*>/gi;
      while ((m = re2.exec(t))) {
        if (!/noopener|noreferrer/i.test(m[0])) { add('LOW', 'NOOPENER', 'target=_blank da rel="noopener" yo\'q', rp + ':' + lineOf(t, m.index), '', 'rel="noopener noreferrer" qo\'shing.', 'CWE-1022'); break; }
      }
      const inlineHandlers = (t.match(/\son(click|load|error|mouseover)\s*=/gi) || []).length;
      if (inlineHandlers > 0) add('INFO', 'INLINE-JS', `Inline JS handlerlar: ${inlineHandlers} ta (qat'iy CSP o'rnatishga to'sqinlik qiladi)`, rp, '', 'addEventListener ga o\'tkazing.', '');
      // takroriy id
      const ids = {}; const idRe = /\sid=["']([^"']+)["']/g; let im;
      while ((im = idRe.exec(t))) ids[im[1]] = (ids[im[1]] || 0) + 1;
      const dups = Object.entries(ids).filter(([, c]) => c > 1).map(([k, c]) => k + '×' + c);
      if (dups.length) add('LOW', 'DUP-ID', 'Takroriy HTML id lar: ' + dups.slice(0, 5).join(', '), rp, 'DOM xatolari va PDF/skript muammolari.', 'Har bir id yagona bo\'lsin.', '');
      if (/<\/html>\s*[\s\S]*<(script|div|section)/i.test(t.split(/<\/html>/i).slice(1).join(''))) {
        add('LOW', 'AFTER-HTML', '</html> dan keyin kod bor', rp, '', 'Ortiqcha qismni o\'chiring.', '');
      }
    }
  }

  // ---- 1.4 server.js / app konfiguratsiyasi ----
  const serverFile = ['server.js', 'app.js', 'index.js'].map(n => path.join(ROOT, n)).find(fs.existsSync);
  const all = serverSide.map(read).join('\n');
  const sv = serverFile ? read(serverFile) : '';
  if (serverFile) {
    if (!/helmet/.test(all)) add('MEDIUM', 'NO-HELMET', 'helmet (HTTP xavfsizlik sarlavhalari) ishlatilmagan', rel(serverFile), 'CSP, X-Frame-Options, HSTS, nosniff yo\'q bo\'ladi.', 'npm i helmet; app.use(helmet());', 'CWE-693');
    if (!/express-rate-limit|rateLimit/.test(all)) add('HIGH', 'NO-RATELIMIT', 'Rate limit umuman yo\'q', rel(serverFile), '', 'express-rate-limit ni login, register, kod tasdiqlash yo\'llariga qo\'ying.', 'CWE-307');
    if (!/csrf|csurf|csrf-csrf|X-CSRF|x-csrf/i.test(all)) add('HIGH', 'NO-CSRF', 'CSRF himoyasi topilmadi', rel(serverFile), 'sameSite cookie yagona himoya bo\'lib qoladi.', 'CSRF token yoki sameSite=strict + Origin tekshiruvi.', 'CWE-352');
    if (!/mongo-sanitize|mongoSanitize|express-validator|joi|zod|yup/i.test(all)) add('MEDIUM', 'NO-VALIDATION', 'Kirish ma\'lumotlarini tekshiruvchi kutubxona yo\'q (Joi/zod/express-validator/mongo-sanitize)', rel(serverFile), '', 'Har bir endpoint uchun sxema tekshiruvi qo\'shing.', 'CWE-20');
    if (/app\.use\(\s*express\.static\(\s*(__dirname|['"]\.['"]|path\.join\(__dirname\s*\)|process\.cwd\(\))\s*\)/.test(sv)) add('CRITICAL', 'STATIC-ROOT', 'express.static butun loyiha papkasini ochib qo\'yadi (.env, server.js ko\'rinadi)', rel(serverFile), '', 'Faqat public/ papkasini bering.', 'CWE-538');
    if (/x-powered-by/i.test(sv) === false && !/helmet/.test(all)) add('LOW', 'POWERED-BY', 'X-Powered-By o\'chirilmagan', rel(serverFile), 'Express ekanligi ma\'lum bo\'ladi.', 'app.disable("x-powered-by")', 'CWE-200');
    if (!/trust proxy/.test(sv) && /onrender|render\.com|process\.env\.PORT/.test(all + sv)) add('LOW', 'TRUST-PROXY', 'Proxy ortida (Render) "trust proxy" yo\'q: rate limit va secure cookie noto\'g\'ri ishlashi mumkin', rel(serverFile), '', 'app.set("trust proxy", 1)', '');
    if (!/express\.json\(\s*\{[^}]*limit/.test(sv)) add('LOW', 'BODY-LIMIT', 'express.json uchun hajm chegarasi aniq berilmagan', rel(serverFile), '', 'express.json({ limit: "10kb" })', 'CWE-770');
  }
  const sess = all.match(/session\s*\(\s*\{[\s\S]*?\}\s*\)/);
  if (sess) {
    const s = sess[0];
    if (!/secure\s*:/.test(s)) add('MEDIUM', 'COOKIE-SECURE', 'Session cookie da secure bayrog\'i aniq berilmagan', 'session()', '', 'cookie: { secure: process.env.NODE_ENV === "production" }', 'CWE-614');
    if (/httpOnly\s*:\s*false/.test(s) || !/httpOnly/.test(s)) add('LOW', 'COOKIE-HTTPONLY', 'httpOnly aniq berilmagan (standart true, lekin aniq yozing)', 'session()', '', 'httpOnly: true', 'CWE-1004');
    if (!/sameSite/.test(s)) add('MEDIUM', 'COOKIE-SAMESITE', 'sameSite berilmagan', 'session()', 'CSRF xavfi.', 'sameSite: "lax"', 'CWE-1275');
    if (/secret\s*:\s*process\.env\.\w+\s*\|\|\s*['"`]/.test(s)) add('HIGH', 'SESSION-FALLBACK', 'Session secret uchun qotirilgan zaxira qiymat bor (env bo\'lmasa taxmin qilinadigan kalit)', 'session()', '', '|| "..." ni olib tashlang; env bo\'lmasa serverni to\'xtating.', 'CWE-1188');
    if (!/store\s*:|MongoStore|connect-mongo|connect-redis/.test(s)) add('LOW', 'MEMORY-STORE', 'Session store ko\'rsatilmagan (MemoryStore: production uchun yaroqsiz, xotira sizadi)', 'session()', '', 'connect-mongo ishlating.', 'CWE-770');
  }
  // ---- 1.5 auth mantiqi ----
  const authFile = path.join(ROOT, 'routes', 'auth.js');
  const userFile = path.join(ROOT, 'models', 'User.js');
  if (fs.existsSync(authFile)) {
    const a = read(authFile);
    const u = read(userFile);
    if (/bcrypt\.hash/.test(a) && /pre\(\s*['"]save['"]/.test(u) && /bcrypt\.hash/.test(u)) {
      add('HIGH', 'DOUBLE-HASH', 'Parol ikki marta xeshlanishi mumkin (auth.js va User.js pre-save)', 'routes/auth.js + models/User.js', 'Foydalanuvchi keyin kira olmaydi.', 'Xeshlashni faqat bitta joyda qoldiring yoki $2 prefiksini tekshiring.', 'CWE-327');
    }
    if (/\.select\(\s*['"]-password['"]\s*\)/.test(a)) add('CRITICAL', 'ME-LEAK', '/me endpointi faqat parolni yashiradi; twoFactorSecret, backupCodes kabilar ochiq chiqadi', 'routes/auth.js', '', 'Oq ro\'yxat: .select("username email avatar role ...")', 'CWE-200');
    if (/admin-login/.test(a) && !/pending2FA|twoFactor|verifyToken/.test(a.slice(a.indexOf('admin-login'), a.indexOf('admin-login') + 1800))) add('CRITICAL', 'ADMIN-2FA', '/admin-login da 2FA tekshiruvi ko\'rinmayapti', 'routes/auth.js', 'Admin paroli bilinsa 2FA aylanib o\'tiladi.', 'Adminga 2FA ni majburiy qiling.', 'CWE-306');
    if (!/session\.regenerate/.test(a)) add('HIGH', 'SESSION-FIX', 'session.regenerate() umuman yo\'q (Session Fixation)', 'routes/auth.js', '', 'Har bir muvaffaqiyatli kirishdan keyin regenerate qiling.', 'CWE-384');
    for (const m of a.matchAll(/router\.(post|get)\(\s*['"]\/(verify-login-2fa|verify|login|register|forgot-password|reset-password|enable-2fa[^'"]*)['"]\s*,\s*(async\s*)?\(/g)) {
      add('MEDIUM', 'NO-LIMITER', `/${m[2]} yo'lida rate limiter ko'rinmayapti`, 'routes/auth.js:' + lineOf(a, m.index), 'Brute-force mumkin.', 'Yo\'lga limiter middleware qo\'shing.', 'CWE-307');
    }
    if (/Math\.random/.test(a)) add('HIGH', 'WEAK-OTP', 'Tasdiqlash kodi Math.random bilan yaratilgan bo\'lishi mumkin', 'routes/auth.js', 'Bashorat qilinadi.', 'crypto.randomInt(100000, 1000000)', 'CWE-338');
    if (/verificationCodes\s*=\s*\{\}|verificationCodes\s*=\s*new Map/.test(a) && !/setInterval|expires|TTL|delete verificationCodes/.test(a)) add('MEDIUM', 'MEM-DOS', 'verificationCodes tozalanmaydi (xotira to\'lishi)', 'routes/auth.js', '', 'TTL va hajm chegarasi qo\'ying.', 'CWE-770');
    if (/forgot-password/.test(a) && /adminBot|sendTelegram|ADMIN_CHAT/i.test(a.slice(a.indexOf('forgot-password'), a.indexOf('forgot-password') + 2500))) add('HIGH', 'RESET-TO-ADMIN', 'Parol tiklash havolasi/kodi foydalanuvchiga emas, admin Telegramiga ketayotgan ko\'rinadi', 'routes/auth.js', 'Admin istalgan akkauntni egallay oladi.', 'Havolani foydalanuvchining tasdiqlangan emailiga yuboring.', 'CWE-640');
    if (/account.*not found|foydalanuvchi topilmadi|email topilmadi/i.test(a)) add('LOW', 'USER-ENUM', 'Xato xabarlari foydalanuvchi mavjudligini oshkor qilishi mumkin (user enumeration)', 'routes/auth.js', '', 'Har doim bir xil xabar qaytaring.', 'CWE-204');
  }
  // ---- 1.6 admin/himoyalanmagan marshrutlar ----
  for (const f of serverSide.filter(x => /routes\//.test(rel(x)) || /server\.js$/.test(rel(x)))) {
    const t = read(f);
    for (const m of t.matchAll(/(router|app)\.(get|post|put|patch|delete)\(\s*['"`]([^'"`]*(admin|delete|ban|users|flag|score|role|upload)[^'"`]*)['"`]\s*,\s*(async\s*)?\(/gi)) {
      add('HIGH', 'NO-AUTH-MW', `${m[2].toUpperCase()} ${m[3]}: oldida auth/role middleware ko'rinmayapti`, rel(f) + ':' + lineOf(t, m.index), 'Handler to\'g\'ridan-to\'g\'ri, middleware yo\'q. Ichida tekshiruv bo\'lsa e\'tiborsiz qoldiring.', 'requireAuth / requireAdmin middleware qo\'shing (BOLA/BFLA).', 'CWE-862');
    }
    for (const m of t.matchAll(/findById\s*\(\s*req\.(params|body|query)\.\w+\s*\)/g)) {
      const ctx = t.slice(m.index, m.index + 400);
      if (!/session\.user|req\.user|owner|userId/.test(ctx)) add('MEDIUM', 'BOLA', 'ID bo\'yicha ob\'ekt olinmoqda, egalik tekshiruvi ko\'rinmayapti (BOLA/IDOR)', rel(f) + ':' + lineOf(t, m.index), '', 'Ob\'ekt egasi = joriy foydalanuvchi ekanini tekshiring.', 'CWE-639');
    }
  }
  // ---- 1.7 package.json ----
  const pkgPath = path.join(ROOT, 'package.json');
  if (fs.existsSync(pkgPath)) {
    let pkg = {};
    try { pkg = JSON.parse(read(pkgPath)); } catch { }
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    const unpinned = Object.entries(deps).filter(([, v]) => /^(\*|latest|>=)/.test(v));
    for (const [k, v] of unpinned) add('LOW', 'DEP-PIN', `Bog'liqlik versiyasi aniqlanmagan: ${k}@${v}`, 'package.json', '', 'Aniq versiya ishlating.', 'CWE-1104');
    const oldNames = { 'request': 'to\'xtatilgan', 'node-uuid': 'eskirgan', 'csurf': 'to\'xtatilgan (deprecated)', 'express-validator': null };
    for (const [k, why] of Object.entries(oldNames)) if (why && deps[k]) add('LOW', 'DEP-OLD', `${k} ${why}`, 'package.json', '', 'Zamonaviy muqobilga o\'ting.', '');
    // npm audit
    try {
      if (fs.existsSync(path.join(ROOT, 'node_modules'))) {
        let out;
        try { out = execSync('npm audit --json', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'], timeout: 60000 }).toString(); }
        catch (e) { out = e.stdout ? e.stdout.toString() : ''; }
        const j = JSON.parse(out || '{}');
        const v = (j.metadata && j.metadata.vulnerabilities) || {};
        const tot = (v.critical || 0) + (v.high || 0) + (v.moderate || 0) + (v.low || 0);
        if (tot) {
          if (v.critical) add('CRITICAL', 'NPM-AUDIT', `npm audit: ${v.critical} ta kritik zaif paket`, 'package.json', JSON.stringify(v), 'npm audit fix', 'CWE-1395');
          if (v.high) add('HIGH', 'NPM-AUDIT', `npm audit: ${v.high} ta yuqori darajali zaif paket`, 'package.json', JSON.stringify(v), 'npm audit fix', 'CWE-1395');
          if (v.moderate) add('MEDIUM', 'NPM-AUDIT', `npm audit: ${v.moderate} ta o'rta darajali zaif paket`, 'package.json', '', 'npm audit fix', 'CWE-1395');
        } else add('INFO', 'NPM-OK', 'npm audit: zaif paket topilmadi', 'package.json', '', '', '');
      }
    } catch { /* tarmoq yo'q */ }
  }
}

// ═════════════════════════ 2. DINAMIK TEKSHIRUV ═════════════════════════
async function req(method, p, { headers = {}, body, redirect = 'manual' } = {}) {
  const ctl = new AbortController();
  const to = setTimeout(() => ctl.abort(), 15000);
  try {
    const res = await fetch(URL_BASE + p, { method, headers, body, redirect, signal: ctl.signal });
    const text = await res.text().catch(() => '');
    const setCookies = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : (res.headers.get('set-cookie') ? [res.headers.get('set-cookie')] : []);
    return { status: res.status, headers: res.headers, text, setCookies };
  } catch (e) { return { status: 0, error: e.message, headers: new Headers(), text: '', setCookies: [] }; }
  finally { clearTimeout(to); }
}

async function dynamicScan() {
  section('DINAMIK TEKSHIRUV: ' + URL_BASE);
  const home = await req('GET', '/');
  if (!home.status) { console.log('  Server javob bermadi: ' + home.error + '\n  Avval `npm start` bilan serverni ishga tushiring.'); add('INFO', 'NO-SERVER', 'Dinamik tekshiruv o\'tkazilmadi: server javob bermadi', URL_BASE, home.error || '', 'Serverni ishga tushirib qayta urinib ko\'ring.', ''); return; }
  const H = (r, n) => r.headers.get(n);
  const https = URL_BASE.startsWith('https');

  // ---- sarlavhalar ----
  const hdrRules = [
    ['content-security-policy', 'MEDIUM', 'Content-Security-Policy yo\'q (XSS ga qarshi asosiy qatlam)', 'CWE-693'],
    ['x-content-type-options', 'LOW', 'X-Content-Type-Options: nosniff yo\'q', 'CWE-693'],
    ['referrer-policy', 'LOW', 'Referrer-Policy yo\'q', 'CWE-200'],
    ['permissions-policy', 'INFO', 'Permissions-Policy yo\'q', ''],
  ];
  for (const [h, sev, t, ref] of hdrRules) if (!H(home, h)) add(sev, 'HDR-' + h, t, '/', '', 'helmet() yoki qo\'lda sarlavha qo\'shing.', ref);
  if (!H(home, 'x-frame-options') && !/frame-ancestors/.test(H(home, 'content-security-policy') || '')) add('MEDIUM', 'CLICKJACK', 'Clickjacking himoyasi yo\'q (X-Frame-Options / frame-ancestors)', '/', 'Sayt iframe ichiga joylanishi mumkin.', 'X-Frame-Options: DENY', 'CWE-1021');
  if (https && !H(home, 'strict-transport-security')) add('MEDIUM', 'HSTS', 'Strict-Transport-Security yo\'q', '/', '', 'helmet({ hsts: ... })', 'CWE-319');
  if (H(home, 'x-powered-by')) add('LOW', 'X-POWERED', 'X-Powered-By: ' + H(home, 'x-powered-by') + ' (texnologiya oshkor)', '/', '', 'app.disable("x-powered-by")', 'CWE-200');
  if (H(home, 'server') && /\d/.test(H(home, 'server'))) add('LOW', 'SERVER-VER', 'Server sarlavhasida versiya: ' + H(home, 'server'), '/', '', 'Yashiring.', 'CWE-200');
  const cc = (H(home, 'access-control-allow-origin') || '');
  if (cc === '*') add('MEDIUM', 'CORS-STAR', 'Access-Control-Allow-Origin: *', '/', '', 'Faqat o\'z domeningizga ruxsat bering.', 'CWE-942');

  // CORS aks sado
  const evil = 'https://evil.example';
  const cors = await req('GET', '/api/auth/me', { headers: { Origin: evil } });
  if (H(cors, 'access-control-allow-origin') === evil) {
    add(H(cors, 'access-control-allow-credentials') === 'true' ? 'HIGH' : 'MEDIUM', 'CORS-REFLECT', 'CORS har qanday Origin ni qaytaradi' + (H(cors, 'access-control-allow-credentials') === 'true' ? ' va credentials ruxsat etilgan' : ''), '/api/auth/me', 'Boshqa sayt foydalanuvchi nomidan API ga murojaat qila oladi.', 'Origin oq ro\'yxati.', 'CWE-942');
  }

  // ---- cookie ----
  const loginPage = await req('GET', '/login');
  const probeLogin = await req('POST', '/api/auth/login', { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'audit_nouser', password: 'x' }) });
  const cookies = [...home.setCookies, ...loginPage.setCookies, ...probeLogin.setCookies];
  for (const c of new Set(cookies)) {
    const name = c.split('=')[0];
    if (!/httponly/i.test(c)) add('MEDIUM', 'COOKIE-HTTPONLY', `Cookie "${name}" da HttpOnly yo'q`, '/', c.slice(0, 80), 'httpOnly: true', 'CWE-1004');
    if (https && !/;\s*secure/i.test(c)) add('MEDIUM', 'COOKIE-SECURE', `Cookie "${name}" da Secure yo'q`, '/', '', 'secure: true (+ trust proxy)', 'CWE-614');
    if (!/samesite/i.test(c)) add('MEDIUM', 'COOKIE-SAMESITE', `Cookie "${name}" da SameSite yo'q`, '/', '', 'sameSite: "lax"', 'CWE-1275');
    if (/samesite=none/i.test(c) && !/secure/i.test(c)) add('MEDIUM', 'COOKIE-NONE', `Cookie "${name}": SameSite=None, lekin Secure yo'q`, '/', '', '', '');
  }
  if (!cookies.length) add('INFO', 'NO-COOKIE', 'Tekshiruv paytida cookie kuzatilmadi', '/', '', '', '');

  // ---- ochiq nozik fayllar ----
  const sensitive = ['/.env', '/.env.bak', '/.env.local', '/.git/config', '/.git/HEAD', '/package.json', '/package-lock.json', '/server.js', '/app.js', '/routes/auth.js', '/models/User.js', '/utils/telegram.js', '/utils/twoFactor.js', '/node_modules/', '/.DS_Store', '/backup.zip', '/backup.sql', '/dump.sql', '/db.json', '/config.js', '/.htaccess', '/npm-debug.log', '/.gitignore', '/Dockerfile', '/render.yaml', '/admin/', '/robots.txt', '/sitemap.xml', '/api/docs', '/swagger.json', '/api-docs', '/.well-known/security.txt'];
  const notFoundSample = await req('GET', '/__audit_404_' + Date.now());
  for (const p of sensitive) {
    const r = await req('GET', p);
    if (r.status !== 200 || !r.text) continue;
    if (r.text === home.text || (notFoundSample.status === 200 && r.text === notFoundSample.text)) continue; // SPA fallback
    if (/^\/(robots\.txt|sitemap\.xml|\.well-known\/security\.txt)$/.test(p)) { if (p.includes('robots') && /Disallow:\s*\/(admin|api)/i.test(r.text)) add('INFO', 'ROBOTS', 'robots.txt maxfiy yo\'llarni oshkor qilyapti', p, r.text.slice(0, 100), '', ''); continue; }
    if (p === '/admin/') { add('INFO', 'ADMIN-PAGE', 'Admin sahifasi autentifikatsiyasiz 200 qaytardi (ichida login bo\'lsa normal)', p, '', 'Admin yo\'lini IP/2FA bilan cheklang.', ''); continue; }
    const crit = /\.env|\.git|server\.js|app\.js|routes\/|models\/|utils\/|\.sql|backup|dump|config\.js|db\.json/.test(p);
    add(crit ? 'CRITICAL' : 'MEDIUM', 'EXPOSED-FILE', 'Ochiq fayl: ' + p, p, `HTTP 200, ${r.text.length} bayt`, 'express.static faqat public/ ga yo\'naltirilsin, bu fayllarni o\'chiring/yashiring.', 'CWE-538');
  }
  // yo'l o'tish
  for (const p of ['/..%2f..%2fpackage.json', '/%2e%2e/%2e%2e/package.json', '/public/../package.json', '/..%5c..%5cpackage.json']) {
    const r = await req('GET', p);
    if (r.status === 200 && /"dependencies"|"scripts"/.test(r.text)) add('CRITICAL', 'PATH-TRAVERSAL', 'Path Traversal: ' + p, p, 'package.json o\'qildi.', 'Statik fayllarni cheklang, Express/Node ni yangilang.', 'CWE-22');
  }

  // ---- server tomonidagi sahifa himoyasi (autentifikatsiyasiz) ----
  const guarded = ['/learn', '/learn.html', '/career', '/career.html', '/dashboard', '/dashboard.html', '/profile', '/profile.html', '/arena', '/battle', '/rating'];
  for (const p of guarded) {
    const r = await req('GET', p);
    if (r.status === 200 && r.text.length > 500 && r.text !== home.text) {
      const guard = /\/welcome|\/login|location\.(href|replace)/i.test(r.text);
      add('HIGH', 'PAGE-UNPROTECTED', `${p} login qilmasdan 200 bilan to'liq HTML beradi` + (guard ? ' (faqat JS yo\'naltirishi bor)' : ''), p, 'Himoya faqat brauzerda; curl yoki JS o\'chirilsa o\'tib ketadi.', 'express.static dan oldin server tomonida req.session.user tekshiruvi.', 'CWE-602');
    }
  }
  // ---- API: autentifikatsiyasiz ma'lumot ----
  const apis = ['/api/auth/me', '/api/me', '/api/users', '/api/user', '/api/admin', '/api/admin/users', '/api/admin/stats', '/api/leaderboard', '/api/stats', '/api/challenges', '/api/events', '/api/certificates', '/api/users/1'];
  for (const p of apis) {
    const r = await req('GET', p, { headers: { Accept: 'application/json' } });
    if (r.status === 200 && /^\s*[\[{]/.test(r.text)) {
      const sens = /(password|twoFactorSecret|backupCodes|secret|token|email|phone|lastLoginIP|role)/i.test(r.text);
      const adm = /admin/.test(p);
      if (adm || sens) add(adm ? 'CRITICAL' : 'HIGH', 'API-OPEN', `${p} autentifikatsiyasiz ma'lumot qaytaradi` + (sens ? ' (nozik maydonlar bor)' : ''), p, r.text.slice(0, 120).replace(/\s+/g, ' '), 'Auth/role middleware va maydonlarni oq ro\'yxat bilan cheklang.', 'CWE-306');
      else add('INFO', 'API-PUBLIC', `${p} ochiq (nozik maydon aniqlanmadi, ommaviy bo'lsa normal)`, p, '', '', '');
    }
  }

  // ---- xato xabarlari (stack trace) ----
  const bad = await req('POST', '/api/auth/login', { headers: { 'Content-Type': 'application/json' }, body: '{"broken":' });
  if (/at\s+\S+\s+\(.*:\d+:\d+\)|node_modules|SyntaxError|stack/i.test(bad.text)) add('MEDIUM', 'STACKTRACE', 'Noto\'g\'ri JSON da stack trace / ichki xato chiqyapti', '/api/auth/login', bad.text.slice(0, 120).replace(/\s+/g, ' '), 'Production da umumiy xato xabari qaytaring, NODE_ENV=production.', 'CWE-209');
  const e404 = await req('GET', '/api/__nope__/' + Date.now());
  if (/at\s+\S+\s+\(.*:\d+:\d+\)/.test(e404.text)) add('MEDIUM', 'STACKTRACE404', '404 da stack trace', '/api', '', '', 'CWE-209');

  // ---- HTTP metodlari ----
  const trace = await req('TRACE', '/');
  if (trace.status === 200) add('LOW', 'TRACE', 'HTTP TRACE yoqilgan', '/', '', 'O\'chiring.', 'CWE-16');

  // ---- reflected XSS belgisi ----
  const mark = 'ctfuzXSS' + Date.now();
  for (const p of ['/login?error=', '/search?q=', '/?q=', '/welcome?msg=']) {
    const r = await req('GET', p + encodeURIComponent('"><svg onload=' + mark + '>'));
    if (r.text.includes('<svg onload=' + mark)) add('HIGH', 'REFLECTED-XSS', 'Reflected XSS: parametr escape qilinmay javobda ko\'rinyapti', p, '', 'Chiqarishdan oldin HTML escape qiling, CSP qo\'ying.', 'CWE-79');
  }
  // ---- open redirect ----
  for (const p of ['/login?next=', '/login?redirect=', '/login?returnTo=', '/?url=']) {
    const r = await req('GET', p + encodeURIComponent('https://evil.example'));
    if ([301, 302, 303, 307, 308].includes(r.status) && /evil\.example/.test(H(r, 'location') || '')) add('MEDIUM', 'OPEN-REDIRECT', 'Open Redirect', p, 'Location: ' + H(r, 'location'), 'Faqat ichki yo\'llarga ruxsat bering.', 'CWE-601');
  }

  // ---- NoSQL injection (kirish) ----
  const nosql = await req('POST', '/api/auth/login', { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: { $ne: null }, email: { $ne: null }, password: { $ne: null } }) });
  if (nosql.status === 200 && /"success"\s*:\s*true/.test(nosql.text)) add('CRITICAL', 'NOSQL-LOGIN', 'NoSQL injection: {"$ne":null} bilan kirish muvaffaqiyatli bo\'ldi', '/api/auth/login', '', 'Kirishlarni String() ga o\'tkazing, express-mongo-sanitize qo\'shing.', 'CWE-943');
  else if (/Cast to|CastError|\$ne|MongoServerError|ObjectParameterError/i.test(nosql.text)) add('MEDIUM', 'NOSQL-ERR', 'Operator obyektlari tekshirilmaydi (Mongo xatosi chiqdi)', '/api/auth/login', nosql.text.slice(0, 100), 'Kirish turini tekshiring.', 'CWE-943');
  // ---- brute-force: login rate limit ----
  let limited = false;
  for (let i = 0; i < 25; i++) {
    const r = await req('POST', '/api/auth/login', { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'audit_user_' + (i % 2), password: 'wrong' + i }) });
    if (r.status === 429) { limited = true; break; }
  }
  if (!limited) add('HIGH', 'LOGIN-BRUTE', '25 ta ketma-ket noto\'g\'ri login urinishiga 429 (limit) qaytmadi', '/api/auth/login', 'Parol taxmin qilish hujumi mumkin.', 'express-rate-limit (IP + username bo\'yicha) va vaqtinchalik blok.', 'CWE-307');
  else add('INFO', 'LOGIN-LIMIT-OK', 'Login uchun rate limit ishlayapti', '/api/auth/login', '', '', '');
  // 2FA / kod tasdiqlash limiti
  for (const p of ['/api/auth/verify', '/api/auth/verify-login-2fa']) {
    let lim = false, seen = false;
    for (let i = 0; i < 20; i++) {
      const r = await req('POST', p, { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'audit@example.com', code: String(100000 + i) }) });
      if (r.status === 404 || r.status === 0) break;
      seen = true;
      if (r.status === 429) { lim = true; break; }
    }
    if (seen && !lim) add('HIGH', 'OTP-BRUTE', p + ' da 20 ta xato kodga limit qo\'llanmadi (6 xonali kod terib topiladi)', p, '', 'Urinishlar sonini cheklang (5 ta), keyin kodni bekor qiling.', 'CWE-307');
  }
  // ---- user enumeration ----
  const ex1 = await req('POST', '/api/auth/login', { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'admin', password: 'zzz_wrong_1' }) });
  const ex2 = await req('POST', '/api/auth/login', { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'nouser_' + Date.now(), password: 'zzz_wrong_1' }) });
  if (ex1.status && ex1.text !== ex2.text && ex1.status !== 429 && ex2.status !== 429) add('LOW', 'USER-ENUM', 'Login javobi mavjud va mavjud bo\'lmagan foydalanuvchida farq qiladi (user enumeration)', '/api/auth/login', `"admin": ${ex1.text.slice(0, 60)}  |  yo'q: ${ex2.text.slice(0, 60)}`, 'Bir xil xabar va bir xil javob vaqti.', 'CWE-204');

  // ---- HTTPS yo'naltirish ----
  if (https) {
    const r = await req('GET', '/').catch(() => null);
    const h = await fetch(URL_BASE.replace('https://', 'http://'), { redirect: 'manual' }).catch(() => null);
    if (h && h.status === 200) add('MEDIUM', 'NO-HTTPS-REDIR', 'HTTP manzil HTTPS ga yo\'naltirilmaydi', URL_BASE.replace('https://', 'http://'), '', 'HTTP → HTTPS redirect.', 'CWE-319');
  }
  // ---- CSRF: Origin tekshirilmasligi ----
  const csrf = await req('POST', '/api/auth/logout', { headers: { Origin: evil, 'Content-Type': 'application/json' }, body: '{}' });
  if (csrf.status === 200 && !home.setCookies.length && false) add('INFO', 'CSRF', '', '', '', '', '');
}

// ═════════════════════════ 3. HISOBOT ═════════════════════════
function report() {
  // dublikatlarni birlashtirish
  const seen = new Set(); const uniq = [];
  for (const f of findings) { const k = f.id + '|' + f.where + '|' + f.title; if (!seen.has(k)) { seen.add(k); uniq.push(f); } }
  uniq.sort((a, b) => SEV[b.sev] - SEV[a.sev]);
  const count = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 };
  uniq.forEach(f => count[f.sev]++);

  console.log('\n\x1b[1m══════════════ XULOSA ══════════════' + R);
  for (const s of Object.keys(count)) console.log(`${COLORS[s]} ${s.padEnd(8)} ${R} ${count[s]}`);
  const score = Math.max(0, 100 - count.CRITICAL * 20 - count.HIGH * 7 - count.MEDIUM * 2 - count.LOW * 0.5);
  console.log(`\nXavfsizlik bahosi: \x1b[1m${Math.round(score)}/100${R}`);

  fs.writeFileSync('audit-report.json', JSON.stringify({ date: new Date().toISOString(), target: URL_BASE, dir: ROOT, counts: count, score: Math.round(score), findings: uniq }, null, 2));
  let md = `# CTF.UZ Xavfsizlik Audit Hisoboti\n\nSana: ${new Date().toISOString()}  \nManzil: ${URL_BASE}  \nBaho: **${Math.round(score)}/100**\n\n| Daraja | Soni |\n|---|---|\n` + Object.entries(count).map(([k, v]) => `| ${k} | ${v} |`).join('\n') + '\n\n';
  for (const s of ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']) {
    const list = uniq.filter(f => f.sev === s); if (!list.length) continue;
    md += `## ${s}\n\n`;
    list.forEach((f, i) => {
      md += `### ${i + 1}. ${f.title}\n- **Joyi:** \`${f.where || '-'}\`\n- **Kod:** ${f.id}${f.ref ? ' / ' + f.ref : ''}\n` + (f.detail ? `- **Dalil:** ${f.detail}\n` : '') + (f.fix ? `- **Tuzatish:** ${f.fix}\n` : '') + '\n';
    });
  }
  fs.writeFileSync('audit-report.md', md);
  console.log('\nHisobotlar: audit-report.md va audit-report.json');
  console.log('Eslatma: statik qoidalar "taxmin" beradi (soxta ijobiy bo\'lishi mumkin). Har birini kodda tekshiring.');
  process.exit(count.CRITICAL ? 2 : count.HIGH ? 1 : 0);
}

(async () => {
  console.log('\x1b[1mCTF.UZ Security Audit' + R + ' · ' + new Date().toLocaleString());
  if (RUN_STATIC) staticScan();
  if (RUN_DYNAMIC) await dynamicScan();
  report();
})();
