const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = process.cwd();
const files = {
  auth: path.join(root, 'routes', 'auth.js'),
  user: path.join(root, 'models', 'User.js'),
  login: path.join(root, 'public', 'login.html'),
};
for (const f of Object.values(files)) {
  if (!fs.existsSync(f)) { console.error('Topilmadi: ' + f + ' (skriptni loyiha papkasida ishga tushiring)'); process.exit(1); }
}

const stamp = Date.now();
const original = {};
for (const [k, f] of Object.entries(files)) {
  original[k] = fs.readFileSync(f, 'utf8');
  fs.writeFileSync(f + '.bak-' + stamp, original[k]);
}
const report = [];
const step = (name, ok) => report.push((ok ? 'OK    ' : 'SKIP  ') + name);

// ───────────────────────── models/User.js ─────────────────────────
let user = original.user;
if (!user.includes('githubId')) {
  const anchor = /(\n[ \t]*password: \{ type: String, required: false \},)/;
  if (anchor.test(user)) {
    user = user.replace(anchor, (m) => m + String.raw`
    githubId: { type: String, unique: true, sparse: true },`);
    step('User.js: githubId maydoni', true);
  } else step('User.js: githubId (password qatori topilmadi)', false);
} else step('User.js: githubId allaqachon bor', false);

if (!user.includes('googleId')) {
  const anchor = /(\n[ \t]*githubId: \{[^\n]*\},)/;
  if (anchor.test(user)) {
    user = user.replace(anchor, (m) => m + String.raw`
    googleId: { type: String, unique: true, sparse: true },`);
    step('User.js: googleId maydoni', true);
  } else step('User.js: googleId', false);
} else step('User.js: googleId allaqachon bor', false);

// ───────────────────────── routes/auth.js ─────────────────────────
let auth = original.auth;

// 1) Session Fixation: har bir kirishda sessiya ID yangilanadi
{
  const re = /function establishSafeSession\([^)]*\)\s*\{[\s\S]*?\n\}\n/;
  const m = auth.match(re);
  if (m && !m[0].includes('regenerate')) {
    const fixed = String.raw`function establishSafeSession(req, sessionUser, isAdmin = false, callback) {
    req.session.regenerate((regenErr) => {
        if (regenErr) return callback(regenErr);
        req.session.user = sessionUser;
        if (isAdmin) {
            req.session.isAdmin = true;
            req.session.adminLoginTime = Date.now();
        }
        req.session.save((saveErr) => callback(saveErr));
    });
}
`;
    auth = auth.replace(re, () => fixed);
    step('auth.js: Session Fixation (regenerate)', true);
  } else step('auth.js: Session Fixation (allaqachon tuzatilgan yoki topilmadi)', false);
}

// 2) Parolsiz (Google/GitHub) akkauntlarda bcrypt.compare xato bermasin
{
  const from = 'await bcrypt.compare(password, user.password)';
  const to = '(user.password ? await bcrypt.compare(password, user.password) : false)';
  if (auth.includes(from)) {
    auth = auth.split(from).join(to);
    step('auth.js: parolsiz akkauntlar uchun bcrypt.compare', true);
  } else step('auth.js: bcrypt.compare (allaqachon tuzatilgan)', false);
}

// 3) Google route: email_verified, banned, 2FA aylanib o'tilishi, session regenerate
{
  let changed = false;
  const a = 'const { email, name, sub } = payload;';
  if (auth.includes(a) && !auth.includes('Google email tasdiqlanmagan')) {
    auth = auth.replace(a, () => a + String.raw`
        if (!payload.email_verified) {
            return res.status(400).json({ success: false, message: 'Google email tasdiqlanmagan' });
        }`);
    changed = true;
  }
  const re = /req\.session\.user = \{ id: user\._id, username: user\.username \};\s*await new Promise\(resolve => req\.session\.save\(resolve\)\);/;
  if (re.test(auth)) {
    auth = auth.replace(re, () => String.raw`if (user.banned) {
            return res.status(403).json({ success: false, message: 'Hisobingiz bloklangan' });
        }
        if (user.twoFactor && user.twoFactorSecret) {
            await new Promise((resolve, reject) => req.session.regenerate(e => e ? reject(e) : resolve()));
            req.session.pending2FA = user._id.toString();
            req.session.twoFactorAttempts = 0;
            await new Promise(resolve => req.session.save(resolve));
            return res.json({ success: true, requires2FA: true });
        }
        await new Promise((resolve, reject) => req.session.regenerate(e => e ? reject(e) : resolve()));
        req.session.user = { id: user._id.toString(), email: user.email, username: user.username, name: user.name, avatar: user.avatar, role: user.role };
        await new Promise(resolve => req.session.save(resolve));`);
    changed = true;
  }
  step('auth.js: Google (email_verified, banned, 2FA bypass, regenerate)', changed);
}

// 4) GitHub OAuth route'lari
if (!auth.includes('GITHUB AUTH')) {
  const githubCode = String.raw`
// ==================== GITHUB AUTH ====================
const ghCrypto = require('crypto');

router.get('/github', (req, res) => {
    if (!process.env.GITHUB_CLIENT_ID) return res.redirect('/login?error=github_failed');
    const state = ghCrypto.randomBytes(16).toString('hex');
    req.session.githubState = state;
    const redirectUri = process.env.GITHUB_REDIRECT_URI || 'https://ctf-uz.onrender.com/api/auth/github/callback';
    const params = new URLSearchParams({
        client_id: process.env.GITHUB_CLIENT_ID,
        redirect_uri: redirectUri,
        scope: 'read:user user:email',
        state: state
    });
    req.session.save(() => res.redirect('https://github.com/login/oauth/authorize?' + params.toString()));
});

router.get('/github/callback', async (req, res) => {
    try {
        const code = String(req.query.code || '');
        const state = String(req.query.state || '');
        const expected = req.session && req.session.githubState;
        if (req.session) delete req.session.githubState;
        if (!code || !state || !expected || state !== expected) throw new Error('state mismatch');

        const redirectUri = process.env.GITHUB_REDIRECT_URI || 'https://ctf-uz.onrender.com/api/auth/github/callback';
        const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code: code,
                redirect_uri: redirectUri
            })
        });
        const tokenData = await tokenRes.json();
        if (!tokenData.access_token) throw new Error('token olinmadi');

        const gh = {
            'Authorization': 'Bearer ' + tokenData.access_token,
            'User-Agent': 'ctf-uz',
            'Accept': 'application/vnd.github+json'
        };
        const profile = await (await fetch('https://api.github.com/user', { headers: gh })).json();
        const emails = await (await fetch('https://api.github.com/user/emails', { headers: gh })).json();
        if (!profile || !profile.id) throw new Error('profil olinmadi');

        // Faqat GitHub tasdiqlagan email ishlatiladi
        let verifiedEmail = null;
        if (Array.isArray(emails)) {
            const pick = emails.find(e => e.primary && e.verified) || emails.find(e => e.verified);
            if (pick) verifiedEmail = String(pick.email).toLowerCase();
        }
        if (!verifiedEmail) return res.redirect('/login?error=github_no_email');

        const githubId = String(profile.id);
        let ghUser = await User.findOne({ githubId: githubId });
        if (!ghUser) ghUser = await User.findOne({ email: verifiedEmail });

        if (!ghUser) {
            let base = String(profile.login || 'user').toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20);
            if (base.length < 3) base = 'user' + base;
            let username = base;
            while (await User.exists({ username: username })) {
                username = base + '_' + ghCrypto.randomBytes(2).toString('hex');
            }
            ghUser = new User({
                name: String(profile.name || profile.login || username).slice(0, 50),
                username: username,
                email: verifiedEmail,
                githubId: githubId,
                github: String(profile.login || ''),
                verified: true,
                role: 'user'
            });
            await ghUser.save();
        } else if (!ghUser.githubId) {
            ghUser.githubId = githubId;
            if (!ghUser.github) ghUser.github = String(profile.login || '');
        }

        if (ghUser.banned) return res.redirect('/login?error=github_banned');

        ghUser.lastActive = new Date();
        await ghUser.save();

        // 2FA yoqilgan akkauntda 2FA aylanib o'tilmaydi
        if (ghUser.twoFactor && ghUser.twoFactorSecret) {
            return req.session.regenerate((err) => {
                if (err) return res.redirect('/login?error=github_failed');
                req.session.pending2FA = ghUser._id.toString();
                req.session.twoFactorAttempts = 0;
                req.session.save(() => res.redirect('/login?github2fa=1'));
            });
        }

        const sessionUser = {
            id: ghUser._id.toString(),
            email: ghUser.email,
            username: ghUser.username,
            name: ghUser.name,
            avatar: ghUser.avatar,
            role: ghUser.role
        };
        establishSafeSession(req, sessionUser, false, (err) => {
            if (err) return res.redirect('/login?error=github_failed');
            res.redirect('/dashboard');
        });
    } catch (e) {
        console.error('GitHub callback xatosi:', e.message);
        res.redirect('/login?error=github_failed');
    }
});
// ==================== END GITHUB AUTH ====================

`;
  const idx = auth.lastIndexOf('module.exports = router;');
  if (idx !== -1) {
    auth = auth.slice(0, idx) + githubCode + auth.slice(idx);
    step('auth.js: GitHub login route\'lari', true);
  } else step('auth.js: module.exports topilmadi', false);
} else step('auth.js: GitHub route\'lari allaqachon bor', false);

// ───────────────────────── public/login.html ─────────────────────────
let html = original.login;

// Avval noto'g'ri joyga (2FA oynasiga) qo'yilgan eski tugmani o'chirish
{
  const oldBtn = /\s*<button type="button" class="github-btn"[\s\S]*?<\/button>/;
  if (oldBtn.test(html)) {
    html = html.replace(oldBtn, '');
    step('login.html: eski (noto\'g\'ri joydagi) GitHub tugmasi o\'chirildi', true);
  }
}

if (!html.includes('gh-oauth-btn')) {
  const containerRe = /id="g_auth_container" style="[^"]*"/;
  if (containerRe.test(html)) {
    html = html.replace(containerRe, () => 'id="g_auth_container" style="text-align:center; display:flex; flex-direction:column; align-items:center; width:100%; margin-top:10px;"');
  }
  const googleDivRe = /<div class="g_id_signin"[^>]*><\/div>/;
  const ghButton = String.raw`
    <button type="button" class="gh-oauth-btn" onclick="location.href='/api/auth/github'" style="display:flex; align-items:center; justify-content:center; gap:10px; background:#24292f; color:#ffffff; border:1px solid #3d444d; border-radius:4px; padding:11px 20px; font-weight:600; font-size:0.95rem; cursor:pointer; width:100%; margin-top:12px; font-family:inherit; transition:background 0.2s;" onmouseover="this.style.background='#32383f'" onmouseout="this.style.background='#24292f'">
        <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>
        GitHub orqali kirish
    </button>`;
  if (googleDivRe.test(html)) {
    html = html.replace(googleDivRe, (m) => m + ghButton);
    step('login.html: GitHub tugmasi Google tagiga qo\'shildi', true);
  } else step('login.html: Google tugmasi topilmadi', false);
} else step('login.html: GitHub tugmasi allaqachon bor', false);

// Google orqali kirishda 2FA oynasini ko'rsatish
if (html.includes('if (data.requireDetails) {') && !html.includes('data.requires2FA) {\n                document')) {
  html = html.replace('if (data.requireDetails) {', () => String.raw`if (data.requires2FA) {
                document.getElementById('login-view').style.display = 'none';
                document.getElementById('twofa-view').style.display = 'block';
                var _otp = document.querySelector('.otp-digit'); if (_otp) _otp.focus();
            } else if (data.requireDetails) {`);
  step('login.html: Google uchun 2FA oynasi', true);
} else step('login.html: Google 2FA oynasi (allaqachon bor)', false);

// GitHub qaytganda 2FA oynasi va xato xabarlari
if (!html.includes('github2fa')) {
  const helper = String.raw`
<script>
(function () {
    var p = new URLSearchParams(location.search);
    if (p.get('github2fa') === '1') {
        document.getElementById('login-view').style.display = 'none';
        document.getElementById('twofa-view').style.display = 'block';
        var f = document.querySelector('.otp-digit'); if (f) f.focus();
    }
    var errs = {
        github_failed: 'GitHub orqali kirish amalga oshmadi. Qaytadan urinib ko\'ring.',
        github_no_email: 'GitHub akkauntingizda tasdiqlangan email topilmadi.',
        github_banned: 'Hisobingiz bloklangan.'
    };
    var e = p.get('error');
    if (e && errs[e]) {
        var m = document.getElementById('login-message');
        if (m) { m.className = 'msg-box error'; m.innerText = errs[e]; }
    }
})();
</script>
`;
  const idx = html.lastIndexOf('</body>');
  if (idx !== -1) {
    html = html.slice(0, idx) + helper + html.slice(idx);
    step('login.html: GitHub 2FA / xato xabarlari', true);
  }
} else step('login.html: GitHub 2FA skripti allaqachon bor', false);

// ───────────────────────── Yozish va tekshirish ─────────────────────────
fs.writeFileSync(files.auth, auth, 'utf8');
fs.writeFileSync(files.user, user, 'utf8');
fs.writeFileSync(files.login, html, 'utf8');

try {
  execSync('node --check ' + JSON.stringify(files.auth), { stdio: 'pipe' });
  execSync('node --check ' + JSON.stringify(files.user), { stdio: 'pipe' });
} catch (e) {
  for (const [k, f] of Object.entries(files)) fs.writeFileSync(f, original[k], 'utf8');
  console.error('\n❌ Sintaksis xatosi, hamma narsa avvalgi holatga qaytarildi:\n' + (e.stderr ? e.stderr.toString() : e.message));
  process.exit(1);
}

console.log(report.join('\n'));
console.log('\n✅ Tayyor. Zaxira nusxalar: *.bak-' + stamp);
console.log('Endi .env da GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_REDIRECT_URI borligini tekshiring va serverni qayta ishga tushiring.');
