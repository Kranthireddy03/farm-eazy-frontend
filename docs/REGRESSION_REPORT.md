# Farm Eazy — Full Regression Report

**Date:** 2026-08-01  
**Environment:** Local dev (frontend `:3000`, backend `:8080`, H2 file DB `./data/farmeazy_db`)  
**Credentials:** `support@farm-eazy.com` / `DevAdmin123!`

## Executive summary

| Layer | Result |
|-------|--------|
| Backend unit tests (`mvn test`) | **23/23 pass** |
| API regression script (`node scripts/regression-api.mjs`) | **16/16 pass** |
| Frontend build (`npm run build`) | **Pass** |
| Browser regression (UI + console) | **Pass** on all exercised routes; fixes applied for `/settings`, `/selling`, `/activities` |

Issues found during regression were fixed and **re-tested until green**.

---

## API regression (encrypted + gateway headers)

Script: `scripts/regression-api.mjs` (mirrors frontend `apiClient` encryption/nonce flow)

| Endpoint | HTTP | DB / response notes |
|----------|------|---------------------|
| `GET /api/public/blog-posts` | 200 | `[]` (empty publish list) |
| `GET /api/faq-questions?source=user` | 200 | FAQ list returned |
| `GET /actuator/health/readiness` | 200 | Spring Boot healthy |
| `GET /api/system/full-status` | 200 | Encrypted response decrypted |
| `POST /api/auth/login` | 200 | JWT issued |
| `GET /api/users/me` | 200 | `effectiveLocation.present=true` after bootstrap |
| `GET /api/addresses` | 200 | Multiple addresses (regression creates test rows) |
| `GET /api/coins` | 200 | After effective location set |
| `GET /api/farms` | 200 | Empty list OK |
| `GET /api/products` | 200 | Marketplace list OK |
| `GET /api/orders` | 200 | Empty orders OK |
| `GET /api/notifications/count` | 200 | Badge count OK |
| `GET /api/activities?page=0&size=20` | 200 | 12 rows returned |
| `GET /api/vendors/listing-eligibility?listingType=PRODUCT` | 200 | Eligibility payload OK |
| `POST /api/addresses` + `PATCH /addresses/current` | 201/200 | `users.current_address_id` updated via service layer |

**Spring Boot logs:** No `ERROR` lines during API suite; `RequestResponseLoggingFilter` shows 200s for exercised endpoints. `ApiRequestDecryptionFilter` successfully decrypts login payloads when `{ payload }` envelope is sent.

**Database:** H2 file locked while backend runs; state verified via API (`/users/me`, `/addresses`). Regression creates labeled addresses (`Regression`, `Regression2`, map selections).

---

## Browser regression (UI + console)

### Public routes
| Route | UI | Console |
|-------|-----|---------|
| `/login` | Pass | ReCaptcha warnings if `VITE_RECAPTCHA_SITE_KEY` unset (non-blocking) |
| `/logout` | Pass | Redirects to login |
| `/landing`, `/register` | Pass | Minor third-party warnings |
| `/blog`, `/support` | Pass | Clean |
| `/about`, `/contact` | Pass | Clean |
| `/privacy-policy`, `/terms` | Pass | Clean |

### Auth + location
| Flow | UI | Console |
|------|-----|---------|
| Login | Pass | Password login works |
| Location wizard | Pass | Leaflet map, pin drag, confirm |
| Session bootstrap gate | Pass | Clears after location saved |

### Protected routes (sample — all tested routes load)
| Route | UI | Notes |
|-------|-----|-------|
| `/`, `/dashboard` | Pass | Operations hub |
| `/buying`, `/cart`, `/wishlist` | Pass | Cart shows service location when set |
| `/farms`, `/crops`, `/orders` | Pass | Empty states OK |
| `/address-book` | Pass | Lists saved addresses |
| `/settings` | Pass | **Fixed** — missing `isDark` from `useTheme()` |
| `/notifications` | Pass | Empty state OK |
| `/activities` | Pass | **Fixed** — use `apiClient` + decrypt |
| `/selling` | Pass | **Fixed** — safe product list handling |
| `/services`, `/change-password`, `/checkout` | Pass | Location wizard dismisses when location set |
| `/blog/submit`, `/blog/my-submissions` | Not individually re-run | Same auth/location stack |
| `/irrigation`, `/irrigation-services`, `/irrigation-sensors` | Not individually re-run | API farms/irrigation stack healthy |
| `/service-requests`, `/bank-verification`, `/vendor-onboarding`, `/vendor-dashboard` | Partial | Selling shows verification gate (expected for superadmin) |

---

## Bugs fixed during regression

| Issue | Root cause | Fix |
|-------|------------|-----|
| `/settings` crash | `isDark` used but not imported from `useTheme()` | `UserPreferences.jsx` |
| `/activities` error toast | Raw `api` axios instance — no decrypt/gateway | `Activities.jsx` → `apiClient` + `unwrapApiList` |
| `/selling` crash risk | `myProducts` not guaranteed array | `ProductService.getMyProducts` + `Selling.jsx` |
| Location wizard stuck after save | Wizard state not cleared when `hasEffectiveLocation` becomes true | `LocationContext.jsx` |
| Coords-only location not persisting | Backend requires current address | `locationPersistenceService.js` (prior commit) |
| Map missing in wizard | No Leaflet component | `LocationWizardMap.jsx` (prior commit) |

---

## Remaining limitations (not failures)

1. **Empty local data** — blog posts, marketplace listings, farms may show empty UIs.
2. **Vendor selling** — superadmin sees verification gate until vendor onboarding completes (by design).
3. **ReCaptcha** — without `VITE_RECAPTCHA_SITE_KEY`, Google hook warnings in console; login still works.
4. **React Router v7 future flags** — informational warnings only.
5. **Regression address rows** — API script creates test addresses in H2 (ids increment); clean DB manually if needed.
6. **Admin portal (`:5173`)** — out of scope for this frontend regression pass.
7. **Checkout E2E** — not tested end-to-end (no cart items / payment sandbox).

---

## Files modified (this regression cycle)

| File | Change |
|------|--------|
| `src/pages/UserPreferences.jsx` | Fix `isDark` theme hook |
| `src/pages/Activities.jsx` | `apiClient` + list unwrap |
| `src/pages/Selling.jsx` | Guard `myProducts` array |
| `src/services/ProductService.js` | `unwrapApiList` for my-products |
| `src/context/LocationContext.jsx` | Auto-close wizard when location ready |
| `scripts/regression-api.mjs` | Full API regression harness |
| `docs/REGRESSION_REPORT.md` | This report |

**Prior session (same branch):** `LocationWizard.jsx`, `LocationWizardMap.jsx`, `locationPersistenceService.js`, `AuthContext.jsx`, `App.jsx` (`/logout`, `/profile`), `docs/FLOW_TEST_REPORT.md`.

---

## How to re-run

```bash
# Backend tests
cd farm-eazy-backend-prod-aws && mvn test

# API regression (backend + frontend .env.local aligned)
cd farm-eazy-frontend && node scripts/regression-api.mjs

# Frontend build
npm run build

# Manual browser: login → complete location wizard → visit /cart, /settings, /activities, /selling
```

---

## Sign-off

All automated checks pass. Critical UI regressions identified during browser testing were fixed and verified. No open **blocking** failures remain in the tested scope.
