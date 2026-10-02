const express = require('express');
const router = express.Router();
const {
    getNotifications, markAsRead, markAllAsRead,
    getUnreadCount, deleteNotification
} = require('../utils/notifications');

// Barcha bildirishnomalar
router.get('/', (req, res) => {
    if (!req.session.user) return res.status(401).json({ success: false, message: "Kirish kerak" });
    res.json({
        success: true,
        notifications: getNotifications(req.session.user.id),
        unread: getUnreadCount(req.session.user.id)
    });
});

// O'qilgan deb belgilash
router.put('/:id/read', (req, res) => {
    if (!req.session.user) return res.status(401).json({ success: false, message: "Kirish kerak" });
    const ok = markAsRead(req.session.user.id, parseFloat(req.params.id));
    res.json({ success: ok });
});

// Hammasini o'qilgan
router.put('/read-all', (req, res) => {
    if (!req.session.user) return res.status(401).json({ success: false, message: "Kirish kerak" });
    markAllAsRead(req.session.user.id);
    res.json({ success: true });
});

// O'chirish
router.delete('/:id', (req, res) => {
    if (!req.session.user) return res.status(401).json({ success: false, message: "Kirish kerak" });
    const ok = deleteNotification(req.session.user.id, parseFloat(req.params.id));
    res.json({ success: ok });
});

// Unread count
router.get('/unread', (req, res) => {
    if (!req.session.user) return res.json({ success: true, count: 0 });
    res.json({ success: true, count: getUnreadCount(req.session.user.id) });
});

module.exports = router;