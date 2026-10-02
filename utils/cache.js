// Redis mavjud bo'lsa ishlatiladi
let redis = null;

try {
    const Redis = require('ioredis');
    if (process.env.REDIS_URL) {
        redis = new Redis(process.env.REDIS_URL, {
            maxRetriesPerRequest: 3,
            retryStrategy: (times) => Math.min(times * 50, 2000)
        });

        redis.on('connect', () => console.log('✅ Redis ulandi'));
        redis.on('error', (err) => console.warn('⚠️ Redis xatosi:', err.message));
    }
} catch (e) {
    console.log('⚠️ Redis yo\'q — caching o\'chirilgan');
}

// ══════════════════════════════════════════
// CACHE HELPER
// ══════════════════════════════════════════
async function get(key) {
    if (!redis) return null;
    try {
        const data = await redis.get(key);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        return null;
    }
}

async function set(key, value, ttlSeconds = 60) {
    if (!redis) return false;
    try {
        await redis.setex(key, ttlSeconds, JSON.stringify(value));
        return true;
    } catch (e) {
        return false;
    }
}

async function del(key) {
    if (!redis) return false;
    try {
        await redis.del(key);
        return true;
    } catch (e) {
        return false;
    }
}

async function delPattern(pattern) {
    if (!redis) return false;
    try {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) await redis.del(...keys);
        return true;
    } catch (e) {
        return false;
    }
}

module.exports = { redis, get, set, del, delPattern };