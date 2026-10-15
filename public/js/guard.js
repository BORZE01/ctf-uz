// ══════════════════════════════════════════
// GUARD — sahifalarni himoya qilish
// ══════════════════════════════════════════

async function requireAuth(redirectTo = '/welcome') {
    try {
        const res = await fetch('/api/auth/me', { 
            credentials: 'include',
            cache: 'no-store'
        });
        
        if (!res.ok) {
            window.location.replace(redirectTo);
            return null;
        }
        
        const data = await res.json();
        
        if (!data.success || !data.user) {
            window.location.replace(redirectTo);
            return null;
        }
        
        // Global foydalanuvchi
        window.currentUser = data.user;
        return data.user;
    } catch (e) {
        console.error('Guard xatosi:', e);
        window.location.replace(redirectTo);
        return null;
    }
}

async function requireAdmin(redirectTo = '/') {
    const user = await requireAuth(redirectTo);
    if (!user) return null;
    
    const adminRoles = ['admin', 'super_admin', 'moderator', 'organizer', 'challenge_author'];
    if (!adminRoles.includes(user.role)) {
        window.location.replace(redirectTo);
        return null;
    }
    return user;
}

async function getCurrentUser() {
    try {
        const res = await fetch('/api/auth/me', { 
            credentials: 'include',
            cache: 'no-store'
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.success ? data.user : null;
    } catch (e) {
        return null;
    }
}
