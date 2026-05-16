export const changelogData = [
  {
    "version": "1.8.9e",
    "changes": [
      "Spinner → Skeleton loading: Replaced full-screen spinner overlay with pulsing skeleton blocks that mirror the app layout (header, metrics row, chart, minimap), improving perceived performance and reducing cognitive load during data fetch.",
      "Fluid typography with clamp(): Applied clamp() to location-name, weather-summary, time-main, and date-sub for smooth scaling between mobile and desktop without media query breakpoints.",
      "Scroll indicators repositioned: Moved .scroll-indicator from top:12px/height:35px to top:0/height:18px to eliminate overlap with metric cards in the scrollable top-panel-metrics row.",
      "Flex container shrink: Changed .controls-left min-width from 300px to 0 to allow proper wrapping on narrow desktop viewports."
    ]
  },
  {
    "version": "1.8.9a",
    "changes": [
      "Changelog detail backdrop leak: Fixed a bug where closing the version detail sheet removed the shared backdrop, leaving the main changelog modal open and unprotected. Fix: split the shared backdrop into two independent backdrops, one per modal, and removed the pointerEvents hack."
    ]
  },
  {
    "version": "1.8.8",
    "changes": [
      "Changelog Load Fix (iOS 18 PWA): Embedded changelog data directly in JS module, eliminating the fetch and Service Worker interception entirely — matching the same pattern used by i18n translations. This permanently avoids the WebKit Cache API empty-body bug on iOS 18.x."
    ]
  },
  {
    "version": "1.8.7",
    "changes": [
      "PWA Installability: Added beforeinstallprompt handler with install button in header, appinstalled tracking, and controllerchange listener for auto-reload on SW update.",
      "PWA Standalone Mode: Added standalone detection via display-mode + navigator.standalone with safe-area CSS adjustments.",
      "Offline Support: Created offline.html fallback page, SW navigation fallback, and online/offline event listeners with visual indicator.",
      "iOS Compatibility: Added apple-touch-icon meta tags for 120/152/167/180 sizes. Dynamic theme-color meta that updates on theme change.",
      "Manifest: Added scope field for proper PWA boundary definition."
    ]
  },
  {
    "version": "1.8.6",
    "changes": [
      "iOS Daily Cards Scroll Jank: Removed scroll-behavior:smooth, added GPU layer promotion to #daily-cards-container, changed scroll behavior to 'instant', added active-day guard to skip heavy layout ops, and removed expensive CSS transitions on .daily-card.",
      "Changelog Bottom Sheet Fetch Error on iOS: Removed { cache: 'reload' } from fetch to avoid WebKit+SW bug on iOS 18, added in-memory caching so data is fetched once, and added caches API fallback when network fetch fails."
    ]
  },
  {
    "version": "1.8.5",
    "changes": [
      "Adaptive Bottom Safe Area: Added @media (display-mode: standalone) with 8px padding for PWA mode and env(safe-area-inset-bottom) for browser mode, so the daily cards' bottom zone remains fully visible while avoiding gaps across both Safari and PWA contexts.",
      "Changelog Data Not Loading: Removed the cache-busting query string from the changelog.json fetch that prevented the Service Worker from matching cached responses, and added the file to the SW asset pre-cache list so it is always available even when the network fetch fails."
    ]
  },
  {
    "version": "1.8.4",
    "changes": [
      "Visual Bottom Padding Regression: Fixed a regression where daily cards stretched and deformed under the minimap on mobile browsers.",
      "Fixed height constraints forcing them to 80px and centered AQI/Pollen radar graphics securely within the bottom sheets layer.",
      "Changelog Instantiation: Repaired dynamic IDs across drag handles preventing the Swipe-to-Dismiss bottom-sheet version of the Changelog from rendering."
    ]
  },
  {
    "version": "1.8.3",
    "changes": [
      "Refactored the confirmation dialog globally into a bottom sheet for improved mobile UX and consistency.",
      "Added strictly enforced safe-area paddings via CSS matching the Safari responsive DOM models.",
      "Prevented Safari auto-zoom on inputs enforcing font-sizes to minimum values.",
      "Enabled native `-webkit-overflow-scrolling` elasticity throughout modal views and grids.",
      "Fixed IndexedDB bug failing to wipe background 'hourly' data entries during a specific 'YearInPixels' month wipe.",
      "Fixed an iOS Safari touch event listener issue silently omitting the Changelog modal initialization.",
      "Hardened gestures so Pull-To-Refresh overrides remain inaccessible while overlays exist.",
      "Fixed daily cards container and minimap overlapping with bottom safe-area in mobile browsers.",
      "Properly scaled safe areas on Info, YIP and Changelog modals to prevent overlaps with iOS/Android top status bars.",
      "Centered correctly the AQI and Pollen components logic across the bottom sheets layer."
    ]
  },
  {
    "version": "1.8.1",
    "changes": [
      "Fixed incorrect month translations in the 'Year in Pixels' dashboard.",
      "Added confirm dialog and fixed the 'delete location data' functionality in 'Year in Pixels', which was previously throwing a reference error.",
      "Converted the SPF, AQI, and Pollen modals into swipeable bottom sheets matching the UX of the changelog detail view.",
      "Ensured newly introduced configuration strings are fully supported in English and Spanish."
    ]
  },
  {
    "version": "1.8.0",
    "changes": [
      "Completely redesigned 'Year in Pixels' using CSS Grid structure optimized for mobile layout with vertical scroll snapping.",
      "Added detailed micro-interactions (staggered hover scale) and structural empty-future state patterns in 'Year in Pixels'.",
      "Added interactive bottom-sheet in 'Year in Pixels' revealing all tracked historical metrics when a specific daily cell is tapped.",
      "Expanded pollen data tracking in the background processor to permanently store individualized historical details per seed type (Alder, Birch, Grass, Mugwort, Olive, Ragweed).",
      "Added visualization dropdown options for the new individual pollen trackers in the 'Year in Pixels' dashboard."
    ]
  },
  {
    "version": "1.7.2",
    "changes": [
      "Added 'View Changelog' link in the settings modal to view all application changes at any time.",
      "Fixed Pollen level calculation in 'Year in Pixels' mapping incorrect pollen states.",
      "Fixed Precipitation calculation logic in 'Year in Pixels' to exactly match the rendered precipitation bars in the histogram."
    ]
  },
  {
    "version": "1.7.1",
    "changes": [
      "Added tracking and storage of AQI, pollen, wind speed, gusts, and apparent temperature in IndexedDB.",
      "Fixed precipitation tracking missing or inaccurate values in Year In Pixels.",
      "Added new visualization options (AQI, pollen, wind, apparent temp) to the Year In Pixels grid.",
      "Improved Year In Pixels modal styling to match the SPF modal (absolute positioned close button).",
      "Added functionality to close Year In Pixels modal by clicking outside."
    ]
  },
  {
    "version": "1.7.0",
    "changes": [
      "Added visual tactile feedback for cards and buttons.",
      "Added pull-to-refresh dynamic icon rotation feedback.",
      "Enhanced map search results with country flags and subregions.",
      "Added offline weather history saving utilizing IndexedDB (auto cleanup > 1 year).",
      "Added 'Year in Pixels' feature to visualize stored history.",
      "Improved UI and transitions for active daily cards."
    ]
  },
  {
    "version": "1.6.8",
    "changes": [
      "Added version update detection mechanism.",
      "Introduced toast notifications for available updates.",
      "Added recent changes modal dialog on updates."
    ]
  },
  {
    "version": "1.6.7",
    "changes": [
      "Histogram Height Expansion: Fixed an implicit flex-height collapse rendering issue.",
      "Safe Area Insets: Meticulously recalibrated safe-area-inset padding parameters.",
      "Leaflet Overlay Restructuring: Relocated the Leaflet interactive zoom controls natively to bottom-left.",
      "Dynamic Mobile Padding: Action bars at the bottom inherently adapt to variable safe-areas."
    ]
  },
  {
    "version": "1.6.6",
    "changes": [
      "Map Geolocation Popups: Resolved an issue where using the 'My Location' button within the map view would hang infinitely.",
      "Cache Clearing Regression: Fixed a missing FavoritesService.clear() method implementation."
    ]
  }
];
