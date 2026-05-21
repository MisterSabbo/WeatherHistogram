# Spec: `src/ui/ChangelogModal.js`

## Propósito
Modal de changelog con timeline visual, detalle expandible, y animaciones de entrada.

## Dependencias

### Módulos internos
| Módulo | Export usado | Para qué |
|--------|-------------|----------|
| `../data/changelog.js` | `changelogData` | datos |
| `../utils/i18n.js` | `t` | traducción |
| `./BottomSheet.js` | `openBottomSheet` | modal |

## API Pública

### `export function showChangelogModal(version?: string, onUpdate?: Function): void`

**Descripción:** Abre changelog con o sin versión específica.

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `version?` | `string` | Versión específica a mostrar (si se omite, muestra todos) |
| `onUpdate?` | `Function` | Callback al hacer clic en "actualizar" |

**Metadatos:**
- Mutates state: No
- Async: No

### `export function initChangelog(onBeforeOpen?: Function): void`

**Descripción:** Inicializa link de apertura del changelog.

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `onBeforeOpen?` | `Function` | Callback antes de abrir el modal |

**Metadatos:**
- Mutates state: Sí (registra event listener)
- Async: No

## Comportamiento

1. Timeline vertical con markers circulares (major = azul, patch = gris)
2. Animación fadeInUp escalonada por índice
3. Click en item → `openChangelogDetail` → bottom sheet con lista completa de cambios
4. Si hay versión específica, muestra update button
5. `initChangelog` attach click al link `#open-changelog-link` con guard against doble click

## Casos borde

| Entrada | Comportamiento esperado |
|---------|------------------------|
| `version` vacío / `undefined` | Muestra timeline completo sin versión destacada |
| `onBeforeOpen` no es función | No lanza error, ignora callback |
| Elemento `#open-changelog-link` no existe | `initChangelog` no lanza error, no registra listener |
| `changelogData` vacío | Muestra timeline sin items |
| Doble clic en link | Guard contra doble registro de eventos |

## Escenarios de test

1. **Se inicializa sin errores con elementos DOM presentes:** `initChangelog` con link presente, no lanza error
2. **No lanza si faltan elementos DOM en el documento:** Link `#open-changelog-link` ausente, no lanza error
3. **Exporta las funciones esperadas:** `showChangelogModal`, `initChangelog` son funciones
4. **Modal con versión específica:** `showChangelogModal('1.0.0')` abre con versión destacada
5. **Modal sin versión:** `showChangelogModal()` muestra timeline completo
6. **Doble clic en link:** Guard contra doble registro de eventos

## Historial de cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-05-21 | Spec inicial | SDD |
