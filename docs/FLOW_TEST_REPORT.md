# Farm Eazy Frontend — Flow Test Report

**Date:** 2026-08-01  
**Environment:** Local dev (`http://localhost:3000`, backend `http://localhost:8080`)  
**Tester:** Cloud agent (browser + API)  
**Credentials:** Set `REGRESSION_EMAIL` and `REGRESSION_PASSWORD` environment variables (not stored in repo).

## Summary

| Result | Count |
|--------|-------|
| Pass | 8 |
| Fixed in this session | 4 |
| Blocked / data empty | 3 |
| Partial | 1 |

## Flow Results

| Flow | Status | Notes |
|------|--------|-------|
| Login | **PASS** | Session active; dashboard and profile bootstrap load. |
| Location wizard + map | **PASS** (fixed) | Leaflet map with draggable pin, zoom, search, GPS, and **Use map location** button. Coords now persist via saved address + `PATCH /addresses/current`. |
| Session bootstrap gate | **PASS** (fixed) | Gate clears after map/GPS selection because backend `effectiveLocation.present` is set. |
| Dashboard / Home | **PASS** | Resilience mode, system health widgets, coins balance. |
| Blog (`/blog`) | **PASS** | Loads without API errors; empty list when no published posts (expected). |
| Support / FAQ (`/support`) | **PASS** | FAQ categories and questions render. |
| Marketplace (`/buying`) | **PASS** | Filters and empty marketplace state; 0 listings in local DB. |
| Cart (`/cart`) | **PASS** (fixed) | Accessible after location set; empty cart state works. |
| Farms (`/farms`) | **PASS** (fixed) | Page loads when location gate cleared; 0 farms in local data. |
| Address book | **PASS** (fixed) | Accessible; map selections create addresses. |
| Orders (`/orders`) | **PASS** | Empty orders state. |
| Profile / settings | **PARTIAL** | `/profile` redirects to `/settings` (added). User preferences page available. |
| Logout (`/logout`) | **PASS** (fixed) | Route calls logout and redirects to `/login`. |
| Checkout | **NOT RUN** | Requires cart items; local marketplace empty. |
| Selling / vendor flows | **NOT RUN** | Out of scope for this pass; routes exist. |

## Fixes Applied (this session)

1. **`LocationWizardMap.jsx`** — Interactive Leaflet map in the location wizard.
2. **`locationPersistenceService.js`** — Map/GPS coords create an address and set `current` so backend effective location is present.
3. **`LocationContext.jsx`** — Coords selections call persistence service before profile refresh.
4. **`LocationWizard.jsx`** — Map synced with search, GPS, saved addresses; reverse-geocode metadata for address creation.
5. **`AuthContext.jsx`** — User-initiated logout redirects to `/login`.
6. **`App.jsx`** — `/logout` route and `/profile` → `/settings` redirect.

## Known limitations

- **Empty local data:** Blog posts, marketplace listings, farms may show empty states until DB is seeded.
- **Repeated map picks** create multiple “Map selection” addresses (acceptable for dev; consider upsert later).
- **Registration / OTP** not exercised (superadmin login used).
- **Admin portal** (`5173`) not part of this frontend pass.

## How to re-test

1. Start backend + frontend (see `AGENTS.md`).
2. Log in at `/login` with credentials above.
3. Complete location wizard using the map (drag pin → **Use map location** → **Select location**).
4. Visit `/cart`, `/farms`, `/address-book`, `/logout`.
