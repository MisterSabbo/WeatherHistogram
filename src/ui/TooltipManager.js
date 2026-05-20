let _initialized = false

function getTooltipContainer(el) {
  if (el.classList.contains('info-icon')) {
    return el.closest('.data-value')
  }
  return el
}

function getTooltip(el) {
  const container = getTooltipContainer(el)
  if (!container) return null
  return container.querySelector('.custom-tooltip')
}

function isLocationTruncated() {
  const locName = document.getElementById('location-name')
  const summary = document.getElementById('weather-summary')
  return (locName && locName.scrollWidth > locName.clientWidth) ||
         (summary && summary.scrollWidth > summary.clientWidth)
}

function closeAllTooltips() {
  document.querySelectorAll('.custom-tooltip').forEach(t => {
    const el = /** @type {HTMLElement} */ (t)
    el.style.display = ''
    el.style.position = ''
    el.style.top = ''
    el.style.left = ''
    el.style.transform = ''
    el.style.zIndex = ''
  })
}

export function showTooltip(el) {
  const tt = getTooltip(el)
  if (!tt) return

  if (el.classList.contains('location-group') && !isLocationTruncated()) return

  tt.style.display = 'block'

  if (window.innerWidth < 600) {
    const rect = el.getBoundingClientRect()
    tt.style.position = 'fixed'
    tt.style.top = (rect.bottom + 10) + 'px'
    tt.style.left = '50%'
    tt.style.transform = 'translateX(-50%)'
    tt.style.zIndex = '9999'
  }
}

export function hideTooltip(el) {
  const tt = getTooltip(el)
  if (tt) tt.style.display = ''
}

export function initTooltipManager() {
  if (_initialized) return
  _initialized = true

  // Desktop hover
  document.querySelectorAll('.info-icon, .location-group').forEach(el => {
    el.addEventListener('mouseenter', () => {
      if (window.innerWidth >= 600) showTooltip(el)
    })
    el.addEventListener('mouseleave', () => {
      if (window.innerWidth >= 600) hideTooltip(el)
    })
  })

  // Mobile click
  document.querySelectorAll('.data-value, .location-group').forEach(el => {
    el.addEventListener('click', (e) => {
      if (window.innerWidth >= 600) return
      const tt = getTooltip(el)
      if (!tt) return

      if (el.classList.contains('location-group') && !isLocationTruncated()) return

      const isVisible = tt.style.display === 'block'
      closeAllTooltips()

      if (!isVisible) {
        showTooltip(el)
      }
      e.stopPropagation()
    })
  })

  // Global click closes all tooltips on mobile
  document.addEventListener('click', () => {
    if (window.innerWidth < 600) {
      closeAllTooltips()
    }
  })
}
