# Spec: `src/utils/pwa.js`

## Purpose
PWA module: Service Worker registration, install prompt handling, new version detection, cache cleanup and reload.

## Dependencies

### Internal modules
| Module | Export used | Purpose |
|--------|-------------|----------|
| `./i18n.js` | `t` | Notification texts |

### DOM
| Element | Access type | Context |
|----------|---------------|----------|
| `#pwa-install-btn` | getElementById / style | showInstallButton |
| `.controls-right` | querySelector | showInstallButton |
| `#update-toast` | getElementById / style | showUpdateToast |
| `#update-toast-text` | getElementById / textContent | showUpdateToast |
| `#update-toast-btn` | getElementById / textContent + onclick | showUpdateToast |
| `#changelog-modal` | getElementById / classList | showUpdateToast |
| `./sw.js` | navigator.serviceWorker.register | registerSW |
| `./version.json` | fetch | checkAppVersion |

## Public API

### `export function registerSW(): { onUpdate: ?Function }`

**Description:** Registers the Service Worker (`sw.js`). Emits `onUpdate` when a new SW is installed and waiting.

### `export function handleInstallPrompt(): void`

**Description:** Listens for `beforeinstallprompt` and `appinstalled`. Shows install button in the UI.

### `export function showUpdateToast(onCheckVersion: Function): void`

**Description:** Shows a new version notification toast with a button to view what's new.

### `export async function checkAppVersion(onNewVersion: Function): void`

**Description:** Fetches `version.json` and compares with the local version in localStorage. Emits `onNewVersion` if different.

### `export async function clearCacheAndReload(): void`

**Description:** Clears all Service Worker caches, unregisters SWs, and reloads the page with a flag to prevent double reload.

## Behavior

1. `registerSW`: lazy registration on `window.load`; detects `updatefound` => `statechange` => `installed` + controller exists
2. `controllerchange` reloads the window unless `_isClearingCache` or `_skipSwReload` are active
3. `handleInstallPrompt`: prevents default behavior of `beforeinstallprompt` and shows custom button in `.controls-right`
4. `showUpdateToast`: does not show the toast if the changelog modal is already open
5. `clearCacheAndReload`: flag `_isClearingCache` prevents double execution; sends `skipWaiting` to active SW; sets `_skipSwReload` in sessionStorage

## Edge Cases

| Input | Expected behavior |
|---------|------------------------|
| SW not supported | `registerSW` returns handlers without registering |
| `beforeinstallprompt` not fired | No install button |
| `version.json` not accessible | `checkAppVersion` catches error, does nothing |
| `clearCacheAndReload` called twice | Second call does nothing (flag `_isClearingCache`) |
| Changelog modal open | `showUpdateToast` returns without showing |

## Test Scenarios

1. **registerSW fallback:** Without SW support, returns empty handler
2. **handleInstallPrompt:** Listens to events and shows button
3. **clearCacheAndReload flag:** Second call does not execute
4. **checkAppVersion error:** Fetch fails, silently catches error
5. **showUpdateToast with modal open:** Shows nothing

## Change History

| Date | Change | Author |
|-------|--------|-------|
| 2026-05-21 | Initial spec | SDD |
