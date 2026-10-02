const express = require('express');
const router = express.Router();
const LOCATIONS = require('../utils/locations');

// Barcha viloyatlar
router.get('/regions', (req, res) => {
    const regions = Object.keys(LOCATIONS).map(name => ({
        name,
        citiesCount: LOCATIONS[name].cities.length,
        districtsCount: LOCATIONS[name].districts.length
    }));
    res.json({ success: true, regions });
});

// Viloyat bo'yicha shahar va tumanlar
router.get('/regions/:region', (req, res) => {
    const region = req.params.region;
    if (!LOCATIONS[region]) {
        return res.status(404).json({ success: false, message: "Viloyat topilmadi" });
    }
    res.json({
        success: true,
        region,
        cities: LOCATIONS[region].cities,
        districts: LOCATIONS[region].districts
    });
});

module.exports = router;