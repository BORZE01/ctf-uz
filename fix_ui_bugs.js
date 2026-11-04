const fs = require('fs');
const path = require('path');

const pubDir = path.join(__dirname, 'public');
const htmlFiles = fs.readdirSync(pubDir).filter(f => f.endsWith('.html'));

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
`;

htmlFiles.forEach(file => {
  const filePath = path.join(pubDir, file);
  let html = fs.readFileSync(filePath, 'utf8');
  let isModified = false;

  // 1. Ikkita footerni tozalash
  const footerCount = (html.match(/<footer class="ctf-global-footer">/g) || []).length;
  if (footerCount > 1) {
    const firstFooterIndex = html.indexOf('<footer class="ctf-global-footer">');
    const secondFooterIndex = html.indexOf('<footer class="ctf-global-footer">', firstFooterIndex + 1);
    if (secondFooterIndex !== -1) {
      const beforeSecondFooter = html.substring(0, secondFooterIndex);
      const afterSecondFooter = html.substring(secondFooterIndex).replace(/<footer[\s\S]*?<\/footer>/, '');
      html = beforeSecondFooter + afterSecondFooter;
      isModified = true;
    }
  }

  // 2. Yo'qolgan navigatsiyani tiklash
  if (file === 'leaderboard.html' || file === 'battle.html') {
      if(!html.includes('<nav class="nav">') && !html.includes('<nav class="header__nav">')) {
          const headerStart = html.indexOf('<header');
          const headerEnd = html.indexOf('</header>');
          
          if(headerStart !== -1 && headerEnd !== -1) {
              const headerContent = html.substring(headerStart, headerEnd);
              
              const navHtml = `
    <nav class="nav">
        <a href="/dashboard.html">Dashboard</a>
        <a href="/arena.html">Arena</a>
        <a href="/learn.html">O'rganish</a>
        <a href="/battle.html">Battle</a>
        <a href="/leaderboard.html">Reyting</a>
        <a href="/career.html">Karyera</a>
        <a href="/profile.html">@jasur7</a>
    </nav>`;
              if(!headerContent.includes('nav')) {
                  const insertPos = headerContent.indexOf('</a>') + 4;
                  const newHeader = headerContent.slice(0, insertPos) + navHtml + headerContent.slice(insertPos);
                  html = html.substring(0, headerStart) + newHeader + html.substring(headerEnd);
                  isModified = true;
              }
          }
      }
  }

  if (isModified) {
    fs.writeFileSync(filePath, html);
    console.log(`✅ To'g'irlandi: ${file}`);
  }
});
console.log("🚀 Barcha UI xatolari tekshirildi va tozalandi!");
