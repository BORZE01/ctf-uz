// ══════════════════════════════════════════
// APP.JS — global yordamchi funksiyalar
// ══════════════════════════════════════════

// Joriy foydalanuvchini olish
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

// Login qilganmi?
async function isLoggedIn() {
    const user = await getCurrentUser();
    return !!user;
}

// Logout
async function logout() {
    if (!confirm('Akkauntdan chiqishni tasdiqlaysizmi?')) return;
    try {
        await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
    } catch (e) {}
    sessionStorage.clear();
    window.location.href = '/';
}

// Foydalanuvchi ma'lumotini UI ga joylash (ixtiyoriy)
async function renderUserInfo() {
    const user = await getCurrentUser();
    if (!user) return;

    // auth-link elementlarini yangilash
    document.querySelectorAll('#auth-link, [data-auth-link]').forEach(el => {
        el.innerText = '@' + user.username;
        el.href = '/profile';
    });

    return user;
}

// Sahifa yuklanganda
document.addEventListener('DOMContentLoaded', async () => {
    const user = await getCurrentUser();
    if (!user) return;

    // auth-link elementlarini yangilash
    const authLink = document.getElementById('auth-link');
    if (authLink) {
        authLink.innerHTML = '@' + user.username;
        authLink.href = '/profile';
    }
});
