// IPv4 ni majburlash
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const TelegramBot = require('node-telegram-bot-api');

const VERIFY_BOT_TOKEN = process.env.VERIFY_BOT_TOKEN;
const ADMIN_BOT_TOKEN = process.env.ADMIN_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

let verifyBot = null;
let adminBot = null;

// ══════════════════════════════════════════
// CHAT ID XOTIRASI
// ══════════════════════════════════════════
const userChatIds = new Map();
const phoneChatIds = new Map();

// ══════════════════════════════════════════
// VERIFY BOT
// ══════════════════════════════════════════
if (VERIFY_BOT_TOKEN) {
    try {
        verifyBot = new TelegramBot(VERIFY_BOT_TOKEN, { 
            polling: {
                interval: 3000,
                autoStart: true,
                params: { timeout: 10 }
            }
        });

        // Polling xatolarini ushlash
        verifyBot.on('polling_error', (error) => {
            if (!global._tgPollingErrorShown) {
                console.log('⚠️ Telegram polling vaqtincha ishlamayapti:', error.code || error.message);
                global._tgPollingErrorShown = true;
                setTimeout(() => { global._tgPollingErrorShown = false; }, 60000);
            }
        });

        verifyBot.on('error', (error) => {
            if (!global._tgErrorShown) {
                console.log('⚠️ Telegram xatosi:', error.message);
                global._tgErrorShown = true;
                setTimeout(() => { global._tgErrorShown = false; }, 60000);
            }
        });

        verifyBot.onText(/\/start/, (msg) => {
            const chatId = msg.chat.id;
            const username = msg.from.username;
            const firstName = msg.from.first_name || '';

            console.log(`📩 /start: chatId=${chatId}, username=${username}, name=${firstName}`);

            if (username) {
                userChatIds.set(username.toLowerCase(), chatId);
                console.log(`✅ Username saqlandi: @${username} → ${chatId}`);
            }

            if (msg.contact && msg.contact.phone_number) {
                const phone = msg.contact.phone_number;
                phoneChatIds.set(phone, chatId);
                console.log(`✅ Telefon saqlandi: ${phone} → ${chatId}`);
            }

            verifyBot.sendMessage(chatId,
                `👋 Salom, ${firstName}!\n\n` +
                `🎯 Bu CTF.UZ tasdiqlash boti.\n\n` +
                `📌 <b>Username:</b> @${username || 'yo\'q'}\n` +
                `🆔 <b>Chat ID:</b> <code>${chatId}</code>\n\n` +
                `✍️ Ro'yxatdan o'tishda <b>username'ingizni</b> kiriting — kod shu chatga keladi.\n\n` +
                `📞 Telefon raqamingizni ulashish uchun pastdagi tugmani bosing.`,
                {
                    parse_mode: 'HTML',
                    reply_markup: {
                        keyboard: [[{ text: '📞 Telefon raqamni ulashish', request_contact: true }]],
                        resize_keyboard: true,
                        one_time_keyboard: true
                    }
                }
            ).catch(e => console.log('⚠️ Xabar yuborish xatosi:', e.code || e.message));
        });

        verifyBot.on('contact', (msg) => {
            const chatId = msg.chat.id;
            const phone = msg.contact.phone_number;
            phoneChatIds.set(phone, chatId);
            console.log(`✅ Kontakt saqlandi: ${phone} → ${chatId}`);
            verifyBot.sendMessage(chatId, `✅ Telefon raqamingiz saqlandi!`)
                .catch(e => {});
        });

        console.log('✅ Verify bot ishga tushdi');
    } catch (e) {
        console.error('❌ Verify bot xatosi:', e.message);
    }
} else {
    console.error('❌ VERIFY_BOT_TOKEN .env da yo\'q');
}

// ══════════════════════════════════════════
// ADMIN BOT
// ══════════════════════════════════════════
if (ADMIN_BOT_TOKEN && ADMIN_CHAT_ID) {
    try {
        adminBot = new TelegramBot(ADMIN_BOT_TOKEN, { polling: false });
        console.log('✅ Admin bot tayyor');
    } catch (e) {
        console.error('❌ Admin bot xatosi:', e.message);
    }
}

// ══════════════════════════════════════════
// VERIFY KOD YUBORISH
// ══════════════════════════════════════════
async function sendVerifyCode(username, code, name, email) {
    // Har doim konsolga chiqarish (debug uchun)
    console.log(`\n🔑 VERIFY CODE: ${code} | username: ${username} | email: ${email}\n`);

    if (!verifyBot) {
        console.log('⚠️ Verify bot ishlamayapti — kod faqat konsolda');
        return false;
    }

    // Chat ID ni topish
    let chatId = null;
    let target = 'admin';

    if (username) {
        chatId = userChatIds.get(username.toLowerCase());
        if (chatId) target = `@${username}`;
    }

    // Topilmasa — admin chatiga
    if (!chatId) {
        chatId = ADMIN_CHAT_ID;
        target = 'admin';
    }

    const message = 
        `🔐 <b>Tasdiqlash kodi</b>\n\n` +
        `👤 Ism: <b>${name}</b>\n` +
        `📛 Username: <b>@${username}</b>\n` +
        `📧 Email: <code>${email}</code>\n\n` +
        `🔑 Kod: <code>${code}</code>\n\n` +
        `⏱ Kod 10 daqiqa amal qiladi.`;

    // 1-urinish: user chatiga
    if (chatId && chatId !== ADMIN_CHAT_ID) {
        try {
            await verifyBot.sendMessage(chatId, message, { parse_mode: 'HTML' });
            console.log(`✅ Kod yuborildi: ${target} (chatId=${chatId})`);
            return true;
        } catch (e) {
            console.log(`⚠️ @${username} ga yuborilmadi: ${e.code || e.message}`);
        }
    }

    // 2-urinish: admin chatiga
    if (ADMIN_CHAT_ID) {
        try {
            await verifyBot.sendMessage(ADMIN_CHAT_ID, message, { parse_mode: 'HTML' });
            console.log(`✅ Kod admin chatiga yuborildi (chatId=${ADMIN_CHAT_ID})`);
            return true;
        } catch (e) {
            console.log(`⚠️ Admin chatiga ham yuborilmadi: ${e.code || e.message}`);
            console.log(`🔑 Kod konsolda: ${code}`);
        }
    }

    return false;
}

// ══════════════════════════════════════════
// ADMIN XABAR
// ══════════════════════════════════════════
async function sendAdminMessage(message, parseMode = 'HTML') {
    if (!adminBot || !ADMIN_CHAT_ID) return false;
    try {
        await adminBot.sendMessage(ADMIN_CHAT_ID, message, { parse_mode: parseMode });
        return true;
    } catch (e) {
        console.log('⚠️ Admin xabar xatosi:', e.code || e.message);
        return false;
    }
}

module.exports = {
    sendVerifyCode,
    sendAdminMessage,
    verifyBot,
    adminBot,
    userChatIds,
    phoneChatIds
};
