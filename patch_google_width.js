const fs = require('fs');
const f = 'public/login.html';
if (!fs.existsSync(f)) { console.error('public/login.html topilmadi (loyiha papkasida ishga tushiring)'); process.exit(1); }
let html = fs.readFileSync(f, 'utf8');
fs.writeFileSync(f + '.bak-' + Date.now(), html);

if (html.includes('id="g_btn"')) { console.log('Allaqachon tuzatilgan.'); process.exit(0); }

// 1) Deklarativ g_id_onload ni olib tashlaymiz (ikki marta initialize bo'lmasligi uchun)
html = html.replace(/<div id="g_id_onload"[\s\S]*?<\/div>/, '');

// 2) g_id_signin o'rniga bo'sh konteyner
const re = /<div class="g_id_signin"[^>]*><\/div>/;
if (!re.test(html)) { console.error('Google tugmasi (g_id_signin) topilmadi'); process.exit(1); }
html = html.replace(re, '<div id="g_btn" style="width:100%; display:flex; justify-content:center; height:40px;"></div>');

// 3) GitHub tugmasi balandligini Google (40px) bilan tenglash
html = html.replace(/(class="gh-oauth-btn"[^>]*style=")([^"]*)(")/, (m, a, s, c) =>
  a + s.replace(/padding:[^;]*;/, 'padding:0 20px; height:40px;') + c);

// 4) Tugmani konteyner kengligida chizish
const script = `
<script>
window.addEventListener('load', function () {
    if (!window.google || !google.accounts || !google.accounts.id) return;
    var el = document.getElementById('g_btn');
    if (!el) return;
    google.accounts.id.initialize({
        client_id: '357806518913-c6ofpdqqjd0qq37357poomth8rombrtm.apps.googleusercontent.com',
        callback: handleGoogleLogin,
        auto_select: false
    });
    function draw() {
        var w = Math.min(400, Math.floor(el.parentElement.clientWidth || 368));
        el.innerHTML = '';
        google.accounts.id.renderButton(el, {
            type: 'standard', size: 'large', theme: 'outline',
            text: 'continue_with', shape: 'rectangular',
            logo_alignment: 'center', width: w
        });
    }
    draw();
    var t; window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(draw, 250); });
});
</script>
`;
const idx = html.lastIndexOf('</body>');
html = html.slice(0, idx) + script + html.slice(idx);

fs.writeFileSync(f, html, 'utf8');
console.log('✅ Google tugmasi endi konteyner kengligida (GitHub bilan bir xil).');
