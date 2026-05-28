---
name: ensure-pwa-dual-mode
description: Use when building, testing, or deploying a PWA hosted on GitHub Pages to ensure it functions correctly both in regular browser mode and PWA standalone mode; also use when diagnosing why features work in one mode but not the other, or when verifying that routing, offline behavior, rendering, and platform APIs behave identically in both contexts
---

# Ensure PWA Dual-Mode (Web + Standalone)

## Overview

A PWA hosted on GitHub Pages must function correctly in **two distinct contexts**: as a regular website in a browser tab, and as an installed standalone app. These contexts have different rendering environments, constraint sets, and user expectations. This skill provides a systematic process to ensure feature parity between both modes.

**Core principle:** Always test in BOTH modes. A feature that works in browser mode but breaks in standalone mode (or vice versa) is a bug.

## When to Use

```
         ┌───────────────────────────────────┐
         │ Are you building/testing a PWA    │
         │ hosted on GitHub Pages?           │
         └──────────────┬────────────────────┘
                        │
              ┌─────────┴─────────┐
              │ YES               │ NO
              │                   │
        ┌─────▼─────┐       ┌────▼──────────┐
        │ Does it   │       │ Use companion │
        │ need to   │       │ skills instead│
        │ work in   │       │ (pwa-develop- │
        │ BOTH web  │       │ ment, pwa-    │
        │ AND PWA   │       │ github-pages) │
        │ standalone│       └───────────────┘
        │ modes?    │
        └──┬───┬────┘
           │   │
      ┌────▼───▼──┐
      │ USE THIS  │
      │ SKILL     │
      └───────────┘
```

**Use when:**
- You need to verify a feature works identically in browser and standalone PWA mode
- A feature works in dev but breaks in production on GH Pages (in either mode)
- Debugging routing differences between web and PWA mode
- Testing offline behavior in both browser and standalone mode
- Ensuring CSS/layout renders correctly in both contexts
- Validating that the install/prompt flow works correctly
- Before releasing a new version, as part of QA
- Migrating an existing web app to PWA + GH Pages and need to verify both modes

**Do NOT use when:**
- Building PWA features from scratch (use `pwa-development`)
- Configuring deployment to GitHub Pages (use `pwa-github-pages`)
- Debugging iOS-only or Android-only issues (use `pwa-cross-platform`)
- Auditing an existing codebase for compliance (use `auditing-pwa-deployment`)

## Required Companion Skills

**REQUIRED BACKGROUND:** You MUST understand the following companion skills — this skill depends on concepts they define:

- `pwa-development` — service worker patterns, manifest config, caching strategies
- `pwa-github-pages` — SPA routing, static constraints, base path config
- `pwa-cross-platform` — iOS/Android differences, safe areas, platform detection
- `auditing-pwa-deployment` — compliance audit checklist (use this AFTER this skill for final verification)

## Dual-Mode Verification Process

```
Phase 1: Foundation Setup → Phase 2: Mode Detection → Phase 3: Feature Parity →
Phase 4: Rendering Audit → Phase 5: Offline Verification → Phase 6: Automation
```

### Phase 1: Foundation Setup

Before testing dual-mode, ensure the foundation is correct:

#### 1.1 Mode Detection Infrastructure
Ensure the app can detect which mode it's running in:

```javascript
// lib/pwa-mode.js — MUST exist in every PWA
export const PwaMode = {
  /** @returns {'browser' | 'standalone' | 'minimal-ui' | 'fullscreen'} */
  getCurrent() {
    if (window.navigator.standalone === true) return 'standalone'; // iOS
    if (window.matchMedia('(display-mode: standalone)').matches) return 'standalone';
    if (window.matchMedia('(display-mode: minimal-ui)').matches) return 'minimal-ui';
    if (window.matchMedia('(display-mode: fullscreen)').matches) return 'fullscreen';
    return 'browser';
  },

  /** @returns {boolean} */
  isStandalone() {
    return this.getCurrent() !== 'browser';
  },

  /** @returns {boolean} */
  isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  },

  /** Reports current mode for analytics/debugging */
  reportMode() {
    return {
      mode: this.getCurrent(),
      isStandalone: this.isStandalone(),
      userAgent: navigator.userAgent,
      displayModeCSS: window.matchMedia('(display-mode: standalone)').matches,
      navigatorStandalone: window.navigator.standalone,
      screenWidth: screen.width,
      screenHeight: screen.height,
    };
  }
};

// Usage in app init
console.log('PWA Mode:', PwaMode.getCurrent());
```

#### 1.2 GitHub Pages Routing Foundation
Ensure SPA routing works in both modes:

```html
<!-- 404.html — REQUIRED for GH Pages SPA routing -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script>
    sessionStorage.redirect = location.pathname;
    location.replace('/index.html' + (location.pathname.startsWith('/') ? '' : '/'));
  </script>
</head>
<body></body>
</html>
```

```javascript
// App initialization — handle redirect from 404.html
(function handleSPARedirect() {
  const redirect = sessionStorage.getItem('redirect');
  if (redirect && redirect !== '/') {
    sessionStorage.removeItem('redirect');
    // Pass to your SPA router
    window.__SPA_INITIAL_PATH = redirect;
  }
})();
```

#### 1.3 Base Path Verification
Verify that all asset paths resolve correctly in both modes:

```javascript
// Helper to resolve paths correctly for GH Pages subdirectory sites
export function assetPath(relativePath) {
  const base = document.querySelector('base')?.getAttribute('href') || '/';
  const cleanBase = base.endsWith('/') ? base : base + '/';
  const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  return cleanBase + cleanPath;
}
```

### Phase 2: Mode Detection Verification

Verify that mode detection works correctly in ALL scenarios:

| Scenario | Browser | Navigate | Expected Mode | Detection Method |
|----------|---------|----------|---------------|------------------|
| Visit via URL in Chrome desktop | Tab | Direct | `browser` | CSS media query |
| Visit via URL in Safari iOS | Tab | Direct | `browser` | CSS media query |
| Add to Home Screen + open | Standalone window | Direct | `standalone` (iOS: `navigator.standalone`) | Both methods |
| Install from Chrome prompt + open | Standalone window | Direct | `standalone` | CSS media query |
| Open from recents (Android) | Standalone window | Restore | `standalone` | CSS media query |
| Deep link from another app | Standalone or tab | Direct | Depends on OS | Both methods |

**Test checklist:**
- [ ] `PwaMode.getCurrent()` returns `'browser'` in regular browser tab
- [ ] `PwaMode.getCurrent()` returns `'standalone'` when launched from home screen
- [ ] `PwaMode.isStandalone()` is `true` only in standalone mode
- [ ] `navigator.standalone` (iOS) correctly reports standalone state
- [ ] Mode detection survives page navigation within the SPA
- [ ] Mode detection works on initial cold start of PWA

### Phase 3: Feature Parity Verification

#### 3.1 Routing Parity

Routes must resolve identically in both modes:

```javascript
// Test routing in both modes
const TEST_ROUTES = [
  '/',
  '/settings',
  '/profile',
  '/search?q=test',
  '/details/123',
  '/path/with/deep/nesting',
];

async function verifyRoutingParity() {
  const results = [];
  for (const route of TEST_ROUTES) {
    // Simulate navigation
    window.history.pushState(null, '', route);
    await new Promise(r => setTimeout(r, 100));

    results.push({
      route,
      currentPath: window.location.pathname + window.location.search,
      appResponded: !!document.querySelector('[data-page]'),
      noErrors: !document.querySelector('.error-boundary-fallback'),
    });
  }
  return results;
}
```

**Checklist:**
- [ ] All app routes resolve correctly when accessed directly in browser mode
- [ ] All app routes resolve correctly when accessed directly in standalone mode
- [ ] Deep links work in both modes (external → PWA route)
- [ ] 404.html fallback works on GH Pages in both modes
- [ ] Hash-based routing (if used) works in both modes
- [ ] `pushState` / `replaceState` navigation works in both modes
- [ ] Back/forward browser navigation works in both modes
- [ ] No double-redirect loops in standalone mode

#### 3.2 Service Worker & Caching Parity

The service worker must behave consistently:

```javascript
// sw.js — verify SW handles both modes
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Same-origin: cache-first for static assets
  if (url.origin === self.location.origin) {
    // Navigations (both modes) should serve from cache or network
    if (event.request.mode === 'navigate') {
      event.respondWith(
        caches.match('/index.html')
          .then(cached => cached || fetch(event.request))
          .catch(() => caches.match('/offline.html'))
      );
      return;
    }

    // Static assets — cache first
    event.respondWith(
      caches.match(event.request)
        .then(cached => cached || fetchAndCache(event.request))
    );
    return;
  }

  // Cross-origin (APIs) — network first
  if (url.origin !== self.location.origin) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open('api-cache').then(cache => {
            cache.put(event.request, clone);
          });
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  }
});
```

**Checklist:**
- [ ] SW registration succeeds in both browser and standalone mode
- [ ] Static assets are cached on install (works in both modes)
- [ ] Cache-first strategy serves assets correctly in both modes
- [ ] SW update flow works in both modes (new version prompt + reload)
- [ ] `skipWaiting()` + `controllerchange` works in standalone mode
- [ ] API calls use network-first in both modes
- [ ] Offline fallback works identically in both modes
- [ ] No double-caching or stale data issues specific to one mode
- [ ] SW scope covers all routes in both modes (GH Pages subdirectory issue)
- [ ] `clients.claim()` is called for standalone mode consistency

#### 3.3 Install Flow Parity

```javascript
// Before install prompt handling
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  // Show install button — but only if NOT already in standalone mode
  if (!PwaMode.isStandalone()) {
    showInstallButton();
  }
});

// Verify install flow
window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  trackEvent('pwa_installed');
  hideInstallButton();
});

// iOS needs special handling — can't prompt programmatically
if (PwaMode.isIOS() && !PwaMode.isStandalone()) {
  // Show instructions for Add to Home Screen
  showIOSInstallInstructions();
}
```

**Checklist:**
- [ ] Install prompt appears correctly in browser mode (Chrome/Android)
- [ ] Install prompt is suppressed when already in standalone mode
- [ ] iOS instructions shown only in browser mode on Safari
- [ ] After install, app launches in standalone mode
- [ ] `appinstalled` event fires correctly
- [ ] Install button hides after successful installation
- [ ] Install prompt is not suppressed unnecessarily (preserved for triggering)
- [ ] User can dismiss install prompt without breaking future prompts

#### 3.4 URL & Link Handling Parity

```javascript
// Handle links differently based on mode
function handleLinkClick(event) {
  const link = event.target.closest('a');
  if (!link) return;

  const href = link.getAttribute('href');

  // External links should open in browser, even in standalone mode
  if (isExternalLink(href)) {
    if (PwaMode.isStandalone()) {
      event.preventDefault();
      window.open(href, '_blank'); // Opens in browser
    }
    return;
  }

  // Internal SPA navigation
  if (PwaMode.isStandalone()) {
    event.preventDefault();
    navigateTo(href); // Use SPA router, not full navigation
  }
}
```

**Checklist:**
- [ ] Internal SPA links navigate correctly in standalone mode (no page reload)
- [ ] External links open in browser (not inside PWA window) in standalone mode
- [ ] `target="_blank"` links work correctly in both modes
- [ ] Deep links from outside the app land on the correct page in both modes
- [ ] Relative vs absolute URLs resolve correctly in both modes
- [ ] Share functionality works in both modes

#### 3.5 Platform API Parity

APIs that behave differently between modes:

```javascript
// Example: Clipboard API
async function copyToClipboard(text) {
  try {
    // Works in both modes in modern browsers
    await navigator.clipboard.writeText(text);
  } catch (e) {
    // Fallback for older browsers or restricted contexts
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}

// Example: Fullscreen API (behaves differently in standalone)
function requestFullscreen(element) {
  // In standalone mode, app is already fullscreen — no-op or alternative
  if (PwaMode.isStandalone()) {
    console.warn('Already in standalone/fullscreen mode');
    return Promise.resolve();
  }
  return element.requestFullscreen();
}
```

**Checklist:**
- [ ] Clipboard API works in both modes
- [ ] Fullscreen API gracefully no-ops in standalone mode (or adapts behavior)
- [ ] File picker works in both modes (iOS PWA may differ)
- [ ] Geolocation works in both modes
- [ ] Camera/microphone access works in both modes
- [ ] Web Share API works in both modes (with fallback for standalone iOS)
- [ ] Push notifications (if used) handle unsupported standalone contexts
- [ ] `window.open()` behaves correctly — new windows in browser, same window in standalone
- [ ] `window.print()` works in both modes

### Phase 4: Rendering & Layout Audit

#### 4.1 Viewport & Safe Areas

```css
/* Safe area handling — applies in BOTH modes but critically tested in standalone */
:root {
  --sat: env(safe-area-inset-top, 0px);
  --sar: env(safe-area-inset-right, 0px);
  --sab: env(safe-area-inset-bottom, 0px);
  --sal: env(safe-area-inset-left, 0px);
}

/* Status bar compensation — standalone mode only */
@media all and (display-mode: standalone) {
  body {
    padding-top: max(20px, var(--sat));
    padding-bottom: var(--sab);
  }

  /* iOS status bar: black-translucent means content goes behind status bar */
  .app-header {
    padding-top: max(44px, var(--sat));
    background: var(--theme-color);
  }
}

/* 100vh vs 100dvh — critical for mobile PWA */
.full-height {
  height: 100vh; /* Falls back correctly in browser mode */
  height: 100dvh; /* Dynamic vh — accounts for browser chrome in browser mode */
}

@media all and (display-mode: standalone) {
  .full-height {
    height: 100vh; /* In standalone, 100vh = full screen (no browser chrome) */
  }
}
```

#### 4.2 Theme & Status Bar

```html
<!-- Theme color — used by both modes but rendered differently -->
<meta name="theme-color" content="#1a1a2e" media="(prefers-color-scheme: dark)">
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">

<!-- iOS status bar — only applies in standalone mode -->
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">

<!-- iOS standalone mode -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="MyPWA">
```

#### 4.3 Rendering Checklist

- [ ] App shell renders fully in browser mode (no layout shift)
- [ ] App shell renders fully in standalone mode (no layout shift)
- [ ] Safe areas respected in standalone mode (notched devices)
- [ ] Status bar color matches app theme in standalone mode
- [ ] Splash screen appears on cold start in standalone mode (check `background_color`)
- [ ] No white flash on app launch in standalone mode
- [ ] Scroll behavior is identical in both modes
- [ ] Fixed/sticky positioning works correctly in both modes
- [ ] `100vh` elements display correctly (no cut-off in browser mode, full height in standalone)
- [ ] Keyboard handling works in both modes (mobile)
- [ ] Orientation changes don't break layout in either mode
- [ ] Dark/light theme works in both modes
- [ ] Font rendering is consistent between modes
- [ ] No FOUC (Flash of Unstyled Content) in standalone mode
- [ ] Touch targets are adequate (48px minimum) in both modes

### Phase 5: Offline Verification

#### 5.1 Offline Behavior Matrix

Test offline in ALL combinations:

| Scenario | Browser Mode | Standalone Mode | Expected Behavior |
|----------|-------------|-----------------|-------------------|
| Cold start offline | Navigate to URL | Launch from home screen | App shell loads from cache |
| Navigation to visited route | Click link | Click link | Content from cache |
| Navigation to unvisited route | Click link | Click link | Show offline fallback |
| API call while offline | Auto-triggered | Auto-triggered | Graceful error + cached data |
| Form submission offline | Submit | Submit | Queue or show offline message |
| Refresh page while offline | F5/Cmd+R | Swipe down/pull | Reload from cache if possible |

```javascript
// Offline state UI — must work in both modes
function updateOfflineUI(isOffline) {
  const banner = document.getElementById('offline-banner');
  if (!banner) return;

  if (isOffline) {
    banner.classList.remove('hidden');
    banner.setAttribute('role', 'alert');
    // In standalone mode, offline = no connectivity at all (more critical)
    if (PwaMode.isStandalone()) {
      banner.dataset.severity = 'critical';
    }
  } else {
    banner.classList.add('hidden');
  }
}

window.addEventListener('online', () => updateOfflineUI(false));
window.addEventListener('offline', () => updateOfflineUI(true));
updateOfflineUI(!navigator.onLine);
```

#### 5.2 Offline Checklist

- [ ] App shell loads from cache on cold start offline (both modes)
- [ ] Previously visited pages render from cache (both modes)
- [ ] Unvisited routes show offline fallback gracefully (both modes)
- [ ] Offline indicator/banner is visible and informative (both modes)
- [ ] Cached API data is displayed when offline (both modes)
- [ ] User can retry when coming back online (both modes)
- [ ] No JavaScript errors in offline mode (both modes)
- [ ] Offline.html is styled and functional (matches app theme)
- [ ] Images from cache render correctly (both modes)
- [ ] Service worker doesn't prevent retry when online again
- [ ] Background sync (if implemented) works when coming online

### Phase 6: Automated Verification

#### 6.1 Dual-Mode Test Script

Create a test script that automates verification:

```javascript
// tests/dual-mode-verification.js
/**
 * Automated dual-mode verification.
 * Run this in browser console in each mode.
 */
const DualModeTest = {
  results: [],

  async runAll() {
    console.group('🔍 Dual-Mode Verification');
    console.log('Mode:', PwaMode.getCurrent());

    await this.testModeDetection();
    await this.testRouting();
    await this.testServiceWorker();
    await this.testRendering();
    await this.testOffline();

    console.groupEnd();
    this.report();
  },

  async testModeDetection() {
    const mode = PwaMode.getCurrent();
    const isStandalone = PwaMode.isStandalone();

    this.assert(
      mode === 'browser' || mode === 'standalone',
      `Mode detection: ${mode} (${isStandalone ? 'standalone' : 'browser'})`
    );

    // Verify mode is consistent
    await this.assert(
      (mode === 'standalone') === isStandalone,
      `Mode consistency: ${mode} === standalone? ${isStandalone}`
    );
  },

  async testRouting() {
    // Test current route resolution
    const path = window.location.pathname;
    await this.assert(
      path.length > 0,
      `Route resolved: ${path}`
    );

    // Test SPA navigation
    window.history.pushState(null, '', '/test-route-verification');
    await this.delay(100);
    await this.assert(
      window.location.pathname.includes('test-route-verification'),
      'SPA navigation in current mode'
    );
    window.history.back();
  },

  async testServiceWorker() {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      await this.assert(
        !!registration,
        'Service worker registered'
      );

      if (registration) {
        await this.assert(
          !!registration.active,
          'Service worker active'
        );
      }
    } else {
      this.assert(false, 'Service worker NOT supported');
    }
  },

  async testRendering() {
    // Check viewport dimensions
    await this.assert(
      window.innerHeight > 0 && window.innerWidth > 0,
      `Viewport: ${window.innerWidth}x${window.innerHeight}`
    );

    // Check for layout shifts
    const layoutShift = await this.detectLayoutShift();
    await this.assert(
      layoutShift < 0.1,
      `Layout shift: ${layoutShift.toFixed(3)} (threshold: 0.1)`
    );
  },

  async testOffline() {
    // This test must be run manually with devtools offline
    // But we can check cache availability
    if ('caches' in window) {
      const cacheKeys = await caches.keys();
      await this.assert(
        cacheKeys.length > 0,
        `Caches available: ${cacheKeys.join(', ')}`
      );
    }
  },

  assert(condition, message) {
    const status = condition ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}: ${message}`);
    this.results.push({ condition, message });
  },

  delay(ms) { return new Promise(r => setTimeout(r, ms)); },

  async detectLayoutShift() {
    return new Promise((resolve) => {
      if (!PerformanceObserver) { resolve(0); return; }
      let maxShift = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            maxShift = Math.max(maxShift, entry.value);
          }
        }
      });
      observer.observe({ type: 'layout-shift', buffered: true });
      setTimeout(() => {
        observer.disconnect();
        resolve(maxShift);
      }, 1000);
    });
  },

  report() {
    const passed = this.results.filter(r => r.condition).length;
    const failed = this.results.filter(r => !r.condition).length;
    const total = this.results.length;

    console.log(`\n📊 Results: ${passed}/${total} passed`);
    if (failed > 0) {
      console.log(`❌ ${failed} tests FAILED in ${PwaMode.getCurrent()} mode`);
    } else {
      console.log(`✅ All tests passed in ${PwaMode.getCurrent()} mode`);
    }
  }
};

// Run: DualModeTest.runAll()
```

#### 6.2 Dual-Mode Matrix Testing

Create a verification matrix to track which features work in which mode:

```markdown
# Dual-Mode Verification Matrix
| Feature | Browser Mode | Standalone Mode | Notes |
|---------|-------------|-----------------|-------|
| App shell loads | ✅ | ✅ | |
| Home page | ✅ | ✅ | |
| Route: /settings | ✅ | ✅ | |
| Route: /profile | ✅ | ❌ | Bug: profile data not loading in standalone |
| Offline shell | ✅ | ✅ | |
| Offline data | ✅ | ❌ | Bug: cached data not served in standalone |
| Install prompt | ✅ | N/A | Hidden in standalone (correct) |
| Dark/light theme | ✅ | ✅ | |
| Safe areas | N/A | ✅ | |
| Splash screen | N/A | ✅ | |
```

## Common Dual-Mode Bugs & Fixes

| Bug | Symptom | Root Cause | Fix |
|-----|---------|------------|-----|
| App works in browser but blank in standalone | White screen on PWA launch | SW caching stale HTML or missing assets | Clear old caches in `activate` event; add cache versioning |
| Routes work in browser but 404 in standalone | Navigation fails in PWA | SW doesn't handle `navigate` mode requests | Add `event.request.mode === 'navigate'` handler to serve `index.html` |
| API data missing in standalone | Data doesn't load | API calls not cached for offline; or CORS issues in standalone | Implement network-first caching for APIs; verify CORS headers |
| Layout broken in standalone | Elements overlapping, wrong sizes | Missing safe-area CSS or `100vh` vs `100dvh` issue | Add `env(safe-area-inset-*)` CSS; use `100dvh` with `100vh` fallback |
| Install prompt not appearing | Users can't install | SW registered after page load; or scope mismatch with GH Pages subdirectory | Register SW on `window.load`; verify SW scope covers all paths |
| Splash screen is white | White flash on launch | `background_color` not set in manifest | Set `background_color` to match app theme |
| iOS can't install | No "Add to Home Screen" option | Missing `apple-mobile-web-app-capable` meta tag | Add required iOS meta tags |
| Links open in PWA instead of browser | External links stay in PWA window | No `target="_blank"` or standalone mode detection | Add click handler to open external links in browser via `window.open()` |
| Offline page shows but assets broken | HTML renders, no CSS/images | Only `index.html` cached, not static assets | Cache all critical static assets in `install` event |
| PWA crashes after update | Old cache conflicts with new code | Stale cache served after SW update | Clean all old caches in `activate`; use cache versioning |

## Quick Reference

### Dual-Mode Verification Checklist (Quick)

Run this checklist before every release:

**Mode Detection:**
- [ ] `PwaMode.getCurrent()` works correctly
- [ ] `navigator.standalone` (iOS) reports correctly
- [ ] CSS `display-mode: standalone` media query works

**Routing:**
- [ ] Direct URL access works in browser mode
- [ ] Direct URL access works in standalone mode
- [ ] 404.html redirect works on GH Pages (both modes)
- [ ] SPA navigation works (both modes)

**Rendering:**
- [ ] No layout shift between modes
- [ ] Safe areas applied in standalone mode
- [ ] Status bar styled correctly (standalone)
- [ ] Splash screen shows correct color

**Offline:**
- [ ] Cold start offline loads app shell (both modes)
- [ ] Previously cached content renders offline (both modes)
- [ ] Offline fallback shows for uncached routes (both modes)
- [ ] No JS errors offline (both modes)

**Service Worker:**
- [ ] SW registered and active (both modes)
- [ ] SW update works (both modes)
- [ ] Caching strategy appropriate (both modes)

**APIs & Features:**
- [ ] All features work in browser mode
- [ ] All features work in standalone mode
- [ ] Platform-specific APIs have fallbacks
- [ ] External links open in browser (standalone mode)

## Red Flags — Stop and Fix Before Release

- App shell doesn't load in standalone mode (white screen)
- SPA routes 404 in standalone mode
- Offline mode crashes with JavaScript errors
- Safe areas not applied — content behind notch/home indicator
- Features work in browser but silently fail in standalone
- Service worker not registered or inactive in either mode
- iOS users can't add to home screen
- Splash screen is wrong color or white
- Layout shifts significantly between modes
- External links navigate inside PWA window instead of browser

## Real-World Impact

Applying dual-mode verification catches issues that would otherwise reach production:
- **Before:** "It works on my machine" → deployed, PWA users see white screen
- **After:** Systematic verification catches mode-specific bugs pre-release
- **Result:** Consistent user experience regardless of how the app is accessed, higher PWA adoption and user trust
