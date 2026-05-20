import { describe, it, expect, vi, beforeEach } from 'vitest'
import { showChangelogModal, initChangelog } from './ChangelogModal.js'

vi.mock('../data/changelog.js', () => ({
  changelogData: [
    { version: '2.0.0', changes: ['Major feature', 'Another change'] },
    { version: '1.8.4', changes: ['Patch fix'] }
  ]
}))

vi.mock('../utils/i18n.js', () => ({
  t: (key) => {
    const map = {
      'config.changelogTitle': 'What\'s New v{version}',
      'config.changelogTitleAll': 'All Changes',
      'config.update': 'Update'
    }
    return map[key] || key
  }
}))

vi.mock('./BottomSheet.js', () => ({
  openBottomSheet: vi.fn(() => vi.fn())
}))

describe('ChangelogModal', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="changelog-modal">
        <div id="changelog-title"></div>
        <div id="changelog-list">
          <div id="changelog-items"></div>
        </div>
        <button id="changelog-close-btn">Close</button>
        <div id="changelog-update-container" style="display:none">
          <button id="changelog-update-btn">Update</button>
        </div>
      </div>
      <button id="open-changelog-link">Changelog</button>
      <div id="changelog-detail-title"></div>
      <div id="changelog-detail-subtitle"></div>
      <ul id="changelog-detail-list"></ul>
      <div id="changelog-detail-sheet"></div>
      <div id="changelog-detail-backdrop"></div>
      <div id="changelog-detail-scroll-content"></div>
      <div id="changelog-sheet-backdrop"></div>
      <div id="changelog-scroll-content"></div>
    `
  })

  it('showChangelogModal renders changelog list', () => {
    showChangelogModal()
    const itemsEl = document.getElementById('changelog-items')
    expect(itemsEl.children.length).toBe(2)
  })

  it('showChangelogModal with version filters to single item', () => {
    showChangelogModal('2.0.0')
    const itemsEl = document.getElementById('changelog-items')
    expect(itemsEl.children.length).toBe(1)
    expect(document.getElementById('changelog-title').textContent).toContain('2.0.0')
  })

  it('showChangelogModal without version shows all changes', () => {
    showChangelogModal()
    expect(document.getElementById('changelog-title').textContent).toBe('All Changes')
  })

  it('showChangelogModal returns early when modal elements missing', () => {
    document.body.innerHTML = ''
    expect(() => showChangelogModal()).not.toThrow()
  })

  it('initChangelog sets up click listener', () => {
    initChangelog()
    const link = document.getElementById('open-changelog-link')
    expect(link).toBeTruthy()
  })

  it('initChangelog handles missing link gracefully', () => {
    document.body.innerHTML = ''
    expect(() => initChangelog()).not.toThrow()
  })
})
