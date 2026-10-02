const notifications = {};  // { userId: [{ id, text, type, read, createdAt }] }

// ══════════════════════════════════════════
// BILDIRISHNOMA QO'SHISH
// ══════════════════════════════════════════
function addNotification(userId, text, type = 'info', link = null) {
    if (!notifications[userId]) notifications[userId] = [];

    notifications[userId].unshift({
        id: Date.now() + Math.random(),
        text,
        type,
        link,
        read: false,
        createdAt: new Date()
    });

    if (notifications[userId].length > 50) {
        notifications[userId].length = 50;
    }
}

// ══════════════════════════════════════════
// BILDIRISHNOMALARNI OLISH
// ══════════════════════════════════════════
function getNotifications(userId) {
    return notifications[userId] || [];
}

// ══════════════════════════════════════════
// O'QILGAN DEB BELGILASH
// ══════════════════════════════════════════
function markAsRead(userId, notificationId) {
    if (!notifications[userId]) return false;
    const n = notifications[userId].find(x => x.id === notificationId);
    if (n) {
        n.read = true;
        return true;
    }
    return false;
}

function markAllAsRead(userId) {
    if (!notifications[userId]) return;
    notifications[userId].forEach(n => n.read = true);
}

// ══════════════════════════════════════════
// O'QILMAGANLAR SONI
// ══════════════════════════════════════════
function getUnreadCount(userId) {
    if (!notifications[userId]) return 0;
    return notifications[userId].filter(n => !n.read).length;
}

// ══════════════════════════════════════════
// O'CHIRISH
// ══════════════════════════════════════════
function deleteNotification(userId, notificationId) {
    if (!notifications[userId]) return false;
    const idx = notifications[userId].findIndex(x => x.id === notificationId);
    if (idx === -1) return false;
    notifications[userId].splice(idx, 1);
    return true;
}

module.exports = {
    notifications,
    addNotification,
    getNotifications,
    markAsRead,
    markAllAsRead,
    getUnreadCount,
    deleteNotification
};