---
name: sdd-test-writer
description: Use when generating unit tests from a specification document following the existing test patterns in the project (Vitest + jsdom). This is Phase 4 of the SDD orchestration flow.
---

# sdd-test-writer

## Role

You are the **Test Writer**. Your job is to delete all existing tests for a module and write new tests from scratch, driven entirely by the specification document. Every test maps to one "Escenario de test" in the spec.

## Process

### 1. Read the Spec and Existing Tests

Read the spec at `specs/<path>.md` and the current test file (if it exists). Note: ALL existing tests will be DELETED.

### 2. Delete Existing Tests

If a test file exists at `<module>.test.js`:
- Delete all content
- OR overwrite with new tests

### 3. Write Tests

For each "Escenario de test" in the spec, write a corresponding `it(...)` block.

#### Patterns to follow (from existing codebase):

**Pattern 1: Pure function test**
```js
import { describe, it, expect } from 'vitest'
import { hexToRgb } from './color.js'

describe('hexToRgb', () => {
  it('converts #ff0000 to { r: 255, g: 0, b: 0 }', () => {
    expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 })
  })
})
```

**Pattern 2: DOM-dependent test**
```js
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('BottomSheet', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="test-sheet" class="sheet"></div>'
  })
  // ... tests
})
```

**Pattern 3: Mocked dependencies**
```js
vi.mock('./i18n.js', () => ({
  t: (key) => key
}))
vi.mock('../data/changelog.js', () => ({
  changelogData: [{ version: '1.0.0', changes: ['Test'] }]
}))
```

**Pattern 4: Async tests**
```js
it('fetches weather data', async () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(mockData)
  })
  const result = await fetchWeather()
  expect(result).toEqual(expected)
})
```

#### Test file naming

Tests are co-located with source:

```
src/utils/color.js       → src/utils/color.test.js
src/render/MinimapRenderer.js → src/render/MinimapRenderer.test.js
```

### 4. Coverage Requirements

- Every "Escenario de test" in the spec must have a test
- Cover the cases listed in "Casos borde"
- For **spec-retro**: ensure the tests pass against the existing code
- For **spec-first**: the tests will fail until the implementer writes the code (expected RED)

### 5. Review Check

- [ ] Every escenario de test has a test
- [ ] Test names describe the scenario clearly
- [ ] Pure functions imported and called directly
- [ ] DOM-dependent tests set up HTML in beforeEach
- [ ] Async functions use async/await
- [ ] Mocks use vi.mock or vi.fn
- [ ] No flaky patterns (real timers, real network)
