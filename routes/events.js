const express = require('express');
const router = express.Router();
const Event = require('../models/Event');

// ══════════════════════════════════════════
// BARCHA EVENTS
// ══════════════════════════════════════════
router.get('/', async (req, res) => {
    try {
        const events = await Event.find()
            .sort({ startDate: -1 })
            .limit(50)
            .lean();

        res.json({ 
            success: true, 
            events: events.map(e => ({
                id: e._id.toString(),
                title: e.title,
                type: e.type,
                description: e.description,
                icon: e.icon,
                startDate: e.startDate,
                endDate: e.endDate,
                participants: e.participants || 0,
                status: e.status,
                createdAt: e.createdAt
            }))
        });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).lean();
        if (!event) return res.status(404).json({ success: false, message: "Topilmadi" });
        res.json({ success: true, event });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

router.post('/:id/join', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ success: false, message: "Avval tizimga kiring" });
        }
        const event = await Event.findByIdAndUpdate(
            req.params.id,
            { $inc: { participants: 1 } },
            { new: true }
        );
        if (!event) return res.status(404).json({ success: false, message: "Topilmadi" });
        res.json({ success: true, message: "Eventga qo'shildingiz" });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

module.exports = router;
