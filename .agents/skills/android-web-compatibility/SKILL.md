---
name: android-web-compatibility
description: Use when debugging web applications or PWAs that misbehave on modern Android devices — broken layouts on Chrome Android, touch interaction failures, Chrome-specific rendering bugs, PWA manifest/service worker issues on Android, notification/permission problems, or performance issues in Chrome for Android
---

# Android Web Compatibility (Chrome for Android)

## Overview

Chrome for Android differs from desktop Chrome in critical ways: viewport behavior tied to the dynamic address bar, touch-first input model, aggressive background tab throttling, and a distinct PWA implementation (WebAPK). This skill provides a **systematic debugging approach** to identify and fix Android-specific web and PWA issues. It covers viewport/rendering quirks, touch/input handling, scroll behavior, CSS layout differences, and Chrome Android's unique PWA lifecycle.

**Scope:** Chrome for Android only — not Samsung Internet, Firefox Android, or other browsers.

---

## When to Use

**Use when:**
- A web app works on desktop but has layout breakage on Chrome for Android (content cut off, overflow, overlapping elements)
- Touch interactions are unresponsive, delayed, or triggering wrong actions on Android
- `100vh` / `100dvh` elements overflow or leave gaps on Chrome Android
- `position: fixed` elements misbehave when the virtual keyboard opens
- Text looks different (blurry, wrong size, no antialiasing) on Android vs desktop
- Scroll containers are janky, sticky headers fail, or overscroll causes unwanted pull-to-refresh
- Hover states get "stuck" after tapping on touch devices
- PWA "Add to Home Screen" prompt does not appear or the app does not install as WebAPK
- Service workers fail to register, activate, or receive push notifications on Android
- WebAPK does not update after a new version is deployed
- Push notification permissions are rejected at high rates or notifications do not display correctly
- Manifest fields (display, orientation, scope) are ignored by Chrome for Android
- Chrome DevTools remote debugging is needed to inspect a real Android device

**Do NOT use when:**
- Debugging iOS Safari/WebKit issues (use `ios-pwa-compatibility`)
- Debugging Samsung Internet, Firefox Android, or other non-Chrome Android browsers
- Designing a preventive/responsive layout from scratch (this is a debugging skill, not a design guide)
- Auditing general PWA deployment readiness (use `auditing-pwa-deployment`)
- Building a PWA for cross-platform deployment from scratch (use `pwa-cross-platform`)

---

## Common Issues & Solutions

### Viewport & Rendering

#### Chrome's 400ms Tap Delay

Chrome removed the 300-400ms tap delay in Chrome 32+ (2014) for viewport `<meta name="viewport" content="width=device-width">` pages. However, the delay can still appear if:

- The page lacks a viewport meta tag with `width=device-width`
- Third-party scripts disable the meta viewport dynamically
- The user has "Force Enable Zoom" accessibility setting enabled

**Debug:**
```javascript
// Check if Chrome has eliminated the tap delay
const hasViewportWidth = document.querySelector('meta[name="viewport"]')
  ?.content?.includes('width=device-width');
console.log('Viewport configured:', !!hasViewportWidth);
```

**Fix:** Always include `<meta name="viewport" content="width=device-width, initial-scale=1">`. The delay is eliminated automatically when this tag is present.

#### `100vh` and the Address Bar

Chrome Android's address bar hides/scrols away, changing the viewport size. `100vh` includes the address bar area, causing content to extend below the visible viewport when the bar is hidden.

**Symptoms:**
- Bottom of page cut off when address bar is visible
- "Excess" scroll when address bar hides
- Fixed-position bottom bars overlap content

**Solutions:**

```css
/* Use dynamic/adaptive viewport units (supported Chrome Android 65+) */
.fullscreen-element {
  /* Fallback for older Chrome */
  height: 100vh;
  /* Chrome Android 65+: dynamic viewport height */
  height: 100dvh;
}

/* For hero sections above the fold */
.hero {
  height: 100svh; /* Smallest possible viewport */
}

/* Large viewport (address bar hidden at entry) */
.hero-large {
  height: 100lvh; /* Largest possible viewport */
}
```

**Debug in Chrome DevTools:**
1. Open DevTools on desktop
2. Toggle Device Toolbar (Ctrl+Shift+M)
3. Select an Android device (e.g., Pixel 7)
4. In the address bar simulation, toggle the address bar on/off — observe how `100vh` elements behave
5. Check the "Computed" panel for the actual `height` of elements and verify `dvh` is applied

#### `position: fixed` and Virtual Keyboard Overlap

When the virtual keyboard opens on Chrome Android, `position: fixed` elements may:
- Stay in place while the rest of the page scrolls (expected) but over the keyboard
- Get pushed up above the keyboard (varies by Chrome version)
- Lose their fixed positioning context

**The only reliable approach uses the `visualViewport` API:**

```javascript
if (window.visualViewport) {
  let lastHeight = window.visualViewport.height;

  window.visualViewport.addEventListener('resize', () => {
    const keyboardOpen = window.visualViewport.height < lastHeight * 0.8;

    document.documentElement.classList.toggle('keyboard-open', keyboardOpen);

    // Move fixed bottom elements above keyboard
    if (keyboardOpen) {
      const fixedBottom = document.querySelector('.fixed-bottom-bar');
      if (fixedBottom) {
        fixedBottom.style.bottom = `${window.innerHeight - window.visualViewport.height}px`;
      }
      // Scroll focused input into view
      document.activeElement?.scrollIntoView({ block: 'center' });
    } else {
      document.querySelector('.fixed-bottom-bar')?.style.removeProperty('bottom');
    }
  });
}
```

**Chrome 128+ (2024):** Chrome for Android now resizes the layout viewport by default on keyboard open (aligning with iOS behavior). If you relied on the old "keyboard overlays" behavior, test with Chrome 128+ and use `visualViewport` for backward compatibility.

#### Font Rendering Differences

Chrome for Android does **not** support subpixel antialiasing (common to all mobile OLED/AMOLED screens). Fonts render differently:

| Rendering Mode | Desktop Chrome | Chrome Android |
|---------------|----------------|----------------|
| Subpixel AA | ✅ Enabled on LCD | ❌ Not available (OLED subpixel layout varies) |
| Grayscale AA | ✅ | ✅ (default) |
| `-webkit-font-smoothing: antialiased` | Gray AA | Gray AA (same) |
| `text-rendering: optimizeLegibility` | ✅ Supported | ✅ Supported |

**Issues to watch for:**
- Thin light fonts (weight < 400) may appear extra thin or disappear on some AMOLED screens
- Fonts with fine serifs may look blurry at small sizes
- System fonts (Roboto, Noto) render more consistently than custom web fonts

**Mitigation:**
```css
/* Ensure minimum font weight for readability on AMOLED */
body {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  /* Avoid font-weight: 100-300 for body text on Android */
}

/* On Android, prefer slightly heavier weights */
@media (hover: none) and (pointer: coarse) {
  body, p, span {
    font-weight: 400; /* Minimum weight for mobile */
  }
}
```

#### `-webkit-tap-highlight-color`

Chrome for Android adds a grey/colored highlight box when tapping interactive elements. This is an accessibility feature but often breaks custom UI designs.

```css
/* Remove the highlight (only if you have custom :active/:focus styles) */
* {
  -webkit-tap-highlight-color: transparent;
}

/* Better: use a custom color that matches your theme */
a, button, [role="button"] {
  -webkit-tap-highlight-color: rgba(0, 150, 255, 0.3);
}
```

#### Overscroll Behavior

Chrome Android has native pull-to-refresh and overscroll glow effects that can conflict with custom scrollable areas or games.

```css
/* Prevent page-level pull-to-refresh */
html {
  overscroll-behavior: none;
}

/* Contain overscroll within specific scroll containers */
.scrollable-panel {
  overscroll-behavior-y: contain;
  overflow-y: auto;
}

/* Prevent rubber-banding on inner scroll areas */
.scrollable-area {
  overscroll-behavior: contain;
}
```

#### Chrome's Minimum Font Size Setting

Chrome for Android has a user-accessible setting: Settings → Accessibility → **Force enable zoom** / **Minimum font size**. Users can set a minimum font size (default: off). When enabled, text below the threshold is forcibly enlarged, breaking layouts.

**Debug:**
```css
/* Use relative units so enlargement preserves proportions */
body {
  font-size: 16px; /* Safe baseline — Chrome won't enlarge this */
}

/* Detect forced font size via media query (approximate) */
@media (min-resolution: 1dppx) {
  /* Normal resolution — no action needed */
}
```

**There is no CSS API to detect or override the user's minimum font size.** Mitigate by:
- Using `rem`/`em` instead of `px` for font sizing (proportional scaling)
- Testing with Chrome's minimum font size set to 24px in DevTools (Settings → Advanced → Accessibility → Minimum font size)
- Avoiding critical layouts that depend on exact text sizing

#### `-webkit-text-size-adjust`

Chrome for Android uses `-webkit-text-size-adjust` to handle automatic text size adjustment on orientation change and zoom.

```css
/* Prevent automatic text size adjustment on orientation change */
html {
  -webkit-text-size-adjust: 100%;
}

/* Use `none` only if you fully control text sizing (e.g., in a canvas/webgl app) */
html.no-text-adjust {
  -webkit-text-size-adjust: none;
}
```

**When to use `100%` vs `none`:**
- `100%`: Allows user zoom but prevents automatic size adjustment on orientation change — **recommended for most apps**
- `none`: Disables ALL text size adjustment including user zoom. Only use in games or highly controlled layouts

---

### Touch & Input

#### `touchstart`/`touchend` vs `click` Event Handling

Chrome for Android fires events in a specific order that differs from desktop:

**Desktop Chrome:** `mousedown` → `mouseup` → `click`
**Chrome Android:** `touchstart` → `touchend` → `mousedown` → `mouseup` → `click`

The 300ms delay between `touchend` and `click` was removed in Chrome 32+, but **if both touch and mouse events are listened for, they fire in sequence**, causing double-firing.

```javascript
// ❌ BAD: Double-fires on Android
element.addEventListener('touchstart', handler);
element.addEventListener('click', handler);

// ✅ GOOD: Use only click (fires reliably on both desktop and Android)
element.addEventListener('click', handler);

// ✅ GOOD: Or use touchstart and prevent the subsequent click
element.addEventListener('touchstart', (e) => {
  e.preventDefault(); // Prevents the click event
  handler(e);
});
```

**For drag/swipe interactions:**
```javascript
let touchHandled = false;

element.addEventListener('touchstart', (e) => {
  touchHandled = true;
  // Start drag tracking
}, { passive: true });

element.addEventListener('click', (e) => {
  if (touchHandled) {
    e.preventDefault();
    touchHandled = false;
    return;
  }
  // Mouse click path
});
```

#### Passive Event Listeners for Scroll Performance

Chrome for Android warns if a `touchstart` or `touchmove` listener is not passive (blocks scrolling):

```
[Violation] 'touchstart' handler took 430ms
[Violation] Added non-passive event listener to a scroll-blocking 'touchmove' event
```

```javascript
// ✅ GOOD: Always add { passive: true } for touch events that don't preventDefault
document.addEventListener('touchstart', onTouchStart, { passive: true });
document.addEventListener('touchmove', onTouchMove, { passive: true });

// Only use passive: false when calling preventDefault()
document.addEventListener('touchmove', (e) => {
  e.preventDefault();
  // Custom gesture handling
}, { passive: false }); // Chrome allows this but warns if slow
```

**Tip:** Use a feature detection helper to set the `passive` option only in supporting browsers:
```javascript
let supportsPassive = false;
try {
  window.addEventListener('test', null, Object.defineProperty({}, 'passive', {
    get: () => { supportsPassive = true; return true; }
  }));
} catch (e) {}

const PASSIVE = supportsPassive ? { passive: true } : false;
document.addEventListener('touchstart', handler, PASSIVE);
```

#### `touch-action: manipulation`

Eliminates double-tap zoom and the 350ms tap delay on Chrome Android:

```css
/* Apply to all interactive elements */
button, a, input, select, textarea, [role="button"] {
  touch-action: manipulation;
}

/* Or document-wide (only if you don't need pinch-zoom anywhere) */
html {
  touch-action: manipulation;
}
```

**Caveat:** `touch-action: manipulation` also disables pinch-zoom. Ensure accessibility-compatible zoom alternatives if removing pinch-zoom (e.g., a zoom button).

#### Handling Both Mouse and Touch Events Correctly

Chrome Android fires both touch and mouse events for the same interaction. Use the `pointer events` API (preferred) or a cooperative flag pattern:

```css
/* Using pointer events (Chrome Android supports Pointer Events since Chrome 55) */
```

```javascript
// ✅ PREFERRED: Use Pointer Events for unified input handling
element.addEventListener('pointerdown', handlePointerDown);
element.addEventListener('pointerup', handlePointerUp);
element.addEventListener('pointermove', handlePointerMove);

function handlePointerDown(e) {
  // Works for both mouse and touch
  const isTouch = e.pointerType === 'touch';
  const isMouse = e.pointerType === 'mouse';
  // e.pointerId distinguishes concurrent pointers
}
```

#### Input Focus When Virtual Keyboard Opens

When an `<input>` or `<textarea>` receives focus on Chrome Android, the keyboard opens and may:

1. Push the viewport up (if using `visualViewport`)
2. Cause `position: fixed` elements to shift
3. Scroll the page unexpectedly

```javascript
// Smooth scroll to input when it receives focus
document.querySelectorAll('input, textarea').forEach(el => {
  el.addEventListener('focus', (e) => {
    // Wait for keyboard to begin opening
    setTimeout(() => {
      e.target.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 300);
  });
});

// Preserve scroll position when input loses focus
let scrollPos = 0;
document.querySelectorAll('input, textarea').forEach(el => {
  el.addEventListener('focus', () => {
    scrollPos = window.scrollY;
  });
  el.addEventListener('blur', () => {
    window.scrollTo({ top: scrollPos, behavior: 'smooth' });
  });
});
```

---

### Scroll Behavior

#### `-webkit-overflow-scrolling: touch`

This property is **legacy** (deprecated since Chrome 63+ and no longer needed). Chrome for Android has had native smooth scrolling for scrollable containers since Chrome 63 (2017).

```css
/* ❌ UNNECESSARY on Chrome Android — safe to remove */
.scroll-container {
  -webkit-overflow-scrolling: touch;
}

/* ✅ Modern approach — just use standard overflow + smooth-scroll */
.scroll-container {
  overflow-y: auto;
  scroll-behavior: smooth; /* Standard property */
  -webkit-overflow-scrolling: auto; /* Override legacy if present */
}
```

**If removing `-webkit-overflow-scrolling: touch` causes issues on very old Chrome (<63):**
- The affected Chrome version share is negligible (<0.1% as of 2025)
- Safe to remove in any project not targeting Android devices from 2015-2017

#### Smooth Scrolling Performance

Chrome Android's scrolling can jank if the main thread is blocked. Symptoms: scroll delays, dropped frames, white checkerboarding.

**Causes and fixes:**
```css
/* Ensure scroll containers use GPU compositing */
.scroll-container {
  overflow-y: auto;
  will-change: scroll-position; /* Hint to GPU-composite */
  transform: translateZ(0);    /* Legacy: force GPU layer */
}

/* Avoid expensive styles on scrolled elements */
/* ❌ BAD: triggers repaint on every scroll frame */
.scroll-indicator {
  left: ${scrollX}px;
}

/* ✅ GOOD: uses compositing — no repaint */
.scroll-indicator {
  transform: translateX(${scrollX}px);
}
```

```javascript
// Throttle scroll handlers with rAF
let ticking = false;
scrollContainer.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      updateUI();
      ticking = false;
    });
    ticking = true;
  }
}, { passive: true });
```

#### Scroll Anchoring Behavior

Chrome for Android implements scroll anchoring to prevent content "jumping" when DOM elements above the viewport load (e.g., images, ads). This can cause issues when dynamically inserting content above a scrollable area.

```css
/* Disable scroll anchoring if it interferes with dynamic content */
.dynamic-content-area {
  overflow-anchor: none;
}

/* Recommended for chat/message lists where new messages appear above */
.chat-messages {
  overflow-anchor: none;
}
```

**Debug:** In Chrome DevTools on a real device or emulated device, check the "Rendering" tab → "Scroll Anchoring" to visualize which elements are anchors.

#### Sticky Headers and `position: sticky`

Chrome for Android supports `position: sticky` since Chrome 56 (2017). Known issues:

1. **`position: sticky` inside a scrollable overflow container** — works reliably on Chrome Android 73+
2. **Sticky elements jumping on keyboard open** — re-evaluate sticky position after `visualViewport` resize
3. **Sticky headers and `top: 0` with notch/status bar** — notch does not apply on Android, but status bar height varies (24-32dp)

```css
.sticky-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: white; /* Required to prevent content showing through */
}

/* In a scroll container */
.scroll-area {
  overflow-y: auto;
  height: 100%;
}
```

**Fix for sticky + keyboard overlap:**
```javascript
window.visualViewport?.addEventListener('resize', () => {
  // Force re-layout of sticky elements after keyboard changes viewport
  document.querySelectorAll('.sticky-header').forEach(el => {
    el.style.position = 'static';
    requestAnimationFrame(() => { el.style.position = 'sticky'; });
  });
});
```

---

### CSS & Layout

#### Chrome Android's Handling of `aspect-ratio`

Chrome for Android supports `aspect-ratio` since Chrome 79 (2019). Known issues:

1. **Images with explicit width/height attributes** — Chrome respects `aspect-ratio` even if width/height attributes are set, but only if no inline styles override it
2. **`aspect-ratio` + `max-width: 100%`** — there is a Chrome bug where the aspect ratio is not preserved when combined with `max-width` in a flex container on Chrome 79-88; fixed in Chrome 89

```css
/* Safe pattern for responsive aspect-ratio containers */
.video-embed {
  width: 100%;
  max-width: 560px;
  aspect-ratio: 16 / 9;
}

/* Workaround for Chrome 79-88 bug with aspect-ratio in flex containers */
.flex-item-aspect {
  flex: 0 0 auto; /* Prevents flex from overriding aspect-ratio */
  width: 50%;
  aspect-ratio: 4 / 3;
}
```

#### Backdrop-filter Performance

`backdrop-filter` (frosted glass effect) is supported since Chrome 76 (2019) on Android. Performance varies by device:

- Can cause jank on mid-range and low-end Android devices
- Animating elements with `backdrop-filter` is particularly expensive
- `backdrop-filter: blur()` is the most expensive variant

```css
/* ⚠️ Use sparingly on Android */
.glass-panel {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

/* Safer: use a semi-transparent background instead */
.glass-panel-safe {
  background: rgba(255, 255, 255, 0.85);
}

/* Conditionally apply based on device capability */
@media (pointer: coarse) {
  .glass-panel {
    backdrop-filter: blur(8px); /* Reduced blur for mobile */
    -webkit-backdrop-filter: blur(8px);
  }
}
```

**Debug:** Check Chrome DevTools Rendering tab → "Rendering" → "FPS meter" to monitor performance. Below 30 FPS on a mid-range device (e.g., Moto G Power) indicates `backdrop-filter` is too heavy.

#### Hover States on Touch Devices (Sticky Hover)

Chrome for Android fires `:hover` on the first tap and keeps the hover state "stuck" until the user taps elsewhere. This is known as "sticky hover" or "stuck hover state."

```css
/* ❌ BAD: Hover-only effects cause confusion on touch */
.card:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

/* ✅ GOOD: Use hover as enhancement, always provide touch equivalent */
.card:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.card:active {
  transform: scale(0.98); /* Touch feedback */
}

/* ✅ BEST: Use hover only for pointer devices, separate touch styles */
@media (hover: hover) and (pointer: fine) {
  .card:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  }
}

@media (hover: none) and (pointer: coarse) {
  .card:active {
    background: rgba(0,0,0,0.05);
    transform: scale(0.98);
  }
}
```

#### `:active` Pseudo-Class on Chrome Android

`<body>` or its parent must have a `touchstart` or `touchend` event listener for `:active` to fire on Chrome Android — OR the element must have `cursor: pointer`:

```css
/* Enable :active on all interactive elements */
button, a, [role="button"], .clickable {
  cursor: pointer; /* Required for :active on Chrome Android */
}

/* Only works on elements with cursor: pointer or touch listener */
.button:active {
  background: #e0e0e0;
  transform: scale(0.97);
}
```

#### WebP/AVIF Support Differences

Chrome for Android supports both WebP (since Chrome 25) and AVIF (since Chrome 85). Key debugging points:

- **WebP lossy + alpha is not supported on very old Chrome for Android (<50)**
- **AVIF decoding is slower on mid-range Android devices** — consider providing JPEG fallback for low-end devices
- **Animated WebP** works on Chrome Android 70+

```html
<!-- Use <picture> for format fallbacks -->
<picture>
  <source srcset="image.avif" type="image/avif">
  <source srcset="image.webp" type="image/webp">
  <img src="image.jpg" alt="Fallback">
</picture>
```

#### CSS Grid / Subgrid

Chrome for Android supports CSS Grid since Chrome 57 (2017) and `subgrid` since Chrome 117 (2023). On very old Chrome Android (<57), Grid falls back to `display: block`.

```css
.grid-layout {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

/* Subgrid support (Chrome 117+ Android) */
.grid-nested {
  display: grid;
  grid-template-rows: subgrid;
  grid-row: span 2;
}
```

#### CSS Container Queries

Chrome for Android supports Container Queries since Chrome 105 (2022). No significant Android-specific bugs reported.

```css
.card-container {
  container-type: inline-size;
  container-name: card;
}

@container card (min-width: 400px) {
  .card {
    flex-direction: row;
  }
}
```

---

## PWA on Android — Specific Issues

### Add to Home Screen (A2HS)

#### WebAPK vs Traditional Bookmark

Chrome for Android generates a **WebAPK** (Android Package Kit) when a user adds a PWA to the home screen. This is fundamentally different from a traditional browser bookmark or shortcut:

| Feature | WebAPK | Bookmark (no WebAPK) |
|---------|--------|---------------------|
| App icon on launcher | ✅ Full icon with badge | ⚠️ Chrome shortcut icon |
| App appears in Settings | ✅ Full Android app entry | ❌ Not listed |
| Launch without URL bar | ✅ True standalone | ❌ Chrome opens |
| Push notifications | ✅ Full Android notification support | ❌ Requires Chrome open |
| Updates | ✅ Auto-updated weekly/biweekly | ❌ Manual only |
| App appears in "Share via" | ✅ Can receive intents | ❌ |

#### Manifest Requirements for A2HS Prompt

Chrome for Android requires ALL of the following for the `beforeinstallprompt` event to fire:

```json
{
  "name": "My App",                          // Required
  "short_name": "MyApp",                     // Required (≤12 chars recommended)
  "start_url": "/?source=pwa",              // Required (absolute or relative to manifest)
  "display": "standalone",                  // Required (or "fullscreen" / "minimal-ui")
  "icons": [
    {
      "src": "icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"             // maskable recommended for Android
    },
    {
      "src": "icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "scope": "/",                               // Recommended (covers all routes)
  "theme_color": "#1a73e8",
  "background_color": "#ffffff"
}
```

**Chrome will NOT prompt if:**
- The manifest is missing, 404s, or has invalid JSON
- No icons of exactly 192x192 and 512x512 are provided
- `display` is not `standalone` or `fullscreen`
- The site is not served over HTTPS (localhost exempt)
- The service worker is not registered or does not intercept fetch events
- The user has previously dismissed the prompt
- Chrome detects the user has not engaged with the site enough (Chrome's heuristic)

#### `beforeinstallprompt` Event (Deprecated in Chrome 2025+)

**Important:** Chrome for Android deprecated the `beforeinstallprompt` event in Chrome 129 (September 2024) and **removed it entirely** in Chrome 2025. On newer Chrome for Android versions:

- The event will no longer fire — A2HS is handled through Chrome's UI (three-dot menu → "Install app" or the mini-infobar)
- You **cannot** programmatically trigger the install prompt anymore
- The `window.onbeforeinstallprompt` pattern no longer works

```javascript
// Legacy approach (still works on Chrome <129, does nothing on Chrome 129+)
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  // Store event for later use (legacy)
  deferredPrompt = e;
  showInstallButton();
});

// ✅ Modern approach: Direct users to Chrome's install UI
// Show a visual hint directing users to the Chrome menu
if ('serviceWorker' in navigator) {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  if (!isStandalone) {
    // Show a tooltip: "Install this app — tap Chrome menu → Install app"
    showInstallGuide();
  }
}
```

**Debug A2HS without `beforeinstallprompt`:**
1. Open Chrome DevTools on desktop connected to Android via USB (see Debugging Tools section)
2. Go to Application → Manifest → "Installability" section
3. Click "Add to home screen" button in DevTools to test
4. Check the Console for A2HS-related warnings

#### Debugging A2HS Issues

**Chrome DevTools → Application → Manifest:**
- Verify all manifest fields load correctly
- Check "Identity" section → `start_url` resolves to a valid page
- Check "Icons" section → all icons load, sizes match

**Chrome DevTools → Console:**
```
Site cannot be installed: missing manifest
Site cannot be installed: no matching service worker
Site cannot be installed: manifest does not contain 'display': 'standalone'
Site cannot be installed: icon requirements not met
```

**chrome://flags for testing:**
```
chrome://flags/#bypass-app-banner-engagement-checks
chrome://flags/#force-show-app-banner
```

#### Testing A2HS in Chrome DevTools

1. Open DevTools → Application → Manifest
2. Click "Add to home screen" button
3. If it's greyed out, hover over it for the error reason
4. Check the "Installability" section for detailed diagnostics

---

### WebAPK

#### What is WebAPK and How Chrome Generates It

WebAPK is an Android APK that Chrome generates, signed with a Google-operated key, and installs on the device. It wraps the PWA in a minimal Android app shell.

**Generation process:**
1. User adds PWA to home screen
2. Chrome sends the manifest to Google Play Services
3. Google Play Services generates a WebAPK (via Google's servers)
4. The WebAPK is installed silently on the device
5. The WebAPK launches Chrome in PWA mode when opened

**Known debugging issues:**
- WebAPK generation requires Google Play Services (no Google Services on some Chinese Android devices — A2HS falls back to bookmark)
- WebAPK generation can take **1-5 minutes** and may fail silently on the first attempt
- WebAPK is tied to the specific Chrome channel (stable/beta/dev) that installed it

#### Updating WebAPK (Version Updates)

Chrome checks for WebAPK updates every ~2 weeks (14 days). The update triggers when Chrome detects the manifest has changed.

**To force a WebAPK update:**
1. Bump the manifest `version` field (non-standard but recognized by Chrome)
2. Or change any significant field (icons, `name`, `start_url`)
3. Chrome may still take up to 48 hours to pick up the change
4. The user can force-update: **Settings → Apps → [App Name] → Storage → Clear cache**

```javascript
// Alternative: Use a unique start_url per version
// Set the manifest start_url dynamically to force re-install
// start_url: "/?v=2.5.0"
// Each version bump changes the start_url, triggering re-install
```

**Warning:** There is no JavaScript API to programmatically trigger a WebAPK update. Apps relying on instant updates should implement a version check in-app.

#### Debugging WebAPK Issues

**Check if the app is running as WebAPK:**
```javascript
// Method 1: display-mode media query
const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

// Method 2: Check if in minimal-ui (sometimes used)
const isMinimalUI = window.matchMedia('(display-mode: minimal-ui)').matches;

// Method 3: Check navigator.standalone (iOS only, always false on Android)
// On Android, use display-mode query exclusively

// Method 4: Chrome-specific getInstalledRelatedApps API
if ('getInstalledRelatedApps' in navigator) {
  const relatedApps = await navigator.getInstalledRelatedApps();
  const isInstalledPWA = relatedApps.some(app => app.platform === 'webapp');
  console.log('Installed as PWA:', isInstalledPWA);
}
```

**Common WebAPK problems:**
| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| App opens in Chrome browser instead of standalone | WebAPK not generated yet | Wait 1-5 minutes, re-add |
| Old version still running after deploy | WebAPK not updated (2-week cycle) | Bump manifest, or instruct user to clear cache |
| App icon missing or shows default Android icon | No maskable icon in manifest | Add icon with `"purpose": "maskable"` |
| App crashes on launch | Corrupted WebAPK | Settings → Apps → [App] → Force stop → Clear storage |
| "Add to Home Screen" does nothing | WebAPK generation failed | Check Google Play Services, retry on WiFi |

#### Limitations of WebAPK

- **No custom splash screen branding** — the splash screen uses the `background_color` and icon from the manifest only
- **No native APIs** — WebAPK provides no Android API access beyond what Chrome exposes via web APIs
- **No custom notification channels** — Chrome manages notification channels; they cannot be customized via PWA
- **No file association** — PWA cannot register as a file handler for custom file types (limited support added in Chrome 105+ but not universally available)
- **No foreground service** — PWA cannot run persistent background services
- **Shared Chrome storage** — WebAPK shares cookie/storage with Chrome; clearing Chrome data clears PWA data

---

### Service Workers on Android Chrome

#### Service Worker Lifecycle on Android (Doze Mode, Background Killing)

Android aggressively manages battery life through **Doze mode** (introduced in Android 6.0) and **App Standby Buckets** (Android 9+). This affects service workers:

| Android State | SW Behavior |
|--------------|-------------|
| **Foreground** (PWA visible) | SW runs normally, events fire immediately |
| **Recent background** (< 5 min) | SW can run for a few seconds after page closes |
| **Doze mode** (device idle, screen off) | SW events are batched and delayed — may not fire for hours |
| **Standby bucket** (infrequently used app) | Background work is severely limited |
| **Stopped** (app force-closed) | SW is terminated; no events fire until PWA is re-launched |

**Debug:**
```javascript
// Log SW state transitions
navigator.serviceWorker.addEventListener('controllerchange', () => {
  console.log('SW controller changed');
});

// Check if SW is actively controlling the page
if (navigator.serviceWorker.controller) {
  console.log('SW controller state:', navigator.serviceWorker.controller.state);
}

// Monitor registration status
const reg = await navigator.serviceWorker.getRegistration();
console.log('SW registration:', reg.active ? 'active' : 'not active');
console.log('SW scope:', reg.scope);
```

**Mitigations:**
- Use `SyncManager` for write operations (supports periodic sync on Android)
- Use Web Push API for critical notifications (wakes the device)
- Do not rely on SW running continuously — treat it as ephemeral
- On Android, `navigator.storage.persist()` helps prevent storage eviction but does not prevent SW termination

#### Push Notification Permissions Flow on Android

Chrome for Android uses the Android notification permission system. The flow differs from desktop:

1. **Android 13+ (API 33):** The `Notification.permission` prompt is an Android runtime permission dialog (not a Chrome prompt). The user sees:
   - "Allow [App Name] to send notifications?" — this is the **Android** dialog
   - Chrome fires `push` and `notificationclick` events on the SW only if permission is granted

2. **Android 12 and below:** The first PWA that requests notification permission shows a Chrome prompt; subsequent PWAs inherit Chrome's permission state

```javascript
// Check notification permission
if ('Notification' in window) {
  console.log('Notification permission:', Notification.permission);
  // "granted" | "denied" | "default" (not yet asked)
}

// Request permission
const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return 'unsupported';

  // On Android 13+, this triggers the native Android permission dialog
  const permission = await Notification.requestPermission();
  return permission;
};
```

**Do-not-disturb override:** Notification priority on Android can be configured per notification channel. PWA notifications are sent through a Chrome-managed channel that respects the device's Do Not Disturb settings.

#### Background Sync Quirks

Chrome for Android supports `SyncManager` (Background Sync) since Chrome 49 and Periodic Background Sync since Chrome 80.

**Known limitations:**
- Periodic Background Sync has a minimum interval of 12 hours on Chrome Android
- Sync events may not fire when the device is in Doze mode
- Sync events have a limited budget per app on Android

```javascript
// Register a one-time background sync
async function registerSync(tag) {
  const reg = await navigator.serviceWorker.ready;
  try {
    await reg.sync.register(tag);
    console.log('Background sync registered:', tag);
  } catch (err) {
    console.error('Background sync registration failed:', err);
    // Fallback: queue data for next page load
    queueDataForNextLoad(tag);
  }
}
```

#### Cache Storage Limits

Chrome for Android uses a pool-based storage system. Total storage available depends on the device:

| Device Tier | Estimated Cache API Limit |
|-------------|--------------------------|
| Low-end (2GB RAM) | ~200-500 MB shared with all Chrome storage |
| Mid-range (4GB RAM) | ~500 MB - 1 GB |
| High-end (8GB+ RAM) | ~1-4 GB |

**The Cache API and IndexedDB share the same storage pool.** Caching too aggressively can evict IndexedDB data.

```javascript
// Estimate available storage
if ('storage' in navigator && 'estimate' in navigator.storage) {
  const estimate = await navigator.storage.estimate();
  console.log('Storage used:', estimate.usage);
  console.log('Storage quota:', estimate.quota);
  console.log('Percentage used:', (estimate.usage / estimate.quota * 100).toFixed(1) + '%');
}

// Persist storage to reduce eviction risk
if ('persist' in navigator.storage) {
  const isPersisted = await navigator.storage.persisted();
  if (!isPersisted) {
    const result = await navigator.storage.persist();
    console.log('Storage persistence requested:', result ? 'granted' : 'denied');
    // On Android, persistence is generally granted for installed PWAs
  }
}
```

#### Debugging SW with chrome://inspect

1. **Connect Android device via USB** (see Remote Debugging section for setup)
2. Open Chrome on desktop, navigate to `chrome://inspect`
3. Find your Android device → the open Chrome tab with your PWA
4. Click "inspect" → Chrome DevTools opens for that tab
5. Go to **Application → Service Workers** panel
   - See registration status
   - Manually "Update" or "Unregister" SW
   - Check "Offline" checkbox to test offline behavior
   - View SW timing logs
6. Go to **Application → Cache Storage** to inspect cached assets
7. Go to **Application → IndexedDB** to inspect stored data

---

### Manifest

#### Required and Recommended Manifest Fields for Android

```json
{
  "name": "My App",                           // REQUIRED
  "short_name": "MyApp",                      // REQUIRED (≤12 chars for Android)
  "description": "Does amazing things",       // RECOMMENDED (used in A2HS prompt)
  "start_url": "/?source=pwa",               // REQUIRED (must be relative to scope)
  "scope": "/",                               // RECOMMENDED (default: dir of manifest)
  "display": "standalone",                    // REQUIRED
  "display_override": ["window-controls-overlay", "standalone"], // Chrome 95+
  "orientation": "portrait-primary",          // RECOMMENDED if locking orientation
  "icons": [                                   // REQUIRED (min 192x192 + 512x512)
    { "src": "/icons/192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "theme_color": "#1a73e8",                   // RECOMMENDED (status bar color)
  "background_color": "#ffffff",              // RECOMMENDED (splash screen)
  "categories": ["utilities", "weather"],     // OPTIONAL
  "screenshots": [                            // REQUIRED for enhanced A2HS (Play Store-like prompt)
    { "src": "/screenshots/1.png", "sizes": "1080x1920", "form_factor": "narrow" }
  ],
  "shortcuts": [                              // OPTIONAL (Android app shortcuts, Chrome 84+)
    { "name": "New Item", "short_name": "New", "url": "/new" }
  ],
  "related_applications": [],                 // OPTIONAL
  "prefer_related_applications": false        // OPTIONAL (default: false)
}
```

#### Splash Screen Configuration

Chrome for Android generates a splash screen using:
- `background_color` (from manifest) — used as splash background
- `icons` — the app icon centered on the splash
- `name` or `short_name` — optional text below icon

```json
{
  "background_color": "#ffffff",  // Must match your landing page background
  "theme_color": "#1a73e8",       // Status bar color during splash
  "name": "My App",
  "icons": [
    { "src": "/icons/512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

**Debug splash screen:**
1. Open Chrome DevTools → Application → Manifest
2. Click "Show screenshot" to preview the splash
3. The splash is generated by Chrome — not customizable beyond manifest fields

#### `display: standalone` vs `fullscreen` vs `minimal-ui`

| Display Mode | Android Behavior | Chrome Support |
|-------------|-----------------|----------------|
| `standalone` | No URL bar, has status bar (with theme_color). Default for PWAs. | ✅ Full support |
| `fullscreen` | No status bar, no URL bar. Immersive mode. Use for games/video. | ✅ Full support |
| `minimal-ui` | Shows a minimal back/refresh bar. Rarely used on Android. | ✅ Supported |
| `browser` | Regular Chrome tab. Not useful as PWA. | ✅ Always works |

```json
{
  "display": "standalone",
  "display_override": ["window-controls-overlay", "standalone"]
}
```

**Note:** `display_override` is honored on Chrome 95+ but `window-controls-overlay` (which allows desktop-style window controls) is only meaningful on ChromeOS, not Android.

#### `orientation` Lock Behavior

Chrome for Android supports orientation lock since Chrome 53. The lock applies when the PWA is launched:

```json
{
  "orientation": "portrait-primary"
}
```

**Valid values (match Screen Orientation API):**
- `portrait-primary` — portrait only
- `landscape-primary` — landscape only
- `portrait` — portrait-primary or portrait-secondary
- `landscape` — landscape-primary or landscape-secondary
- `any` — follows device rotation (default if omitted)

**Debug orientation lock:**
- Test by rotating the device — the PWA should not rotate
- The lock is only respected in standalone mode
- Screen Orientation API (`screen.orientation.lock()`) supersedes manifest orientation once the app is running

#### `scope` and `start_url` Best Practices

```json
{
  "scope": "/app/",           // Only routes under /app/ are in the PWA
  "start_url": "/app/"        // Where the PWA opens on launch
}
```

**Rules:**
- `start_url` must be within `scope`. If outside scope, `start_url` is ignored and scope root is used
- `scope` defaults to the directory containing the manifest file
- Navigating outside `scope` opens the URLs in Chrome (not the PWA)
- On Android WebAPK, navigating outside scope does NOT exit the PWA — a Chrome Custom Tab opens inside the PWA

```json
// ✅ GOOD: Broad scope for full-site PWA
{ "scope": "/", "start_url": "/" }

// ✅ GOOD: App in subdirectory
{ "scope": "/app/", "start_url": "/app/index.html" }

// ❌ BAD: start_url outside scope
{ "scope": "/app/", "start_url": "/" } // start_url is ignored
```

#### `related_applications` and `prefer_related_applications`

If a native Android app exists alongside the PWA, Chrome can redirect users to the native app:

```json
{
  "related_applications": [
    {
      "platform": "play",
      "id": "com.example.myapp",
      "url": "https://play.google.com/store/apps/details?id=com.example.myapp"
    }
  ],
  "prefer_related_applications": true
}
```

**When `prefer_related_applications: true`:**
- Chrome will NOT prompt for A2HS PWA installation
- Instead, Chrome directs the user to the Play Store to install the native Android app
- The PWA itself still functions when accessed via browser

**Common mistake:** Setting `prefer_related_applications: true` without a valid Play Store app id causes Chrome to silently do nothing — no PWA install prompt AND no Play Store redirect.

---

### Notifications

#### Push Notification Permission Request Best Practices (Do's and Don'ts)

**Do NOT request permission immediately on page load.** Chrome for Android's permission prompt is easily dismissed, and once denied, Chrome's permission UI is hidden (user must manually re-enable in Chrome Settings).

```javascript
// ❌ BAD: Immediate permission request
document.addEventListener('DOMContentLoaded', () => {
  Notification.requestPermission(); // User may dismiss → permission "default" becomes "denied"
});

// ✅ GOOD: Gradual engagement → permission request
// Step 1: After meaningful interaction
document.getElementById('enable-notifications').addEventListener('click', () => {
  requestNotificationPermission();
});

// Or step through a non-blocking prompt first
function showNotificationPrompt() {
  // Show a custom UI explaining WHY notifications are needed
  const banner = document.createElement('div');
  banner.className = 'notification-banner';
  banner.innerHTML = `
    <p>Get notified when your forecast changes</p>
    <button id="allow-notif">Enable Notifications</button>
    <button id="dismiss-notif">Not now</button>
  `;
  document.body.appendChild(banner);

  document.getElementById('allow-notif').addEventListener('click', () => {
    requestNotificationPermission();
    banner.remove();
  });
  document.getElementById('dismiss-notif').addEventListener('click', () => {
    banner.remove();
    // Remind again after 3 days
    localStorage.setItem('notif-dismissed', Date.now());
  });
}

// Only show banner if never dismissed or dismissed >3 days ago
const dismissed = localStorage.getItem('notif-dismissed');
if (!dismissed || Date.now() - parseInt(dismissed) > 3 * 24 * 60 * 60 * 1000) {
  showNotificationPrompt();
}
```

**On Android 13+:** The `Notification.requestPermission()` triggers the native Android runtime permission dialog. Requesting permission without context leads to high denial rates.

#### Notification Styling on Android (Notification Channels)

Chrome for Android categorizes PWA notifications under a Chrome-managed notification channel. The channel name is based on the site domain.

**Limitations:**
- PWA notifications cannot create custom notification channels on Android
- Notification priority and sounds are controlled by the user in Android Settings
- Notification styling (icon, color) uses the PWA manifest icon

```javascript
// Register push
navigator.serviceWorker.ready.then(reg => {
  reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
  });
});

// In service worker — handle push event
self.addEventListener('push', (event) => {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/192.png',          // Uses manifest icon
    badge: '/icons/badge.png',       // Small badge icon (Android)
    vibrate: [200, 100, 200],        // Vibration pattern (Android)
    data: { url: data.url },
    requireInteraction: true,        // Notification stays until user interacts (Android)
    actions: [                        // Action buttons on Android notification
      { action: 'open', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});
```

**Badge icon:** The `badge` parameter displays a monochrome version of your icon in the status bar and on the notification shade. It should be a simple white-on-transparent shape (Chrome on Android renders it white-only).

#### Notification Click Handling

```javascript
// In service worker
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        // If PWA is already open, focus it and navigate
        for (const client of windowClients) {
          if (client.url.startsWith(self.location.origin) && 'focus' in client) {
            client.focus();
            client.navigate(urlToOpen);
            return;
          }
        }
        // Otherwise open new window
        clients.openWindow(urlToOpen);
      })
  );
});
```

**Known Android issues:**
- `notificationclick` may not fire if the PWA process was killed (WebAPK restarts Chrome and re-fires the event — but not guaranteed)
- On some Android OEM skins (Xiaomi, Huawei), notification click handling may be delayed or lost

#### Badging API

Chrome for Android supports the Badging API since Chrome 81. It sets a badge number on the app icon.

```javascript
// Set badge count
if ('setAppBadge' in navigator) {
  await navigator.setAppBadge(unreadCount);
}

// Clear badge
if ('clearAppBadge' in navigator) {
  await navigator.clearAppBadge();
}
```

**Android-specific behavior:**
- Badge appears as a small circle with the count on the app icon (Android launcher dependent)
- Some Android launchers (Samsung One UI) show the badge consistently; others (stock Android) may not
- Badge is only meaningful when the app is installed as WebAPK (not in browser tabs)
- Setting badge to `0` clears the badge (`clearAppBadge()` is equivalent to `setAppBadge(0)`)

---

## Debugging Tools & Techniques

### Remote Debugging with Chrome DevTools

#### USB Debugging Setup (Step-by-Step)

1. **On Android device:** Settings → Developer Options → **USB Debugging = ON**
   - If Developer Options is hidden: Settings → About Phone → Tap Build Number 7 times
   
2. **On development machine:**
   - Install Chrome (desktop)
   - Open `chrome://inspect` in Chrome

3. **Connect Android via USB cable**
   - Android will prompt "Allow USB debugging?" → Accept and check "Always allow from this computer"

4. **In `chrome://inspect`:**
   - Your device appears under "Devices"
   - Open Chrome tabs on the device appear in the list
   - Click "inspect" under any tab to open DevTools

5. **If device does not appear:**
   - Check that USB cable supports data (not charge-only)
   - On Windows: Install [Android USB drivers](https://developer.android.com/studio/run/win-usb)
   - On Linux: Add udev rules for Android (see `chrome://inspect` help)
   - Try `adb devices` from Android SDK platform-tools to verify USB connection

#### chrome://inspect

Once connected, `chrome://inspect` provides:

| Feature | Use |
|---------|-----|
| **Connected device** | Lists all connected Android devices |
| **Open tabs** | All Chrome tabs on device (incognito tabs not listed) |
| **"inspect"** | Opens full DevTools for that tab |
| **"Focus tab"** | Brings the tab to foreground on the device |
| **"Reload"** | Reloads the tab on the device |
| **Port forwarding** | Map a port on your machine to a port on the device |

#### Port Forwarding

For testing a local development server on your machine from the Android device:

1. `chrome://inspect` → **Port forwarding** → **Enable port forwarding**
2. Add entry: e.g., local port `3000` → device port `3000`
3. On Android Chrome, navigate to `http://localhost:3000`
4. The request is forwarded to your machine's `localhost:3000`

**Common use cases:**
- Testing a Vite dev server (`localhost:3000`) on a real Android device
- Testing HTTPS-only features (push notifications) via a forwarded local server with mkcert
- Debugging WebAPK while still in development

**Troubleshooting port forwarding:**
- Ensure the port on your machine is not firewalled
- `localhost` on the device maps to your machine (not the Android device)
- Close other adb connections that may conflict

#### Override User Agent / Device Metrics

Chrome DevTools (desktop) can simulate Android Chrome:

1. **Device Toolbar** (Ctrl+Shift+M)
   - Select an Android device (e.g., "Pixel 7", "Galaxy S23")
   - Chrome sets viewport, user agent, and device pixel ratio

2. **Network Conditions** (DevTools → Network tab)
   - Override user agent: e.g., `Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36`
   - Set throttling: "Slow 3G" or "Fast 3G" to simulate mobile network

3. **Sensors** (DevTools → ⋮ → More tools → Sensors)
   - Override geolocation
   - Simulate device orientation

#### Using DevTools to Simulate Android Chrome

**Limitations of desktop simulation:**
- Desktop Chrome lacks Android's actual rendering pipeline (e.g., font rendering differences)
- Address bar behavior is simulated, not identical
- Touch events are translated from mouse events — not the same as real touch
- Performance characteristics are different

**Always test on a real Android device after initial debugging with DevTools.**

### Chrome-Specific DevTools

#### Device Toolbar Features for Android

| DevTools Feature | Android Debugging Use |
|-----------------|----------------------|
| **Device list** | Pre-configured viewports for popular Android devices |
| **Add custom device** | Define exact viewport, DPR, user agent string |
| **Media queries** | See breakpoints in a bar above the viewport |
| **Rendering → Emulate CSS media type** | Test `print`, `screen`, `prefers-color-scheme` |
| **Rendering → Emulate `prefers-reduced-motion`** | Test reduced motion on Android |
| **Rendering → Emulate `prefers-color-scheme`** | Test dark/light theme |
| **Rendering → Disable local fonts** | Test web font fallback behavior |
| **Network → Disable cache** | Simulate first load on slow connection |
| **Network → Offline** | Test offline fallbacks |
| **Application → Manifest** | Full PWA manifest checker |
| **Application → Service Workers** | SW status, update, push simulation |
| **Application → Cache Storage** | Inspect Cache API contents |
| **Application → Background Services** | Push messaging, sync events |
| **Console → Preserve log** | Keep logs across page navigations (useful for PWA startup) |

#### Remote Debugging with Wireless Connection (Android 11+)

Android 11+ supports wireless debugging without USB:

1. Enable **Developer Options** on Android
2. Enable **Wireless debugging** (in Developer Options)
3. Open the Wireless debugging screen → **Pair device with pairing code**
4. On your machine (with `adb` installed):
   ```
   adb pair <host>:<port>  # e.g., adb pair 192.168.1.100:37123
   # Enter the pairing code shown on the device
   ```
5. After pairing:
   ```
   adb connect <host>:<port>  # e.g., adb connect 192.168.1.100:41537
   ```
6. `chrome://inspect` shows the device as connected

**Troubleshooting wireless:**
- Both device and machine must be on the same network
- Firewalls may block the connection
- Wireless debugging is less reliable than USB — re-pair if it disconnects

#### WebView Debugging

If your PWA or web content runs inside a WebView (Android native app):

```java
// Enable WebView debugging in the native Android app
if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
    WebView.setWebContentsDebuggingEnabled(true);
}
```

Then in `chrome://inspect`, the WebView appears as a debuggable context under the host app name.

**Note:** Chrome custom tabs (used when a PWA navigates outside its scope) have limited debuggability and do not appear in `chrome://inspect`.

### Other Tools

#### Logcat for Chrome Errors

Android's `logcat` captures Chrome's internal logs, including:
- Service worker registration failures
- WebAPK generation messages
- Push notification delivery status
- Security/CSP violations

```bash
# Filter Chrome-related logs
adb logcat -s chromium

# Or broader web-related logs
adb logcat | grep -E "chromium|webapp|WebAPK|ServiceWorker"

# Clear log buffer before reproducing an issue
adb logcat -c
```

#### Chrome://flags for Testing Experimental Features

| Flag | Use Case |
|------|----------|
| `chrome://flags/#bypass-app-banner-engagement-checks` | Force A2HS prompt regardless of user engagement |
| `chrome://flags/#force-show-app-banner` | Always show install banner for testing |
| `chrome://flags/#enable-desktop-pwas` | Test PWA features on desktop Chrome |
| `chrome://flags/#enable-experimental-web-platform-features` | Test upcoming web APIs |
| `chrome://flags/#enable-service-worker-pattern-matching` | Test SW scope pattern matching |
| `chrome://flags/#enable-background-sync` | Force background sync for testing |
| `chrome://flags/#enable-dynamic-viewport-units` | Test dvh/svh/lvh behavior |
| `chrome://flags/#enable-devtools-experiments` | Access experimental DevTools features |

**Warning:** Some flags are available only in Chrome Beta, Dev, or Canary. Production Chrome on Android hides many flags.

#### Android Studio Emulator with Chrome

For debugging without a physical device:

1. **Install Android Studio**
2. Create a virtual device (e.g., Pixel 7 API 34)
3. Start the emulator
4. Install Chrome from the Play Store (or use the pre-installed Chrome on some emulator images)
5. `adb devices` shows the emulator as a device
6. `chrome://inspect` works with the emulator

**Limitations:**
- Emulator cannot simulate touch pressure or multi-touch accurately
- WebAPK generation may not work in all emulator configurations
- Performance characteristics differ (emulator is usually slower)
- No Google Play Services on some emulator images → WebAPK cannot be generated

#### WebPageTest for Android Performance Testing

[WebPageTest](https://www.webpagetest.org) supports testing on real Android devices:

- Select "Chrome" browser and "Mobile" connection
- Choose an Android device (Motorola Moto G4, Google Pixel 2, etc.)
- View filmstrip, waterfall, and performance metrics
- Particularly useful for identifying render-blocking resources on mobile

---

## Quick Reference Table

| Symptom | Likely Cause | Solution |
|---------|-------------|----------|
| Content extends below visible area on scroll | `100vh` includes address bar | Replace with `100dvh`, add `100vh` fallback |
| Fixed bottom bar hidden behind keyboard | Keyboard overlaps `position: fixed` | Use `visualViewport` API to detect keyboard and adjust bottom position |
| Text looks thin/unreadable on AMOLED screen | No subpixel antialiasing on OLED | Use `font-weight: 400+`, avoid 100-300 for body text |
| Grey/blue highlight on tap | Chrome default `-webkit-tap-highlight-color` | Set to `transparent` and define `:active` styles |
| Page refreshes/pulls down when scrolling up | Chrome pull-to-refresh | Add `overscroll-behavior-y: contain` to scroll container |
| Hover style stays "stuck" after tap | Sticky hover on touch devices | Use `@media (hover: hover) and (pointer: fine)` for hover effects |
| `:active` not firing on tap | No `cursor: pointer` on element | Add `cursor: pointer` to interactive elements |
| "Add to Home Screen" prompt doesn't appear | Missing manifest fields or SW issues | Check manifest has `display: standalone`, 192+512 icons, valid SW fetch handler |
| A2HS prompt does nothing on Chrome 2025+ | `beforeinstallprompt` removed | Guide users to Chrome menu → Install app |
| App opens in Chrome browser, not standalone | WebAPK not yet generated | Wait 1-5 min with WiFi; check Google Play Services |
| WebAPK still showing old version after deploy | WebAPK updates every ~14 days only | Bump manifest or use unique `start_url` per version |
| Push notifications not delivered on Android | Doze mode or permission denied | Check `Notification.permission`, test with device awake |
| App icon on launcher shows default Chrome icon | No maskable icon in manifest | Add icon with `"purpose": "maskable"` |
| SW not registering/activating | HTTPS missing or SW file 404 | Serve over HTTPS, check SW path and MIME type |
| Periodic sync not firing | Minimum interval 12h; Doze delays | Use push notifications as fallback for time-sensitive data |
| Input zooms page on focus | Font size < 16px triggers zoom | Set `input { font-size: 16px }` minimum |
| Scroll jank on long lists | Main thread blocked on scroll | Use `{ passive: true }` on scroll/touch listeners, rAF throttle |
| Canvas/WebGL context lost when app backgrounded | Android kills GPU context on low memory | Listen for `contextlost` event, reload context on `visibilitychange` |
| `position: sticky` not working in scroll container | Missing `overflow-y: auto` on parent | Ensure parent has explicit height and `overflow-y: auto` or `scroll` |
| `backdrop-filter` causes low FPS | GPU-intensive on mid-range Android | Reduce blur radius, fallback to semi-transparent background |
| Splash screen shows wrong color | `background_color` not set or wrong | Set `background_color` in manifest to match landing page |
| Page content shifts when address bar hides | Layout depends on `100vh` | Use `100dvh` with `100vh` fallback for viewport-dependent elements |
| `touchstart` handler triggers twice on Android | Both `touchstart` and `click` fire | Listen only to `click` for tap, or `pointerdown` for unified input |

---

## Common Mistakes & Pitfalls

| Mistake | What Goes Wrong | How to Fix |
|---------|----------------|------------|
| Using `100vh` for full-screen layouts | Content extends below viewport when address bar hides, or is cut off when visible | Use `100dvh` with `100vh` fallback |
| No `overscroll-behavior` on scroll containers | Chrome's native pull-to-refresh conflicts with custom scrolling | Add `overscroll-behavior-y: contain` |
| Hover-only desktop styles without touch fallback | Touch users see "stuck" hover states that don't go away | Wrap hover effects in `@media (hover: hover) and (pointer: fine)` |
| Requesting notification permission immediately on page load | High rejection rate; once denied, hard to re-enable | Request after meaningful interaction with context |
| Setting `prefer_related_applications: true` without a valid Play Store app | PWA install prompt is suppressed AND no native app redirect | Only use if a real Play Store app exists |
| Assuming `beforeinstallprompt` still works | Chrome 2025+ removed the event entirely; custom install UI breaks | Direct users to Chrome's native install flow (menu → Install app) |
| Storing critical data only in the Cache API | Android may evict cache under storage pressure, losing offline data | Keep critical user data in IndexedDB with persistence requested |
| Not testing on a real Android device | DevTools simulation misses actual rendering, touch, and performance differences | Always test on at least one mid-range Android device (e.g., Moto G series) |
| Using `-webkit-overflow-scrolling: touch` as a required property | Deprecated since Chrome 63; no longer needed | Remove; it has no effect on modern Chrome Android |
| Setting minimum font size below 16px on inputs | Chrome Android zooms into the input on focus | Always set `input, textarea { font-size: 16px }` minimum |
| Assuming the SW stays alive when the app is backgrounded | Android kills SW in Doze/Standby mode | Treat SW as ephemeral; use push notifications for time-sensitive work |
| Not handling `visualViewport` resize for `position: fixed` elements | Fixed elements overlap or are hidden when keyboard opens | Use `visualViewport` event listener + adjust bottom of fixed elements |
| Providing icons without `purpose: maskable` | Android may crop the icon badly or show a white circle background | Always include at least one 512x512 icon with `"purpose": "maskable"` |
| Expecting WebAPK to update instantly after deploy | WebAPK updates every ~14 days on Chrome stable | Use a versioned `start_url` to prompt re-installation |

---

## Red Flags — STOP and Debug with This Skill

- "The layout works on desktop, just ship it" → **Stop.** Test on a real Android device with Chrome.
- "I added `100vh` for the full-screen panel" → **Stop.** Replace with `100dvh` + `100vh` fallback.
- "The install prompt isn't showing, let's add a banner" → **Stop.** `beforeinstallprompt` is deprecated; verify manifest fields first, then use Chrome's native install UI.
- "The hover effect works on desktop, Android should be fine" → **Stop.** Touch devices have sticky hover. Use `@media (hover: hover)` to isolate hover.
- "I'll store everything in the Cache API" → **Stop.** Cache/IndexedDB share storage pool; user data goes in IndexedDB with `navigator.storage.persist()`.
- "The SW update will propagate automatically" → **Stop.** WebAPK updates take up to 2 weeks. Implement in-app version checking.
- "The emulator is good enough for testing" → **Stop.** Emulators miss real touch behavior, performance profiles, and WebAPK generation.
- "I fixed the keyboard issue with `position: fixed` and `bottom: 0`" → **Stop.** The keyboard overlaps fixed elements. Use `visualViewport` API.
- "The push notification permission will be granted" → **Stop.** Request after context, not on page load.
