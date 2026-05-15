let ticking = false;

export function initRenderLoop(options) {
    const {
        scrollContainer,
        render,
        drawFixedOverlay,
        updateNowButtonPosition,
        updateActiveDailyCard,
        state
    } = options;

    if (!scrollContainer) return;

    scrollContainer.addEventListener('pointerdown', (e) => {
        if (e.pointerType !== 'mouse') return;
        state.isDragging = true;
        state.startX = e.pageX - scrollContainer.offsetLeft;
        state.scrollLeft = scrollContainer.scrollLeft;
        scrollContainer.style.cursor = 'grabbing';
    });

    scrollContainer.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse') return;
        if (state.isDragging) e.preventDefault();
        if (!ticking) {
            const rect = scrollContainer.getBoundingClientRect();
            const pageX = e.pageX;
            const clientX = e.clientX;
            const offsetLeft = scrollContainer.offsetLeft;

            window.requestAnimationFrame(() => {
                state.hoverX = (clientX - rect.left) + scrollContainer.scrollLeft;
                if (state.isDragging) {
                    const x = pageX - offsetLeft;
                    if (Math.abs(x - state.startX) > 3) {
                        const walk = (x - state.startX) * 1.5;
                        scrollContainer.scrollLeft = state.scrollLeft - walk;
                    }
                }
                render();
                ticking = false;
            });
            ticking = true;
        }
    });

    scrollContainer.addEventListener('pointerup', (e) => {
        if (e.pointerType !== 'mouse') return;
        state.isDragging = false;
        scrollContainer.style.cursor = 'default';
    });

    scrollContainer.addEventListener('pointerleave', (e) => {
        if (e.pointerType !== 'mouse') return;
        state.isDragging = false;
        state.hoverX = null;
        scrollContainer.style.cursor = 'default';
        render();
    });

    scrollContainer.addEventListener('scroll', () => {
        updateNowButtonPosition();
        if (!ticking) {
            window.requestAnimationFrame(() => {
                drawFixedOverlay();
                render();
                updateActiveDailyCard();
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });

    requestAnimationFrame(function pulseLoop() {
        drawFixedOverlay();
        requestAnimationFrame(pulseLoop);
    });
}

export function initScrollIndicator() {
    const metricsContainer = document.querySelector('.top-panel-metrics');
    const scrollIndLeft = document.querySelector('.scroll-indicator-left');
    const scrollIndRight = document.querySelector('.scroll-indicator-right');

    if (!metricsContainer || !scrollIndLeft || !scrollIndRight) return;

    const updateScrollIndicator = () => {
        const hasOverflow = metricsContainer.scrollWidth > metricsContainer.clientWidth;
        const isAtStart = metricsContainer.scrollLeft <= 5;
        const isAtEnd = metricsContainer.scrollLeft + metricsContainer.clientWidth >= metricsContainer.scrollWidth - 5;

        if (hasOverflow && !isAtEnd) {
            scrollIndRight.style.display = 'flex';
            scrollIndRight.style.opacity = '1';
        } else {
            scrollIndRight.style.opacity = '0';
            setTimeout(() => {
                if (scrollIndRight.style.opacity === '0') scrollIndRight.style.display = 'none';
            }, 300);
        }

        if (hasOverflow && !isAtStart) {
            scrollIndLeft.style.display = 'flex';
            scrollIndLeft.style.opacity = '1';
        } else {
            scrollIndLeft.style.opacity = '0';
            setTimeout(() => {
                if (scrollIndLeft.style.opacity === '0') scrollIndLeft.style.display = 'none';
            }, 300);
        }
    };

    window.updateScrollIndicator = updateScrollIndicator;
    metricsContainer.addEventListener('scroll', updateScrollIndicator, { passive: true });
    window.addEventListener('resize', updateScrollIndicator);
    setTimeout(updateScrollIndicator, 1000);
}
