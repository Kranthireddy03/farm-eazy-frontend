# Page quality reviews

Release gate: each page **PASS** or **NEEDS IMPROVEMENT** per `PAGE_QUALITY_STANDARDS.md`.

Last updated: release-quality sprint (commerce completion).

## Commerce — marketplace flow

| Page | Status | Notes |
|------|--------|-------|
| **Buying** | **PASS** | KPIs, filters, `PageScaffold` aside (zone, actions, tips), hooks |
| **Product detail** | **PASS** | AppPage, actions; minor: seller panel could expand later |
| **Cart** | **PASS** | Scaffold, summary, `useCart` |
| **Checkout** | **NEEDS IMPROVEMENT** | Step indicator added; still large file; vendor blocks dense; address validation UI deferred |
| **Order confirmation** | **PASS** (after timeline) | Timeline + delivery aside |
| **Orders** | **PASS** (after aside) | KPIs, filters, context aside |
| **Selling (list)** | **PASS** | DataTable, aside, meta badges |
| **Selling (form)** | **NEEDS IMPROVEMENT** | Legacy multi-step UI; migrate to `FormField` + shared step indicator |
| **Saved products (wishlist)** | **PASS** (new) | Completes local wishlist journey |

## Farm operations (Phase 3 — not release blocker)

| Page | Status | Notes |
|------|--------|-------|
| Farms | PASS | Reference list page |
| Crops | PASS | Aligned with Farms |
| Farm detail | NEEDS IMPROVEMENT | Legacy shell |
| Irrigation * | NEEDS IMPROVEMENT | Legacy `premium-shell` |
| Activities | NEEDS IMPROVEMENT | Legacy timeline |

## Dashboard & admin (later phases)

| Page | Status |
|------|--------|
| DashboardEnhanced | NEEDS IMPROVEMENT — widgets Phase 4 |
| Admin surfaces | NEEDS IMPROVEMENT — Phase 5 |

## Next release actions

1. Selling form migration (no new components)
2. Checkout decomposition (panels, not new primitives)
3. Farm / irrigation module migration
4. WCAG AA + bundle audit
