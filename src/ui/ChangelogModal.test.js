import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { mockChangelogData } = vi.hoisted(() => {
  const data = []
  for (let i = 0; i < 15; i++) {
    data.push({
      version: `2.${14 - i}.0`,
      changes: [`Change ${i}`]
    })
  }
  data[0].version = '2.15.0'
  data[0].changes = ['Major feature', 'Another change']
  data[1].version = '2.14.4'
  data[1].changes = ['Patch fix']
  return { mockChangelogData: data }
})

vi.mock('../data/changelog.js', () => ({
  changelogData: mockChangelogData
}))

vi.mock('../utils/i18n.js', () => ({
  t: (key) => {
    const map = {
      'config.changelogTitle': 'What\'s New v{version}',
      'config.changelogTitleAll': 'All Changes',
      'config.update': 'Update',
      'config.changelogLoading': 'Loading more changes…',
      'config.changelogCaughtUp': 'All caught up',
      'config.changelogLoadError': 'Load error. Retry.',
      'config.changelogRetry': 'Retry'
    }
    return map[key] || key
  }
}))

vi.mock('./BottomSheet.js', () => ({
  openBottomSheet: vi.fn(() => vi.fn())
}))

let mockObserverCallback = null
let mockObserveTarget = null
let mockDisconnectCalled = false

class MockIntersectionObserver {
  constructor(callback, _options) {
    mockObserverCallback = callback
    mockDisconnectCalled = false
  }
  observe(target) {
    mockObserveTarget = target
  }
  unobserve() {}
  disconnect() {
    mockDisconnectCalled = true
    mockObserverCallback = null
  }
}

function setupDOM() {
  document.body.innerHTML = `
    <div id="changelog-modal">
      <div id="changelog-title"></div>
      <div id="changelog-list">
        <ul id="changelog-items"></ul>
      </div>
      <button id="changelog-close-btn">Close</button>
      <div id="changelog-update-container" style="display:none">
        <button id="changelog-update-btn">Update</button>
      </div>
      <div id="changelog-scroll-content"></div>
    </div>
    <button id="open-changelog-link">Changelog</button>
    <div id="changelog-detail-title"></div>
    <div id="changelog-detail-subtitle"></div>
    <ul id="changelog-detail-list"></ul>
    <div id="changelog-detail-sheet"></div>
    <div id="changelog-detail-backdrop"></div>
    <div id="changelog-detail-scroll-content"></div>
    <div id="changelog-sheet-backdrop"></div>
  `
}

let showChangelogModal, initChangelog
const OriginalIntersectionObserver = globalThis.IntersectionObserver

beforeEach(async () => {
  mockObserverCallback = null
  mockObserveTarget = null
  mockDisconnectCalled = false
  globalThis.IntersectionObserver = MockIntersectionObserver

  const mod = await import('./ChangelogModal.js')
  showChangelogModal = mod.showChangelogModal
  initChangelog = mod.initChangelog
  setupDOM()
})

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
  if (OriginalIntersectionObserver) {
    globalThis.IntersectionObserver = OriginalIntersectionObserver
  } else {
    void delete globalThis.IntersectionObserver
  }
})

describe('ChangelogModal', () => {
  describe('initial render', () => {
    it('renders first 10 entries for full changelog', () => {
      showChangelogModal()
      const itemsEl = document.getElementById('changelog-items')
      const entries = itemsEl.querySelectorAll('.changelog-entry')
      expect(entries.length).toBe(10)
    })

    it('renders sentinel after initial 10 entries', () => {
      showChangelogModal()
      const itemsEl = document.getElementById('changelog-items')
      const sentinel = itemsEl.querySelector('.changelog-sentinel')
      expect(sentinel).toBeTruthy()
    })

    it('sets up IntersectionObserver watching sentinel', () => {
      showChangelogModal()
      expect(mockObserveTarget).toBeTruthy()
      expect(mockObserveTarget.classList.contains('changelog-sentinel')).toBe(true)
    })

    it('sets title to All Changes without version', () => {
      showChangelogModal()
      expect(document.getElementById('changelog-title').textContent).toBe('All Changes')
    })

    it('hides update container without version', () => {
      showChangelogModal()
      const container = document.getElementById('changelog-update-container')
      expect(container.style.display).toBe('none')
    })

    it('does not throw when modal elements are missing', () => {
      document.body.innerHTML = ''
      expect(() => showChangelogModal()).not.toThrow()
    })
  })

  describe('load more on intersection', () => {
    it('loads next 10 entries when observer fires', async () => {
      showChangelogModal()
      expect(mockObserverCallback).toBeTruthy()

      mockObserverCallback([{ isIntersecting: true }], {})

      await new Promise(resolve => setTimeout(resolve, 200))

      const itemsEl = document.getElementById('changelog-items')
      const entries = itemsEl.querySelectorAll('.changelog-entry')
      expect(entries.length).toBe(15)
    })

    it('shows caught up indicator after all entries loaded', async () => {
      showChangelogModal()

      mockObserverCallback([{ isIntersecting: true }], {})

      await new Promise(resolve => setTimeout(resolve, 200))

      const itemsEl = document.getElementById('changelog-items')
      const caughtUp = itemsEl.querySelector('.changelog-caught-up')
      expect(caughtUp).toBeTruthy()
      expect(caughtUp.textContent).toBe('All caught up')
    })

    it('does not load when sentinel is not intersecting', () => {
      showChangelogModal()

      mockObserverCallback([{ isIntersecting: false }], {})

      const itemsEl = document.getElementById('changelog-items')
      const entries = itemsEl.querySelectorAll('.changelog-entry')
      expect(entries.length).toBe(10)
    })
  })

  describe('single version mode', () => {
    it('renders 1 entry for a specific version', () => {
      showChangelogModal('2.15.0')
      const itemsEl = document.getElementById('changelog-items')
      const entries = itemsEl.querySelectorAll('.changelog-entry')
      expect(entries.length).toBe(1)
    })

    it('does not render sentinel in single version mode', () => {
      showChangelogModal('2.15.0')
      const itemsEl = document.getElementById('changelog-items')
      const sentinel = itemsEl.querySelector('.changelog-sentinel')
      expect(sentinel).toBeFalsy()
    })

    it('shows version in title', () => {
      showChangelogModal('2.15.0')
      expect(document.getElementById('changelog-title').textContent).toContain('2.15.0')
    })

    it('shows update button in single version mode', () => {
      showChangelogModal('2.15.0')
      const container = document.getElementById('changelog-update-container')
      expect(container.style.display).toBe('flex')
    })
  })

  describe('observer lifecycle', () => {
    it('disconnects observer on close', () => {
      showChangelogModal()
      document.getElementById('changelog-close-btn').click()
      expect(mockDisconnectCalled).toBe(true)
    })

    it('resets state on close', () => {
      showChangelogModal()
      document.getElementById('changelog-close-btn').click()
      showChangelogModal()
      const itemsEl = document.getElementById('changelog-items')
      const entries = itemsEl.querySelectorAll('.changelog-entry')
      expect(entries.length).toBe(10)
    })
  })

  describe('CSS classes', () => {
    it('applies changelog-entry class to entries', () => {
      showChangelogModal()
      const itemsEl = document.getElementById('changelog-items')
      const firstEntry = itemsEl.querySelector('.changelog-entry')
      expect(firstEntry).toBeTruthy()
    })

    it('applies changelog-entry-major for .0 versions', () => {
      showChangelogModal()
      const itemsEl = document.getElementById('changelog-items')
      const majorEntry = itemsEl.querySelector('.changelog-entry-major')
      expect(majorEntry).toBeTruthy()
    })

    it('applies changelog-entry-marker to entries', () => {
      showChangelogModal()
      const itemsEl = document.getElementById('changelog-items')
      const marker = itemsEl.querySelector('.changelog-entry-marker')
      expect(marker).toBeTruthy()
    })

    it('applies changelog-entry-content to entries', () => {
      showChangelogModal()
      const itemsEl = document.getElementById('changelog-items')
      const content = itemsEl.querySelector('.changelog-entry-content')
      expect(content).toBeTruthy()
    })

    it('applies changelog-entry-header to entries', () => {
      showChangelogModal()
      const itemsEl = document.getElementById('changelog-items')
      const header = itemsEl.querySelector('.changelog-entry-header')
      expect(header).toBeTruthy()
    })

    it('applies changelog-entry-tag to entries', () => {
      showChangelogModal()
      const itemsEl = document.getElementById('changelog-items')
      const tag = itemsEl.querySelector('.changelog-entry-tag')
      expect(tag).toBeTruthy()
    })

    it('applies changelog-entry-title to entries', () => {
      showChangelogModal()
      const itemsEl = document.getElementById('changelog-items')
      const title = itemsEl.querySelector('.changelog-entry-title')
      expect(title).toBeTruthy()
    })

    it('applies changelog-entry-desc to entries', () => {
      showChangelogModal()
      const itemsEl = document.getElementById('changelog-items')
      const desc = itemsEl.querySelector('.changelog-entry-desc')
      expect(desc).toBeTruthy()
    })
  })

  describe('initChangelog', () => {
    it('sets up click listener on link', () => {
      initChangelog()
      const link = document.getElementById('open-changelog-link')
      expect(link).toBeTruthy()
    })

    it('handles missing link gracefully', () => {
      document.body.innerHTML = ''
      expect(() => initChangelog()).not.toThrow()
    })

    it('calls onBeforeOpen callback', () => {
      const callback = vi.fn()
      initChangelog(callback)
      const link = document.getElementById('open-changelog-link')
      link.click()
      expect(callback).toHaveBeenCalled()
    })
  })
})
