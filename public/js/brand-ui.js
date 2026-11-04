
document.addEventListener('DOMContentLoaded', () => {
  // Mobil navigatsiya tugmasini avtomatik qo'shish
  const headers = document.querySelectorAll('header, .header');
  headers.forEach(hdr => {
    const nav = hdr.querySelector('.nav, nav');
    if (nav && !hdr.querySelector('.mobile-nav-toggle')) {
      const btn = document.createElement('button');
      btn.className = 'mobile-nav-toggle';
      btn.setAttribute('aria-label', 'Menyuni ochish');
      btn.setAttribute('aria-expanded', 'false');
      btn.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>';
      btn.addEventListener('click', () => {
        const isOpen = nav.classList.toggle('nav-open');
        btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });
      hdr.appendChild(btn);
    }
  });

  // Escape bosilganda mobil menyuni yopish
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.nav.nav-open').forEach(n => n.classList.remove('nav-open'));
    }
  });
});
