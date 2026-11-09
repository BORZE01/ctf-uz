const express = require('express');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { requireAuth } = require('../middleware/auth');
const ArenaLabSession = require('../models/ArenaLabSession');
const ArenaLabSolve = require('../models/ArenaLabSolve');
const Activity = require('../models/Activity');
const { LABS, expectedFlag, promptFor, executeLabCommand } = require('../services/arenaLabEngine');

const router = express.Router();
router.use(requireAuth);

const MAX_COMMANDS = 600;
const HISTORY_LIMIT = 601; // Includes the initial banner plus up to 600 commands.
const MAX_OUTPUT_CHARS = 8000;

function publicLab(lab) {
  return {
    slug: lab.slug, title: lab.title, category: lab.category, difficulty: lab.difficulty,
    points: lab.points, durationMinutes: lab.durationMinutes, os: lab.os,
    attackBox: lab.attackBox, target: lab.target, description: lab.description,
    objectives: lab.objectives
  };
}

function remainingFor(session, now = Date.now()) {
  if (session.status === 'paused' || session.status === 'stopped') {
    return Math.max(0, Number(session.remainingMs || 0));
  }
  return Math.max(0, new Date(session.expiresAt).getTime() - now);
}

function appendHistory(session, entry) {
  session.terminalHistory = Array.isArray(session.terminalHistory) ? session.terminalHistory : [];
  session.terminalHistory.push({
    kind: entry.kind || 'command',
    command: String(entry.command || '').slice(0, 180),
    output: String(entry.output || '').slice(0, MAX_OUTPUT_CHARS),
    prompt: String(entry.prompt || '').slice(0, 160),
    createdAt: entry.createdAt || new Date()
  });
  if (session.terminalHistory.length > HISTORY_LIMIT) {
    session.terminalHistory = session.terminalHistory.slice(-HISTORY_LIMIT);
  }
}

function sessionPayload(session) {
  return {
    id: session._id.toString(),
    status: session.status,
    expiresAt: session.expiresAt,
    remainingMs: remainingFor(session),
    commandCount: session.commandCount,
    state: session.state,
    currentPrompt: promptFor(LABS[session.labSlug], session.state),
    terminalHistory: (session.terminalHistory || []).map(item => ({
      kind: item.kind,
      command: item.command,
      output: item.output,
      prompt: item.prompt,
      createdAt: item.createdAt
    }))
  };
}

async function pauseRunningSessions(userId, exceptId = null) {
  const running = await ArenaLabSession.find({ userId, status: 'running' });
  const now = Date.now();
  for (const session of running) {
    if (exceptId && session._id.equals(exceptId)) continue;
    const left = Math.max(0, new Date(session.expiresAt).getTime() - now);
    session.remainingMs = left;
    session.status = left > 0 ? 'paused' : 'expired';
    session.pausedAt = left > 0 ? new Date() : null;
    await session.save();
  }
}

async function ownedActiveSession(req, res) {
  if (!mongoose.Types.ObjectId.isValid(req.params.sessionId)) {
    res.status(400).json({ success: false, message: 'Lab sessiya ID noto‘g‘ri.' });
    return null;
  }
  const session = await ArenaLabSession.findOne({ _id: req.params.sessionId, userId: req.currentUser._id });
  if (!session) {
    res.status(404).json({ success: false, message: 'Lab sessiya topilmadi.' });
    return null;
  }
  if (session.status !== 'running') {
    res.status(409).json({ success: false, message: 'Lab sessiya faol emas. Saqlangan sessiyani Resume tugmasi bilan davom ettiring.' });
    return null;
  }
  if (session.expiresAt <= new Date()) {
    session.status = 'expired';
    session.remainingMs = 0;
    await session.save();
    res.status(410).json({ success: false, message: 'Lab vaqti tugadi. Yangi sessiya boshlang.' });
    return null;
  }
  return session;
}

router.get('/catalog', async (req, res) => {
  try {
    const slugs = Object.keys(LABS);
    const solved = await ArenaLabSolve.find({ userId: req.currentUser._id, labSlug: { $in: slugs } }).select('labSlug solvedAt pointsAwarded').lean();
    const solvedMap = new Map(solved.map(s => [s.labSlug, s]));
    res.json({ success: true, labs: slugs.map(slug => ({ ...publicLab(LABS[slug]), solved: solvedMap.has(slug), solvedAt: solvedMap.get(slug)?.solvedAt || null })) });
  } catch (error) {
    console.error('Arena lab catalog:', error.message);
    res.status(500).json({ success: false, message: 'Lab katalogini yuklashda xatolik.' });
  }
});

// Restore the last lab run for this account. It is intentionally keyed by the
// authenticated user, not localStorage, so it survives refresh, logout/login and
// a different browser on the same account.
router.get('/:slug/active', async (req, res) => {
  try {
    const lab = LABS[req.params.slug];
    if (!lab) return res.status(404).json({ success: false, message: 'Bunday lab mavjud emas.' });
    const session = await ArenaLabSession.findOne({ userId: req.currentUser._id, labSlug: lab.slug })
      .sort({ updatedAt: -1, startedAt: -1 });
    if (!session) return res.json({ success: true, session: null, lab: publicLab(lab) });

    if (session.status === 'running' && session.expiresAt <= new Date()) {
      session.status = 'expired';
      session.remainingMs = 0;
      await session.save();
    } else if (session.status === 'stopped') {
      // Backward compatibility for sessions created by the earlier Arena build.
      session.remainingMs = Math.max(0, new Date(session.expiresAt).getTime() - Date.now());
      session.status = session.remainingMs > 0 ? 'paused' : 'expired';
      session.pausedAt = session.status === 'paused' ? new Date() : null;
      await session.save();
    } else if (session.status === 'paused' && Number(session.remainingMs || 0) <= 0) {
      session.status = 'expired';
      session.remainingMs = 0;
      session.pausedAt = null;
      await session.save();
    }

    const priorSolve = await ArenaLabSolve.exists({ userId: req.currentUser._id, labSlug: lab.slug });
    res.set('Cache-Control', 'no-store');
    res.json({ success: true, lab: publicLab(lab), alreadySolved: Boolean(priorSolve), session: sessionPayload(session) });
  } catch (error) {
    console.error('Arena lab restore:', error.message);
    res.status(500).json({ success: false, message: 'Saqlangan lab sessiyasini tiklab bo‘lmadi.' });
  }
});

router.post('/:slug/start', async (req, res) => {
  try {
    const lab = LABS[req.params.slug];
    if (!lab) return res.status(404).json({ success: false, message: 'Bunday lab mavjud emas.' });
    const restart = req.body && req.body.restart === true;
    let previous = await ArenaLabSession.findOne({
      userId: req.currentUser._id,
      labSlug: lab.slug,
      status: { $in: ['running', 'paused', 'stopped'] }
    }).sort({ updatedAt: -1 });

    if (previous && previous.status === 'running' && previous.expiresAt <= new Date()) {
      previous.status = 'expired'; previous.remainingMs = 0; await previous.save(); previous = null;
    }
    if (previous && previous.status === 'paused' && Number(previous.remainingMs || 0) <= 0) {
      previous.status = 'expired'; previous.remainingMs = 0; await previous.save(); previous = null;
    }

    if (previous && !restart) {
      if (previous.status === 'stopped') {
        previous.status = 'paused';
        previous.remainingMs = Math.max(0, new Date(previous.expiresAt).getTime() - Date.now());
      }
      if (previous.status === 'running') {
        return res.json({ success: true, restored: true, session: sessionPayload(previous), lab: publicLab(lab), alreadySolved: Boolean(await ArenaLabSolve.exists({ userId: req.currentUser._id, labSlug: lab.slug })), prompt: promptFor(lab, previous.state), output: '' });
      }
      if (previous.status === 'paused' && previous.remainingMs > 0) {
        await pauseRunningSessions(req.currentUser._id, previous._id);
        previous.status = 'running';
        previous.expiresAt = new Date(Date.now() + previous.remainingMs);
        previous.remainingMs = null;
        previous.pausedAt = null;
        await previous.save();
        return res.json({ success: true, resumed: true, session: sessionPayload(previous), lab: publicLab(lab), alreadySolved: Boolean(await ArenaLabSolve.exists({ userId: req.currentUser._id, labSlug: lab.slug })), prompt: promptFor(lab, previous.state), output: '' });
      }
    }

    // A different room is paused, not destroyed. The user can return to it later.
    await pauseRunningSessions(req.currentUser._id);

    const now = new Date();
    const initialState = {
      connected: false, elevated: false, serviceConfigured: false,
      serviceInspected: false, aclInspected: false,
      uacDefaultConfigured: false, uacDelegateConfigured: false,
      enumerated: false, exploitPrepared: false,
      cwd: '/home/trainee', previousCwd: '', objectivesCompleted: [false, false, false, false],
      ...(lab.slug === 'codenest-linux-privesc' ? { codenest: { currentUser: 'kali', pendingAuth: '', cwd: '/home/kali' } } : {})
    };
    const banner = `CTF.UZ Arena Labs\n${lab.title} | ${lab.os}\nAttack box: ${lab.attackBox}\nTarget: ${lab.target}\n\nBu xavfsiz terminal simulyatsiyasi. Buyruqlar server operatsion tizimida bajarilmaydi.\nBoshlash uchun: ${lab.connectionCommand}\nYordam: help`;
    const session = await ArenaLabSession.create({
      userId: req.currentUser._id,
      labSlug: lab.slug,
      status: 'running',
      state: initialState,
      commandCount: 0,
      remainingMs: null,
      expiresAt: new Date(now.getTime() + lab.durationMinutes * 60 * 1000),
      terminalHistory: [{ kind: 'system', output: banner, prompt: promptFor(lab, initialState), createdAt: now }]
    });
    const priorSolve = await ArenaLabSolve.exists({ userId: req.currentUser._id, labSlug: lab.slug });
    res.status(201).json({ success: true, restored: false, session: sessionPayload(session), lab: publicLab(lab), alreadySolved: Boolean(priorSolve), prompt: promptFor(lab, session.state), output: banner });
  } catch (error) {
    console.error('Arena lab start:', error.message);
    if (error.code === 11000) return res.status(409).json({ success: false, message: 'Boshqa lab sessiyangiz ayni vaqtda ishga tushmoqda. Sahifani yangilang.' });
    res.status(500).json({ success: false, message: 'Labni ishga tushirib bo‘lmadi.' });
  }
});

router.post('/sessions/:sessionId/command', async (req, res) => {
  try {
    const session = await ownedActiveSession(req, res);
    if (!session) return;
    const raw = typeof req.body.command === 'string' ? req.body.command : '';
    if (!raw.trim() || raw.length > 180) return res.status(400).json({ success: false, message: 'Buyruq 1–180 belgi bo‘lishi kerak.' });
    if (session.commandCount >= MAX_COMMANDS) return res.status(429).json({ success: false, message: 'Lab buyruqlari limiti tugadi. Saqlangan tarixni ko‘rishingiz mumkin, yangi run boshlang.' });

    const lab = LABS[session.labSlug];
    if (!lab) return res.status(404).json({ success: false, message: 'Lab konfiguratsiyasi topilmadi.' });
    const stateBefore = session.state.toObject ? session.state.toObject() : session.state;
    const isCodenestPasswordInput = Boolean(stateBefore.codenest && stateBefore.codenest.pendingAuth);
    const promptBefore = promptFor(lab, stateBefore);
    let result;
    if (raw.trim().toLowerCase() === 'history') {
      const previousCommands = (session.terminalHistory || []).filter(item => item.kind === 'command' && item.command).slice(-30);
      const historyText = previousCommands.length
        ? previousCommands.map((item, index) => `${index + 1}  ${item.command}`).join('\n')
        : 'Hozircha buyruqlar tarixi bo‘sh.';
      result = { output: historyText, state: stateBefore, prompt: promptBefore };
    } else {
      result = executeLabCommand(lab, session._id.toString(), stateBefore, raw);
    }

    session.state = result.state;
    session.commandCount += 1;
    const isClear = result.output === '[CLEAR]';
    appendHistory(session, {
      kind: isClear ? 'clear' : 'command',
      command: isCodenestPasswordInput ? '********' : raw.trim(),
      output: isClear ? '' : result.output,
      prompt: promptBefore
    });
    await session.save();
    res.json({
      success: true, output: result.output, prompt: result.prompt,
      state: { connected: result.state.connected, elevated: result.state.elevated, cwd: result.state.cwd, objectivesCompleted: result.state.objectivesCompleted || [] },
      commandCount: session.commandCount, expiresAt: session.expiresAt,
      remainingMs: remainingFor(session)
    });
  } catch (error) {
    console.error('Arena lab command:', error.message);
    if (error.name === 'VersionError') return res.status(409).json({ success: false, message: 'Terminal holati boshqa oynada yangilandi. Sahifani qayta yuklab, sessiyani tiklang.' });
    res.status(500).json({ success: false, message: 'Buyruqni bajarishda xatolik.' });
  }
});

router.post('/sessions/:sessionId/submit', async (req, res) => {
  try {
    const session = await ownedActiveSession(req, res);
    if (!session) return;
    if (!session.state.elevated) return res.status(403).json({ success: false, message: 'Avval lab maqsadidagi yuqori ruxsat darajasiga chiqing.' });

    const lab = LABS[session.labSlug];
    const supplied = typeof req.body.flag === 'string' ? req.body.flag.trim() : '';
    if (!supplied || supplied.length > 120) return res.status(400).json({ success: false, message: 'Flag bo‘sh bo‘lmasligi va 120 belgidan oshmasligi kerak.' });
    const expected = expectedFlag(session._id.toString(), lab.slug);
    const suppliedDigest = crypto.createHash('sha256').update(supplied).digest();
    const expectedDigest = crypto.createHash('sha256').update(expected).digest();
    if (!crypto.timingSafeEqual(suppliedDigest, expectedDigest)) return res.status(400).json({ success: false, message: 'Flag noto‘g‘ri. Target terminalidagi flag faylini tekshiring.' });

    const flagDigest = crypto.createHash('sha256').update(expected).digest('hex');
    try {
      await ArenaLabSolve.create({ userId: req.currentUser._id, labSlug: lab.slug, pointsAwarded: lab.points, flagDigest });
    } catch (error) {
      if (error.code === 11000) {
        session.status = 'completed'; session.completedAt = new Date();
        session.state.objectivesCompleted = [true, true, true, true];
        appendHistory(session, { kind: 'system', output: 'Lab avval yechilgan. Ball qayta qo‘shilmadi.', prompt: promptFor(lab, session.state) });
        await session.save();
        return res.json({ success: true, alreadySolved: true, pointsAwarded: 0, message: 'Lab avval yechilgan. Ball qayta qo‘shilmadi.' });
      }
      throw error;
    }

    try {
      req.currentUser.score = (req.currentUser.score || 0) + lab.points;
      req.currentUser.xp = (req.currentUser.xp || 0) + lab.points;
      req.currentUser.skills = req.currentUser.skills || {};
      req.currentUser.skills[lab.skill] = (req.currentUser.skills[lab.skill] || 0) + lab.points;
      await req.currentUser.save();
    } catch (error) {
      await ArenaLabSolve.deleteOne({ userId: req.currentUser._id, labSlug: lab.slug });
      throw error;
    }

    session.status = 'completed'; session.completedAt = new Date();
    session.state.objectivesCompleted = [true, true, true, true];
    appendHistory(session, { kind: 'system', output: `Tabriklaymiz! ${lab.title} muvaffaqiyatli yakunlandi. +${lab.points} XP`, prompt: promptFor(lab, session.state) });
    await session.save();
    Activity.create({ userId: req.currentUser._id, type: 'solve', title: `${lab.title} lab yechildi`, description: `Arena Labs orqali ${lab.points} XP olindi.`, icon: '🖥️', metadata: { labSlug: lab.slug, points: lab.points } }).catch(() => {});

    res.json({ success: true, alreadySolved: false, pointsAwarded: lab.points, score: req.currentUser.score, xp: req.currentUser.xp, message: `Tabriklaymiz! ${lab.title} muvaffaqiyatli yakunlandi. +${lab.points} XP` });
  } catch (error) {
    console.error('Arena lab submit:', error.message);
    if (error.name === 'VersionError') return res.status(409).json({ success: false, message: 'Sessiya boshqa oynada yakunlandi. Sahifani yangilab holatni tekshiring.' });
    res.status(500).json({ success: false, message: 'Flagni tekshirishda server xatoligi.' });
  }
});

router.post('/sessions/:sessionId/stop', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.sessionId)) return res.status(400).json({ success: false, message: 'Sessiya ID noto‘g‘ri.' });
    const session = await ArenaLabSession.findOne({ _id: req.params.sessionId, userId: req.currentUser._id });
    if (!session) return res.status(404).json({ success: false, message: 'Lab sessiya topilmadi.' });
    if (session.status === 'running') {
      session.remainingMs = Math.max(0, new Date(session.expiresAt).getTime() - Date.now());
      session.status = session.remainingMs > 0 ? 'paused' : 'expired';
      session.pausedAt = session.status === 'paused' ? new Date() : null;
      appendHistory(session, { kind: 'system', output: 'Lab pauza qilindi. Terminal tarixi va progress saqlandi; Resume bilan davom ettirishingiz mumkin.', prompt: promptFor(LABS[session.labSlug], session.state) });
      await session.save();
    }
    res.json({ success: true, status: session.status, remainingMs: remainingFor(session), message: session.status === 'paused' ? 'Lab pauza qilindi. Progress saqlandi.' : 'Lab to‘xtatildi.' });
  } catch (error) {
    console.error('Arena lab stop:', error.message);
    if (error.name === 'VersionError') return res.status(409).json({ success: false, message: 'Sessiya boshqa oynada yangilandi. Sahifani yangilang.' });
    res.status(500).json({ success: false, message: 'Labni to‘xtatib bo‘lmadi.' });
  }
});

module.exports = router;
