// === ASOSIY APP ===
window.addEventListener('load', async () => {
    await checkSession();
    createStars();
});

// === STARS ===
function createStars() {
    const container = document.createElement('div');
    container.className = 'stars-container';
    document.body.appendChild(container);

    for (let i = 0; i < 150; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.animationDelay = Math.random() * 3 + 's';
        star.style.animationDuration = (Math.random() * 2 + 2) + 's';
        container.appendChild(star);
    }
}

// === PHONE FORMAT ===
function formatPhone(input) {
    let digits = input.value.replace(/[^0-9]/g, '');
    if (!digits.startsWith('998')) {
        digits = '998' + digits.replace(/^998/, '');
    }
    digits = digits.substring(0, 12);
    let formatted = '+998';
    if (digits.length > 3) formatted += ' ' + digits.substring(3, 5);
    if (digits.length > 5) formatted += ' ' + digits.substring(5, 8);
    if (digits.length > 8) formatted += ' ' + digits.substring(8, 10);
    if (digits.length > 10) formatted += ' ' + digits.substring(10, 12);
    input.value = formatted;
}