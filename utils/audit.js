const { auditLogs } = require('./storage');

// ══════════════════════════════════════════
// HARAKATNI YOZISH
// ══════════════════════════════════════════
function logAction(admin, action, details = {}) {
    const entry = {
        id: auditLogs.length + 1,
        admin: admin || 'system',
        action,
        details,
        timestamp: new Date(),
        ip: details.ip || 'N/A'
    };

    auditLogs.unshift(entry);

    if (auditLogs.length > 2000) auditLogs.length = 2000;

    console.log(`[AUDIT] ${admin} → ${action}`, JSON.stringify(details).slice(0, 200));
    return entry;
}

// ══════════════════════════════════════════
// LOGLARNI OLISH
// ══════════════════════════════════════════
function getAuditLogs(limit = 100, filters = {}) {
    let result = [...auditLogs];

    if (filters.admin) {
        result = result.filter(l => l.admin === filters.admin);
    }
    if (filters.action) {
        result = result.filter(l => l.action === filters.action);
    }
    if (filters.since) {
        result = result.filter(l => new Date(l.timestamp) >= new Date(filters.since));
    }

    return result.slice(0, limit);
}

module.exports = { logAction, getAuditLogs };