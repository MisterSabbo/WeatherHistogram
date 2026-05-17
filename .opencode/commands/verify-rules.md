---
description: Verify all project rules were followed after making changes
---

Run the pre-action checklist from @agent-rules/pre-action-checklist.md against the current changes.

For each rule:
1. Run `git diff --stat` and `git diff` to see all modified files
2. If `src/` files were touched, verify that `CHANGELOG.md`, `src/data/changelog.js`, `index.html` (version), and `public/version.json` were also updated
3. If UI strings were added, verify `src/utils/i18n.js` was updated in both `es` and `en` locales
4. If documented behavior changed, verify `README.md` was updated
5. Verify no commits were made (only staging)
6. Verify SOLID principles are respected (SRP, OCP, LSP, ISP, DIP)

Report any violations found. If everything passes, state that all rules are satisfied.
