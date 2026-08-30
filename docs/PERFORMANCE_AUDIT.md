# Performance audit (Phase 6)

## Bundle strategy

`vite.config.js` uses `manualChunks` to split:

| Chunk | Contents |
|-------|----------|
| `charts` | recharts + d3 |
| `motion` | framer-motion |
| `maps-auth` | Google Maps / reCAPTCHA loaders |
| `router` | react-router |
| `vendor` | remaining node_modules |

## Known large routes

- `DashboardEnhanced` — chart-heavy; benefits from `charts` chunk and lazy route import in `App.jsx`.
- `LocationPicker` — map dependencies; isolated in `maps-auth` when loaded.

## Verification

```bash
npm run build
```

Inspect `dist/assets/` for chunk sizes. Target: no single app chunk above ~450 kB gzip without charts.

## Follow-ups

- Lazy-load irrigation sensor charts if bundle regresses.
- Consider route-level prefetch only for marketplace journey (buying → cart → checkout).
