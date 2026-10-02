// ══════════════════════════════════════════
// INPUT VALIDATSIYA
// ══════════════════════════════════════════

function validateBody(schema) {
    return (req, res, next) => {
        const errors = [];

        for (const [field, rules] of Object.entries(schema)) {
            const value = req.body[field];

            if (rules.required && (value === undefined || value === null || value === '')) {
                errors.push(`${field}: majburiy maydon`);
                continue;
            }

            if (value === undefined || value === null) continue;

            if (rules.type && typeof value !== rules.type) {
                errors.push(`${field}: ${rules.type} bo'lishi kerak`);
                continue;
            }

            if (rules.min && String(value).length < rules.min) {
                errors.push(`${field}: kamida ${rules.min} belgi`);
            }

            if (rules.max && String(value).length > rules.max) {
                errors.push(`${field}: ${rules.max} belgidan oshmasin`);
            }

            if (rules.pattern && !rules.pattern.test(String(value))) {
                errors.push(`${field}: noto'g'ri format`);
            }

            if (rules.enum && !rules.enum.includes(value)) {
                errors.push(`${field}: ruxsat etilmagan qiymat`);
            }

            if (rules.array && !Array.isArray(value)) {
                errors.push(`${field}: array bo'lishi kerak`);
            }
        }

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Validatsiya xatosi",
                errors
            });
        }

        next();
    };
}

module.exports = { validateBody };
