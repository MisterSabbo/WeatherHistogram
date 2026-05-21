# Spec: `src/utils/pwa.js`

## Propósito
Módulo PWA: registro de Service Worker, manejo del prompt de instalación, detección de nuevas versiones, limpieza de caché y recarga.

## Dependencias

### Módulos internos
| Módulo | Export usado | Para qué |
|--------|-------------|----------|
| `./i18n.js` | `t` | Textos de notificaciones |

### DOM
| Elemento | Tipo de acceso | Contexto |
|----------|---------------|----------|
| `#pwa-install-btn` | getElementById / style | showInstallButton |
| `.controls-right` | querySelector | showInstallButton |
| `#update-toast` | getElementById / style | showUpdateToast |
| `#update-toast-text` | getElementById / textContent | showUpdateToast |
| `#update-toast-btn` | getElementById / textContent + onclick | showUpdateToast |
| `#changelog-modal` | getElementById / classList | showUpdateToast |
| `./sw.js` | navigator.serviceWorker.register | registerSW |
| `./version.json` | fetch | checkAppVersion |

## API Pública

### `export function registerSW(): { onUpdate: ?Function }`

**Descripción:** Registra el Service Worker (`sw.js`). Emite `onUpdate` cuando un nuevo SW se instala y está esperando.

### `export function handleInstallPrompt(): void`

**Descripción:** Escucha `beforeinstallprompt` y `appinstalled`. Muestra botón de instalación en la UI.

### `export function showUpdateToast(onCheckVersion: Function): void`

**Descripción:** Muestra un toast de notificación de nueva versión disponible con botón para ver novedades.

### `export async function checkAppVersion(onNewVersion: Function): void`

**Descripción:** Fetch a `version.json` y compara con la versión local en localStorage. Emite `onNewVersion` si hay diferencia.

### `export async function clearCacheAndReload(): void`

**Descripción:** Limpia todas las caches del Service Worker, desregistra SWs, y recarga la página con un flag para evitar doble recarga.

## Comportamiento

1. `registerSW`: registro lazy on `window.load`; detecta `updatefound` → `statechange` → `installed` + controller exists
2. `controllerchange` recarga la ventana a menos que `_isClearingCache` o `_skipSwReload` estén activos
3. `handleInstallPrompt`: previene comportamiento default del `beforeinstallprompt` y muestra botón custom en `.controls-right`
4. `showUpdateToast`: no muestra el toast si el changelog modal ya está abierto
5. `clearCacheAndReload`: flag `_isClearingCache` previene ejecución doble; envía `skipWaiting` al SW activo; setea `_skipSwReload` en sessionStorage

## Casos borde

| Entrada | Comportamiento esperado |
|---------|------------------------|
| SW no soportado | `registerSW` retorna handlers sin registrar nada |
| `beforeinstallprompt` no se dispara | No hay botón de instalación |
| `version.json` no accesible | `checkAppVersion` captura error, no hace nada |
| `clearCacheAndReload` llamado dos veces | Segunda llamada no ejecuta nada (flag `_isClearingCache`) |
| Changelog modal abierto | `showUpdateToast` retorna sin mostrar |

## Escenarios de test

1. **registerSW fallback:** Sin soporte SW, retorna handlers vacío
2. **handleInstallPrompt:** Escucha eventos y muestra botón
3. **clearCacheAndReload flag:** Segunda llamada no ejecuta
4. **checkAppVersion error:** Fetch falla, captura error silenciosamente
5. **showUpdateToast con modal abierto:** No muestra nada

## Historial de cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-05-21 | Spec inicial | SDD |
