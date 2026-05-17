---
description: Bump version across all project files (changelog, version.json, index.html)
---

Read the current version from @public/version.json and @index.html (#app-version-label).

Ask me what kind of bump this is:
- **patch** — bug fixes (X.Y.Z+1, suffix resets)
- **feature** — new features (X.Y+1.0, suffix resets)
- **breaking** — breaking changes (X+1.0.0, suffix resets)
- **trivial** — letter suffix increment (e.g. v1.2.3a -> v1.2.3b)

Then update ALL of these files:
1. `index.html` — `#app-version-label`
2. `public/version.json` — `"version"`
3. `CHANGELOG.md` — new entry at the top following existing format
4. `src/data/changelog.js` — new entry at the beginning of the array

Follow the existing semver convention: X.Y.Z for breaking/feature/patch; letter suffix for trivial. Suffix resets when X/Y/Z changes.
