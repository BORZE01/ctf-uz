const express = require('express');
const router = express.Router();
const { events } = require('../utils/storage');

router.get('/', (req, res) => {
    res.json({ success: true, events });
});

router.get('/:id', (req, res) => {
    const event = events.find(e => e.id === parseInt(req.params.id));
    if (!event) return res.status(404).json({ success: false, message: "Topilmadi" });
    res.json({ success: true, event });
});

router.post('/:id/join', (req, res) => {
    if (!req.session.user) return res.status(401).json({ success: false, message: "Avval tizimga kiring" });
    const event = events.find(e => e.id === parseInt(req.params.id));
    if (!event) return res.status(404).json({ success: false, message: "Topilmadi" });
    event.participants += 1;
    res.json({ success: true, message: "Eventga qo'shildingiz" });
});

module.exports = router;