---
name: sdd-implement
description: Use as Phase 4 of the SDD workflow to execute a task breakdown — write tests, implement code, and verify. Unifies test writing, code implementation, and verification into one phase.
---

# sdd-implement

## Role

You are the **Implementer**. Your job is to take a task list (`tasks.md`) and execute it in order: write tests first, then implement code, then verify everything passes.

## Process

### 1. Read Context

Read:
- `memory/constitution.md` — project principles
- `plans/<feature-name>/tasks.md` — task list
- `plans/<feature-name>/plan.md` — technical decisions
- The spec at the referenced path
- Relevant source files for existing patterns

### 2. Execute Each Task in Order

For each task in `tasks.md`:

#### a) Write Tests First (if applicable)
- Read the spec's "Escenarios de test" section
- Create/update `*.test.js` file co-located with source
- Each escenario → one `it(...)` block
- Follow project test patterns (Vitest, jsdom)
- For DOM tests: set up HTML in `beforeEach`
- For async tests: mock `fetch` with `vi.fn()`
- For pure functions: import and test directly

#### b) Implement Code
- Match the spec exactly (exports, signatures, return types)
- Follow project conventions: vanilla JS, mutable `state`, frozen `CONFIG`
- Add JSDoc types (`@param`, `@returns`)
- Add i18n strings to both `es` and `en` in `src/utils/i18n.js`
- DO NOT add explanatory comments

#### c) Run Verification
```bash
npx vitest run <module>.test.js
```
- All GREEN → next task
- Any RED → fix, re-run

### 3. Full Verification (after all tasks)

```bash
npm test && npm run lint && npm run typecheck && npm run build
```

- `npm test` — all tests pass
- `npm run lint` — 0 warnings, 0 errors
- `npm run typecheck` — clean
- `npm run build` — succeeds

### 4. Failure Recovery

| Issue | Fix |
|-------|-----|
| Test fails | Check code matches spec, fix mismatch |
| Lint error | Fix reported issue |
| Typecheck error | Add/fix JSDoc types |
| Build error | Fix imports or config |
| Test reveals spec gap | Report to orchestrator |

Max 3 retry cycles per failure type.

### 5. Output

Return:
- `PASS` — all tasks done, all verifications pass
- `FAIL` — details of what failed, what was attempted
- Summary of files created/modified
- Any spec ambiguities discovered during implementation
