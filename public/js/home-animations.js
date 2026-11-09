(() => {
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motionPreference.matches) return;

    initLogoShatter();
    if (!('IntersectionObserver' in window)) return;

    const revealGroups = [
        ['.section-header', 1],
        ['.features-grid .feature-card', 45],
        ['.events-header', 1],
        ['.events-grid .event-card', 65],
        ['.cta-content', 1],
        ['.footer-top > *', 45]
    ];

    const revealElements = revealGroups.flatMap(([selector]) =>
        Array.from(document.querySelectorAll(selector))
    );

    revealElements.forEach((element) => {
        element.dataset.motion = 'reveal';
    });

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
        });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    revealElements.forEach((element) => revealObserver.observe(element));

    revealGroups.forEach(([selector, stagger]) => {
        document.querySelectorAll(selector).forEach((element, index) => {
            if (index > 0) element.style.setProperty('--reveal-delay', `${index * stagger}ms`);
        });
    });

    const countObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            observer.unobserve(entry.target);

            const element = entry.target;
            const target = Number(element.textContent.trim().replace(/[^\d]/g, ''));
            if (!Number.isFinite(target) || target <= 0) return;

            const duration = 900;
            const start = performance.now();
            const step = (now) => {
                const progress = Math.min((now - start) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                element.textContent = String(Math.round(target * eased));
                if (progress < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
        });
    }, { threshold: 0.6 });

    document.querySelectorAll('.stat-value').forEach((element) => {
        element.dataset.count = 'pending';
        countObserver.observe(element);
    });

    document.documentElement.classList.add('motion-enabled');

    function initLogoShatter() {
        if (!window.matchMedia('(min-width: 901px) and (hover: hover) and (pointer: fine)').matches) return;

        const svg = document.querySelector('.hero-emblem');
        const fragments = svg?.querySelector('.emblem-fragments');
        const defs = svg?.querySelector('defs');
        if (!svg || !fragments || !defs) return;

        const namespace = 'http://www.w3.org/2000/svg';
        const gridSize = 50;
        const cells = 500 / gridSize;
        const radius = 214;
        const fragmentTiles = [];
        const fragmentUses = [];
        let frame = 0;
        let pointer = null;

        for (let row = 0; row < cells; row++) {
            for (let column = 0; column < cells; column++) {
                const x = column * gridSize;
                const y = row * gridSize;
                const corners = (row + column) % 2 === 0
                    ? [
                        [[x, y], [x + gridSize, y], [x + gridSize, y + gridSize]],
                        [[x, y], [x, y + gridSize], [x + gridSize, y + gridSize]]
                    ]
                    : [
                        [[x, y], [x + gridSize, y], [x, y + gridSize]],
                        [[x + gridSize, y], [x + gridSize, y + gridSize], [x, y + gridSize]]
                    ];

                corners.forEach((points, half) => {
                    const index = (row * cells + column) * 2 + half;
                    const clipId = `emblem-fragment-clip-${index}`;
                    const clip = document.createElementNS(namespace, 'clipPath');
                    clip.id = clipId;
                    clip.setAttribute('clipPathUnits', 'userSpaceOnUse');

                    const polygon = document.createElementNS(namespace, 'polygon');
                    polygon.setAttribute('points', points.map((point) => point.join(',')).join(' '));
                    clip.appendChild(polygon);
                    defs.appendChild(clip);

                    const tile = document.createElementNS(namespace, 'g');
                    tile.setAttribute('clip-path', `url(#${clipId})`);

                    const artwork = document.createElementNS(namespace, 'use');
                    artwork.setAttribute('href', '#emblem-artwork');
                    tile.appendChild(artwork);
                    fragmentTiles.push(tile);
                    fragmentUses.push(artwork);
                    tile.dataset.x = String(points.reduce((sum, point) => sum + point[0], 0) / points.length);
                    tile.dataset.y = String(points.reduce((sum, point) => sum + point[1], 0) / points.length);
                    tile.dataset.index = String(index);
                    fragments.appendChild(tile);
                });
            }
        }

        const maskGradient = svg.querySelector('#emblem-shatter-gradient');
        svg.addEventListener('pointerenter', (event) => {
            if (event.pointerType === 'touch') return;
            pointer = getSvgPoint(event);
            svg.classList.add('is-shattering');
            updateFragments();
        });

        svg.addEventListener('pointermove', (event) => {
            if (!svg.classList.contains('is-shattering')) return;
            pointer = getSvgPoint(event);
            if (!frame) frame = requestAnimationFrame(updateFragments);
        });

        svg.addEventListener('pointerleave', () => {
            pointer = null;
            svg.classList.remove('is-shattering');
            fragmentUses.forEach((piece) => {
                piece.style.opacity = '0';
                piece.style.transform = '';
            });
        });

        function getSvgPoint(event) {
            const bounds = svg.getBoundingClientRect();
            return {
                x: ((event.clientX - bounds.left) / bounds.width) * 500,
                y: ((event.clientY - bounds.top) / bounds.height) * 500
            };
        }

        function updateFragments() {
            frame = 0;
            if (!pointer) return;

            maskGradient?.setAttribute('cx', String(pointer.x));
            maskGradient?.setAttribute('cy', String(pointer.y));

            fragmentTiles.forEach((tile) => {
                const index = Number(tile.dataset.index);
                const deltaX = Number(tile.dataset.x) - pointer.x;
                const deltaY = Number(tile.dataset.y) - pointer.y;
                const distance = Math.hypot(deltaX, deltaY);
                const piece = tile.firstElementChild;

                if (distance > radius) {
                    piece.style.opacity = '0';
                    piece.style.transform = '';
                    return;
                }

                const strength = 1 - distance / radius;
                const seed = (index * 9301 + 49297) % 233280;
                const angle = distance < 1 ? (seed / 233280) * Math.PI * 2 : Math.atan2(deltaY, deltaX);
                const jitter = (seed / 233280 - .5) * 24 * strength;
                const travel = (24 + strength * 55) * strength;
                const moveX = Math.cos(angle) * travel - Math.sin(angle) * jitter;
                const moveY = Math.sin(angle) * travel + Math.cos(angle) * jitter;

                piece.style.opacity = String(Math.min(.95, .25 + strength * .7));
                piece.style.transform = `translate(${moveX}px, ${moveY}px)`;
            });
        }
    }
})();
