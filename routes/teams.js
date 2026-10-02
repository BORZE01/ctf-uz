const express = require('express');
const router = express.Router();
const { teams, users, universities } = require('../utils/storage');
const { addNotification } = require('../utils/notifications');

// Barcha jamoalar
router.get('/', (req, res) => {
    const sorted = [...teams].sort((a, b) => (b.score || 0) - (a.score || 0));
    res.json({ success: true, teams: sorted });
});

// Universitetlar
router.get('/universities', (req, res) => {
    res.json({ success: true, universities });
});

// Bitta jamoa
router.get('/:id', (req, res) => {
    const team = teams.find(t => t.id === parseInt(req.params.id));
    if (!team) return res.status(404).json({ success: false, message: "Jamoa topilmadi" });

    const members = users.filter(u => u.teamId === team.id).map(u => ({
        username: u.username,
        name: u.name,
        avatar: u.avatar,
        score: u.score,
        cyberLevel: u.cyberLevel
    }));

    res.json({ success: true, team: { ...team, members } });
});

// Jamoa yaratish
router.post('/create', (req, res) => {
    if (!req.session.user) return res.status(401).json({ success: false, message: "Kirish kerak" });

    const { name, universityId } = req.body;
    if (!name || name.length < 3) {
        return res.status(400).json({ success: false, message: "Jamoa nomi kamida 3 belgi" });
    }

    if (teams.find(t => t.name.toLowerCase() === name.toLowerCase())) {
        return res.status(400).json({ success: false, message: "Bu nom band" });
    }

    const user = users.find(u => u.id === req.session.user.id);
    if (user.teamId) {
        return res.status(400).json({ success: false, message: "Siz allaqachon jamoadasiz" });
    }

    const team = {
        id: teams.length + 1,
        name,
        universityId: universityId || null,
        captain: user.id,
        members: [user.id],
        score: 0,
        createdAt: new Date()
    };

    teams.push(team);
    user.teamId = team.id;

    addNotification(user.id, `Siz "${name}" jamoasini yaratdingiz!`, 'success', '/teams/' + team.id);

    res.json({ success: true, team });
});

// Jamoaga qo'shilish
router.post('/:id/join', (req, res) => {
    if (!req.session.user) return res.status(401).json({ success: false, message: "Kirish kerak" });

    const team = teams.find(t => t.id === parseInt(req.params.id));
    if (!team) return res.status(404).json({ success: false, message: "Jamoa topilmadi" });

    const user = users.find(u => u.id === req.session.user.id);
    if (user.teamId) {
        return res.status(400).json({ success: false, message: "Siz allaqachon jamoadasiz" });
    }

    team.members.push(user.id);
    user.teamId = team.id;

    addNotification(user.id, `Siz "${team.name}" jamoasiga qo'shildingiz!`, 'success');

    res.json({ success: true, message: "Jamoada qo'shildingiz" });
});

// Jamoani tark etish
router.post('/leave', (req, res) => {
    if (!req.session.user) return res.status(401).json({ success: false, message: "Kirish kerak" });

    const user = users.find(u => u.id === req.session.user.id);
    if (!user.teamId) return res.status(400).json({ success: false, message: "Siz jamoada emassiz" });

    const team = teams.find(t => t.id === user.teamId);
    if (team) {
        const idx = team.members.indexOf(user.id);
        if (idx !== -1) team.members.splice(idx, 1);
    }

    user.teamId = null;
    res.json({ success: true, message: "Jamoadan chiqdingiz" });
});

module.exports = router;