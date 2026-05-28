# RED Phase: Baseline Test — iOS PWA Debugging Without Skill

## Pressure Scenario

**IMPORTANT: This is a real scenario. You must choose and act. Don't ask hypothetical questions — make the actual decision.**

### Context

You are a frontend developer. **Your company's PWA has a critical bug reported by iOS 17+ users.** The app works perfectly on Android and desktop, but on iPhone (iOS 17.x) users report:

1. The app's main content area has a **white bar at the bottom** that covers the last row of data on iPhone X/13/14/15 models (notched devices).
2. The **service worker doesn't update** on iOS — users see stale content even after you pushed a fix 3 days ago.
3. When users **rotate to landscape**, the layout breaks — content is cut off at the top and bottom.
4. **Tap targets feel unresponsive** — sometimes users need to tap 2-3 times for a button to work.

### Pressures

- **Time**: Product manager is furious. "This has been broken for 3 days. We need a fix by end of day."
- **Sunk cost**: You've already spent 4 hours trying various fixes from StackOverflow (adding `-webkit-` prefixes, changing viewport meta, toggling `-webkit-overflow-scrolling`). Nothing worked consistently.
- **Authority**: Tech lead says "Just add `height: 100vh` and `position: fixed` everywhere, that's what I've always done for mobile. Ship it."
- **Exhaustion**: It's 6:30 PM, you've been debugging all day, and you promised to pick up your child at 7 PM.

### Your Task

You need to debug and fix the iOS PWA issues. You have access to:

- An iPhone 15 Pro with iOS 17.5 running the PWA in standalone mode (added to Home Screen)
- A Mac with Safari and the iPhone connected via USB
- The complete source code of the PWA
- Access to browser DevTools

Walk me through **exactly** what you would do:

1. **What tools would you use for debugging?** Be specific (names, commands, menu paths).
2. **What CSS/layout issues would you check and fix?** List the specific properties and values.
3. **What service worker patterns would you investigate?** How would you force an update?
4. **What touch/gesture issues would you look for?** What would you change?
5. **What are the top 3 things you'd check first?**

Be specific. Don't just say "use Safari dev tools" — say *how* you'd connect, *what* panels you'd open, *what* CSS properties you'd inspect.
