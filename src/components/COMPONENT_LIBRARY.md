# Component library

Internal UI platform for FarmEazy. **Import from `src/components/catalog` when building new pages.**

## Page anatomy (mandatory for authenticated routes)

```
AppShell
 └── AppPage
      ├── Breadcrumbs (automatic)
      ├── PageHeader (title, description, meta, actions)
      ├── PageToolbar (optional — filters, export)
      ├── KpiSection (optional)
      └── PageScaffold
           ├── Main content
           └── Aside (order summary, secondary panels)
```

## Do

- Reuse `DataTable`, `ProductCard`, `OrderSummaryPanel`, `CartLineItem`
- Use design tokens (`space-4`, `text-sm`, `shadow-md`) — never arbitrary pixel values
- Use `EmptyState` / `ErrorState` / `PageSkeleton` / `BrandLoader` for loading and errors
- Keep page files under ~250 lines; push UI into `components/marketplace` or `components/app`

## Don't

- Build custom tables when `DataTable` fits
- Duplicate cart pricing math — use `lib/marketplace.js`
- Render full-page layouts outside `AppShell` + `AppPage` (except public/auth routes)
- Add emoji as primary UI chrome — use Lucide icons

## Key components

| Component | Purpose |
|-----------|---------|
| `AppPage` | Breadcrumbs + header + motion wrapper |
| `PageScaffold` | Main + aside grid |
| `OrderSummaryPanel` | Cart/checkout pricing + coins |
| `ProductCard` | Marketplace listing card |
| `BrandLoader` | FE-branded loading state |

## Marketplace journey order

1. Cart → 2. Checkout → 3. Order confirmation → 4. Orders history → 5. Selling → 6. Wishlist → 7. Recommendations
