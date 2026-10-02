const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { calculateElo } = require('../utils/scoring');

// Hozircha oddiy versiya
router.get('/', (req, res) => {
    res.json({ success: true, battles: [] });
});

router.post('/create', async (req, res) => {
    res.json({ success: false, message: "Battle tez orada" });
});

module.exports = router;