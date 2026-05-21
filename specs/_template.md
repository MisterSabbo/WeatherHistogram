# Spec: `ruta/relativa/al/modulo.js`

## Propósito
Una línea describiendo qué hace este módulo y por qué existe.

## Dependencias

### state
| Propiedad | Acceso (R/W) | Contexto |
|-----------|-------------|----------|
| `state.xxx` | read / write | función donde se usa |

### CONFIG
| Constante | Contexto |
|-----------|----------|
| `CONFIG.XXX` | función donde se usa |

### DOM
| Elemento | Tipo de acceso | Contexto |
|----------|---------------|----------|
| `#element-id` | querySelector / evento | función donde se usa |

### Módulos internos
| Módulo | Export usado | Para qué |
|--------|-------------|----------|
| `./foo.js` | `barFunction` | ... |

## API Pública

### `export function nombreFuncion(param1: type, param2: type): returnType`

**Descripción:** Qué hace.

**Parámetros:**
| Nombre | Tipo | Descripción |
|--------|------|-------------|
| `param1` | `string` | Descripción |

**Retorno:** `{ r: number, g: number, b: number } | null`

**Mutates state:** No / Sí (propiedades: ...)

**Async:** No / Sí (awaits: ...)

### `export const CONSTANTE = valor`

**Descripción:** Para qué sirve.

---

## Comportamiento

1. **Regla 1:** Descripción (ej: "Si el input no tiene #, se añade automáticamente")
2. **Regla 2:** ...
3. **Regla 3:** ...

## Casos borde

| Entrada | Comportamiento esperado |
|---------|------------------------|
| `null` | Retorna `null` |
| `''` (string vacío) | Retorna `null` |
| Valor fuera de rango | ... |

## Escenarios de test

1. **Caso normal:** Input `X` → output `Y`
2. **Sin prefijo #:** Input `"ff0000"` → output `{ r: 255, g: 0, b: 0 }`
3. **Shorthand 3 dígitos:** Input `"#fff"` → output `{ r: 255, g: 255, b: 255 }`
4. **Input inválido:** Input `"xyz"` → output `null`
5. **Input null:** Input `null` → output `null`
6. **Input vacío:** Input `""` → output `null`

## Historial de cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| YYYY-MM-DD | Spec inicial | SDD |
