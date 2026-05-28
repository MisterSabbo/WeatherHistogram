---
name: ios-pwa-compatibility
description: Use when debugging PWAs or websites that misbehave on modern iOS (iOS 17+) — broken layout on notched/Dynamic Island devices, SW not updating, unresponsive taps, keyboard overlaps content, landscape breakage, or IndexedDB data loss
---

# iOS PWA Compatibility (iOS 17+)

## Overview

iOS 17+ (Safari/WebKit) has unique behaviors that differ from both Android/Chrome and older iOS versions. This skill provides a **systematic debugging workflow** to identify and fix iOS-specific issues in PWAs and websites. It covers viewport/safe-areas, service worker quirks, touch handling, keyboard management, and known iOS 17+ WebKit bugs.

## Systematic Debugging Workflow

Follow this ordered workflow. Do NOT skip steps — each targets a specific class of iOS-specific failures.

```
┌──────────────────────┐
│ 1. CONNECT & VERIFY  │ ← Safari Web Inspector + user agent
├──────────────────────┤
│ 2. VIEWPORT AUDIT    │ ← safe-areas, dvh, landscape, keyboard
├──────────────────────┤
│ 3. SW & STORAGE      │ ← registration, ITP, IndexedDB fallback
├──────────────────────┤
│ 4. TOUCH & GESTURE   │ ← tap delay, overscroll, zoom
├──────────────────────┤
│ 5. FORM & INPUT      │ ← autofill, zoom-on-focus, file inputs
├──────────────────────┤
│ 6. RENDER & PERF     │ ← GPU, background tabs, memory
└──────────────────────┘
```

---

## Step 1: Connect & Verify

### Safari Web Inspector Setup

1. **On iPhone**: Settings → Safari → Advanced → **Web Inspector = ON**
2. **On Mac**: Safari → Settings → Advanced → **Show Develop menu = ON**
3. **Connect iPhone via USB**, then Safari → Develop → `[Device Name]` → `[Page URL]`

### Panels to Open

| Panel | What to Check |
|-------|---------------|
| **Console** | CSP errors, uncaught exceptions, SW registration failures |
| **Elements → Computed** | Actual `height`, `padding`, `touch-action`, `-webkit-appearance` |
| **Network** | SW script response headers (must NOT be cached by Safari) |
| **Storage → Service Workers** | Registration state, "Update on reload", SW version mismatch |
| **Storage → Local Storage** | IS IndexedDB data replicated? (iOS may clear IDB) |
| **Storage → IndexedDB** | Database present? Data intact? |

### Verify User Agent

```javascript
// In Safari Console
navigator.userAgent
// Expected: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)..."
// Check for: iOS version, "iPhone" or "iPad" or "Macintosh" (iPadOS)

// Also verify standalone mode
window.navigator.standalone
// true if PWA is running from Home Screen
```

### Verify iOS/iPadOS Standalone Detection

```javascript
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
const isIOSPWA = isIOS && window.navigator.standalone === true;

// iPadOS 13+ detection (desktop-class browsing)
const isIPad = /Macintosh/.test(navigator.userAgent) &&
              navigator.maxTouchPoints > 1;

// Apply standalone class
if (isIOSPWA) {
  document.documentElement.classList.add('pwa-standalone');
}
```

---

## Step 2: Viewport Audit

### 2A. Safe Areas & Dynamic Island

iOS 17+ devices fall into three safe-area categories:

| Device Type | `safe-area-inset-top` | `safe-area-inset-bottom` | Example Devices |
|-------------|----------------------|--------------------------|-----------------|
| Classic home button | 20px | 0px | iPhone SE (gen2/3) |
| Notch | ~44-47px | 34px | iPhone X–13, 14/15 non-Pro |
| Dynamic Island | ~54-59px | 34px | iPhone 14 Pro/Pro Max, 15 Pro/Pro Max |

**Critical:** The Dynamic Island is physically taller than the notch. Hardcoding `44px` for the top safe area breaks on iPhone 14 Pro/15 Pro.

**Always use `env()` — never hardcode:**

```css
:root {
  --safe-area-top: env(safe-area-inset-top, 20px);
  --safe-area-bottom: env(safe-area-inset-bottom, 0px);
  --safe-area-left: env(safe-area-inset-left, 0px);
  --safe-area-right: env(safe-area-inset-right, 0px);
}
```

**For standalone (PWA) mode**, the status bar adds extra height:

```css
.pwa-standalone .header {
  /* Status bar + safe area = ~88-100px on Dynamic Island devices */
  padding-top: calc(44px + var(--safe-area-top));
}

/* Better: use env() directly in your layout */
.pwa-standalone #app-wrapper {
  /* top: status bar height + safe area */
  padding-top: calc(44px + env(safe-area-inset-top, 20px));
  /* bottom: home indicator + safe area */
  padding-bottom: env(safe-area-inset-bottom, 0px);
  padding-left: env(safe-area-inset-left, 0px);
  padding-right: env(safe-area-inset-right, 0px);
}
```

### 2B. Viewport Height: `dvh` vs `vh` vs `-webkit-fill-available`

| Unit | iOS Support | Behavior |
|------|-------------|----------|
| `100vh` | ✅ All iOS | Includes address bar area; content may extend below viewport |
| `100dvh` | ✅ iOS 15.4+ | Dynamic viewport height; excludes browser chrome |
| `100svh` | ✅ iOS 15.4+ | Smallest possible viewport height |
| `-webkit-fill-available` | ⚠️ Deprecated iOS 15.4+ | Use `dvh` instead |

**Debug tip:** In Safari Web Inspector → Elements → Computed, check the actual computed `height` of `body` and `html`. If `body` height > `window.innerHeight`, you have a viewport height issue.

**Fix:** Use `100dvh` with `100vh` as fallback for iOS <15.4:

```css
.fullscreen-area {
  height: 100vh;        /* Fallback for older iOS */
  height: 100dvh;       /* iOS 15.4+ */
}
```

### 2C. Landscape Mode

In landscape on iPhone (especially 14 Pro/15 Pro with 393x852 → 852x393 logical), available height drops dramatically. Common failures:

```css
/* Common fix: reduce fixed-height elements in landscape */
@media (orientation: landscape) and (max-height: 450px) {
  .fixed-header { height: 50px; }
  .bottom-nav { height: 44px; }
  .scroll-area { 
    min-height: unset;
    flex: 1 1 auto;
  }
}
```

**Always check:** After orientation change, read `window.innerHeight` vs `document.documentElement.clientHeight` — on iOS these can differ (the former excludes the address bar).

### 2D. Keyboard Overlap (visualViewport)

iOS Safari does NOT resize the layout viewport when the keyboard opens — it overlaps the content. The **only** reliable API is `visualViewport`:

```javascript
if (window.visualViewport) {
  let initialHeight = window.visualViewport.height;

  window.visualViewport.addEventListener('resize', () => {
    const keyboardOpen = window.visualViewport.height < initialHeight * 0.8;
    
    document.documentElement.classList.toggle('keyboard-open', keyboardOpen);
    
    if (keyboardOpen) {
      // Scroll active element into view
      document.activeElement?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  });

  // Reset on orientation change
  window.addEventListener('orientationchange', () => {
    setTimeout(() => { initialHeight = window.visualViewport.height; }, 500);
  });
}
```

### 2E. Text Size Adjustment on Orientation Change

iOS adjusts font size when switching orientation. Prevent with:

```css
html {
  -webkit-text-size-adjust: 100%;
  /* or: none — but 100% allows user zoom while preventing automatic adjustment */
}
```

---

## Step 3: Service Worker & Storage

### 3A. SW Update Mechanism

iOS 17 has a known issue where the service worker script itself gets aggressively cached, preventing updates.

**Debug in Safari DevTools:**
1. Storage → Service Workers → check "Received" date
2. If the SW script hasn't updated despite file changes, iOS is caching the SW file
3. **Fix:** Ensure the SW response includes `Cache-Control: no-cache` or use a unique SW URL per version

**Workaround — Bump cache name AND SW file:**

```javascript
// sw.js
const CACHE_NAME = 'app-v7'; // ← VERSION BUMP forces reinstall on iOS

// Force update check from app code
if ('serviceWorker' in navigator) {
  // iOS-specific: poll for updates
  setInterval(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg) await reg.update();
  }, 30 * 60 * 1000); // 30 minutes

  // Also update on visibility change
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      navigator.serviceWorker.getRegistration().then(r => r?.update());
    }
  });
}
```

### 3B. IndexedDB Data Loss

iOS may delete IndexedDB data under storage pressure or after PWA updates. **Always implement a fallback.**

```javascript
class StorageWithFallback {
  constructor(dbName) {
    this.dbName = dbName;
    this.fallbackPrefix = `idb_fallback_${dbName}_`;
  }

  async set(key, value) {
    const data = JSON.stringify(value);
    
    // Primary: IndexedDB
    try {
      await this._idbSet(key, data);
    } catch (e) {
      console.warn('IndexedDB write failed, using localStorage:', e.message);
    }
    
    // Fallback: localStorage (iOS retains this when IndexedDB is cleared)
    try {
      localStorage.setItem(this.fallbackPrefix + key, data);
    } catch (e) {
      console.warn('localStorage fallback failed:', e.message);
    }
  }

  async get(key) {
    // Try IndexedDB first
    try {
      const data = await this._idbGet(key);
      if (data !== null && data !== undefined) return JSON.parse(data);
    } catch (e) { /* fall through */ }

    // Fallback to localStorage
    try {
      const data = localStorage.getItem(this.fallbackPrefix + key);
      if (data) return JSON.parse(data);
    } catch (e) { /* fall through */ }

    return null;
  }
}
```

### 3C. Intelligent Tracking Prevention (ITP)

iOS Safari's ITP may purge client-side storage (IndexedDB, Cache API, localStorage) after 7 days of no user interaction in a PWA. Mitigation:

- **Touch events count as interaction.** Ensure meaningful touch handlers exist.
- **`Service-Worker-Allowed` header** may help, but ITP is aggressive.
- **Remind users** that iOS may clear data; provide data export/import functionality.

### 3D. Unsupported APIs on iOS PWA

| API | iOS 17+ Support | Fallback |
|-----|----------------|----------|
| Push Notifications | ❌ Not in PWA | Poll-based refresh, badge via `<title>` |
| Badging API | ❌ | Update document title with count |
| Periodic Background Sync | ❌ | Refresh on visibility change |
| Web Share Target | ❌ | Custom share button, clipboard fallback |
| File System Access | ❌ | User-triggered file input |
| Background Fetch | ❌ | Foreground-only |

---

## Step 4: Touch & Gesture

### 4A. Eliminate Tap Delay

```css
/* One property eliminates 300ms delay + double-tap zoom */
html, body {
  touch-action: manipulation;
}
```

### 4B. Overscroll & Pull-to-Refresh

iOS has native pull-to-refresh that can conflict with PWAs:

```css
/* Prevent pull-to-refresh on main view */
.scroll-container {
  overscroll-behavior-y: contain;
}

/* Prevent rubber-banding on scrollable areas */
.scroll-area {
  overscroll-behavior: contain;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch; /* Deprecated iOS 13+ but harmless */
}
```

### 4C. Active State on Tap

iOS only fires `:active` on elements with `cursor: pointer` or a `touchstart` listener:

```css
button, a, [role="button"], .clickable {
  cursor: pointer;        /* Enables :active on iOS touch */
  -webkit-tap-highlight-color: transparent; /* Remove grey highlight */
}
```

### 4D. Prevent Double-Tap Zoom

```css
/* Option A: on specific elements (recommended) */
.interactive-area {
  touch-action: manipulation;
}

/* Option B: document-wide (only if no zoom needed) */
html {
  touch-action: manipulation;
}
```

### 4E. Scroll Performance During Touch

On iOS, `scroll` events fire at different rates than on desktop. Ensure rendering keeps up:

```javascript
// Use passive listeners for scroll performance
scrollContainer.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      updateOverlay();
      renderVisibleArea();
      ticking = false;
    });
    ticking = true;
  }
}, { passive: true });
```

---

## Step 5: Form & Input

### 5A. Prevent Zoom on Focus

iOS automatically zooms on `<input>` focus if font-size < 16px:

```css
/* Critical: 16px minimum prevents iOS zoom */
input, textarea, select {
  font-size: 16px;
}

/* If you need smaller visual size, use transform instead */
input.compact {
  font-size: 16px;          /* Keeps zoom prevention */
  transform: scale(0.875);  /* Visually 14px */
}
```

### 5B. Input Modes for iOS Keyboard

```html
<!-- Shows numeric keypad -->
<input type="text" inputmode="numeric" pattern="[0-9]*">

<!-- Shows email keyboard with @ and . -->
<input type="email" inputmode="email" autocomplete="email">

<!-- Shows telephone keypad -->
<input type="tel" inputmode="tel">

<!-- Prevents keyboard from appearing (custom picker) -->
<input type="text" inputmode="none" readonly>
```

### 5C. iOS-Specific Form Styling

```css
/* Remove default iOS styling */
input, textarea, select, button {
  -webkit-appearance: none;
  appearance: none;
}

/* Remove inner shadow on iOS inputs */
input {
  -webkit-box-shadow: none;
  box-shadow: none;
}

/* Disable autocorrect/autocapitalize where inappropriate */
input[type="email"],
input[type="url"],
input.autocomplete-off {
  autocorrect: off;
  autocapitalize: none;
  spellcheck: false;
}
```

### 5D. File & Camera Inputs

```html
<!-- Camera: add capture attribute for iOS -->
<input type="file" accept="image/*" capture="environment">
<input type="file" accept="video/*" capture="environment">

<!-- iOS does NOT support multiple capture; use single -->
<input type="file" accept="image/*" multiple>
<!-- multiple works for picking from gallery, not for camera -->
```

---

## Step 6: Render & Performance

### 6A. GPU Compositing

iOS aggressively uses GPU compositing. Common issues:

```css
/* Force hardware acceleration for animated elements */
.animated {
  will-change: transform;              /* Hint browser to composite */
  -webkit-transform: translateZ(0);    /* Legacy: force GPU layer */
}

/* Avoid repaints on scroll — use transform instead of position/top/left */
/* ❌ Bad */
.scroll-indicator { left: ${scrollX}px; }

/* ✅ Good */
.scroll-indicator { transform: translateX(${scrollX}px); }
```

### 6B. Background Tab Throttling

iOS aggressively throttles timers in background tabs (and PWAs that are not foreground):

- `setInterval` > 1 minute: may drift significantly
- `requestAnimationFrame`: paused when not visible
- `setTimeout` with delay < 1s in background: clamped to 1s (iOS 17+)

**Fix:** Use `visibilitychange` and `document.hidden`:

```javascript
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Pause animations, stop polling
    this.pause();
  } else {
    // Resume, do immediate sync
    this.resume();
    this.forceSync();
  }
});
```

### 6C. Memory Limits

iOS PWAs have tighter memory limits than Safari browser tabs. Symptoms: blank white screen on return, canvas corruption, tab reload. Mitigation:

```javascript
// Clear large data structures when hidden
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    this.canvasCache?.clear();
    URL.revokeObjectURL(this.largeBlobURL);
  }
});

// Listen for memory pressure (Safari-only)
if ('memoryPressure' in window) {
  window.addEventListener('memorypressure', () => {
    this.clearCaches();
  });
}
```

---

## Known iOS 17+ Bugs

| Bug | Symptom | Workaround |
|-----|---------|------------|
| SW script cached aggressively | SW doesn't update | Bump CACHE_NAME, add `Cache-Control: no-cache`, poll `reg.update()` |
| IndexedDB cleared on storage pressure | User loses settings/data | localStorage fallback for critical data |
| `100dvh` glitch in standalone with Dynamic Island | Content shifted up/down by ~10px | Use `env(safe-area-inset-top)` + status bar compensation |
| Orientation transition repaint | Flash of white during rotation | Apply `body { background: theme_color }` during transition |
| Canvas `getContext('webgl')` failure in PWA | WebGL not available | Fallback to Canvas2D, detect with `try/catch` |
| `navigator.standalone` false positive in Safari 17.4+ | Incorrectly detects standalone when not | Combine with `matchMedia('(display-mode: standalone)')` |

---

## Debugging Tools Reference

| Tool | How to Access | Use Case |
|------|--------------|----------|
| Safari Web Inspector | Mac Safari → Develop → Device → Page | Full DOM, Console, Network, Storage audit |
| Safari Responsive Mode | Mac Safari → Develop → Enter Responsive Design (Cmd+Ctrl+R) | Viewport testing without device |
| iOS Console Logs | Settings → Developer → Start Logging | When Safari Web Inspector can't connect |
| NetService (app) | App Store → Network debugging app | Inspect fetch/XHR on device without Mac |
| WebDriver (Safari) | `defaults write com.apple.Safari IncludeDevelopMenu -bool true` | Automation + testing (XCUITest) |

---

## Common Mistakes

| Mistake | Reality |
|---------|---------|
| Hardcoding `44px` for top safe area | Dynamic Island is taller — use `env(safe-area-inset-top)` |
| Using `100vh` for full-screen layouts | Includes browser chrome — use `100dvh` |
| Forgetting `touch-action: manipulation` | 300ms tap delay on interactive elements |
| Assuming `scroll` event fires reliably | Use `{ passive: true }` + rAF throttling |
| Storing critical data only in IndexedDB | iOS may clear it — always have a fallback |
| Setting `input { font-size: 14px }` | iOS zooms into input on focus — minimum 16px |
| Not testing landscape on notch/Dynamic Island | Content gets cut off — test with reduced header heights |
| Using `-webkit-overflow-scrolling: touch` | Deprecated since iOS 13 — safe to keep but don't rely on it |

---

## Red Flags — STOP and Follow the Workflow

- "Just add `height: 100vh` and ship it" → **Stop.** You need `100dvh` + safe area handling.
- "The PWA works on Android, iOS must be the same" → **Stop.** iOS WebKit differs significantly.
- "I already hardcoded the notch offset" → **Stop.** Dynamic Island changed the dimensions.
- "`-webkit-` prefix will fix it" → **Stop.** Many `-webkit-` prefixes are deprecated.
- "Just trust IndexedDB for persistent storage" → **Stop.** iOS may clear it without warning.
- "The SW update will propagate on its own" → **Stop.** iOS caches SW aggressively.

## Verification Checklist

Before marking the iOS PWA as fully compatible:

- [ ] Safe areas use `env()` — no hardcoded values for notch/Dynamic Island
- [ ] Full-screen layouts use `100dvh` with `100vh` fallback
- [ ] Landscape mode tested: no overflow, reduced header heights
- [ ] `touch-action: manipulation` applied to all interactive areas
- [ ] `overscroll-behavior: contain` prevents pull-to-refresh conflicts
- [ ] Keyboard does NOT overlap content — `visualViewport` API in use
- [ ] All `font-size` on inputs ≥ `16px` (prevents iOS zoom on focus)
- [ ] SW updates reliably — poll `reg.update()` + bump cache names
- [ ] IndexedDB critical data backed up to localStorage
- [ ] SW response has `Cache-Control: no-cache`
- [ ] Inputs use proper `inputmode` and `autocomplete`
- [ ] No `-webkit-overflow-scrolling: touch` as required property
- [ ] `position: fixed` elements account for safe areas
- [ ] Tested with both notch and Dynamic Island simulators
- [ ] Tested orientation change (both directions)
- [ ] Tested in PWA standalone mode (Add to Home Screen)
- [ ] Unsupported APIs have graceful fallbacks
