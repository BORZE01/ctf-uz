const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const Application = require('../models/Application');

router.post('/:id/apply', async (req, res) => {
    if (!req.session || !req.session.user) return res.status(401).json({ success: false, message: 'Kiring' });
    try {
        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ success: false });
        
        await Application.create({
            job: job._id, employer: job.author, candidate: req.session.user.id, status: 'new'
        });
        res.json({ success: true, message: "Ariza yuborildi" });
    } catch(e) { res.status(500).json({ success: false }); }
});
module.exports = router;
