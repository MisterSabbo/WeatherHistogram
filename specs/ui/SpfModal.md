# Spec: `src/ui/SpfModal.js`

## Propósito
Modal SPF que muestra riesgo UV, tiempo hasta quemadura y recomendación de protector solar según fototipo.

## Dependencias

### state
| Propiedad | Acceso | Contexto |
|-----------|--------|----------|
| `state.skinType` | read | cálculo tiempo quemadura |

### Módulos internos
| Módulo | Export usado | Para qué |
|--------|-------------|----------|
| `../store.js` | `state` | acceso |
| `../utils/i18n.js` | `t` | traducción |
| `./BottomSheet.js` | `openBottomSheet`, `closeBottomSheet`, `onSheetClose` | modal |

## API Pública

### `export function closeSpfSheet(): void`

**Descripción:** Cierra el modal SPF.

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| — | — | Sin parámetros |

**Metadatos:**
- Mutates state: Sí (cierra bottom sheet)
- Async: No

### `export function openSpfSheet(): void`

**Descripción:** Abre modal con datos UV actuales desde `#spf-info-container.dataset.uv`.

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| — | — | Sin parámetros (lee DOM y `state.skinType`) |

**Metadatos:**
- Mutates state: No
- Async: No

### `export function initSpfModal(): void`

**Descripción:** Inicializa eventos del modal SPF.

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| — | — | Sin parámetros |

**Metadatos:**
- Mutates state: Sí (registra event listeners)
- Async: No

## Comportamiento

1. Lee UV de `#spf-info-container.dataset.uv`
2. Riesgo: <3 bajo, 3-5 moderado, 6-7 alto, 8-10 muy alto, 11+ extremo
3. Tiempo hasta quemadura: `SKIN_BASE_MINS[skinType-1] / uv`
4. SPF recomendado: UV≥8 → 50+, UV≥6 → 50, UV≥3 → 30+, UV>0 + skin≤2 → 15
5. `openSpfSheet` abre bottom sheet 'spf-modal' con `scrollElementId='spf-sheet-scroll-content'`
6. `initSpfModal`: attach click a `#spf-info-container` y `#spf-settings-btn`

## Casos borde

| Entrada | Comportamiento esperado |
|---------|------------------------|
| `#spf-info-container` sin dataset.uv | `openSpfSheet` lee `undefined`, cálculos NaN, no lanza error |
| `state.skinType` fuera de rango (< 1 o > 6) | `SKIN_BASE_MINS[skinType-1]` es `undefined`, no lanza error |
| Elementos DOM SPF no existen | `openSpfSheet`/`closeSpfSheet` no lanzan error |
| UV = 0 | Riesgo "Bajo", tiempo hasta quemadura = Infinity, SPF no recomendado |
| `#spf-settings-btn` no existe | `initSpfModal` no lanza error, registro parcial de eventos |

## Escenarios de test

1. **Se inicializa sin errores con elementos DOM presentes:** `initSpfModal` con elementos DOM, no lanza error
2. **No lanza si faltan elementos DOM en el documento:** Elementos SPF ausentes, no lanza error
3. **Exporta las funciones esperadas:** `initSpfModal`, `openSpfSheet`, `closeSpfSheet` son funciones
4. **UV = 0:** Riesgo "Bajo", tiempo hasta quemadura Infinity
5. **SkinType fuera de rango:** < 1 o > 6, no lanza error
6. **Sin dataset.uv:** `#spf-info-container` sin atributo uv, cálculos NaN seguros

## Historial de cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-05-28 | Añadido scrollElementId a openSpfSheet (spf-sheet-scroll-content) para fixed-handle pattern | SDD |
| 2026-05-21 | Spec inicial | SDD |
