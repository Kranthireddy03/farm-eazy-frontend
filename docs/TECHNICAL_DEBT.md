# FarmEazy Frontend — Technical Debt Report

Prioritized audit for the main frontend (`farm-eazy-frontend`). Each item explains impact and recommended timing.

**Legend:** Impact = user/engineering risk · **Fix now** = blocks platform consistency · **Defer** = schedule in a named phase

---

## P0 — Fix now (platform consistency)

| Issue | Why it matters | Impact | Recommendation |
|-------|----------------|--------|----------------|
| **Selling product form still uses legacy step UI** | Multi-step form uses gradient buttons and emoji headers instead of `FormField` / `CheckoutStepIndicator` | Medium — seller UX inconsistent with checkout | **Defer to Phase 2** — extracted to `SellingProductForm.jsx`; migrate steps to shared form primitives next |
| **Checkout.jsx size (~900+ lines)** | Payment, address, and retry logic live in one page | High — hard to test and extend commerce polish | **Fix now (partial)** — use `useCheckout` hook; extract address/payment panels in Phase 2 |
| **Legacy `isDark` / `premium-shell` pages** | Irrigation, Vendor, Register/Login, Profile, Activities, etc. | High — visual inconsistency, duplicate theme logic | **Defer Phase 3–5** — migrate module-by-module to `AppPage` + semantic tokens |
| **Duplicate layout shells** | `Layout.jsx`, `premium-shell`, custom page headers vs `AppShell`/`AppPage` | Medium — drift on spacing and nav | **Fix now** — new pages must use `AppPage`; retire patterns when touching a module |

---

## P1 — High value next sprint

| Issue | Why it matters | Impact | Recommendation |
|-------|----------------|--------|----------------|
| **Wishlist page + recommendations** | Commerce journey incomplete | Medium — discovery/retention | **Phase 2** — after Selling stabilization |
| **Buying filters not on `useMarketplaceFilters`** | Filter logic duplicated in `Buying.jsx` | Low–medium | **Fix now** — hook exists; wire Buying page |
| **Inconsistent loading states** | Mix of spinners, `PageSkeleton`, `BrandLoader` | Medium — perceived quality | **Fix now** — standard: list pages → `PageSkeleton`, actions → button loading |
| **Inconsistent empty/error states** | Some pages use raw divs | Medium — support burden | **Fix now** — use `EmptyState` / `ErrorState` on every list page |
| **Admin portal operations console** | No audit logs, jobs, health UI | Medium — enterprise story | **Phase 5** — mock data OK initially |

---

## P2 — Engineering excellence (Phase 6)

| Issue | Why it matters | Impact | Recommendation |
|-------|----------------|--------|----------------|
| **No Storybook** | Component docs and visual regression | Medium — hiring/dx | **Defer Phase 6** |
| **No bundle analysis / manualChunks** | Large lazy routes still heavy | Medium — performance | **Defer Phase 6** |
| **WCAG AA audit** | Focus rings on primitives; not verified end-to-end | High for compliance | **Defer Phase 6** — audit after page migrations |
| **Visual regression testing** | No Chromatic/Percy | Low until Storybook | **Defer Phase 6** |

---

## P3 — Product polish (Phase C/D)

| Issue | Why it matters | Impact | Recommendation |
|-------|----------------|--------|----------------|
| **Micro-interactions** | Button press, card hover, skeleton fade | Low–medium — premium feel | **Defer Phase C** — use `motion` tokens |
| **Checkout polish** | Stepper, address validation UI, order timeline | Medium — conversion | **Defer Phase F** |
| **Dashboard analytics** | Sparklines, heat maps, export | Medium — executive story | **Defer Phase 4** |
| **Marketplace advanced filters** | Sticky filter bar, comparison, saved search | Medium — buyer UX | **Defer Phase F** |

---

## Completed in recent platform work

- Design platform modules: `colors`, `spacing`, `typography`, `shadows`, `radius`, `motion`, `breakpoints`, `zIndex`, `icons`
- Enterprise building blocks: `AppCard`, `MetricCard`, `StatsCard`, `SectionHeader`, `SectionContainer`, `InfoPanel`, `SummaryPanel`, `DetailPanel`, `PageBanner`, `HeroSection`, `FeatureGrid`
- Hooks: `useCart`, `useCheckout`, `useMarketplaceFilters`
- Selling list view: `AppPage`, `DataTable`, `KpiSection`, `InfoPanel`
- `SellingProductForm` extracted from page shell

---

## Module migration status

| Module | AppPage | DataTable | Platform components | Notes |
|--------|---------|-----------|----------------------|-------|
| Farms, Crops, Orders, Service Requests | ✅ | ✅ | Partial | Reference implementations |
| Cart, Checkout, Order Success | ✅ | — | ✅ | Checkout still large |
| Buying, Product Detail | ✅ | — | ✅ | Wire `useMarketplaceFilters` |
| Selling (list) | ✅ | ✅ | ✅ | Form still legacy UI |
| Dashboard | ✅ | Partial | Partial | Charts need Phase 4 |
| Irrigation / Vendor / Auth legacy | ❌ | ❌ | ❌ | High `isDark` debt |
| Admin (in-app) | ❌ | ❌ | ❌ | Phase 5 |

---

## Rules for new work

1. No hardcoded colors/spacing — use `design-system` tokens or Tailwind theme keys.
2. Authenticated pages → `AppShell` → `AppPage`.
3. Lists → `FilterBar` + `DataTable` or documented grid pattern.
4. No new `isDark` branches — rely on CSS variables / `dark:` utilities.
5. Commerce logic → `lib/marketplace.js` and marketplace hooks.
6. Import shared UI from `components/catalog` or `components/platform`.
