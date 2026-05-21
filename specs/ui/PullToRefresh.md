# Spec: `src/ui/PullToRefresh.js`

## Propósito
Implementa pull-to-refresh táctil con indicador visual, rotación de icono y detección de overlays abiertos.

## Dependencias

### DOM
| Elemento | Tipo de acceso | Contexto |
|----------|---------------|----------|
| `#ptr-icon` | getElementById | rotación |
| `#ptr-indicator` | getElementById | animación |
| `#app-wrapper` | getElementById | transform |
| Overlay selectors | querySelectorAll | hasOverlayOpen |

## API Pública

### `export function initPullToRefresh(options?: { onRefresh?: Function }): { destroy: Function }`

**Descripción:** Inicializa pull-to-refresh con callbacks.

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `options?` | `Object` | Opciones de configuración |
| `options.onRefresh?` | `Function` | Callback async que se ejecuta al hacer pull. Debe retornar Promise. |

**Retorno:** `{ destroy: Function }` — objeto con método `destroy()` para limpiar listeners.

**Metadatos:**
- Mutates state: Sí (configura event listeners, manipula DOM del indicador)
- Async: No

## Comportamiento

1. Solo en touchstart con 1 dedo, sin overlays abiertos
2. Ignora si el touch empieza dentro de `#search-results`
3. Distingue scroll horizontal vs vertical (ignora si X diff > Y diff)
4. Distancia visual: `min(75, dist/2.5)`, umbral de activación: 60px
5. Icono rota proporcionalmente hasta 360° al llegar a 75px
6. Al soltar: si dist > 60px, spinning animation + llama `onRefresh`
7. `onRefresh` debe retornar Promise; al completar, resetea UI

## Casos borde

| Entrada | Comportamiento esperado |
|---------|------------------------|
| `options = null` / `undefined` | Inicializa sin callback, retorna `{ destroy }` |
| `onRefresh` no es función | Inicializa sin callback, no lanza error |
| Elementos DOM (`#ptr-icon`, `#ptr-indicator`) no existen | No lanza error, PTR no funcional |
| Touch dentro de `#search-results` | Ignora, no inicia PTR |
| Touch con 2+ dedos | Ignora, solo 1 dedo |
| `destroy()` llamado dos veces | No lanza error, segunda llamada es no-op |

## Escenarios de test

1. **Se inicializa sin errores con opciones:** `initPullToRefresh({ onRefresh })`, no lanza error
2. **No lanza si faltan elementos DOM:** Elementos `#ptr-icon`, `#ptr-indicator` ausentes, no lanza error
3. **Exporta las funciones esperadas:** `initPullToRefresh` exportado y retorna `{ destroy }`
4. **Sin opciones:** `initPullToRefresh()` sin parámetros, retorna `{ destroy }`
5. **Touch con 2+ dedos:** Ignora, no inicia PTR
6. **Destroy llamado dos veces:** Segunda llamada es no-op

## Historial de cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-05-21 | Spec inicial | SDD |
