import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../store.js', () => ({
  state: { lat: 40.4167, lon: -3.70325, locationName: 'Madrid' }
}))

vi.mock('../services/GeoService.js', () => ({
  geoService: {
    reverseGeocode: vi.fn(() => Promise.resolve('Madrid')),
    searchLocation: vi.fn(() => Promise.resolve([]))
  }
}))

vi.mock('../utils/i18n.js', () => ({
  t: vi.fn((k) => {
    const map = { 'config.loading': 'Cargando...', 'map.geoNotSupported': 'No soportado', 'map.geoFailed': 'Error' }
    return map[k] || k
  })
}))

function setupMapModalDOM() {
  document.body.innerHTML = `
    <div id="map-location-modal">
      <button id="open-location-modal-btn">Abrir</button>
      <button id="close-map-modal-btn">Cerrar</button>
      <button id="map-current-location-btn">📍</button>
      <button id="map-toggle-search-btn">🔍</button>
      <div id="map-favorites-btn">Fav</div>
      <div id="map-search-overlay" style="display:none">
        <input id="map-search-input" />
        <button id="close-map-search-btn">X</button>
        <div id="map-search-suggestions" style="display:none"></div>
      </div>
      <div id="leaflet-map"></div>
    </div>
  `
}

describe('MapSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    document.body.innerHTML = ''
  })

  it('exports initMapModal function', async () => {
    const mod = await import('./MapSelector.js')
    expect(mod.initMapModal).toBeDefined()
    expect(typeof mod.initMapModal).toBe('function')
  })

  it('does not throw when DOM elements are present', async () => {
    const mod = await import('./MapSelector.js')
    setupMapModalDOM()
    expect(() => mod.initMapModal(vi.fn())).not.toThrow()
  })

  it('works with null onLocationSelected when DOM elements exist', async () => {
    const mod = await import('./MapSelector.js')
    setupMapModalDOM()
    expect(() => mod.initMapModal(null)).not.toThrow()
  })

  it('initializes with Leaflet mocked globally', async () => {
    vi.stubGlobal('L', {
      map: vi.fn(() => ({
        setView: vi.fn(() => ({ addTo: vi.fn() })),
        on: vi.fn(),
        invalidateSize: vi.fn(),
        removeLayer: vi.fn(),
        addLayer: vi.fn()
      })),
      marker: vi.fn(() => ({
        addTo: vi.fn(() => ({
          bindPopup: vi.fn(() => ({
            openPopup: vi.fn()
          }))
        })),
        getLatLng: vi.fn(() => ({ lat: 40.4167, lng: -3.70325 }))
      })),
      control: { zoom: vi.fn(() => ({ addTo: vi.fn() })) },
      tileLayer: vi.fn(() => ({ addTo: vi.fn() }))
    })

    const mod = await import('./MapSelector.js')
    setupMapModalDOM()
    expect(() => mod.initMapModal(vi.fn())).not.toThrow()
    vi.unstubAllGlobals()
  })

  it('initializes event listeners on DOM elements', async () => {
    const mod = await import('./MapSelector.js')
    setupMapModalDOM()

    const openBtn = document.getElementById('open-location-modal-btn')
    const clickSpy = vi.spyOn(openBtn, 'addEventListener')

    mod.initMapModal(vi.fn())
    expect(clickSpy).toHaveBeenCalledWith('click', expect.any(Function))
  })
})
