const express = require('express');
const router = express.Router();
const { learningPaths } = require('../utils/storage');

router.get('/paths', (req, res) => {
    res.json({ success: true, paths: learningPaths });
});

router.get('/path/:id', (req, res) => {
    const path = learningPaths.find(p => p.id === parseInt(req.params.id));
    if (!path) return res.status(404).json({ success: false, message: "Topilmadi" });
    res.json({ success: true, path });
});

module.exports = router;