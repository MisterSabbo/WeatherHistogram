export function initTooltipBindings() {
    setupLocationTooltip();
    setupAlertsTooltip();
    setupDesktopTooltips();
    setupMobileTooltips();
    setupDocumentClickClose();
}

function setupLocationTooltip() {
    const locationGroup = document.querySelector('.location-group');
    if (!locationGroup) return;

    const checkOverflow = () => {
        const locName = document.getElementById('location-name');
        const summary = document.getElementById('weather-summary');
        const isOverflowing = (locName.scrollWidth > locName.offsetWidth) ||
                            (summary.scrollWidth > summary.offsetWidth);
        locationGroup.classList.toggle('has-overflow', isOverflowing);
        locationGroup.style.cursor = isOverflowing ? 'pointer' : 'default';
        return isOverflowing;
    };

    locationGroup.addEventListener('mouseenter', checkOverflow);
    locationGroup.addEventListener('click', (e) => {
        if (window.innerWidth <= 600) {
            locationGroup.classList.toggle('active');
            if (locationGroup.classList.contains('active')) {
                setTimeout(() => locationGroup.classList.remove('active'), 3000);
            }
        }
    });
}

function setupAlertsTooltip() {
    const alertsContainer = document.getElementById('alerts-container');
    if (!alertsContainer) return;

    alertsContainer.style.pointerEvents = 'auto';
    alertsContainer.addEventListener('click', (e) => {
        const isMobile = window.innerWidth <= 600;
        if (isMobile) {
            const tooltip = document.getElementById('alerts-tooltip');
            if (tooltip) {
                const isVisible = tooltip.style.opacity === '1';
                document.querySelectorAll('.custom-tooltip').forEach(t => t.style.display = '');

                if (!isVisible) {
                    alertsContainer.classList.add('active');
                    tooltip.style.position = 'fixed';
                    const rect = alertsContainer.getBoundingClientRect();
                    tooltip.style.top = (rect.bottom + 10) + 'px';
                    tooltip.style.left = '50%';
                    tooltip.style.transform = 'translateX(-50%)';
                    tooltip.style.zIndex = '9999';
                    tooltip.style.opacity = '1';
                    tooltip.style.visibility = 'visible';
                    tooltip.style.display = 'block';

                    setTimeout(() => {
                        alertsContainer.classList.remove('active');
                        tooltip.style.opacity = '';
                        tooltip.style.visibility = '';
                        tooltip.style.display = '';
                    }, 4000);
                } else {
                    alertsContainer.classList.remove('active');
                    tooltip.style.opacity = '';
                    tooltip.style.visibility = '';
                    tooltip.style.display = '';
                }
            }
            e.stopPropagation();
        }
    });

    alertsContainer.addEventListener('mouseenter', () => {
        if (window.innerWidth > 600) {
            alertsContainer.classList.add('active');
        }
    });
    alertsContainer.addEventListener('mouseleave', () => {
        if (window.innerWidth > 600) {
            alertsContainer.classList.remove('active');
        }
    });
}

function setupDesktopTooltips() {
    document.querySelectorAll('.info-icon, .location-group').forEach(el => {
        el.addEventListener('mouseenter', () => {
            if (window.innerWidth >= 600) {
                const container = el.classList.contains('info-icon') ? el.closest('.data-value') : el;
                const tt = container.querySelector('.custom-tooltip');
                if (tt) {
                    if (el.classList.contains('location-group')) {
                        const locName = document.getElementById('location-name');
                        const summary = document.getElementById('weather-summary');
                        const isTruncated = (locName.scrollWidth > locName.clientWidth) || (summary.scrollWidth > summary.clientWidth);
                        if (isTruncated) tt.style.display = 'block';
                    } else {
                        tt.style.display = 'block';
                    }
                }
            }
        });
        el.addEventListener('mouseleave', () => {
            if (window.innerWidth >= 600) {
                const container = el.classList.contains('info-icon') ? el.closest('.data-value') : el;
                const tt = container.querySelector('.custom-tooltip');
                if (tt) tt.style.display = '';
            }
        });
    });
}

function setupMobileTooltips() {
    document.querySelectorAll('.data-value, .location-group').forEach(val => {
        val.addEventListener('click', (e) => {
            if (window.innerWidth < 600) {
                const tooltip = val.querySelector('.custom-tooltip');
                if (tooltip) {
                    if (val.classList.contains('location-group')) {
                        const locName = document.getElementById('location-name');
                        const summary = document.getElementById('weather-summary');
                        const isTruncated = (locName.scrollWidth > locName.clientWidth) || (summary.scrollWidth > summary.clientWidth);
                        if (!isTruncated) return;
                    }
                    const isVisible = tooltip.style.display === 'block';
                    document.querySelectorAll('.custom-tooltip').forEach(t => {
                        t.style.display = '';
                        t.style.position = '';
                        t.style.top = '';
                        t.style.left = '';
                        t.style.transform = '';
                        t.style.zIndex = '';
                    });

                    if (!isVisible) {
                        tooltip.style.display = 'block';
                        const rect = val.getBoundingClientRect();
                        tooltip.style.position = 'fixed';
                        tooltip.style.top = (rect.bottom + 10) + 'px';
                        tooltip.style.left = '50%';
                        tooltip.style.transform = 'translateX(-50%)';
                        tooltip.style.zIndex = '9999';
                    }
                    e.stopPropagation();
                }
            }
        });
    });
}

function setupDocumentClickClose() {
    document.addEventListener('click', () => {
        if (window.innerWidth < 600) {
            document.querySelectorAll('.custom-tooltip').forEach(t => {
                t.style.display = '';
                t.style.position = '';
                t.style.top = '';
                t.style.left = '';
                t.style.transform = '';
                t.style.zIndex = '';
            });
        }
    });
}
