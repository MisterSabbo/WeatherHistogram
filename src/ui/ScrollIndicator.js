export function updateScrollIndicator(
  metricsContainer,
  scrollIndLeft,
  scrollIndRight,
  metricsDots
) {
  const hasOverflow = metricsContainer.scrollWidth > metricsContainer.clientWidth;
  const isAtStart = metricsContainer.scrollLeft <= 5;
  const isAtEnd = metricsContainer.scrollLeft + metricsContainer.clientWidth >= metricsContainer.scrollWidth - 5;

  if (hasOverflow && !isAtEnd) {
    scrollIndRight.classList.add('visible');
  } else {
    scrollIndRight.classList.remove('visible');
  }

  if (hasOverflow && !isAtStart) {
    scrollIndLeft.classList.add('visible');
  } else {
    scrollIndLeft.classList.remove('visible');
  }

  if (metricsDots) {
    if (!hasOverflow) {
      metricsDots.innerHTML = '';
      metricsDots.style.display = 'none';
      return hasOverflow;
    }
    metricsDots.style.display = '';
    const pageWidth = metricsContainer.clientWidth;
    const totalPages = Math.max(1, Math.ceil(metricsContainer.scrollWidth / pageWidth));
    const currentPage = Math.round(metricsContainer.scrollLeft / pageWidth);
    let html = '';
    for (let i = 0; i < totalPages; i++) {
      html += '<span class="metric-dot' + (i === currentPage ? ' active' : '') + '"></span>';
    }
    if (totalPages > 1) {
      html += '<span class="metric-page-counter">' + (currentPage + 1) + '/' + totalPages + '</span>';
    }
    metricsDots.innerHTML = html;
  }

  return hasOverflow;
}

export function initScrollIndicator(metricsContainer, scrollIndLeft, scrollIndRight, metricsDots) {
  let _discoveryPlayed = false;

  const fn = () => {
    const hasOverflow = updateScrollIndicator(metricsContainer, scrollIndLeft, scrollIndRight, metricsDots);

    if (!_discoveryPlayed && hasOverflow) {
      _discoveryPlayed = true;
      playDiscoveryAnimation(scrollIndRight);
    }
  };

  metricsContainer.addEventListener('scroll', fn, { passive: true });
  window.addEventListener('resize', fn);
  setTimeout(fn, 1000);

  return fn;
}

function playDiscoveryAnimation(el) {
  el.classList.add('visible');
  el.style.transition = 'none';
  el.style.transform = 'translateY(-50%) translateX(0)';
  void el.offsetHeight;
  let step = 0;
  const swipe = () => {
    if (step > 5) {
      el.style.transition = '';
      el.style.transform = '';
      return;
    }
    const isEven = step % 2 === 0;
    el.style.transition = 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)';
    el.style.transform = isEven
      ? 'translateY(-50%) translateX(14px)'
      : 'translateY(-50%) translateX(0)';
    step++;
    setTimeout(swipe, 280);
  };
  setTimeout(swipe, 400);
}
