export function updateMetricsOverlay(metricsContainer, metricsDots) {
  const hasOverflow = metricsContainer.scrollWidth > metricsContainer.clientWidth;
  const isAtStart = metricsContainer.scrollLeft <= 5;
  const isAtEnd = metricsContainer.scrollLeft + metricsContainer.clientWidth >= metricsContainer.scrollWidth - 5;

  const topPanel = metricsContainer.closest('#top-panel');
  if (topPanel) {
    topPanel.classList.toggle('gradient-right-visible', hasOverflow && !isAtEnd);
    topPanel.classList.toggle('gradient-left-visible', hasOverflow && !isAtStart);
  }

  if (metricsDots) {
    if (!hasOverflow) {
      metricsDots.innerHTML = '';
      metricsDots.style.display = 'none';
      return hasOverflow;
    }
    metricsDots.style.display = '';
    const pageWidth = metricsContainer.clientWidth;
    const maxScrollLeft = Math.max(0, metricsContainer.scrollWidth - pageWidth);
    const totalPages = Math.max(1, Math.ceil(metricsContainer.scrollWidth / pageWidth));
    const currentPage = totalPages <= 1 ? 0 : Math.round((metricsContainer.scrollLeft / maxScrollLeft) * (totalPages - 1));
    let html = '';

    if (hasOverflow && !isAtStart) {
      html += '<span class="metric-chevron metric-chevron-left material-symbols-outlined">chevron_left</span>';
    }

    for (let i = 0; i < totalPages; i++) {
      html += '<span class="metric-dot' + (i === currentPage ? ' active' : '') + '"></span>';
    }

    if (hasOverflow && !isAtEnd) {
      html += '<span class="metric-chevron metric-chevron-right material-symbols-outlined">chevron_right</span>';
    }

    if (totalPages > 1) {
      html += '<span class="metric-page-counter">' + (currentPage + 1) + '/' + totalPages + '</span>';
    }

    metricsDots.innerHTML = html;
  }

  return hasOverflow;
}

export function initScrollIndicator(metricsContainer, metricsDots) {
  const fn = () => {
    updateMetricsOverlay(metricsContainer, metricsDots);
  };

  metricsContainer.addEventListener('scroll', fn, { passive: true });
  window.addEventListener('resize', fn);
  setTimeout(fn, 1000);

  window.updateScrollIndicator = fn;

  return fn;
}
