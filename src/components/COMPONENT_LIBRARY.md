# Component library

Internal UI platform for FarmEazy. **Import from `src/components/catalog` when building new pages.**

**Quality standards:** `docs/PAGE_QUALITY_STANDARDS.md`  
**UX audit & priorities:** `docs/UX_AUDIT.md`  
**Technical debt:** `docs/TECHNICAL_DEBT.md`

---

## Core rule

> **Every page must justify every section.**

Every visible block should answer: what am I looking at? why it matters? what to do next? what changed? what needs attention? what supports my decision?

Do not add cards to fill space. Add **context, metrics, actions, or guidance** that helps the user.

---

## Page anatomy (mandatory for authenticated routes)

```text
AppShell
 └── AppPage
      ├── Breadcrumbs (automatic)
      ├── PageHeader (title, description, meta, actions)
      ├── PageToolbar (optional — filters, export)
      ├── KpiSection (when metrics matter)
      └── PageScaffold
           ├── Main content (2/3 on desktop)
           └── Aside — tips, summary, quick actions, status (1/3 on desktop)
```

### Six questions every page answers

1. Where am I?  
2. What is this page for?  
3. What is the current status?  
4. What are the key metrics?  
5. What actions can I take?  
6. What related information should I see next?  

### Layout balance

- Purposeful density — not empty wide regions, not cluttered decoration  
- Desktop: use `PageScaffold` when a context panel improves decisions  
- Mobile: aside collapses below main content  

---

## Do

- Reuse `DataTable`, `ProductCard`, `OrderSummaryPanel`, `CartLineItem`
- Use platform panels: `InfoPanel`, `SummaryPanel`, `DetailPanel`, `PageBanner`
- Use design tokens — never arbitrary pixel colors/spacing
- Use `EmptyState` / `ErrorState` / `PageSkeleton` / `BrandLoader`
- Keep page files under ~250 lines; push UI into feature folders
- Commerce logic: `lib/marketplace.js`, `useCart`, `useCheckout`, `useMarketplaceFilters`

## Don't

- Build custom tables when `DataTable` fits
- Duplicate cart pricing math
- Render authenticated pages outside `AppShell` + `AppPage`
- Use `isDark` ternary styling — use semantic tokens
- Add emoji as primary chrome — use Lucide icons
- Create new generic components unless they solve a **cross-cutting** problem

---

## Key components

| Component | Purpose |
|-----------|---------|
| `AppPage` | Breadcrumbs + header + motion wrapper |
| `PageScaffold` | Main + aside grid (`lg:grid-cols-3`) |
| `InfoPanel` / `SummaryPanel` | Context and quick actions in aside |
| `StatsCard` | KPI with optional tone |
| `OrderSummaryPanel` | Cart/checkout pricing + coins |
| `ProductCard` | Marketplace listing card |
| `CheckoutStepIndicator` | Checkout / multi-step progress |
| `BrandLoader` | FE-branded loading state |

---

## Marketplace journey order

1. Cart → 2. Checkout → 3. Order confirmation → 4. Orders → 5. Selling → 6. Wishlist → 7. Recommendations
