const fs = require('fs');
const path = require('path');

const dsPath = path.join(__dirname, 'public', 'css', 'design-system.css');
if (fs.existsSync(dsPath)) {
  let css = fs.readFileSync(dsPath, 'utf8');
  
  // 1. Qisqarib qolgan (shrink-wrap) elementlarni to'liq kenglikka qaytarish
  css = css.replace(/body > :not\(footer\):not\(header\):not\(nav\):not\(script\):not\(style\) {([\s\S]*?)}/g, 
`body > :not(footer):not(header):not(nav):not(script):not(style) {
  flex: 1 0 auto;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}`);

  // 2. Auth sahifalari va toraygan bloklar uchun maxsus himoya
  const layoutFix = `
/* --- KENGAYTIRILGAN DESKTOP FIX --- */
div[style*="max-width: 400px"], 
div[style*="width: 25%"], 
div[style*="width: 30%"],
form[action*="login"], 
form[action*="register"] {
    width: 100% !important;
    max-width: 450px !important;
    min-width: 350px !important;
    margin-left: auto !important;
    margin-right: auto !important;
}

main, .main-content, .layout, .container {
    width: 100%;
    box-sizing: border-box;
}
/* ---------------------------------- */
`;
  
  if (!css.includes('KENGAYTIRILGAN DESKTOP FIX')) {
    fs.writeFileSync(dsPath, css + '\n' + layoutFix, 'utf8');
    console.log("✅ Barcha sahifalardagi 'telefondek torayib qolish' muammosi hal qilindi!");
  } else {
    fs.writeFileSync(dsPath, css, 'utf8');
    console.log("✅ Desktop layout yangilandi!");
  }
}
