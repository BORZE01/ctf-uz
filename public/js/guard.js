// Login qilmagan foydalanuvchini login sahifasiga yo'naltirish
async function requireAuth() {
    try {
        const res = await fetch('/api/auth/session', { credentials: 'include' });
        const data = await res.json();

        if (!data.success || !data.user) {
            // Joriy sahifani saqlash (login qilgandan keyin qaytish uchun)
            sessionStorage.setItem('redirectAfterLogin', window.location.pathname + window.location.search);
            window.location.replace('/welcome');
            return null;
        }

        window.currentUser = data.user;
        updateUserUI(data.user);
        return data.user;
    } catch (err) {
        console.error('Auth xatosi:', err);
        window.location.replace('/welcome');
        return null;
    }
}

// Header da user ma'lumotlarini ko'rsatish
function updateUserUI(user) {
    const authLink = document.getElementById('auth-link');
    if (!authLink) return;

    authLink.innerHTML = `
        <img src="${user.avatar || '/assets/default-avatar.svg'}" 
             style="width:22px; height:22px; border-radius:50%; object-fit:cover; vertical-align:middle; margin-right:6px; border:1px solid var(--uz-blue, #2563EB);"
             onerror="this.src='/assets/default-avatar.svg'">
        ${user.username}
    `;
    authLink.href = '/profile';
}

// Login qilmagan foydalanuvchi uchun
async function checkAuthStatus() {
    try {
        const res = await fetch('/api/auth/session', { credentials: 'include' });
        const data = await res.json();
        return data.success && data.user ? data.user : null;
    } catch (err) {
        return null;
    }
}