// ══════════════════════════════════════════
// BOLA / IDOR HIMOYA
// ══════════════════════════════════════════
// Foydalanuvchi faqat O'Z resurslarini ko'ra/o'zgartira oladi

const mongoose = require('mongoose');

// ══════════════════════════════════════════
// OBJECT ID VALIDATSIYA
// ══════════════════════════════════════════
function validateObjectId(...fields) {
    return (req, res, next) => {
        for (const field of fields) {
            const value = req.params[field] || req.body[field] || req.query[field];
            if (value && !mongoose.Types.ObjectId.isValid(value)) {
                return res.status(400).json({
                    success: false,
                    message: `Noto'g'ri ${field}`,
                    code: 'INVALID_ID'
                });
            }
        }
        next();
    };
}

// ══════════════════════════════════════════
// OWNER TEKSHIRISH
// ══════════════════════════════════════════
function requireOwner(Model, ownerField = 'userId', paramName = 'id') {
    return async (req, res, next) => {
        try {
            const user = req.currentUser;
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: "Kirish kerak"
                });
            }

            const id = req.params[paramName];
            const doc = await Model.findById(id).select(ownerField);

            if (!doc) {
                return res.status(404).json({
                    success: false,
                    message: "Topilmadi"
                });
            }

            const ownerId = doc[ownerField]?.toString();
            const userId = user._id.toString();
            const isAdmin = ['admin', 'super_admin'].includes(user.role);

            if (ownerId !== userId && !isAdmin) {
                return res.status(403).json({
                    success: false,
                    message: "Ruxsat yo'q — bu sizning resursingiz emas",
                    code: 'BOLA_FORBIDDEN'
                });
            }

            req.targetDoc = doc;
            next();
        } catch (err) {
            return res.status(500).json({
                success: false,
                message: "Server xatosi"
            });
        }
    };
}

// ══════════════════════════════════════════
// SELF OR ADMIN
// ══════════════════════════════════════════
function selfOrAdmin(paramName = 'id') {
    return (req, res, next) => {
        const user = req.currentUser;
        if (!user) {
            return res.status(401).json({ success: false, message: "Kirish kerak" });
        }

        const targetId = req.params[paramName];
        const userId = user._id.toString();
        const isSelf = targetId === userId;
        const isAdmin = ['admin', 'super_admin'].includes(user.role);

        if (!isSelf && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: "Ruxsat yo'q",
                code: 'BOLA_FORBIDDEN'
            });
        }

        next();
    };
}

module.exports = {
    validateObjectId,
    requireOwner,
    selfOrAdmin
};
