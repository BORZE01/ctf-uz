const express = require('express');
const router = express.Router();
const { writeups, users, challenges } = require('../utils/storage');
const { addNotification } = require('../utils/notifications');
const { escapeHtml } = require('../middleware/security');

// Barcha writeup lar
router.get('/', (req, res) => {
    const published = writeups
        .filter(w => w.published)
        .map(w => {
            const user = users.find(u => u.id === w.userId);
            const challenge = challenges.find(c => c.id === w.challengeId);
            return {
                id: w.id,
                title: w.title,
                excerpt: w.content.slice(0, 200) + '...',
                challengeTitle: challenge?.title || 'N/A',
                author: user?.username || 'unknown',
                authorAvatar: user?.avatar,
                votes: w.votes || 0,
                createdAt: w.createdAt
            };
        });
    res.json({ success: true, writeups: published });
});

// Bitta writeup
router.get('/:id', (req, res) => {
    const w = writeups.find(x => x.id === parseInt(req.params.id));
    if (!w) return res.status(404).json({ success: false, message: "Topilmadi" });

    const user = users.find(u => u.id === w.userId);
    const challenge = challenges.find(c => c.id === w.challengeId);

    res.json({
        success: true,
        writeup: {
            ...w,
            author: user?.username,
            authorAvatar: user?.avatar,
            challengeTitle: challenge?.title
        }
    });
});

// Writeup yaratish
router.post('/', (req, res) => {
    if (!req.session.user) return res.status(401).json({ success: false, message: "Kirish kerak" });

    const { challengeId, title, content } = req.body;

    if (!challengeId || !title || !content) {
        return res.status(400).json({ success: false, message: "Barcha maydonlar shart" });
    }

    const user = users.find(u => u.id === req.session.user.id);
    if (!user.solvedChallenges.includes(parseInt(challengeId))) {
        return res.status(400).json({ success: false, message: "Avval challenge ni yeching" });
    }

    const writeup = {
        id: writeups.length + 1,
        userId: user.id,
        challengeId: parseInt(challengeId),
        title: escapeHtml(title),
        content: escapeHtml(content),
        votes: 0,
        voters: [],
        published: true,
        createdAt: new Date()
    };

    writeups.push(writeup);
    res.json({ success: true, writeup });
});

// Ovoz berish
router.post('/:id/vote', (req, res) => {
    if (!req.session.user) return res.status(401).json({ success: false, message: "Kirish kerak" });

    const w = writeups.find(x => x.id === parseInt(req.params.id));
    if (!w) return res.status(404).json({ success: false, message: "Topilmadi" });

    if (w.voters.includes(req.session.user.id)) {
        return res.status(400).json({ success: false, message: "Siz allaqachon ovoz bergansiz" });
    }

    w.votes++;
    w.voters.push(req.session.user.id);

    addNotification(w.userId, `Sizning writeupingizga ovoz berildi!`, 'success');

    res.json({ success: true, votes: w.votes });
});

module.exports = router;