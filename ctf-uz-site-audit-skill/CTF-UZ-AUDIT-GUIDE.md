# CTF-UZ uchun Site Audit Skill

Bu kichik paketni mavjud `ctf-uz` loyihasining ildiziga oching. U faqat yangi Skill faylini qo‘shadi; mavjud fayllarni almashtirmaydi.

Yangi fayl:
`.claude/skills/site-audit/SKILL.md`

Loyiha tekshiruvida e'tibor berilgan jihatlar:
- Node.js 18+, Express server (`server.js`)
- frontend HTML fayllari `public/` ichida
- API route modullari `routes/` ichida
- Jest/Supertest testlari `tests/` ichida
- MongoDB/Mongoose va Redis bilan bog‘liq konfiguratsiya ehtimoli
- autentifikatsiya, admin bo‘limlari, CTF challenge, progress/score kabi ma'lumotni o‘zgartirishi mumkin bo‘lgan amallar

## O‘rnatish

1. ZIP faylni oching.
2. Ichidagi `.claude` papkasini `ctf-uz` loyihangizning ildiziga ko‘chiring.
3. Agar `.claude` papkasi avvaldan mavjud bo‘lsa, uni almashtirmang; ichidagi `skills/site-audit/SKILL.md` faylini qo‘shing.
4. VS Code’da `ctf-uz` ildiz papkasini oching.
5. Terminalda `claude` buyrug‘i bilan Claude Code’ni ishga tushiring (agar allaqachon ishlayotgan bo‘lsa, qayta ishga tushirish mumkin).
6. Claude Code ichida `/site-audit` deb yuboring.

## Xavfsizlik

- Skill standart holatda faqat audit qiladi, kodni o‘zgartirmaydi.
- `npm test` ishga tushirishdan avval testlar qaysi ma'lumotlar bazasidan foydalanishini tekshirish kerak.
- Audit vaqtida seed/reset/clear/patch/restore skriptlarini ishga tushirmaslik kerak.
- `.env`, cookie, token va sessiya ma'lumotlarini hisobotga yozmang.
- Challenge flag topshirish, score/progress o‘zgartirish, sertifikat chiqarish yoki admin amallarini production muhitida sinamang.
- Playwright yo‘q bo‘lsa, Claude’dan uni darhol o‘rnatishni emas, avval o‘rnatish rejasini so‘rash kerak.

## Ishlayotgan sayt URL manzili

Claude Code’ga URL ma'lum bo‘lmasa, o‘zingizning local yoki staging manzilingizni yuboring. Masalan:
`/site-audit audit local URL http://localhost:3000`

Portni loyiha konfiguratsiyasi yoki terminal chiqishidan tekshiring; `3000` faqat misol.
