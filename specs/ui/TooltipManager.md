# Spec: `src/ui/TooltipManager.js`

## Propósito
Gestión de tooltips para desktop (hover) y bottom sheets para mobile (click) en métricas y ubicación.

## Dependencias

### Módulos internos
| Módulo | Export usado | Para qué |
|--------|-------------|----------|
| `./BottomSheet.js` | `openBottomSheet` | modales métricas |

### DOM
| Elemento | Tipo de acceso | Contexto |
|----------|---------------|----------|
| `.info-icon` | querySelectorAll | hover/click |
| `.location-group` | querySelectorAll | hover/click |
| `.data-value` | querySelectorAll | click mobile |
| `.custom-tooltip` | querySelectorAll | mostrar/ocultar |

## API Pública

### `export function showTooltip(el: HTMLElement): void`

**Descripción:** Muestra tooltip, centrado en mobile.

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `el` | `HTMLElement` | Elemento que activa el tooltip |

**Metadatos:**
- Mutates state: Sí (modifica display/posición de tooltip)
- Async: No

### `export function hideTooltip(el: HTMLElement): void`

**Descripción:** Oculta tooltip.

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `el` | `HTMLElement` | Elemento cuyo tooltip ocultar |

**Metadatos:**
- Mutates state: Sí (modifica display de tooltip)
- Async: No

### `export function initTooltipManager(): void`

**Descripción:** Inicializa eventos hover (desktop) y click (mobile) para tooltips.

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| — | — | Sin parámetros |

**Metadatos:**
- Mutates state: Sí (registra event listeners)
- Async: No

## Comportamiento

1. Desktop (>=600px): hover en .info-icon y .location-group
2. Mobile (<600px): click en .data-value → abre modal si tiene METRIC_MODALS mapping
3. Location group: solo muestra tooltip si hay overflow (texto truncado)
4. Global click en mobile cierra todos los tooltips
5. Tooltip en mobile: position fixed, centrado horizontal, debajo del elemento

## Casos borde

| Entrada | Comportamiento esperado |
|---------|------------------------|
| `el = null` / `undefined` | `showTooltip` / `hideTooltip` no lanzan error |
| `.info-icon` / `.location-group` no existen | `initTooltipManager` no registra eventos para esos selectores |
| Elemento sin `.custom-tooltip` asociado | `showTooltip` no encuentra tooltip, no lanza error |
| Desktop (>600px) con click táctil | Comportamiento hover, ignora click |
| Location sin overflow (texto no truncado) | No muestra tooltip |
| Mobile global click cierra tooltip que no existe | No lanza error |

## Escenarios de test

1. **Se inicializa sin errores con elementos DOM presentes:** `initTooltipManager` con elementos DOM, no lanza error
2. **No lanza si faltan elementos DOM en el documento:** Selectores sin elementos, no lanza error
3. **Exporta las funciones esperadas:** `initTooltipManager`, `showTooltip`, `hideTooltip` son funciones
4. **Tooltip con elemento null:** `showTooltip(null)` no lanza error
5. **Desktop hover:** `window.innerWidth >= 600`, hover en info-icon
6. **Mobile click:** `window.innerWidth < 600`, click en data-value

## Historial de cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-05-21 | Spec inicial | SDD |
