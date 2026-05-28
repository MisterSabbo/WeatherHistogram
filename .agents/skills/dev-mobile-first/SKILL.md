---
name: dev-mobile-first
description: Use when auditing, analyzing, or generating code for a web project that needs to follow mobile-first responsive design principles — before writing CSS, when reviewing layout breakpoints, when touch interactions feel unresponsive, when fonts are too small on mobile, when performance on low-end devices is poor, or when a project lacks responsive meta tags and media queries
---

# dev-mobile-first

## Overview

**Mobile-first** means designing and writing CSS for the smallest screen first, then progressively enhancing with `min-width` media queries. This skill ensures every web project starts from a solid mobile baseline — covering responsive design, touch interactions, font sizing, viewport configuration, and performance for low-end devices.

When invoked, the agent will:
1. **Scan** the project (current directory or given path) for common mobile-first violations.
2. **Report** issues with file locations, severity, and explanations.
3. **Generate** corrected/fixed code or scaffold a mobile-first foundation if one is missing.

## When to Use

| Síntoma / Situación | Activar la skill |
|---|---|
| El proyecto usa `max-width` en lugar de `min-width` en media queries | Sí — mobile-first requiere `min-width` |
| No hay meta tag `viewport` en el HTML | Sí — es la base del responsive |
| Los botones/enlaces son menores de 44px | Sí — viola las guías de accesibilidad táctil |
| Las fuentes están en píxels fijos sin escalado relativo | Sí — deben ser `rem` / `em` |
| Las imágenes no tienen `srcset` ni `sizes` | Sí — afecta rendimiento en móviles |
| El proyecto no tiene ningún CSS media query | Sí — probablemente no es responsive |
| Se está iniciando un proyecto nuevo desde cero | Sí — genera scaffolding mobile-first |
| Se audita un proyecto existente para mobile-first | Sí — este es el caso principal |

**No usar cuando:**
- El proyecto es solo backend / API (sin HTML/CSS/JS frontend).
- Ya se ha verificado manualmente con herramientas como Lighthouse y no hay issues.

## Core Pattern: Mobile-First CSS Progression

### ❌ Anti-patrón: Desktop-first con `max-width`

```css
/* ❌ Desktop-first: empieza por lo grande y va "hacia abajo" */
.header { font-size: 24px; padding: 20px; }

@media (max-width: 768px) {
  .header { font-size: 18px; padding: 10px; }
}

@media (max-width: 480px) {
  .header { font-size: 16px; padding: 8px; }
}
```

**Problemas:** Estilos base pensados para desktop; móvil recibe parches; más código override; fácil olvidar casos extremos.

### ✅ Patrón correcto: Mobile-first con `min-width`

```css
/* ✅ Mobile-first: empieza por lo pequeño y mejora progresivamente */
.header { font-size: 16px; padding: 8px; }

@media (min-width: 481px) {
  .header { font-size: 18px; padding: 10px; }
}

@media (min-width: 769px) {
  .header { font-size: 24px; padding: 20px; }
}
```

**Ventajas:** Estilos base son para móvil (el caso más restrictivo); menos código; más fácil de mantener; rinde mejor en dispositivos lentos.

## Quick Reference — Checklist Mobile-First

| # | Aspecto | Qué comprobar | Cómo arreglarlo |
|---|---------|---------------|-----------------|
| 1 | **Viewport** | `<meta name="viewport" content="width=device-width, initial-scale=1">` | Añadirlo en `<head>` |
| 2 | **Media Queries** | ¿Solo `max-width`? | Cambiar a `min-width` + diseño base mobile |
| 3 | **Breakpoints** | ¿Usa valores extraños? | Usar puntos comunes: 480px, 768px, 1024px, 1280px |
| 4 | **Touch targets** | Botones < 44×44px | `min-height: 44px; min-width: 44px` o `padding` suficiente |
| 5 | **Font sizes** | ¿píxels fijos? | Usar `rem` (1rem = 16px base); mínimo 16px en body |
| 6 | **Box-sizing** | ¿Falta `box-sizing: border-box`? | `*, *::before, *::after { box-sizing: border-box; }` |
| 7 | **Images responsive** | ¿Sin `srcset`/`sizes`? | `<img src="f.jpg" srcset="f-400.jpg 400w, f-800.jpg 800w" sizes="100vw">` |
| 8 | **CSS Containment** | ¿Layout pesado sin contener? | `contain: layout style paint` en widgets aislados |
| 9 | **Touch events** | ¿Solo `click` en botones móviles? | Usar también `touchstart` o delegar a pointer events |
| 10 | **Content overflow** | ¿Scroll horizontal inesperado? | `overflow-x: hidden` en body + revisar anchos fijos |
| 11 | **Performance** | ¿CSS/JS bloqueante? | `media` en hojas de estilo; `defer`/`async` en scripts |
| 12 | **Spacing** | ¿Margins/paddings en px fijos? | Usar `clamp()` o unidades relativas (`vw`, `rem`) |

## Implementation

### 1. Escaneo automático del proyecto

Cuando no se especifica ruta, la skill asume el directorio actual de trabajo. Si el usuario provee una ruta, se usa esa.

```bash
# Sin ruta — analiza el directorio actual
# Con ruta:
#   agent: "audita mi-proyecto para mobile-first"
```

### 2. Archivos a inspeccionar

La skill debe buscar en estos archivos por orden de prioridad:

| Tipo | Patrones de archivo |
|------|---------------------|
| HTML | `index.html`, `*.html`, `*.php`, `*.njk`, `*.hbs` |
| CSS | `*.css`, `*.scss`, `*.less`, `*.styl` |
| JS (eventos táctiles) | `*.js`, `*.ts`, `*.jsx`, `*.tsx`, `*.vue`, `*.svelte` |
| Config | `vite.config.*`, `webpack.config.*`, `package.json` (browserslist) |

### 3. Análisis automático (report)

Ejecutar estas comprobaciones y devolver un informe estructurado:

```markdown
## 📱 Mobile-First Audit Report

### 🔴 CRITICAL (must fix)
- [ ] Meta viewport tag: NO ENCONTRADO → src/index.html
- [ ] box-sizing: NO ENCONTRADO → ningún CSS lo declara
- [ ] Touch targets < 44px en: src/components/Button.css:12

### 🟡 WARNINGS (should fix)
- [ ] Media queries con max-width en lugar de min-width: 8 ocurrencias
- [ ] Fuentes en px sin rem: 12 ocurrencias
- [ ] Sin srcset en imágenes: 3 etiquetas <img>

### 🟢 INFO (recommendations)
- [ ] Considerar CSS containment para mejorar rendimiento paint/layout
- [ ] Añadir preconnect a Google Fonts si se usan
- [ ] Usar <link media="..."> para hojas CSS no críticas
```

### 4. Generación de código corregido

La skill debe **producir el código corregido** para cada issue, mostrando el diff o el archivo completo. Usar `edit` para aplicar cambios.

#### Scaffolding mobile-first rápido

Si el proyecto no tiene CSS o está empezando desde cero, generar esta base:

```css
/* ========================================
   Mobile-First Base Styles
   ======================================== */

/* 1. Box-sizing global */
*, *::before, *::after {
  box-sizing: border-box;
}

/* 2. Reset básico */
body, h1, h2, h3, p, ul, ol, figure {
  margin: 0;
  padding: 0;
}

/* 3. Viewport y tipografía base */
html {
  -webkit-text-size-adjust: 100%;
  font-size: 100%; /* 16px base */
}

body {
  font-size: 1rem;      /* 16px mínimo */
  line-height: 1.5;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}

/* 4. Imágenes responsive */
img, picture, video, canvas, svg {
  display: block;
  max-width: 100%;
  height: auto;
}

/* 5. Touch targets accesibles */
button, a, input, select, textarea {
  min-height: 44px;
  min-width: 44px;       /* o padding suficiente */
}

button, a {
  touch-action: manipulation;
}

/* 6. Mobile-First Media Queries Template */

/* Mobile base (0 - 480px) — ESTILOS BASE AQUÍ (ya son mobile) */

/* Tablet (>= 481px) */
@media (min-width: 481px) {
  /* layout de tablet */
}

/* Tablet landscape / small desktop (>= 769px) */
@media (min-width: 769px) {
  /* layout de escritorio */
}

/* Desktop (>= 1025px) */
@media (min-width: 1025px) {
  /* layout ancho */
}

/* Large desktop (>= 1281px) */
@media (min-width: 1281px) {
  /* layout extra ancho */
}

/* 7. Optimización rendimiento: evitar layout shifts */
/* Usar aspect-ratio en lugar de padding-top hacks */
.img-container {
  aspect-ratio: 16 / 9;
  width: 100%;
}
```

### 5. Conversión automática de Desktop-First a Mobile-First

Cuando se detectan `max-width`, la skill debe:

1. Identificar todos los bloques `@media (max-width: ...)`.
2. Extraer las propiedades de los bloques más grandes y moverlas al estilo base.
3. Convertir `max-width` a `min-width` con los breakpoints invertidos.
4. Aplicar los cambios mediante `edit`.

Ejemplo de transformación:

**Antes (Desktop-first):**
```css
.widget { font-size: 20px; display: flex; gap: 16px; }
@media (max-width: 768px) { .widget { font-size: 16px; flex-direction: column; } }
```

**Después (Mobile-first):**
```css
.widget { font-size: 16px; flex-direction: column; }
@media (min-width: 769px) { .widget { font-size: 20px; flex-direction: row; gap: 16px; } }
```

## Common Mistakes

| Error | Explicación | Solución |
|-------|-------------|----------|
| Usar `min-device-width` | No funciona en todos los navegadores modernos | Usar `min-width` |
| Poner estilos base muy grandes y luego `max-width` para reducirlos | Rompe el principio mobile-first y duplica código | Refactorizar a base pequeña + `min-width` |
| Olvidar `-webkit-text-size-adjust: 100%` | iOS hace zoom en landscape si falta | Añadirlo en `html {}` |
| No poner `touch-action: manipulation` en botones | iOS retrasa 300ms el click | Añadirlo a botones y enlaces |
| Usar `vw` en tipografía sin `clamp()` | Texto muy pequeño o muy grande en extremos | Usar `clamp(16px, 4vw, 24px)` |
| No agrupar media queries iguales | Código duplicado difícil de mantener | Unificar por breakpoint |
| Confundir "responsive" con "mobile-first" | Un sitio responsive no necesariamente empieza por móvil | Mobile-first es una estrategia de diseño, no solo técnica |

## Auditing Existing Projects — Procedure

1. **Determinar ruta**: usar directorio actual o la ruta que el usuario pase como argumento.
2. **Listar archivos**: buscar `*.html`, `*.css`, `*.scss`, `*.js`, `*.ts`, `*.jsx`, `*.tsx`.
3. **Ejecutar auditoría automática**:
   - Buscar `<meta name="viewport">` en HTML.
   - Buscar `@media (max-width` en todos los CSS.
   - Buscar `font-size` en px que no tengan alternativa `rem`.
   - Buscar `width` fijo en px en elementos de layout.
   - Buscar `min-height`/`min-width` en botones (< 44px o ausente).
   - Buscar imágenes sin `srcset`.
   - Buscar `touch-action` en elementos interactivos.
   - Buscar `box-sizing: border-box` global.
4. **Mostrar informe** con severidades (🔴 CRITICAL, 🟡 WARNING, 🟢 INFO).
5. **Ofrecer correcciones**: para cada issue, preguntar si aplicar cambio o generar el código propuesto.
6. **Aplicar cambios** con `edit` (si el usuario confirma) o mostrar el diff.

## Generating Code — Procedure

1. Preguntar tipo de proyecto (vanilla HTML/CSS, React, Vue, Svelte, etc.) si no es obvio.
2. Generar archivos base:
   - `styles/base.css` o similar con el scaffolding mobile-first.
   - Añadir viewport al HTML si no existe.
3. Si el usuario pide un componente concreto (`navbar`, `card`, `form`, etc.), generarlo con:
   - Estilos base mobile.
   - Media queries `min-width` para breakpoints más grandes.
   - Touch targets ≥ 44px.
   - Unidades `rem`/`em` / `clamp()`.

## Real-World Impact

- **Antes**: Proyecto con media queries `max-width`, botones de 32px, sin viewport, imágenes sin srcset. Lighthouse móvil puntuación 45.
- **Después**: Refactorizado a mobile-first con `min-width`, botones a 44px, viewport añadido, imágenes con srcset. Lighthouse móvil puntuación 92.
- **Tiempo de ahorro**: ~2 horas de auditoría manual → 10 minutos con la skill.
