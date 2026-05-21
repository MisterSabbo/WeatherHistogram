# Spec: `src/theme.js`

## Propósito
Gestión de temas de gráficas: carga de archivos JSON de tema, acceso a colores/iconos/fuente, y actualización del DOM.

## Dependencias

### state
| Propiedad | Acceso | Contexto |
|-----------|--------|----------|
| `state.themeConfig` | read/write | todas las funciones |
| `state.theme` | read | applyThemeDOM via getComputedStyle |

### Módulos internos
| Módulo | Export usado | Para qué |
|--------|-------------|----------|
| `./store.js` | `state` | acceso |

## API Pública

- `getThemeColor(path, fallbackColor)` — navega `state.themeConfig.colors` con path anidado
- `getThemeIcon(path, fallbackIcon)` — navega `state.themeConfig.icons`
- `getThemeFont(size?)` — retorna fuente del tema con size opcional
- `async loadChartTheme(themeId)` — carga tema JSON (primary: `./themes/{id}.json`, fallback: `./public/themes/{id}.json`)
- `applyThemeDOM()` — aplica font-family, theme-color meta, iconos de header

## Comportamiento

1. `getThemeColor`/`getThemeIcon`: path separado por puntos, fallback si no existe
2. `loadChartTheme`: intenta primary → fallback → fallback hardcodeado
3. `applyThemeDOM`: actualiza `body.style.fontFamily`, `meta[theme-color]`, iconos `.material-symbols-outlined` en header

## Casos borde

| Condición | Comportamiento esperado |
|-----------|------------------------|
| themeConfig null | getThemeColor retorna fallback |
| Path inexistente | Retorna fallback |
| Tema no encontrado primary o fallback | Usa fallback hardcodeado |
| Meta tag no existe | applyThemeDOM no lanza error |

## Escenarios de test

1. **getThemeColor con path:** retorna color del tema
2. **getThemeColor sin config:** retorna fallback
3. **getThemeColor path inválido:** retorna fallback
4. **getThemeIcon:** retorna icono o fallback
5. **getThemeFont:** retorna fuente con/sin size
6. **loadChartTheme con tema válido:** state.themeConfig actualizado

## Historial de cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-05-21 | Spec inicial | SDD |
