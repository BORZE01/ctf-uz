const fs = require('fs');
const path = require('path');

const dsPath = path.join(__dirname, 'public', 'css', 'design-system.css');
if (fs.existsSync(dsPath)) {
  let css = fs.readFileSync(dsPath, 'utf8');
  
  const footerFix = `
/* --- FOOTER POSITION FIX --- */
body {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  margin: 0;
}
body > :not(footer):not(header):not(nav):not(script):not(style) {
  flex: 1 0 auto;
}
.ctf-global-footer {
  flex-shrink: 0;
  margin-top: auto;
}
/* --------------------------- */
`;

  if (!css.includes('FOOTER POSITION FIX')) {
    fs.writeFileSync(dsPath, css + '\n' + footerFix);
    console.log("✅ Footer joylashuvi to'g'rilandi: Endi u doim eng tagida turadi!");
  } else {
    console.log("ℹ️ Footer joylashuvi allaqachon to'g'rilangan.");
  }
}
