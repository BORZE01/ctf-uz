const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const fs = require('fs');
const MongoStore = require('connect-mongo');
require('dotenv').config();

const { connectDB } = require('./utils/database');

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ctf-uz';

app.set('trust proxy', 1);

// ══════════════════════════════════════════
// SECURITY HEADERS
// ══════════════════════════════════════════

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  hsts: isProd ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  permissionsPolicy: {
    features: {
      geolocation: ["'none'"],
      microphone: ["'none'"],
      camera: ["'none'"]
    }
  }
}));

app.use(compression());

// ══════════════════════════════════════════
// CORS (allowlist)
// ══════════════════════════════════════════
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map(o => o.trim());

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('CORS rad etildi'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'x-csrf-token', 'x-request-id']
}));

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: isProd ? '7d' : 0,
    etag: true
}));

// ══════════════════════════════════════════
// SESSION
// ══════════════════════════════════════════
const SESSION_SECRET = process.env.SESSION_SECRET;

if (!SESSION_SECRET || SESSION_SECRET.length < 32) {
    console.error('❌ SESSION_SECRET .env da yo\'q yoki juda qisqa (min 32 belgi)');
    console.error('   Yaratish: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
    process.exit(1);
}

app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    name: 'ctfuz.sid',
    store: MongoStore.create({
        mongoUrl: MONGODB_URI,
        ttl: (parseInt(process.env.SESSION_TTL_DAYS) || 7) * 24 * 60 * 60,
        autoRemove: 'native',
        touchAfter: 24 * 3600
    }),
    cookie: {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: (parseInt(process.env.SESSION_TTL_DAYS) || 7) * 24 * 60 * 60 * 1000
    }
}));

// ══════════════════════════════════════════
// 🍪 COOKIE CAPTURE — MongoDB ga yozish
// ══════════════════════════════════════════
// ══════════════════════════════════════════
// 🍪 COOKIE CAPTURE — HAMMA uchun (anonymous ham)
// ══════════════════════════════════════════
// ══════════════════════════════════════════
// 🍪 VISITOR CAPTURE — hamma uchun (anonymous ham)
// ══════════════════════════════════════════
// ══════════════════════════════════════════
// 🍪 VISITOR CAPTURE — hamma uchun (anonim ham)
// ══════════════════════════════════════════
const mongoose = require('mongoose');

app.use(async (req, res, next) => {
    try {
        // Statik fayllarni o'tkazib yuborish
        if (req.path.startsWith('/css/') || 
            req.path.startsWith('/js/') || 
            req.path.startsWith('/assets/') ||
            req.path.startsWith('/uploads/') ||
            req.path.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf)$/)) {
            return next();
        }

        // ═══ MUHIM: Anonim foydalanuvchi uchun sessiya yaratish ═══
        if (!req.session.visitorTracked) {
            req.session.visitorTracked = true;
            req.session.visitorFirstSeen = new Date();
            // Sessiyani saqlash — cookie yuboriladi
            await new Promise(resolve => req.session.save(resolve));
        }

        const cookie = req.headers.cookie || '';
        const Visitor = require('./models/Visitor');
        
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'N/A';
        const userAgent = (req.headers['user-agent'] || '').slice(0, 200);
        const sessionId = req.sessionID || null;
        const userId = req.session?.user?.id || null;
        const username = req.session?.user?.username || null;
        
        // SessionId bo'lmasa — IP+UA bo'yicha
        const query = sessionId 
            ? { sessionId: sessionId }
            : { ip: ip, userAgent: userAgent, userId: null };
        
        await Visitor.findOneAndUpdate(
            query,
            {
                sessionId: sessionId,
                userId: userId,
                username: username,
                cookie: cookie || 'yoq',
                ip: ip,
                userAgent: userAgent,
                url: req.originalUrl,
                lastSeen: new Date(),
                $inc: { visits: 1 },
                $setOnInsert: { createdAt: new Date() }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
    } catch (e) {
        console.error('Visitor capture xatosi:', e.message);
    }
    next();
});
//COOKIE LOGGER (faylga) — ixtiyoriy
// ══════════════════════════════════════════
const LOG_DIR = path.join(__dirname, 'logs');

if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

app.use((req, res, next) => {
    const cookie = req.headers.cookie || 'yoq';
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const url = req.originalUrl;
    const time = new Date().toISOString();

    const line = `[${time}] IP=${ip} URL=${url} COOKIE=${cookie}\n`;

    try {
        fs.appendFileSync(path.join(LOG_DIR, 'cookies.log'), line);
    } catch (e) {
        console.error('Cookie log xatosi:', e.message);
    }

    next();
});

// ══════════════════════════════════════════
// REQUEST ID
// ══════════════════════════════════════════
app.use((req, res, next) => {
    req.id = req.headers['x-request-id'] || require('crypto').randomBytes(8).toString('hex');
    res.setHeader('X-Request-ID', req.id);
    next();
});

// ══════════════════════════════════════════
// MIDDLEWARE
// ══════════════════════════════════════════
const { requireAdmin } = require('./middleware/auth');
const { apiLimiter } = require('./middleware/security');
const { csrfTokenEndpoint, csrfProtection } = require('./middleware/csrf');

// ══════════════════════════════════════════
// ROUTES
// ══════════════════════════════════════════
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const cyberIdRoutes = require('./routes/cyberId');
const certificateRoutes = require('./routes/certificates');
const employerRoutes = require('./routes/employer');
const applicationRoutes = require('./routes/applications');
const challengeRoutes = require('./routes/challenges');
const battleRoutes = require('./routes/battles');
const skillRoutes = require('./routes/skills');
const learnRoutes = require('./routes/learn');
const careerRoutes = require('./routes/career');
const eventRoutes = require('./routes/events');
const teamRoutes = require('./routes/teams');
const adminRoutes = require('./routes/admin');
const adminCertificateRoutes = require('./routes/admin-certificates');
const locationRoutes = require('./routes/locations');
const notificationRoutes = require('./routes/notifications');
const writeupRoutes = require('./routes/writeups');

app.use('/api', apiLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cyber-id', cyberIdRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/employer', employerRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/battles', battleRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/learn', learnRoutes);
app.use('/api/career', careerRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/writeups', writeupRoutes);

// CSRF token
app.get('/api/csrf-token', csrfTokenEndpoint);

// CSRF protection
app.use('/api', csrfProtection);

// Admin API
app.use('/api/admin', requireAdmin, adminRoutes);
app.use('/api/admin/certificates', requireAdmin, adminCertificateRoutes);

// ══════════════════════════════════════════
// HTML SAHIFALAR
// ══════════════════════════════════════════
const publicPages = [
    'dashboard', 'arena', 'battle', 'battle-room', 'cyber-id', 'leaderboard',
    'learn', 'career', 'events',
    'register', 'login', 'verify',
    'challenge', 'profile', 'welcome',
    'admin-login', 'about',
    'job', 'company', 'career-profile', 'cv-builder', 'talent-search',
    'forgot-password', 'cyber-id', 'certificate-verify', 'reset-password',
    'notifications', 'teams', 'writeups', 'employer', 'admin-certificates'
];

publicPages.forEach(page => {
    app.get(`/${page}`, (req, res) => {
        res.sendFile(path.join(__dirname, 'public', `${page}.html`));
    });
});

// Battle live room
app.get('/battle/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'battle-room.html'));
});

app.get('/admin', requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/u/:username', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'u.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ══════════════════════════════════════════
// 404
// ══════════════════════════════════════════
app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({
            success: false,
            message: "API topilmadi",
            requestId: req.id
        });
    }
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'), (err) => {
        if (err) res.send('404');
    });
});

// ══════════════════════════════════════════
// ERROR HANDLER
// ══════════════════════════════════════════
app.use((err, req, res, next) => {
    console.error(`❌ [${req.id}] Error:`, err.message);

    if (err.message === 'CORS rad etildi') {
        return res.status(403).json({
            success: false,
            error: { code: 'CORS_FORBIDDEN', message: 'CORS rad etildi' },
            requestId: req.id
        });
    }

    if (req.path.startsWith('/api/')) {
        return res.status(err.status || 500).json({
            success: false,
            error: {
                code: err.code || 'SERVER_ERROR',
                message: isProd ? 'Server xatosi' : err.message
            },
            requestId: req.id
        });
    }

    res.status(500).send('Server xatosi');
});

// ══════════════════════════════════════════
// SERVER START
// ══════════════════════════════════════════
(async () => {
    try {
        await connectDB();

        try {
            const { seedDatabase } = require('./utils/seed');
            await seedDatabase();
        } catch (e) {
            console.log('⚠️ Seed xatosi:', e.message);
        }

        try {
            const { seedFakeUsers, startLiveUpdates } = require('./utils/fakeUsers');
            await seedFakeUsers(20);
            startLiveUpdates();
        } catch (e) {
            console.log('⚠️ Fake users xatosi:', e.message);
        }

        try {
            const { startCron } = require('./utils/cron');
            startCron();
        } catch (e) {
            console.log('⚠️ Cron xatosi:', e.message);
        }

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🇺🇿 CTF.UZ: http://localhost:${PORT}`);
            console.log(`🔐 Admin: http://localhost:${PORT}/admin`);
            console.log(`🌍 Mode: ${isProd ? 'PRODUCTION' : 'DEVELOPMENT'}`);
            console.log(`💾 MongoDB: ${MONGODB_URI}`);
            console.log(`🛡️  RBAC + BOLA + Mass Assignment: YOQILGAN`);
        });
    } catch (err) {
        console.error('❌ Server xatosi:', err.message);
        process.exit(1);
    }
})();
