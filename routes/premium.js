const express = require('express');
const router = express.Router();
const path = require('path');

// Tariflar sahifasini ko'rsatish
router.get('/pricing', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'pricing.html'));
});

// To'lovni boshlash API (Keyingi bosqich uchun tayyorlab ketamiz)
router.post('/api/checkout', (req, res) => {
    // Bu yerda Click/Payme integratsiyasi bo'ladi
    return res.status(501).json({ success: false, message: "To'lov tizimi (Click/Payme) hali ulanmagan" });
});

module.exports = router;