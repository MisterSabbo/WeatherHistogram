# Spec: `src/utils/color.js`

## Propósito
Convierte strings de color (hex, rgb, rgba) a objetos `{ r, g, b }` con valores decimales.

## Dependencias

### state
Ninguna.

### CONFIG
Ninguna.

### DOM
Ninguno.

### Módulos internos
Ninguno.

## API Pública

### `export function hexToRgb(hex: string): { r: number, g: number, b: number }`

**Descripción:** Convierte un string de color (hex con/sin #, shorthand 3 dígitos, rgb/rgba) a un objeto con componentes rojo, verde y azul en decimal (0-255). Para entradas inválidas retorna `{ r: 0, g: 0, b: 0 }`.

**Parámetros:**
| Nombre | Tipo | Descripción |
|--------|------|-------------|
| `hex` | `string` | String de color en formato hex (`#ff0000`, `ff0000`, `#f00`), rgb(`255,0,0`) o rgba(`255,0,0,0.5`) |

**Retorno:** `{ r: number, g: number, b: number }` — valores enteros entre 0-255.

**Mutates state:** No

**Async:** No

---

## Comportamiento

1. **Non-string input:** Si `hex` no es un string, retorna `{ r: 0, g: 0, b: 0 }`.
2. **Formato rgba/rgb:** Si el string empieza con `rgba` o `rgb`, extrae los 3 primeros números mediante regex y los asigna a r, g, b.
3. **Formato hex con #:** Elimina el `#` y parsea los pares hexadecimales.
4. **Formato hex sin #:** Parsea directamente los pares hexadecimales.
5. **Shorthand 3 dígitos:** Detecta patrón de 1 dígito por componente y expande cada dígito (ej: `#f00` → `r = 0xff` = 255).
6. **Formato 6 dígitos:** Parsea pares de 2 dígitos hexadecimales normalmente.
7. **Input inválido:** Si ningún formato coincide, retorna `{ r: 0, g: 0, b: 0 }`.

## Casos borde

| Entrada | Comportamiento esperado |
|---------|------------------------|
| `null` | Retorna `{ r: 0, g: 0, b: 0 }` |
| `123` (número) | Retorna `{ r: 0, g: 0, b: 0 }` |
| `''` (string vacío) | Retorna `{ r: 0, g: 0, b: 0 }` |
| `'xyz'` (inválido) | Retorna `{ r: 0, g: 0, b: 0 }` |
| `'#f00'` (shorthand) | Retorna `{ r: 255, g: 0, b: 0 }` |
| `'ff0000'` (sin #) | Retorna `{ r: 255, g: 0, b: 0 }` |
| `'rgba(100, 150, 200, 0.5)'` | Retorna `{ r: 100, g: 150, b: 200 }` |
| `'rgb(100, 150, 200)'` | Retorna `{ r: 100, g: 150, b: 200 }` |

## Escenarios de test

1. **Hex completo con #:** Input `'#ff0000'` → output `{ r: 255, g: 0, b: 0 }`
2. **Shorthand 3 dígitos:** Input `'#f00'` → output `{ r: 255, g: 0, b: 0 }`
3. **Sin prefijo #:** Input `'ff0000'` → output `{ r: 255, g: 0, b: 0 }`
4. **Color verde:** Input `'#00ff00'` → output `{ r: 0, g: 255, b: 0 }`
5. **Color azul:** Input `'#0000ff'` → output `{ r: 0, g: 0, b: 255 }`
6. **String rgba:** Input `'rgba(100, 150, 200, 0.5)'` → output `{ r: 100, g: 150, b: 200 }`
7. **String rgb:** Input `'rgb(100, 150, 200)'` → output `{ r: 100, g: 150, b: 200 }`
8. **Input inválido:** Input `'not-a-color'` → output `{ r: 0, g: 0, b: 0 }`
9. **Input no-string:** Input `123` (number) → output `{ r: 0, g: 0, b: 0 }`
10. **Input null:** Input `null` → output `{ r: 0, g: 0, b: 0 }`
11. **String vacío:** Input `''` → output `{ r: 0, g: 0, b: 0 }`

## Historial de cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-05-21 | Spec inicial (retro) | SDD |
| 2026-05-21 | Fix: `startsWith('rgba')` → `startsWith('rgb')` para soportar formato `rgb(...)` sin alpha | SDD |
