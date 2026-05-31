export const changelogData = [
  {
    "version": "1.14.1",
    "changes": [
      "YIP scroll snapping a meses en móvil: scroll-snap-type movido de .yip-year-grid (contenido interno) a .yip-modal-scroll-content (contenedor scroll real) y añadido scroll-snap-stop: always para que el scroll vertical se detenga en cada mes en lugar de ser continuo, facilitando la navegación móvil."
    ]
  },
  {
    "version": "1.14.0",
    "changes": [
      "Fixed legend with Cell/State tabs in YIP modal: legend moved outside scroll area as fixed footer with two tabs (Cell for parameter colors, State for condition dots) navigable via pagination dots (● active / ○ inactive). State tab shows 4 condition dots (notes=blue, mood=gold, cold=red, allergies=green). Cell tab updates reactively on param change. i18n strings for tab and condition labels. All tests pass."
    ]
  },
  {
    "version": "1.13.1",
    "changes": [
      "Soporte de modo claro en YIP: getColorForParam() ahora devuelve variantes 1-2 tonos más oscuras/saturadas en modo claro para los 5 colores pastel problemáticos (#93c5fd, #bfdbfe, #ccfbf1, #5eead4, #a3e635), con cache _yipTheme para evitar 365+ lecturas de state.theme por render. Añadida variable CSS --yip-day-number-color en [data-theme='light']. Override .yip-dot-badge en light mode (fondo más claro, texto oscuro). Todas las pruebas unitarias y E2E pasan."
    ]
  },
  {
    "version": "1.13.0b",
    "changes": [
      "Fix: highlight YIP no visible por falta de data-theme en init — los selectores CSS [data-theme='dark'] nunca matcheaban porque data-theme solo se asignaba al toggle manual del tema. Añadido setAttribute en initTheme() para que todos los selectores [data-theme] funcionen desde el arranque. El toast '✓ Guardado' se movió fuera del detail sheet (position fixed) para no desaparecer con el cierre. El highlight se difiere 350ms para ejecutarse tras la animación de cierre (300ms). Todos los tests pasan."
    ]
  },
  {
    "version": "1.13.0a",
    "changes": [
      "Highlight más intenso y mini toast al guardar en YIP: el highlight combina box-shadow pulsante + transform: scale(1.15) + outline semitransparente usando var(--accent-precip). Duración 1s (antes 1.5s). Intensidad: opacidad 0.5 (claro) / 0.3 (oscuro). Mini toast animado '✓ Guardado' en parte inferior del detail sheet con fade in/out, 600ms antes de cerrar. Todas las pruebas pasan."
    ]
  },
  {
    "version": "1.13.0",
    "changes": [
      "YIP modal: cabecera y campos sticky al hacer scroll — DOM reestructurado para que header y fields-bar estén fuera del scroll-content, siempre visibles durante scroll vertical en el grid. Snapshots E2E regenerados."
    ]
  },
  {
    "version": "1.12.0",
    "changes": [
      "Node.js 22 → 24 (Active LTS): CI actualizado a Node 24, añadido .nvmrc y engines en package.json.",
      "Dependencias actualizadas: Vite 6→8, @types/node 25.9.0→25.9.1, vitest 4.1.6→4.1.7.",
      "E2E visual snapshots regenerados para Node 24 + Vite 8. Todos los tests pasan.",
      "PTR nativo de Chrome Android disparado al hacer scroll en YIP modal: movido overscroll-behavior-y: contain de .yip-modal a .yip-modal-scroll-content. En Chrome, overscroll-behavior debe estar en el elemento scrollable real, no en el contenedor."
    ]
  },
  {
    "version": "1.11.0d",
    "changes": [
      "YIP modal responsive: bottom sheet en móvil (<768px, ≥95dvh), modal centrado en escritorio con animación de escala. Drag-to-dismiss (>100px), backdrop separado, control por clases CSS en vez de style.display. Celdas grid: min-width 32→38px, gap 4→5px."
    ]
  },
  {
    "version": "1.11.0c",
    "changes": [
      "Badge +N en vez de elipsis en YIP: reemplazado '…' por badge numérico '+N' con fondo semitransparente oscuro y texto blanco en negrita para indicar estados no meteorológicos extra en las celdas del Year in Pixels. El badge muestra 2 dots + '+N' (ej. '+2', '+3') en vez de 3 dots + '+N', asegurando máximo 3 elementos por celda. Todas las pruebas unitarias y E2E pasan."
    ]
  },
  {
    "version": "1.11.0b",
    "changes": [
      "Immediate visual feedback on YIP save: grid now re-renders immediately after saving, with a 1.5s highlight flash on the saved cell. New 'Clear' button in the detail sheet that empties all fields (notes, moods, cold, allergies). Error toast shown if save fails (sheet stays open for retry). Saving with empty data is equivalent to deleting the day's previous data. All unit + E2E tests pass."
    ]
  },
  {
    "version": "1.11.0a",
    "changes": [
      "YIP detail sheet: drag handle now stays fixed at top while content scrolls beneath. scrollTop resets to 0 on open, preventing scroll position leaks between days.",
      "Fixed-handle pattern generalized to all 10 bottom sheets — AQI, Pollen, SPF, Confirm modals now use scroll wrapper pattern with correct scrollElementId passed to openBottomSheet(), ensuring swipe-to-dismiss guard works with overflow-y:hidden sheets.",
      "Fixed populateParamSheet() to use #yip-param-options-container instead of creating .yip-bottom-sheet-body child.",
      "Fixed TooltipManager.js scrollElementId: aqi-modal and pollen-modal now correctly use -sheet-scroll-content suffix instead of -modal-scroll-content.",
      "All 376 unit tests + 25 E2E tests pass."
    ]
  },
  {
    "version": "1.11.0",
    "changes": [
      "Cold & allergy tracking in YIP: Users can now mark whether they had a cold or allergies on any given day in the Year in Pixels grid. Two toggle buttons '🤧 Cold' and '🌿 Allergies' in the day detail sheet, persisted in IndexedDB via storageService.updateDayConditions(). New 'Health' category in param sheet with 'Cold' (yellow) and 'Allergies' (green) as selectable grid parameters. Dot indicator system replaces individual icons — each cell shows up to 3 semantic 4px dots at the bottom (blue=notes, yellow=mood, red=cold, green=allergies) with '…' ellipsis for 4+. Dots always visible regardless of active parameter. All 376 unit tests + 13 E2E tests pass."
    ]
  },
  {
    "version": "1.10.2",
    "changes": [
      "Clickable no-data days in YIP grid: past days without weather data are now clickable, opening detail sheet with 'Sin datos meteorológicos' message. Notes/moods can still be saved on no-data days. StorageService creates history entry if day is missing. All 376 unit tests + 13 E2E tests pass."
    ]
  },
  {
    "version": "1.10.1",
    "changes": [
      "Unified save/cancel in YIP detail sheet: replaced separate save/cancel for notes and moods with a single save/cancel footer. Added saveDayDetail() that persists both in parallel and auto-closes after 1s with '✓ Saved' feedback. Cleaner UX with fewer taps. All 370 unit tests + 13 E2E tests pass."
    ]
  },
  {
    "version": "1.10.0f",
    "changes": [
      "YIP grid: added day-of-week column headers (LUN/MAR/MIÉ/JUE/VIE/SÁB/DOM) above each month block and day number (1-31) centered at the top of each cell. Headers use i18n `days.short` keys aligned to Monday-start. Day number uses small font (8px) with `text-shadow` for readability over colored backgrounds. Zero functional regression."
    ]
  },
  {
    "version": "1.10.0e",
    "changes": [
      "Fix: Mali-G76 GPU driver bug (Redmi Note 10S) — FINAL root cause fix. The Mali-G76 has a driver bug in GPU compositing of multiple adjacent 2D canvases. Forced software (CPU) rendering on all tile canvases via getContext('2d', { willReadFrequently: true }) to bypass the GPU compositing pipeline. Added snap-to-integer scroll on scrollend/mouseup/touchend to prevent sub-pixel artifacts. Reverted 1px tile overlap (no longer needed). image-rendering: pixelated → auto. (Supersedes v1.10.0c and v1.10.0d — neither CSS layer composition nor alpha workarounds address the Mali-G76 driver bug.)"
    ]
  },
  {
    "version": "1.10.0d",
    "changes": [
      "Fix: Mali-G76 GPU layer composition artifacts (Redmi Note 10S) — REAL root cause fix. CSS will-change:transform + transform-style:preserve-3d on ALL canvases created independent GPU 3D layers per tile, causing sub-pixel seams, opaque translucent layers, and clipped elements on Mali-G76. 3D CSS properties now apply ONLY to #fixed-overlay-canvas. Tile canvases use will-change:auto, transform-style:flat, image-rendering:pixelated. #canvas-wrapper uses translateZ(0) for a single GPU layer. Tile canvases overlap 1px to hide sub-pixel seams. Reverted destination-out workaround from v1.10.0c — only clearRect() remains. (Superseded by v1.10.0e — real root cause is Mali-G76 GPU driver bug, fixed via software rendering with willReadFrequently.)"
    ]
  },
  {
    "version": "1.10.0c",
    "changes": [
      "Fix: Mali-G76 alpha compositing artifacts (Redmi Note 10S) — robust canvas clearing via clearRect + destination-out fill + source-over reset in drawTile(). Tile canvases created without alpha channel to prevent GPU compositing corruption on alternating tiles. (Superseded by v1.10.0d, then v1.10.0e — real root cause is Mali-G76 GPU driver bug, fixed via software rendering with willReadFrequently.)"
    ]
  },
  {
    "version": "1.10.0b",
    "changes": [
      "Fix: settings modal X button now works reliably on mobile — added touch-action: manipulation to .sheet-close-btn to prevent the browser from interpreting taps as scroll gestures on some mobile browsers.",
      "Fix: changelog modal X button now works reliably on mobile — same touch-action: manipulation fix applied to the changelog close button."
    ]
  },
  {
    "version": "1.10.0a",
    "changes": [
      "Fix: YIP location selector dots now match saved locations — dots render 1:1 with .yip-chip elements using getBoundingClientRect center proximity instead of scroll-width pages. Always visible when chips exist. Added resize listener."
    ]
  },
  {
    "version": "1.10.0",
    "changes": [
      "Mood tracking per day in YIP: Users can now assign mood states to individual days in the Year in Pixels dashboard. Six classic moods (Happy, Neutral, Sad, Angry, Anxious, Tired) with emoji icons and distinct colors. Mood is a selectable grid parameter and shown as emoji icon on cells. Multi-select mood toggles in the day detail sheet. Persisted in IndexedDB via storageService.updateDayMoods(). Spanish and English translations included."
    ]
  },
  {
    "version": "1.9.0",
    "changes": [
      "Personal notes per day in YIP: Users can now add personal text notes to individual days in the Year in Pixels dashboard. Notes are persisted in IndexedDB via storageService.updateDayNotes(). Days with notes show a notebook icon in their grid cell. Spanish and English translations included."
    ]
  },
  {
    "version": "1.8.20a",
    "changes": [
      "Fix: changelog timeline line now extends across all items — moved from fixed position in scroll container to inside #changelog-list, so it grows with content height and scrolls with items."
    ]
  },
  {
    "version": "1.8.20",
    "changes": [
      "Fix: clear-cache-and-reload no longer triggers double app reload — sessionStorage flag (_skipSwReload) set before navigation to prevent controllerchange in the new SW registration from triggering a second reload.",
      "Fix: Service Worker no longer intercepts fonts.googleapis.com and fonts.gstatic.com requests, preventing network errors that caused missing icons and fonts after cache clearing."
    ]
  },
  {
    "version": "1.8.19",
    "changes": [
      "E2E Tests: Added Playwright-based end-to-end tests — visual screenshot comparisons (full chart, minimap, daily cards, themes), modal interaction tests (info/settings, changelog, theme toggle, language switch, location button), and theme screenshots. Added playwright.config.ts, test:e2e npm script, CI workflow (.github/workflows/ci.yml), and deterministic mock data helpers. All 11 E2E tests pass."
    ]
  },
  {
    "version": "1.8.18",
    "changes": [
      "Refactor (Phase 8): State & Config Consolidation — unified numeric constants in CONFIG, applied Object.freeze(), removed local const overrides in app.js, fixed stale TILE_WIDTH. All 81 unit tests pass."
    ]
  },
  {
    "version": "1.8.17",
    "changes": [
      "Refactor (Phase 7): App.js Block Splitting — extracted TopPanel UI (src/ui/TopPanel.js), WeatherFetcher (src/domain/WeatherFetcher.js), OverlayRenderer helpers (src/render/OverlayRenderer.js), thresholds utility (src/utils/thresholds.js); refactored init() into 28 named functions. app.js reduced 1925→1366 lines (~29%). All 81 tests pass."
    ]
  },
  {
    "version": "1.8.16",
    "changes": [
      "Fix: Minimap invisible after auto mode-switch (past/future) — MINIMAP_HEIGHT now stored as constructor property in MinimapRenderer, removing dependency from method parameters. Triggered when updateViewport was called without MINIMAP_HEIGHT, causing NaN canvas height on auto-switch via setMode → draw. No functional regression."
    ]
  },
  {
    "version": "1.8.15",
    "changes": [
      "Refactor (Phase 5): Extracted MinimapRenderer (past/future modes, caching, click-to-scroll), ChangelogModal (init, open, render with detail navigation), PWA helpers (registerSW, handleInstallPrompt, checkAppVersion, clearCacheAndReload), and debounce utility into separate modules. All have unit tests. 4 new files. No functional regression."
    ]
  },
  {
    "version": "1.8.14",
    "changes": [
      "Refactor: Extracted PullToRefresh, SpfModal, AlertEngine, and TooltipManager into separate modules — PTR touch handling moved to src/ui/PullToRefresh.js, SPF modal logic to src/ui/SpfModal.js, weather alert generation/rendering to src/utils/AlertEngine.js, and header tooltip interactions to src/ui/TooltipManager.js. All four modules have unit tests. No functional regression."
    ]
  },
  {
    "version": "1.8.13b",
    "changes": [
      "Fix: Settings panel positioned at bottom-left on desktop — reordered @import in style.css so year-in-pixels.css comes before modals.css, restoring the correct cascade where .info-sheet's desktop media query (translateX) overrides .yip-bottom-sheet's default (translateY)."
    ]
  },
  {
    "version": "1.8.13a",
    "changes": [
      "Refactor: Split src/style.css (1889 lines) into 8 per-section CSS modules — variables.css, controls.css, layout.css, daily-cards.css, minimap.css, modals.css, year-in-pixels.css, animations.css. style.css now serves as an @import index. Zero visual regression."
    ]
  },
  {
    "version": "1.8.13",
    "changes": [
      "Tooling: Added TypeScript JSDoc checking via tsconfig.json — npm run typecheck to verify type correctness.",
      "Tooling: Added Vitest test runner with jsdom environment — npm test / npm test:watch for unit tests."
    ]
  },
  {
    "version": "1.8.12f",
    "changes": [
      "Fix: bottom-sheet clickable elements not working on desktop — removed setPointerCapture that prevented click events from firing on interactive elements inside bottom sheets."
    ]
  },
  {
    "version": "1.8.12e",
    "changes": [
      "Enhanced scroll indicators: Redesigned left/right scroll arrows — pill-shaped with background + shadow, vertically centered at 32x32px, using .visible class for smooth transitions.",
      "Scroll-snap pagination: Added scroll-snap-type: x mandatory to the metrics container and scroll-snap-align: start to each data card for intentional page-by-page swiping.",
      "Discovery swipe animation: On first overflow, the right indicator performs a 3-bounce swipe animation to teach users about scrollable content.",
      "Better pagination dots: Increased from 5px to 8px with active glow effect. Added fraction page counter (e.g. '1/3') for exact position feedback.",
      "Right-padding peek: Added 35px right padding inside the scroll container so the next card is always partially visible.",
      "Swipe hint i18n: Added topPanel.swipeHint string in both Spanish and English."
    ]
  },
  {
    "version": "1.8.12d",
    "changes": [
      "Android gesture navigation compatibility: Added overscroll-behavior-x: contain to the horizontal scroll container and mobile metrics row to prevent system back gestures from capturing horizontal swipes.",
      "PWA display_override: Added display_override: ['standalone'] to the web app manifest for more robust standalone mode behavior on Android Chrome.",
      "Navigation API interception: Prevents back navigation during active horizontal scroll of the timeline, reducing unintended browser history back events while scrolling."
    ]
  },
  {
    "version": "1.8.12c",
    "changes": [
      "Remove: YIP location selector scroll buttons (◀▶) removed — the pagination dots alone are sufficient for indicating overflow and current position."
    ]
  },
  {
    "version": "1.8.12b",
    "changes": [
      "Fix: bottom-sheet scroll guard now checks the correct scrollable element — added missing IDs (info-sheet-content, changelog-scroll-content, changelog-detail-scroll-content) and removed stale yip-param-options-container reference (populateParamSheet appends to sheet, not the container)."
    ]
  },
  {
    "version": "1.8.12a",
    "changes": [
      "Metrics row pagination dots: Added dot indicators below the horizontally scrollable metrics cards on mobile, making it obvious that additional metrics are available by swiping.",
      "YIP parameter sheet visual hierarchy: Refactored populateParamSheet() to use pre-defined CSS classes instead of inline styles — category titles now have a border-bottom separator and selectable items have proper hover/active states."
    ]
  },
  {
    "version": "1.8.12",
    "changes": [
      "Fix: white line at histogram bottom — cached tile height between handleResize and drawTile to prevent height drift; changed #chart-area background from hardcoded #f5f5f5 to var(--bg-color).",
      "UX: YIP location selector now shows scroll buttons (◀▶) and pagination dots when chips overflow — makes horizontal scrollability obvious on mobile."
    ]
  },
  {
    "version": "1.8.11",
    "changes": [
      "Fix: bottom-sheet drag-to-dismiss on Android — added pointercancel handler with touch-event fallback to continue tracking swipe after Chrome takes over the gesture.",
      "Fix: clear-cache action guarded against double execution via _isClearingCache flag in performClearCacheAndReload().",
      "Fix: touch event race condition — onTouchStart now sets usingTouch immediately to prevent double-processing when touchstart fires before pointerdown.",
      "Fix: stale backdrop.onclick reference cleaned up in closeSheet()."
    ]
  },
  {
    "version": "1.8.10b",
    "changes": [
      "Fix: bottom-sheet z-index now dynamically managed via monotonically increasing counter in openBottomSheet() — enables proper stacking with dimming.",
      "Fix: confirm dialogs no longer trapped behind settings panel due to unified z-index management.",
      "Fix: range sliders no longer trigger vertical page scroll (touch-action: none on input[type=range]).",
      "Fix: info-sheet and YIP-param-sheet close on swipe-down (openBottomSheet now accepts scrollElementId parameter).",
      "Fix: per-species pollen thresholds with correct YIP coloring — Alder:15/75/250, Birch:15/80/300, Grass:10/50/250, Mugwort:10/50/150, Olive:50/200/500, Ragweed:10/50/150.",
      "Fix: Fototipo and Umbrales are now independently collapsible sections.",
      "Feature: YIP param sheet categories have visually distinct labels.",
      "Feature: YIP pollen legend shows 5 steps (Ninguno, Bajo, Moderado, Alto, Muy Alto)."
    ]
  },
  {
    "version": "1.8.10a",
    "changes": [
      "Fix: closeInfoSheet block-scoping caused ReferenceError when opening changelog from settings.",
      "Fix: theme-sheet and YIP-param-sheet backdrops now block clicks on settings panel behind them (z-index fix).",
      "Feature: added language-switch confirmation dialog before applying translation reload.",
      "Fix: skin type and stickman thresholds moved to separate sections in settings panel.",
      "Fix: confirm dialog now renders above the settings panel (z-index 7500).",
      "Fix: restored missing individual pollen type options in YIP parameter sheet (7 total: general + 6 species).",
      "Fix: maintenance section is now always visible (no longer collapsible)."
    ]
  },
  {
    "version": "1.8.10",
    "changes": [
      "Settings modal → adaptive side panel + bottom sheet: Replaced the fixed pop-up modal with a responsive panel — bottom sheet on mobile (<768px), right-side sliding panel on desktop (≥768px), using CSS media queries to switch between translateY and translateX transforms.",
      "Native selects → touch-friendly bottom sheets: Chart theme selector and YIP parameter selector replaced with bottom sheet pickers with swatch preview and category grouping.",
      "YIP location dropdown → horizontal chips: Replaced <select> for location in Year in Pixels with horizontally scrollable touch-friendly chips.",
      "Stickman thresholds → range sliders: Replaced <input type='number'> with <input type='range'> for cold, hot, wind, and cloud thresholds with live value preview on drag.",
      "Settings theme toggle: Added a dark/light toggle switch in the settings panel that syncs with the top-bar theme button.",
      "Collapsible maintenance section: Danger buttons (Clear Cache, Clear Data) grouped under a collapsible 'Mantenimiento' section.",
      "Settings restructured into sections: About, Apariencia (theme toggle + chart theme selector), Confort (skin type + stickman thresholds), Mantenimiento."
    ]
  },
  {
    "version": "1.8.9g",
    "changes": [
      "Skeleton loading rendered in-place within the layout (no fixed overlay): Removed the full-screen #overlay with semi-transparent background. Skeletons are now native elements inside #controls-bar, #top-panel, #chart-area and #bottom-nav-container, toggled via the .loading class on #app-wrapper. drawFixedOverlay() now skips during loading. Added all 7 metric cards (wind, AQI, pollen, temp, precip, precip prob, clouds), plus location, weather summary and time/date to the skeleton."
    ]
  },
  {
    "version": "1.8.9f",
    "changes": [
      "SPF modal not closing on \"Cambiar fototipo\": Fixed inline transform leak that kept the sheet visible after removing the .open class.",
      "Universal swipe-to-dismiss on all bottom-sheets: Swipe gesture now works on the entire sheet body (not just the drag handle), with scrollTop guard to avoid conflicting with internal scroll. Supports both touch and mouse via pointer events.",
      "YIP detail sheet: Added drag handle and swipe-to-dismiss support via shared openBottomSheet()."
    ]
  },
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
