### UI Components

All in `src/ui/`:

| Component | Purpose |
|-----------|---------|
| `TopPanel.js` | Updates header DOM (location name, weather summary, time, all metric cards: wind, AQI, pollen, temp, precip, prob, clouds) |
| `DailyCards.js` | Forecast cards in bottom nav |
| `BottomSheet.js` | Swipe-to-dismiss bottom sheets with dynamic z-index stacking, pointer + touch event handling, scroll-top guard |
| `MapSelector.js` | Leaflet map modal with search, geolocation, favorites |
| `FavoritesModal.js` | Saved locations list with edit/rename/delete |
| `YearInPixels.js` | Historical heatmap grid (CSS Grid) with per-day detail bottom sheet |
| `AqiRadar.js` / `PollenRadar.js` | Canvas radar charts for AQI and pollen tooltips/modals |
| `PullToRefresh.js` | Touch drag-to-refresh gesture with visual indicator |
| `ChangelogModal.js` | Version history list with per-version detail navigation |
| `SpfModal.js` | Sun protection sheet with UV index, skin type time-to-burn, SPF recommendation |
| `TooltipManager.js` | Desktop hover + mobile click tooltips for header info icons |
| `ScrollIndicator.js` | Left/right scroll arrows + pagination dots for the metrics row |
