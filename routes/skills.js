const express = require('express');
const router = express.Router();
const { skillCategories, users, challenges, submissions } = require('../utils/storage');
const { calculateSkillScores } = require('../utils/scoring');

// === BARCHA SKILL KATEGORIYALAR ===
router.get('/categories', (req, res) => {
    res.json({ success: true, categories: skillCategories });
});

// === FOYDALANUVCHI SKILLS ===
router.get('/my', (req, res) => {
    if (!req.session.user) return res.status(401).json({ success: false, message: "Avval tizimga kiring" });

    const user = users.find(u => u.id === req.session.user.id);
    if (!user) return res.status(404).json({ success: false, message: "Topilmadi" });

    const skills = calculateSkillScores(user, challenges, submissions);
    res.json({ success: true, skills });
});

// === TOP SPECIALISTS ===
router.get('/top/:skill', (req, res) => {
    const { skill } = req.params;
    const topUsers = users
        .map(u => ({
            username: u.username,
            name: u.name,
            skillScore: calculateSkillScores(u, challenges, submissions)[skill] || 0
        }))
        .sort((a, b) => b.skillScore - a.skillScore)
        .slice(0, 10);

    res.json({ success: true, top: topUsers });
});

module.exports = router;