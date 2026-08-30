# Release checklist — FarmEazy frontend

Production release engineering audit. **No redesign** — only ship-blocking fixes.

## Platform shell

| Item | Status | Notes |
|------|--------|-------|
| Authenticated routes use `AppShell` (header + sidebar + footer) | ✅ | Via `Layout` import in `App.jsx` |
| Public routes use `ProductPublicLayout` or `PublicLayout` (header + footer) | ✅ | Policy/blog/about/contact |
| Global theme toggle bottom-right | ✅ | `GlobalFloatingThemeToggle` in `App.jsx` |
| Main content min-height (no collapsed blank footers) | ✅ | `min-h-[calc(100vh-12rem)]` on shell main |
| Irrigation legacy path redirects | ✅ | `/irrigation/schedules` → `/irrigation`, etc. |

## Commerce journey

| Route | Shell | Primary API |
|-------|-------|-------------|
| `/buying` | App shell | Products list |
| `/product/:id` | App shell | Product detail |
| `/cart` | App shell | localStorage cart |
| `/checkout` | App shell | addresses, coins, orders |
| `/order-confirmation/:id` | App shell | order by id |
| `/orders` | App shell | orders list |
| `/wishlist` | App shell | wishlist localStorage |
| `/selling` | App shell | vendor products |

## Farm + irrigation

| Route | Shell | Primary API |
|-------|-------|-------------|
| `/farms`, `/farms/:id` | App shell | farms CRUD |
| `/crops` | App shell | crops CRUD |
| `/irrigation` | App shell | schedules |
| `/irrigation-services` | App shell | service listings |
| `/irrigation-sensors` | App shell | sensors |

## Engineering quality (Phase 5–6)

| Area | Doc | Target |
|------|-----|--------|
| Bundle split | `PERFORMANCE_AUDIT.md` | charts/motion/vendor chunks |
| A11y primitives | `A11Y_AUDIT.md` | FormField, step indicator |
| UX copy | `UX_COPY_GUIDE.md` | Create/Save/Update verbs |
| Page quality | `PAGE_QUALITY_STANDARDS.md` | Six-question framework |
| Platform freeze | `RELEASE_QUALITY.md` | No new generic components |

## Pre-release manual QA

1. Login → dashboard loads KPIs (or empty state, not blank).
2. Toggle light/dark on every major route (floating button).
3. Commerce: add to cart → checkout → place order (COD) or Razorpay sim.
4. Farm CRUD smoke test.
5. Irrigation schedules list/create (pilot scope banner visible).
6. Public pages: `/about`, `/contact`, `/privacy-policy` — header/footer present.
7. `npm run build` — zero errors.

## Lighthouse targets (Sprint 5)

- Performance > 90
- Accessibility > 95
- Best practices > 95

Run: `npx lighthouse http://localhost:3000/dashboard --view` (authenticated session required).

## Out of scope (next phase: backend hardening)

- Backend API parity, pagination, caching
- OpenTelemetry / error reporting
- E2E test suite (Playwright)
- CSP / security headers in production CDN

### QA video walkthrough

Record `docs/qa-walkthrough` artifact after seeding a test user or completing OTP in dev.

**Blocker:** Registration requires OTP email/SMS; seed `demo@farmeazy.com` in local H2 for full authenticated walkthrough.


- [ ] Product owner walkthrough (video artifact)
- [ ] `npm run build` green
- [ ] No P0 console errors on core flows
- [ ] PR merged → branch `release/v1.0.0` or `feature/backend-production-hardening`
