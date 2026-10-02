const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

// ══════════════════════════════════════════
// LOG YOZISH
// ══════════════════════════════════════════
function writeLog(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        level,
        message,
        ...meta
    };

    // Console
    const emoji = { info: 'ℹ️', warn: '⚠️', error: '❌', success: '✅' }[level] || '📝';
    console.log(`${emoji} [${level.toUpperCase()}] ${message}`, Object.keys(meta).length ? meta : '');

    // Fayl
    const date = new Date().toISOString().slice(0, 10);
    const logFile = path.join(logsDir, `${date}.log`);
    const line = JSON.stringify(logEntry) + '\n';

    fs.appendFile(logFile, line, (err) => {
        if (err) console.error('Log yozish xatosi:', err.message);
    });
}

// ══════════════════════════════════════════
// LOGGER API
// ══════════════════════════════════════════
const logger = {
    info: (msg, meta) => writeLog('info', msg, meta),
    warn: (msg, meta) => writeLog('warn', msg, meta),
    error: (msg, meta) => writeLog('error', msg, meta),
    success: (msg, meta) => writeLog('success', msg, meta)
};

module.exports = logger;