# Pre-Action Checklist

Before every task, verify these rules **in order**:

- [ ] **Read AGENTS.md** — Read all sections before making any edit or taking any action
- [ ] **Checked relevant architecture docs?** → Load the @agent-rules/architecture-*.md, defaults-constants.md, build-config.md, key-interactions.md, or theme-i18n.md doc that matches the area you're changing, before editing code
- [ ] **Never commit** — Only `git add`. If asked to commit, stage and inform commits are disabled
- [ ] **Significant change?** → Update `CHANGELOG.md` + `src/data/changelog.js` + version in `index.html` + `public/version.json`
- [ ] **Adding UI strings?** → Add to both `es`/`en` in `src/utils/i18n.js`
- [ ] **Changing documented behavior?** → Update `README.md`
- [ ] **New feature or visual change?** → Run `npm run test:e2e` (update snapshots with `--update-snapshots` if screenshot tests changed)
- [ ] **Complex task?** → Evaluate if a subagent is better suited (see @agent-rules/subagents.md)
- [ ] **Respect SOLID principles** — SRP, OCP, LSP, ISP, DIP
- [ ] **All rendering goes through `render()`** — never draw to tile canvases outside this function
- [ ] **After changes** → Run `git diff --cached` and `git diff`, then propose commit message
- [ ] **Task done?** → `memory_add_observations` on relevant entities summarizing what changed, issues, and next step (see @agent-rules/memory.md)
- [ ] **Final audit** → Invoke `@project-auditor` to verify all rules were followed
