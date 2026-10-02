async function checkSession() {
    try {
        const data = await API.get('/auth/session');
        if (data.success && data.user) {
            window.currentUser = data.user;
            updateAuthUI(true, data.user);
            return data.user;
        }
        window.currentUser = null;
        updateAuthUI(false);
        return null;
    } catch (err) {
        return null;
    }
}

function updateAuthUI(isLoggedIn, user = null) {
    const authLink = document.getElementById('auth-link');
    if (!authLink) return;

    if (isLoggedIn) {
        authLink.innerHTML = `
            <img src="${user.avatar || '/assets/default-avatar.png'}" 
                 style="width:22px; height:22px; border-radius:50%; object-fit:cover; vertical-align:middle; margin-right:6px; border: 1px solid var(--uz-blue);">
            ${user.username}
        `;
        authLink.href = '/profile';
    } else {
        authLink.innerText = 'Kirish';
        authLink.href = '/login';
    }
}

async function logout() {
    await API.post('/auth/logout');
    window.location.href = '/';
}