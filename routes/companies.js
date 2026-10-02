const express = require('express');
const router = express.Router();
const { companies, jobs } = require('../utils/storage');

router.get('/', (req, res) => {
    const companiesWithJobs = companies.map(c => ({
        ...c,
        jobsCount: jobs.filter(j => j.companyId === c.id).length
    }));
    res.json({ success: true, companies: companiesWithJobs });
});

router.get('/:id', (req, res) => {
    const company = companies.find(c => c.id === parseInt(req.params.id));
    if (!company) return res.status(404).json({ success: false, message: "Topilmadi" });

    const companyJobs = jobs.filter(j => j.companyId === company.id);
    res.json({ success: true, company: { ...company, jobs: companyJobs } });
});

module.exports = router;