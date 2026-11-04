const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const pubDir = path.join(__dirname, 'public');
const assetsDir = path.join(pubDir, 'assets');
const brandDir = path.join(assetsDir, 'brand');
const cssDir = path.join(pubDir, 'css');

if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });
if (!fs.existsSync(brandDir)) fs.mkdirSync(brandDir, { recursive: true });

// 1. SVG LOGOTIPLAR VA BANNER YARATISH
const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 56" width="240" height="56" fill="none">
  <defs>
    <linearGradient id="cyberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3B82F6"/>
      <stop offset="100%" stop-color="#22D3EE"/>
    </linearGradient>
    <linearGradient id="shieldBg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#101A2B"/>
      <stop offset="100%" stop-color="#080D18"/>
    </linearGradient>
  </defs>
  <rect x="4" y="4" width="48" height="48" rx="12" fill="url(#shieldBg)" stroke="url(#cyberGrad)" stroke-width="2.5"/>
  <path d="M31 12L17 30H27L25 44L39 26H29L31 12Z" fill="url(#cyberGrad)"/>
  <text x="66" y="38" font-family="'Manrope', 'Inter', sans-serif" font-weight="800" font-size="30" fill="#F1F5F9" letter-spacing="1">CTF<tspan fill="#22D3EE">.UZ</tspan></text>
</svg>`;

const markSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" fill="none">
  <defs>
    <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3B82F6"/>
      <stop offset="100%" stop-color="#22D3EE"/>
    </linearGradient>
    <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#101A2B"/>
      <stop offset="100%" stop-color="#080D18"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#bg)"/>
  <rect x="20" y="20" width="472" height="472" rx="96" stroke="url(#g1)" stroke-width="16" fill="none"/>
  <path d="M288 96L144 280H248L224 416L368 232H264L288 96Z" fill="url(#g1)"/>
</svg>`;

const bannerSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630" fill="none">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#080D18"/>
      <stop offset="50%" stop-color="#101A2B"/>
      <stop offset="100%" stop-color="#080D18"/>
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3B82F6"/>
      <stop offset="100%" stop-color="#22D3EE"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bgGrad)"/>
  <circle cx="1050" cy="120" r="280" fill="#3B82F6" fill-opacity="0.1"/>
  <circle cx="150" cy="520" r="320" fill="#22D3EE" fill-opacity="0.08"/>
  <rect x="60" y="60" width="1080" height="510" rx="24" fill="#101A2B" fill-opacity="0.7" stroke="url(#accentGrad)" stroke-width="2"/>
  <g transform="translate(120, 180)">
    <rect x="0" y="0" width="130" height="130" rx="32" fill="#080D18" stroke="url(#accentGrad)" stroke-width="6"/>
    <path d="M74 26L34 74H62L56 108L96 60H68L74 26Z" fill="url(#accentGrad)"/>
    <text x="165" y="92" font-family="'Manrope', 'Inter', sans-serif" font-weight="800" font-size="84" fill="#F1F5F9" letter-spacing="2">CTF<tspan fill="#22D3EE">.UZ</tspan></text>
  </g>
  <text x="120" y="385" font-family="'Inter', sans-serif" font-weight="600" font-size="34" fill="#94A3B8">O'zbekistonning milliy kiberxavfsizlik va CTF platformasi</text>
  <text x="120" y="450" font-family="'JetBrains Mono', monospace" font-weight="500" font-size="24" fill="#22D3EE">ARENA • ACADEMY • BATTLE • CYBER ID • CAREER</text>
</svg>`;

fs.writeFileSync(path.join(brandDir, 'ctf-uz-logo.svg'), logoSvg);
fs.writeFileSync(path.join(brandDir, 'ctf-uz-mark.svg'), markSvg);
fs.writeFileSync(path.join(assetsDir, 'ctf-uz-logo.svg'), logoSvg);

async function generatePngAssets() {
  await sharp(Buffer.from(markSvg)).resize(64, 64).png().toFile(path.join(assetsDir, 'favicon-64.png'));
  await sharp(Buffer.from(markSvg)).resize(192, 192).png().toFile(path.join(assetsDir, 'icon-192.png'));
  await sharp(Buffer.from(markSvg)).resize(512, 512).png().toFile(path.join(assetsDir, 'icon-512.png'));
  await sharp(Buffer.from(markSvg)).resize(512, 512).png().toFile(path.join(assetsDir, 'ctf-uz-icon.png'));
  await sharp(Buffer.from(bannerSvg)).resize(1200, 630).png().toFile(path.join(assetsDir, 'ctf-uz-banner.png'));
  console.log("✅ 1. Barcha SVG va PNG aktivlar (64x64, 192x192, 512x512, Banner) yaratildi!");
}

// 2. MANIFEST.JSON YANGILASH
const manifestData = {
  name: "CTF.UZ — Milliy Kiberxavfsizlik Platformasi",
  short_name: "CTF.UZ",
  description: "Amaliy kiberxavfsizlik, CTF musobaqalari, o'quv akademiyasi va karyera platformasi.",
  start_url: "/",
  display: "standalone",
  background_color: "#080D18",
  theme_color: "#3B82F6",
  orientation: "portrait-primary",
  icons: [
    { src: "/assets/favicon-64.png", sizes: "64x64", type: "image/png" },
    { src: "/assets/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
    { src: "/assets/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }
  ]
};
fs.writeFileSync(path.join(pubDir, 'manifest.json'), JSON.stringify(manifestData, null, 2));
console.log("✅ 2. PWA manifest.json yangilandi!");

// 3. CSS TOKENLAR VA DIZAYN TIZIMINI TUZATISH (D-03, D-04, D-05, D-18, D-21, D-24)
const dsPath = path.join(cssDir, 'design-system.css');
if (fs.existsSync(dsPath)) {
  let dsCss = fs.readFileSync(dsPath, 'utf8');
  
  // D-18: Light theme qoidasini @media (max-width:768px) ichidan chiqarish
  dsCss = dsCss.replace(/\[data-theme="light"\]\s*\{[\s\S]*?\}/g, '');
  
  const globalAdditions = `
/* === CTF.UZ UNIFIED BRAND TOKENS & FIXES === */
:root {
  --bg: #080D18;
  --surface: #101A2B;
  --surface-raised: #17243A;
  --border: rgba(148, 163, 184, 0.16);
  --text: #F1F5F9;
  --text-primary: #F1F5F9;
  --text2: #CBD5E1;
  --text-secondary: #CBD5E1;
  --text3: #94A3B8;
  --text-muted: #94A3B8;
  --primary: #3B82F6;
  --uz-blue: #3B82F6;
  --blue-l: #60A5FA;
  --uz-blue-light: #60A5FA;
  --accent: #22D3EE;
  --accent-cyan: #22D3EE;
  --success: #10B981;
  --warning: #F59E0B;
  --danger: #EF4444;
}

[data-theme="light"] {
  --bg: #F8FAFC;
  --surface: #FFFFFF;
  --surface-raised: #F1F5F9;
  --border: rgba(15, 23, 42, 0.12);
  --text: #0F172A;
  --text-primary: #0F172A;
  --text2: #334155;
  --text-secondary: #334155;
  --text3: #64748B;
  --text-muted: #64748B;
}

/* D-21: Accessibility Focus Visible */
a:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible {
  outline: 2px solid var(--accent-cyan) !important;
  outline-offset: 2px !important;
}

/* Brand Logo Component */
.brand-logo {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  font-family: 'Manrope', sans-serif;
  font-weight: 800;
  font-size: 1.35rem;
  color: var(--text-primary);
}
.brand-logo img {
  height: 36px;
  width: auto;
  display: block;
}

/* D-03: Mobile Hamburger & Drawer */
.mobile-nav-toggle {
  display: none;
  background: var(--surface-raised);
  border: 1px solid var(--border);
  color: var(--text-primary);
  border-radius: 8px;
  padding: 8px 10px;
  cursor: pointer;
  align-items: center;
  justify-content: center;
}
@media (max-width: 900px) {
  .mobile-nav-toggle { display: inline-flex !important; }
  header .nav, .header .nav, nav.nav {
    display: none !important;
    position: fixed;
    top: 68px;
    left: 16px;
    right: 16px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 16px;
    flex-direction: column;
    gap: 12px;
    z-index: 9999;
    box-shadow: 0 20px 40px rgba(0,0,0,0.6);
  }
  header .nav.nav-open, .header .nav.nav-open, nav.nav.nav-open {
    display: flex !important;
  }
}

/* D-12 & D-23: Events Card & Certificate Responsive */
@media (max-width: 768px) {
  .event-card-responsive {
    grid-template-columns: 1fr !important;
    gap: 16px !important;
    padding: 20px !important;
  }
  .cert-preview-wrapper {
    overflow-x: auto;
    max-width: 100%;
  }
}

/* D-07: Global Unified Footer */
.ctf-global-footer {
  margin-top: 64px;
  padding: 32px 24px;
  border-top: 1px solid var(--border);
  background: rgba(8, 13, 24, 0.9);
  color: var(--text-muted);
  font-size: 0.9rem;
}
.ctf-global-footer__inner {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}
.ctf-global-footer__links {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}
.ctf-global-footer__links a {
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 0.2s;
}
.ctf-global-footer__links a:hover {
  color: var(--accent-cyan);
}
`;
  if (!dsCss.includes('CTF.UZ UNIFIED BRAND TOKENS')) {
    fs.writeFileSync(dsPath, dsCss + '\n' + globalAdditions);
  }
  console.log("✅ 3. design-system.css tokenlar, mobil menyu va global footer bilan boyitildi!");
}

// D-24: animations.css uchun prefers-reduced-motion
const animPath = path.join(cssDir, 'animations.css');
if (fs.existsSync(animPath)) {
  let animCss = fs.readFileSync(animPath, 'utf8');
  if (!animCss.includes('prefers-reduced-motion')) {
    animCss += `\n@media (prefers-reduced-motion: reduce) {\n  *, *::before, *::after {\n    animation-duration: 0.01ms !important;\n    animation-iteration-count: 1 !important;\n    transition-duration: 0.01ms !important;\n  }\n}\n`;
    fs.writeFileSync(animPath, animCss);
  }
}

// 4. PLACEHOLDER VA FRAGMENT SAHIFALARNI TO'LIQ BRAND SHELL'GA O'TKAZISH (D-08, D-09, D-11)
const headBrandLinks = `
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" type="image/png" sizes="64x64" href="/assets/favicon-64.png">
  <link rel="apple-touch-icon" sizes="192x192" href="/assets/icon-192.png">
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#3B82F6">
  <meta property="og:image" content="/assets/ctf-uz-banner.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&family=Manrope:wght@700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/design-system.css">
`;

const globalFooterHtml = `
<footer class="ctf-global-footer">
  <div class="ctf-global-footer__inner">
    <div style="display:flex;align-items:center;gap:12px;">
      <img src="/assets/brand/ctf-uz-logo.svg" alt="CTF.UZ" style="height:28px;">
      <span>© 2026 CTF.UZ. Barcha huquqlar himoyalangan.</span>
    </div>
    <div class="ctf-global-footer__links">
      <a href="/about.html">Biz haqimizda</a>
      <a href="/arena.html">Arena</a>
      <a href="/learn.html">Akademiya</a>
      <a href="/leaderboard.html">Reyting</a>
      <a href="/career.html">Karyera</a>
    </div>
  </div>
</footer>
<script src="/js/brand-ui.js"></script>
`;

function createComingSoonPage(title, desc) {
  return `<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="UTF-8">
  <title>${title} — CTF.UZ</title>
  ${headBrandLinks}
</head>
<body style="background:var(--bg);color:var(--text-primary);font-family:'Inter',sans-serif;min-height:100vh;display:flex;flex-direction:column;margin:0;">
  <header class="header" style="padding:16px 24px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
    <a href="/" class="brand-logo"><img src="/assets/brand/ctf-uz-logo.svg" alt="CTF.UZ"></a>
    <a href="/career.html" class="btn btn-secondary" style="text-decoration:none;padding:8px 16px;border-radius:8px;border:1px solid var(--border);color:var(--text-primary);">← Karyeraga qaytish</a>
  </header>
  <main style="flex:1;display:flex;align-items:center;justify-content:center;padding:24px;">
    <div style="max-width:520px;width:100%;background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:40px;text-align:center;">
      <img src="/assets/brand/ctf-uz-mark.svg" alt="CTF.UZ" style="width:64px;height:64px;margin-bottom:16px;">
      <h1 style="font-family:'Manrope',sans-serif;font-size:1.8rem;margin:0 0 12px;">${title}</h1>
      <p style="color:var(--text-muted);line-height:1.6;margin-bottom:24px;">${desc}</p>
      <a href="/dashboard.html" style="display:inline-block;background:var(--primary);color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;">Asosiy panelga o'tish</a>
    </div>
  </main>
  ${globalFooterHtml}
</body>
</html>`;
}

fs.writeFileSync(path.join(pubDir, 'company.html'), createComingSoonPage("Kompaniyalar katalogi", "O'zbekistondagi yetakchi IT va kiberxavfsizlik kompaniyalari profili tez orada ishga tushiriladi."));
fs.writeFileSync(path.join(pubDir, 'cv-builder.html'), createComingSoonPage("Cyber CV Builder", "Kiberxavfsizlik mutaxassislari uchun avtomatik rezyume va portfolio generatori yakuniy sinovdan o'tmoqda."));
fs.writeFileSync(path.join(pubDir, 'talent-search.html'), createComingSoonPage("Talent Search", "Eng kuchli CTF ishtirokchilari va kiber-mutaxassislarni saralash tizimi tez orada ochiladi."));

// D-09: learn-cia.html fragmentini to'liq HTML va to'g'ri sintaksisga o'tkazish
const learnCiaPath = path.join(pubDir, 'learn-cia.html');
if (fs.existsSync(learnCiaPath)) {
  let ciaContent = fs.readFileSync(learnCiaPath, 'utf8');
  ciaContent = ciaContent.replace(/feedbackEl\.innerHTML\s*=\s*"<i data-lucide="hourglass"([^"]*)";/g, `feedbackEl.innerHTML = '<i data-lucide="hourglass"$1';`);
  if (!ciaContent.toLowerCase().includes('<!doctype html>')) {
    ciaContent = `<!DOCTYPE html>\n<html lang="uz">\n<head>\n<meta charset="UTF-8">\n<title>CIA Triad Darsi — CTF.UZ</title>\n${headBrandLinks}\n</head>\n<body style="background:var(--bg);color:var(--text-primary);padding:24px;">\n<div style="max-width:960px;margin:0 auto;">\n<a href="/learn.html" class="brand-logo" style="margin-bottom:24px;"><img src="/assets/brand/ctf-uz-logo.svg" alt="CTF.UZ"></a>\n${ciaContent}\n</div>\n${globalFooterHtml}\n</body>\n</html>`;
    fs.writeFileSync(learnCiaPath, ciaContent);
  }
}

// 5. MOBIL DRAWER VA ADMIN SIDEBAR SKRIPTI (public/js/brand-ui.js)
const jsDir = path.join(pubDir, 'js');
if (!fs.existsSync(jsDir)) fs.mkdirSync(jsDir, { recursive: true });
const brandUiJs = `
document.addEventListener('DOMContentLoaded', () => {
  // Mobil navigatsiya tugmasini avtomatik qo'shish
  const headers = document.querySelectorAll('header, .header');
  headers.forEach(hdr => {
    const nav = hdr.querySelector('.nav, nav');
    if (nav && !hdr.querySelector('.mobile-nav-toggle')) {
      const btn = document.createElement('button');
      btn.className = 'mobile-nav-toggle';
      btn.setAttribute('aria-label', 'Menyuni ochish');
      btn.setAttribute('aria-expanded', 'false');
      btn.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>';
      btn.addEventListener('click', () => {
        const isOpen = nav.classList.toggle('nav-open');
        btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });
      hdr.appendChild(btn);
    }
  });

  // Escape bosilganda mobil menyuni yopish
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.nav.nav-open').forEach(n => n.classList.remove('nav-open'));
    }
  });
});
`;
fs.writeFileSync(path.join(jsDir, 'brand-ui.js'), brandUiJs);

// 6. BARCHA 33 TA HTML FAYLLARNI STANDARTLASHTIRISH (D-01, D-06, D-07, D-10, D-12, D-13, D-20)
const htmlFiles = fs.readdirSync(pubDir).filter(f => f.endsWith('.html'));
htmlFiles.forEach(file => {
  const filePath = path.join(pubDir, file);
  let html = fs.readFileSync(filePath, 'utf8');

  // D-01: CTF-UZ va CU nomlarini CTF.UZ ga birxillashtirish
  html = html.replace(/CTF-UZ/g, 'CTF.UZ');
  html = html.replace(/<div class="logo-mark"[^>]*>\s*CU\s*<\/div>/gi, '<img src="/assets/brand/ctf-uz-mark.svg" alt="CTF.UZ" style="width:34px;height:34px;border-radius:8px;">');
  
  // D-20: Eski 2025 yillarni 2026 ga yangilash
  html = html.replace(/©\s*2025\s*CTF\.UZ/gi, '© 2026 CTF.UZ');
  html = html.replace(/2025\s*CTF\.UZ/gi, '2026 CTF.UZ');

  // D-06: Viewport, Favicon va Manifest ulash
  if (!html.includes('name="viewport"')) {
    html = html.replace(/<head>/i, '<head>\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">');
  }
  if (!html.includes('rel="manifest"')) {
    const metaInject = `\n  <link rel="icon" type="image/png" sizes="64x64" href="/assets/favicon-64.png">\n  <link rel="apple-touch-icon" sizes="192x192" href="/assets/icon-192.png">\n  <link rel="manifest" href="/manifest.json">\n  <meta name="theme-color" content="#3B82F6">`;
    html = html.replace(/<\/head>/i, `${metaInject}\n</head>`);
  }

  // D-04: Admin panel responsive media query
  if (file === 'admin.html' && !html.includes('@media (max-width: 900px)')) {
    const adminResponsive = `<style>
      @media (max-width: 900px) {
        .layout { grid-template-columns: 1fr !important; }
        .sidebar { position: relative !important; height: auto !important; width: 100% !important; border-right: none !important; border-bottom: 1px solid var(--border); }
      }
    </style>`;
    html = html.replace(/<\/head>/i, `${adminResponsive}\n</head>`);
  }

  // D-13: Lesson sidebar mobil ekranda butunlay yo'qolib qolmasligi uchun
  if (file === 'lesson.html') {
    html = html.replace(/\.lesson-sidebar\s*\{\s*display:\s*none\s*;\s*\}/g, '.lesson-sidebar { display: block; width: 100%; margin-bottom: 16px; }');
  }

  // D-07: Footer yo'q sahifalarga global footer va mobil UI skriptini qo'shish
  if (!html.includes('<footer') && !['admin.html', 'admin-certificates.html'].includes(file)) {
    html = html.replace(/<\/body>/i, `${globalFooterHtml}\n</body>`);
  } else if (!html.includes('brand-ui.js')) {
    html = html.replace(/<\/body>/i, `<script src="/js/brand-ui.js"></script>\n</body>`);
  }

  fs.writeFileSync(filePath, html);
});

generatePngAssets().then(() => {
  console.log("✅ 4. Barcha 33 ta HTML sahifa CTF.UZ Brand Kit standartiga muvaffaqiyatli o'tkazildi!");
});
