let _ptrStartY = 0
let _ptrStartX = 0
let _ptrDist = 0
let _isRefreshing = false
let _onRefreshCallback = null

const OVERLAY_SELECTOR = [
  '.yip-sheet-backdrop.open',
  '#info-modal[style*="display: flex"]',
  '#favorites-modal[style*="display: flex"]',
  '#map-location-modal[style*="display: flex"]',
  '#prompt-modal[style*="display: flex"]',
  '#changelog-modal.open',
  '#yip-modal.open'
].join(', ')

function hasOverlayOpen() {
  return document.querySelectorAll(OVERLAY_SELECTOR).length > 0
}

function resetUI() {
  const ptrIcon = document.getElementById('ptr-icon')
  if (ptrIcon) {
    ptrIcon.dataset.spinning = 'false'
    if (ptrIcon.dataset.spinInterval) {
      clearInterval(parseInt(ptrIcon.dataset.spinInterval))
    }
  }
  const ptrIndicator = document.getElementById('ptr-indicator')
  if (ptrIndicator) {
    ptrIndicator.style.transition = 'transform 0.3s ease-out'
    ptrIndicator.style.transform = 'translateY(-100%)'
  }
  const appWrapper = document.getElementById('app-wrapper')
  if (appWrapper) {
    appWrapper.style.transition = 'transform 0.3s ease-out'
    appWrapper.style.transform = 'translateY(0)'
  }
}

function onTouchStart(e) {
  if (e.touches.length !== 1 || hasOverlayOpen()) {
    _ptrStartY = 0
    return
  }
  const target = e.target
  if (target && typeof target.closest === 'function' && target.closest('#search-results')) {
    _ptrStartY = 0
    return
  }
  _ptrStartY = e.touches[0].clientY
  _ptrStartX = e.touches[0].clientX
  _ptrDist = 0
}

function onTouchMove(e) {
  if (e.touches.length === 1 && _ptrStartY > 0) {
    const currentY = e.touches[0].clientY
    const currentX = e.touches[0].clientX

    if (Math.abs(currentX - _ptrStartX) > Math.abs(currentY - _ptrStartY)) {
      _ptrStartY = 0
      _ptrDist = 0
      const ptrIndicator = document.getElementById('ptr-indicator')
      if (ptrIndicator) ptrIndicator.style.transform = 'translateY(-100%)'
      const appWrapper = document.getElementById('app-wrapper')
      if (appWrapper) appWrapper.style.transform = 'translateY(0)'
      return
    }

    if (currentY > _ptrStartY) {
      if (e.cancelable) e.preventDefault()

      _ptrDist = currentY - _ptrStartY

      if (_ptrDist > 0 && _ptrDist < 200 && !_isRefreshing) {
        const visualDist = Math.min(75, _ptrDist / 2.5)
        const ptrIndicator = document.getElementById('ptr-indicator')
        if (ptrIndicator) {
          ptrIndicator.style.transition = 'none'
          ptrIndicator.style.transform = `translateY(${visualDist - 75}px)`
          const ptrIcon = document.getElementById('ptr-icon')
          if (ptrIcon) {
            const rotation = Math.min(360, (visualDist / 75) * 360)
            ptrIcon.style.transform = `rotate(${rotation}deg)`
            ptrIcon.style.opacity = String(Math.min(1, visualDist / 40))
          }
        }
        const appWrapper = document.getElementById('app-wrapper')
        if (appWrapper) {
          appWrapper.style.transition = 'none'
          appWrapper.style.transform = `translateY(${visualDist}px)`
        }
      }
    } else {
      _ptrDist = 0
    }
  }
}

function onTouchEnd() {
  if (_ptrDist > 60 && _onRefreshCallback && !_isRefreshing) {
    const ptrIcon = document.getElementById('ptr-icon')
    if (ptrIcon) {
      ptrIcon.style.transition = 'transform 0.5s linear'
      ptrIcon.dataset.spinning = 'true'
      let spinDeg = 360
      const spinInterval = setInterval(() => {
        if (ptrIcon.dataset.spinning !== 'true') {
          clearInterval(spinInterval)
          return
        }
        spinDeg += 360
        ptrIcon.style.transform = `rotate(${spinDeg}deg)`
      }, 500)
      ptrIcon.dataset.spinInterval = String(spinInterval)
    }

    const ptrIndicator = document.getElementById('ptr-indicator')
    if (ptrIndicator) {
      ptrIndicator.style.transition = 'transform 0.2s ease-out'
      ptrIndicator.style.transform = 'translateY(0px)'
    }
    const appWrapper = document.getElementById('app-wrapper')
    if (appWrapper) {
      appWrapper.style.transition = 'transform 0.2s ease-out'
      appWrapper.style.transform = 'translateY(75px)'
    }

    _isRefreshing = true
    _onRefreshCallback().finally(() => {
      _isRefreshing = false
      resetUI()
    })
  } else {
    resetUI()
  }

  _ptrStartY = 0
  _ptrStartX = 0
  _ptrDist = 0
}

/**
 * @param {{ onRefresh?: () => void }} [opts]
 */
export function initPullToRefresh({ onRefresh } = {}) {
  _onRefreshCallback = onRefresh || null

  document.addEventListener('touchstart', onTouchStart, { passive: true })
  document.addEventListener('touchmove', onTouchMove, { passive: false })
  document.addEventListener('touchend', onTouchEnd)

  return {
    destroy() {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
      _onRefreshCallback = null
      _isRefreshing = false
    }
  }
}
