### Install & Run

- **Install & run:** `npm install` then `npm run dev` (Vite on port 3000). Production: `npm run build`.
- **`npm run clean`** runs `rm -rf dist` — **fails on Windows**. Use `Remove-Item -Recurse -Force dist` instead.
- **Entry point:** `src/app.js` — all initialization, event wiring, rendering loop, and state. Only touch this file for wiring changes.
- **State store:** `src/store.js` exports a single mutable `state` object and a `CONFIG` constant. No events, no pub/sub — every module reads/writes `state` directly.
