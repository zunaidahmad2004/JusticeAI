# Changelog

All notable changes to JusticeAI are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.2.0] - 2026-07-19

### Added
- Real Google Gemini 2.5 Flash integration — no more mock responses
- Service account authentication for Gemini API
- Copy button and regenerate button in AI Chat
- Proper error messages for failed AI responses

### Fixed
- White screen on first load (Helmet CSP was blocking Vite module scripts)
- Duplicate error toasts on login failure (401 was silently swallowed)
- Infinite redirect loop caused by `fetchMe()` on unauthenticated pages
- Duplicate `import path` in `server/src/index.ts`
- Route order bug — SPA fallback `app.get('*')` was before API routes

### Changed
- AI Chat switched from streaming to reliable non-streaming mode
- `GEMINI_API_KEY` validation now requires `AIzaSy` prefix format

---

## [1.1.0] - 2026-07-14

### Added
- Unified deployment — Express backend serves React frontend (same domain)
- esbuild-based server build (replaces `tsc` to fix Node 24 compatibility)
- Client dist pre-committed to avoid Vite/Node ESM conflicts on Render
- `server/build.mjs` copies `client/dist` into `server/dist/client`
- SPA fallback route — all non-API routes serve `index.html`

### Fixed
- All React Router paths return 200 (previously 404 on page refresh)
- `VITE_API_URL` removed — API calls now use relative `/api` path
- CORS configured to allow same-origin requests

---

## [1.0.0] - 2026-07-13

### Added
- Initial production release
- Complete case management (Cases, Evidence, Witnesses, Victims, Suspects)
- AI FIR Analyzer with Gemini Vision
- Legal provision recommendation (BNS/BNSS/BSA)
- Investigation checklist generator
- Chargesheet draft generator
- Missing evidence detector
- Risk analysis and scoring
- Criminal relationship graph
- Court calendar
- Reports generation
- Real-time notifications (Socket.io)
- Crime heatmap (Leaflet)
- Analytics dashboard (Recharts)
- Role-based access control (Officer, Supervisor, Admin)
- Two-factor authentication (TOTP)
- JWT authentication with refresh tokens
- MongoDB Atlas integration
- Deployed on Render
