# UX audit report

**Scope:** Main frontend authenticated and commerce flows  
**Method:** Page quality standards + six-question framework  
**Status:** Report only — implement highest-impact items incrementally  

---

## Executive summary

The **platform layer is mature** (`AppPage`, KPIs, tables, marketplace components). Remaining gaps are **layout balance on wide screens**, **legacy page shells**, and **inconsistent context panels** — not missing generic components.

**Highest-impact next work:**

1. Commerce — `useCheckout` / `useMarketplaceFilters`, checkout step indicator, contextual asides  
2. Legacy modules — Irrigation, Vendor, Auth (`isDark` / `premium-shell`)  
3. Executive dashboard — weather, calendar, activity feed (Phase 4)  
4. Admin operations console (Phase 5)  

---

## Commerce (Phase 2)

| Page | Hierarchy | Whitespace | Crowding | Context | CTAs | Loading | Empty | A11y | Score |
|------|-----------|------------|----------|---------|------|---------|-------|------|-------|
| **Buying** | Good | Wide desktop unused right column | OK | Missing aside tips | Strong | Skeleton | Good | Filter focus OK | B+ |
| **Product detail** | Good | Some below-fold gap | OK | Seller panel partial | Good | Skeleton | — | Review images alt | B+ |
| **Cart** | Good | Balanced scaffold | OK | Summary aside | Good | Implicit | Good | Good | A- |
| **Checkout** | Fair | 3-col OK | Vendor blocks heavy | No step indicator | Good | Overlay | Good | Radio labels OK | B |
| **Order confirmation** | Good | Centered OK | OK | Timeline partial | Good | Loader | — | Good | B+ |
| **Orders** | Good | Single column wide | OK | No activity aside | Good | Skeleton | Good | Table headers | B+ |
| **Selling (list)** | Good | Wide table empty right | OK | Added KPIs; aside pending | Strong | Skeleton | Good | Good | B+ |
| **Selling (form)** | Fair | Long form scroll | Dense steps | Legacy step UI | OK | Button only | — | Many raw inputs | C+ |

### Buying — findings

1. **Poor hierarchy:** Category chips duplicate filter bar — chips are quick filters (OK) but compete visually with toolbar.  
2. **Whitespace:** Full-width grid without right context panel on desktop.  
3. **Missing context:** No delivery-zone explanation or buyer tips panel.  
4. **Fix now:** `PageScaffold` aside + `useMarketplaceFilters`.  
5. **Defer:** Sticky filter bar, comparison, saved search (Phase F).  

### Checkout — findings

1. **Hierarchy:** Payment and address compete equally — step indicator would clarify sequence.  
2. **Crowding:** Vendor transparency block per line item is heavy (compliance need — keep but use `DetailPanel`).  
3. **Missing feedback:** Address validation UI weak.  
4. **Legacy:** `isDark` branches throughout.  
5. **Fix now:** `useCheckout`, `CheckoutStepIndicator`, semantic panels for warnings.  
6. **Defer:** Full address validation UI, order timeline (Phase F).  

---

## Farm operations (Phase 3)

| Page | Status | Priority issues |
|------|--------|-----------------|
| **Farms** | Upgraded | Add `PageScaffold` aside (tips, crop links); quick actions card is good |
| **Crops** | Upgraded | Same aside pattern as Farms |
| **Farm detail** | Legacy | `isDark`, no `AppPage` |
| **Irrigation *** | Legacy | Large files, `premium-shell`, poor hierarchy |
| **Activities** | Legacy | Dense timeline, no KPI framing |

**Fix:** Defer module migration until commerce Phase 2 complete; use Farms as template.

---

## Dashboard (Phase 4)

| Page | Status | Priority issues |
|------|--------|-----------------|
| **DashboardEnhanced** | Partial | KPIs + charts OK; missing activity feed, weather, calendar widgets |
| **Dashboard (legacy)** | Legacy | Duplicate route risk — confirm single canonical dashboard |

**Whitespace:** Chart row can feel empty without secondary widgets on xl screens.  
**Fix defer:** Phase 4 widgets with real or mocked API data.

---

## Account & settings

| Page | Status | Priority issues |
|------|--------|-----------------|
| **Profile** | Legacy | No `AppPage` |
| **Address book** | Mixed | Functional but dense |
| **Notifications** | Legacy | `isDark` patterns |
| **User preferences** | Legacy | Form-only, no context |

---

## Auth & public

| Page | Status | Notes |
|------|--------|-------|
| **Login / Register** | Legacy UI | Acceptable for auth; not `AppPage` |
| **Home / Landing** | Public layout | Separate design language OK |

---

## Admin (in-app)

| Page | Status | Priority issues |
|------|--------|-----------------|
| **Admin notifications** | Legacy | No operations console pattern |
| **Admin blog** | Legacy | CRUD without audit context |

**Phase 5:** Audit logs, jobs, health, feature flags — UI can mock initially.

---

## Cross-cutting accessibility

| Area | Issue | Severity |
|------|-------|----------|
| Focus rings | Primitives OK; legacy pages inconsistent | Medium |
| Color contrast | Legacy gray-on-gray in dark manual branches | Medium |
| Form labels | Selling form many unlabeled raw inputs | High (Selling form) |
| Motion | `AppPage` motion — respect `prefers-reduced-motion` (defer) | Low |

---

## Cross-cutting performance

| Area | Issue |
|------|-------|
| Dashboard bundle | ~410kb chunk — code split charts (Phase 6) |
| Checkout re-renders | Large single component — hook extraction helps |
| Layout shift | Legacy pages worse than `AppPage` pages |

---

## Implementation queue (recommended)

### P0 — This sprint

- [x] Document page quality standards  
- [x] UX audit report  
- [ ] Buying: `useMarketplaceFilters` + context aside  
- [ ] Selling: context aside + fix `FilterBar` props  
- [ ] Checkout: `useCheckout` + step indicator + warning `InfoPanel`  

### P1 — Commerce finish

- Selling form → `FormField` + step indicator  
- Wishlist page  
- Order timeline on confirmation  
- Wire `useMarketplaceFilters` everywhere browse filters repeat  

### P2 — Module migration

- Irrigation, Vendor, Profile → `AppPage` + aside  
- Remove all `isDark` / `premium-shell`  

### P3 — Product polish (Phase C)

- Micro-interactions via `motion` tokens  
- Skeleton-to-content fade  
- Undo snackbars where destructive  

---

## Pages that pass the six questions today

- Farms, Crops, Orders, Service Requests (list)  
- Cart  
- Selling (list view)  
- Buying (after aside addition)  

## Pages that need redesign before “enterprise release”

- Checkout (structure polish, not full rewrite)  
- SellingProductForm  
- Irrigation*, Vendor*, Profile, Activities  
- Admin surfaces  
