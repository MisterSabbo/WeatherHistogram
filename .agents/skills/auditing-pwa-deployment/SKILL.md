---
name: auditing-pwa-deployment
description: Use when reviewing an existing web app codebase to verify PWA compliance and GitHub Pages hosting readiness — before deployment, after development, or when migrating to GH Pages; also use when diagnosing why a PWA doesn't work correctly in standalone mode or why GitHub Pages breaks SPA routing
---

# Auditing PWA Deployment

## Overview
Review an existing web app codebase to ensure it meets all PWA installability criteria AND works correctly when hosted on GitHub Pages. This skill generates a structured audit report covering both web-access and standalone/PWA mode.

This is a **verification skill** — it audits existing code rather than guiding construction. Use the companion skills (`pwa-development`, `pwa-github-pages`, `pwa-cross-platform`) for HOW to fix issues found during the audit.

## When to Use

```
         ┌──────────────────────────┐
         │ Are you auditing an      │
         │ existing codebase?       │
         └──────────┬───────────────┘
                    │
          ┌─────────┴─────────┐
          │ YES               │ NO
          │                   │
    ┌─────▼─────┐       ┌────▼─────┐
    │ Is the    │       │ Use      │
    │ project   │       │ construc-│
    │ destined  │       │ tion     │
    │ for GH    │       │ skills   │
    │ Pages?    │       │ instead  │
    └──┬───┬────┘       └──────────┘
       │   │
    ┌──▼───▼──┐
    │ AUDIT   │
    └─────────┘
```

**Use when:**
- Reviewing a codebase before deploying to GitHub Pages
- Diagnosing why a PWA doesn't install or work in standalone mode
- Migrating an existing web app to GitHub Pages with PWA support
- Performing a pre-launch quality check on a PWA project
- A Lighthouse PWA audit fails and you need to trace the root cause in code
- An SPA works in dev but breaks on GitHub Pages (404 on route refresh)

**Do NOT use when:**
- Building a PWA from scratch (use `pwa-development` instead)
- Debugging cross-platform iOS/Android issues (use `pwa-cross-platform` instead)
- Configuring deployment workflows (use `pwa-github-pages` instead)

## Required Companion Skills

**REQUIRED BACKGROUND:** You MUST have access to the following skills for remediation after the audit:
- `pwa-development` — to fix service worker, manifest, and offline issues
- `pwa-github-pages` — to fix SPA routing and deployment-specific issues
- `pwa-cross-platform` — to fix iOS/Android platform-specific issues

## Audit Process

The audit follows a structured 5-phase process:

```
Phase 1: README & Config Scan → Phase 2: Static Analysis →
Phase 3: PWA Requirements Check → Phase 4: GH Pages Compatibility →
Phase 5: Cross-Mode Verification → Final Report
```

### Phase 1: Project Configuration Scan

Review files to understand project structure and build setup:
- `package.json` — build tools, scripts, PWA-related dependencies
- `vite.config.js` / `webpack.config.js` — base path, PWA plugins
- `index.html` — meta tags, manifest link, SW registration
- Directory structure — public/ vs src/ layout

### Phase 2: Static Code Analysis

Search for PWA-related code patterns:
- Service worker file(s) — registration logic, caching strategy
- Manifest.json — fields, icons, display mode
- 404.html or SPA routing fallback
- Offline fallback handling
- Platform detection and standalone mode detection

### Phase 3: PWA Requirements Audit

Check each requirement against the codebase:

#### 3.1 Web App Manifest
- [ ] `manifest.json` exists and is linked from `<head>` via `<link rel="manifest">`
- [ ] Contains `name` (human-readable app name)
- [ ] Contains `short_name` (truncated name for home screen)
- [ ] Contains `start_url` (usually `/` or `/?source=pwa`)
- [ ] Contains `display: "standalone"` (or `"fullscreen"` / `"minimal-ui"`)
- [ ] Contains `background_color` (splash screen background)
- [ ] Contains `theme_color` (matches app theme, also used by browsers)
- [ ] Contains at minimum icons: 192x192 and 512x512
- [ ] A maskable icon (`purpose: "maskable"`) is included for Android
- [ ] Icon paths are correct and files exist
- [ ] `scope` is set (usually `"/"`) and covers all app routes

#### 3.2 Service Worker
- [ ] SW file exists and is registered via `navigator.serviceWorker.register()`
- [ ] Registration is guarded with `'serviceWorker' in navigator` check
- [ ] Registration happens on `window.addEventListener('load', ...)` (not before)
- [ ] `install` event caches critical static assets (shell)
- [ ] `activate` event cleans old caches
- [ ] `fetch` event has a caching strategy (CacheFirst, NetworkFirst, etc.)
- [ ] `fetch` handler distinguishes same-origin vs cross-origin requests
- [ ] Cross-origin requests (APIs) are handled explicitly (e.g., stale-while-revalidate)
- [ ] Navigation requests have an offline fallback (offline.html or cached index.html)
- [ ] SW update flow is implemented (`skipWaiting`, `controllerchange` listener)
- [ ] No aggressive caching of API responses without expiration

#### 3.3 Offline Support
- [ ] App loads without network (test: DevTools > Network > Offline)
- [ ] Offline fallback page (`offline.html`) exists and is styled
- [ ] Cached assets render correctly offline (CSS, JS, images)
- [ ] User sees a meaningful message when offline (not a browser error)
- [ ] Online/offline event listeners are registered (`window.addEventListener('online'/'offline')`)
- [ ] Background sync or queuing implemented for write operations (optional but recommended)

#### 3.4 iOS Meta Tags (for Safari/WebKit)
- [ ] `<meta name="apple-mobile-web-app-capable" content="yes">` present
- [ ] `<meta name="apple-mobile-web-app-status-bar-style">` configured
- [ ] `<meta name="apple-mobile-web-app-title">` set
- [ ] `<link rel="apple-touch-icon">` present (at least 180x180)
- [ ] Apple touch icons in multiple sizes (120, 152, 167, 180)

#### 3.5 HTTPS & Security
- [ ] Site runs on HTTPS (GitHub Pages provides this automatically)
- [ ] `Content-Security-Policy` headers don't block SW or cache API
- [ ] No mixed content (HTTP resources on HTTPS page)

#### 3.6 Installability
- [ ] `beforeinstallprompt` event listener is registered
- [ ] Install prompt is shown to user (not suppressed without reason)
- [ ] `appinstalled` event is tracked
- [ ] Standalone mode detection implemented (`display-mode: standalone` or `navigator.standalone`)

### Phase 4: GitHub Pages Compatibility Audit

#### 4.1 Static-Only Compliance
- [ ] No server-side code (Node.js, PHP, Python, etc.) in the build output
- [ ] All dynamic data comes from client-side API calls or build-time data injection
- [ ] No `.htaccess`, `nginx.conf`, or similar server config files expected

#### 4.2 SPA Routing
- [ ] `404.html` exists with redirect logic for client-side routing
- [ ] OR `index.html` includes a redirect script for GitHub Pages
- [ ] The SPA router handles the redirected path correctly (from hash or query)
- [ ] Direct URL access to any route works (e.g., `domain.com/settings`)
- [ ] Relative vs absolute paths are correct (subdirectory-page sites need base path)

#### 4.3 Base Path Configuration
- [ ] For project pages (`username.github.io/repo/`): `base` in vite/webpack config matches repo name
- [ ] All asset paths in `index.html` (CSS, JS, icons) use correct base path
- [ ] Manifest `start_url` and icon `src` paths work with the base path
- [ ] Service worker scope aligns with the base path
- [ ] 404.html redirect accounts for subdirectory path

#### 4.4 Build Output
- [ ] Build produces static files only (HTML, CSS, JS, JSON, images)
- [ ] No file exceeds GitHub Pages soft limit (100MB)
- [ ] Assets are minified and optimized
- [ ] Cache-busting hashes are used for static assets (for SW cache invalidation)

#### 4.5 Custom Domain (if applicable)
- [ ] `CNAME` file present in deploy branch with correct domain
- [ ] DNS records configured at domain provider
- [ ] Manifest `start_url` uses `/` (works with custom domain)

### Phase 5: Cross-Mode Functionality Check

#### 5.1 Web Browser Mode
- [ ] App loads and functions correctly in a regular browser tab
- [ ] All features work without PWA installation
- [ ] Console has no PWA-related errors (manifest fetch, SW registration)

#### 5.2 PWA Standalone Mode
- [ ] App launches without browser chrome (no URL bar, no tabs)
- [ ] Splash screen displays on cold start
- [ ] Status bar color matches theme
- [ ] Safe areas are respected (notched devices via `env(safe-area-inset-*)`)
- [ ] App feels native (smooth transitions, no white flash on navigation)
- [ ] Back button / gesture works correctly (not leaving the app)
- [ ] Deep links open in the PWA (not in browser)

#### 5.3 Offline Mode
- [ ] App shell loads when offline from standalone mode
- [ ] Previously cached data is accessible
- [ ] Meaningful offline state is shown
- [ ] No JavaScript errors in offline mode

## Audit Report Template

After completing all phases, generate a structured report:

```markdown
# PWA Deployment Audit Report

## Project: [project-name]
## Date: [date]

### Summary
- **PWA Compliance:** ✅ / ⚠️ / ❌ ([X]/[Y] checks pass)
- **GitHub Pages Ready:** ✅ / ⚠️ / ❌ ([X]/[Y] checks pass)
- **Cross-Mode Functional:** ✅ / ⚠️ / ❌

### Issues Found

#### Critical (blocking deployment)
| # | Phase | Issue | File | Fix Reference |
|---|-------|-------|------|---------------|
| 1 | 3.1 | Missing manifest.json | index.html | pwa-development |
| 2 | 4.2 | No 404.html for SPA routing | — | pwa-github-pages |

#### Warning (degrades experience)
| # | Phase | Issue | File | Fix Reference |
|---|-------|-------|------|---------------|
| 1 | 3.2 | No offline fallback for navigation | sw.js | pwa-development |
| 2 | 3.4 | Missing apple-touch-icon | index.html | pwa-cross-platform |

#### Info (recommendations)
| # | Phase | Issue | File | Fix Reference |
|---|-------|-------|------|---------------|
| 1 | 3.6 | Install prompt not handled | app.js | pwa-development |
| 2 | 5.2 | Safe area CSS not applied | styles.css | pwa-cross-platform |

### Passed Checks
- [List key checks that passed, for confidence]

### Next Steps
1. Fix critical issues first (block deployment otherwise)
2. Address warnings before launch
3. Consider info recommendations for production quality
4. Re-run audit after fixes
```

## Red Flags — Issues That Must Block Deployment

If any of these are found, the app is NOT ready for deployment:

- **No service worker registration** — PWA won't install or work offline
- **No manifest.json link** — PWA won't install
- **No SPA routing fallback** — GitHub Pages will 404 on route refresh
- **`display` not set to `standalone`** — won't install as PWA
- **Missing 192x192 and 512x512 icons** — won't meet install criteria
- **Service worker fetch handler absent** — no offline capability
- **Absolute paths pointing to localhost** — broken in production

## Common Mistakes Found During Audits

| Mistake | Phase | Why It Happens | Fix Skill |
|---------|-------|----------------|-----------|
| Manifest linked but file returns 404 | 3.1 | Path not updated for GH Pages subdirectory | pwa-github-pages |
| SW registered but never activates | 3.2 | Missing `skipWaiting()` or wrong scope | pwa-development |
| Offline fallback shows but assets broken | 3.3 | CSS not cached, only HTML | pwa-development |
| SPA routes work in dev but 404 on GH Pages | 4.2 | No 404.html redirect for client-side router | pwa-github-pages |
| PWA installs but splash screen is white | 3.1 | `background_color` not set or wrong value | pwa-development |
| iOS users can't install | 3.4 | Missing `apple-mobile-web-app-capable` meta tag | pwa-cross-platform |
| App works in browser but breaks standalone | 5.2 | Missing safe-area CSS or wrong viewport config | pwa-cross-platform |
| API calls fail in production | 4.1 | CORS not configured, or API key exposed | pwa-github-pages |
| Icons render as broken images | 3.1 | Icon paths don't account for base path | pwa-github-pages |

## Verification Checklist for the Auditor

- [ ] All 5 phases completed
- [ ] Each check in phases 3-5 has a clear ✅/⚠️/❌ status
- [ ] Report includes exact file paths and line numbers for issues
- [ ] Each issue references the correct companion skill for fixes
- [ ] Critical issues are clearly separated from warnings
- [ ] Summary section gives at-a-glance status
- [ ] Recommendations are prioritized by impact

## Limitations

This audit covers **static analysis and configuration review**. It cannot:
- Test actual offline behavior (requires manual testing in DevTools)
- Verify Lighthouse PWA scores (requires running Lighthouse)
- Test on real iOS/Android devices (requires physical testing)
- Validate that API endpoints are reachable from GitHub Pages (requires CORS testing)

**After the audit, always recommend:**
1. Run Lighthouse PWA audit
2. Test on a real device
3. Test offline mode manually
4. Test direct URL access to every route on the live GH Pages site

## Real-World Impact

A systematic PWA deployment audit:
- Catches missing manifest links and SW registration issues **before** production
- Prevents the "works on my machine" problem with SPA routing on GH Pages
- Ensures both web and standalone modes work, avoiding user confusion
- Reduces debugging time by providing exact file references for each issue
- Creates documentation of the app's PWA readiness that can be tracked over versions
