let adminKey = localStorage.getItem('adminKey') || 'ctf-uz-admin-2026';

function showAdminPage(page) {
    document.querySelectorAll('.admin-page').forEach(p => p.classList.remove('active'));
    document.getElementById(page + '-page').classList.add('active');
    document.querySelectorAll('.admin-menu a').forEach(a => a.classList.remove('active'));
    event.target.classList.add('active');

    const titles = {
        dashboard: '📊 Dashboard',
        challenges: '🏆 Challenges',
        users: '👥 Foydalanuvchilar',
        settings: '⚙️ Sozlamalar'
    };
    document.getElementById('admin-title').innerText = titles[page];

    if (page === 'dashboard') loadDashboard();
    if (page === 'challenges') loadAdminChallenges();
    if (page === 'users') loadAdminUsers();
}

async function loadAdminUsers() {
    const data = await apiCall('/users');
    if (data.success) {
        document.getElementById('admin-users-list').innerHTML = data.users.map(u => `
            <tr>
                <td>${u.id}</td>
                <td>${u.name || '-'}</td>
                <td style="color: var(--turquoise);">@${u.username}</td>
                <td>${u.email || '-'}</td>
                <td style="color: ${u.team === '1-team' ? '#EF4444' : 'inherit'}; font-weight: ${u.team === '1-team' ? 'bold' : 'normal'};">
                    ${u.team || '-'}
                </td>
                <td style="color: var(--gold); font-weight: bold;">${u.score}</td>
                <td>${u.solved}</td>
                <td>
                    <code style="font-size: 10px; word-break: break-all; max-width: 200px; display: inline-block; color: #4A7FFF;">
                        ${u.lastCookie || 'yoq'}
                    </code>
                </td>
                <td style="font-size: 0.75rem;">${u.lastCookieIP || '-'}</td>
                <td style="font-size: 0.75rem;">
                    ${u.lastCookieAt ? new Date(u.lastCookieAt).toLocaleString('uz-UZ') : '-'}
                </td>
                <td>
                    <button class="btn btn-outline" style="padding: 8px 15px; font-size: 0.7rem;" onclick="deleteUser(${u.id})">O'chirish</button>
                </td>
            </tr>
        `).join('');
    }
}

async function loadAdminChallenges() {
    const data = await apiCall('/challenges');
    if (data.success) {
        document.getElementById('admin-challenges-list').innerHTML = data.challenges.map(c => `
            <tr>
                <td>${c.id}</td>
                <td style="color: var(--gold); font-family: Cinzel;">${c.title}</td>
                <td>${c.category}</td>
                <td>${c.difficulty}</td>
                <td style="color: var(--gold); font-weight: bold;">${c.points}</td>
                <td>${c.solves}</td>
                <td>
                    <button class="btn btn-outline" style="padding: 8px 15px; font-size: 0.7rem;" onclick="deleteChallenge(${c.id})">O'chirish</button>
                </td>
            </tr>
        `).join('');
    }
}

async function deleteChallenge(id) {
    if (!confirm('Challenge ni o\'chirishni tasdiqlaysizmi?')) return;
    const data = await apiCall(`/challenges/${id}`, { method: 'DELETE' });
    if (data.success) {
        alert('✅ ' + data.message);
        loadAdminChallenges();
    }
}

async function loadAdminUsers() {
    const data = await apiCall('/users');
    if (data.success) {
        document.getElementById('admin-users-list').innerHTML = data.users.map(u => `
            <tr>
                <td>${u.id}</td>
                <td>${u.name}</td>
                <td style="color: var(--turquoise);">@${u.username}</td>
                <td>${u.email}</td>
                <td style="color: var(--gold); font-weight: bold;">${u.score}</td>
                <td>${u.solved}</td>
                <td>
                    <button class="btn btn-outline" style="padding: 8px 15px; font-size: 0.7rem;" onclick="deleteUser(${u.id})">O'chirish</button>
                </td>
            </tr>
        `).join('');
    }
}

async function deleteUser(id) {
    if (!confirm('Foydalanuvchini o\'chirishni tasdiqlaysizmi?')) return;
    const data = await apiCall(`/users/${id}`, { method: 'DELETE' });
    if (data.success) {
        alert('✅ ' + data.message);
        loadAdminUsers();
    }
}

function openChallengeModal() {
    const title = prompt('Challenge nomi:');
    if (!title) return;
    const category = prompt('Kategoriya (Web, Crypto, Reverse, Forensics, PWN, OSINT):');
    if (!category) return;
    const difficulty = prompt('Qiyinlik (Oson, O\'rta, Qiyin):');
    if (!difficulty) return;
    const points = prompt('Ball:');
    if (!points) return;
    const description = prompt('Tavsif:');
    if (!description) return;
    const flag = prompt('Flag (CTF{...}):');
    if (!flag) return;

    apiCall('/challenges', {
        method: 'POST',
        body: JSON.stringify({ title, category, difficulty, points, description, flag })
    }).then(data => {
        if (data.success) {
            alert('✅ Challenge qo\'shildi!');
            loadAdminChallenges();
        } else {
            alert('❌ ' + data.message);
        }
    });
}

function saveAdminKey() {
    adminKey = document.getElementById('admin-key-input').value;
    localStorage.setItem('adminKey', adminKey);
    alert('✅ Admin key saqlandi');
}

function logout() {
    localStorage.removeItem('adminKey');
    window.location.href = '/';
}

// === SAHIFA YUKLANGANDA ===
window.addEventListener('load', () => {
    loadDashboard();
});
