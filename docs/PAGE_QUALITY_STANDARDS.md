# Page quality standards

Every authenticated page should feel **complete, informative, and visually balanced** — like Stripe, Linear, GitHub, Notion, Atlassian, Shopify, or Vercel. The goal is **purposeful use of space**, not filling every pixel with decorative cards.

---

## Six questions (every page must answer)

1. **Where am I?** — Breadcrumbs + clear title  
2. **What is the purpose of this page?** — Description under the title  
3. **What is the current status?** — Meta badges, KPIs, or status panels  
4. **What are the most important metrics?** — `KpiSection` when applicable  
5. **What actions can I take?** — Primary + secondary actions in the header  
6. **What related information should I see next?** — Context aside, quick actions, tips  

If a page cannot answer these, redesign the layout before adding more widgets.

---

## Justify every section

Every visible block must answer at least one of:

- What am I looking at?
- Why is it important?
- What should I do next?
- What changed?
- What requires my attention?
- What information supports my decision?

If a section does not answer one of these, remove it or replace it with purposeful content.

---

## Layout balance

### Avoid

- Large unused whitespace or visually empty regions (unless intentional negative space)
- Narrow single-column content on wide desktop while the right side is blank
- Duplicate KPIs or the same data in multiple cards
- Decorative cards that do not improve decisions or actions

### When space is available, prefer

- Contextual information panels (`InfoPanel`, `SummaryPanel`, `DetailPanel`)
- KPIs where they reflect real status
- Summaries, quick actions, recent activity, helpful tips
- Right-side context on desktop via `PageScaffold` aside

### Desktop

- Use width effectively; prefer 2- or 3-column layouts when usability improves
- Main content + contextual aside (`PageScaffold`: 2/3 + 1/3 on `lg+`)
- Full-width KPI row above the scaffold

### Tablet / mobile

- Collapse aside below main content; preserve reading order
- Sticky toolbars only when they aid filtering or primary actions

---

## Structure checklist

| Element | Required |
|---------|----------|
| `AppPage` title | Yes |
| Description | Yes |
| Breadcrumbs | Automatic via `AppPage` |
| Primary action | When the page has a main task |
| Secondary actions | When common alternate paths exist |
| Context meta / badges | When status or counts matter |
| KPI section | When metrics drive the page |
| Main content | Yes |
| Context aside | When tips, summary, or quick actions help |
| Loading state | `PageSkeleton` / `BrandLoader` |
| Empty state | `EmptyState` with action |
| Error state | `ErrorState` with retry |

---

## Feedback checklist

- Loading — skeleton or inline spinner on actions  
- Success — toast + visible state update  
- Failure — toast + `ErrorState` or inline error where appropriate  
- Retry — on recoverable errors  
- Optimistic UI — only where rollback is safe (e.g. local wishlist)

---

## Visual checklist

- Spacing: `space-y-6` page rhythm, `gap-4` grids  
- Typography: title → section → body (`design-system/typography`)  
- Alignment: header actions align with title block  
- Cards: consistent `border-border`, `shadow-sm`, equal padding  
- No `isDark` branches — use semantic tokens and `dark:` utilities  

---

## Performance

- No layout shift when data loads (reserve skeleton space)  
- Avoid full-page spinner flash when skeleton suffices  
- Lazy routes for heavy pages; avoid blocking the shell  

---

## Implementation patterns

```text
AppPage (title, description, meta, actions, toolbar)
├── KpiSection (optional)
└── PageScaffold
    ├── Main (table, grid, forms)
    └── Aside (InfoPanel, SummaryPanel, quick actions)
```

Import building blocks from `components/catalog` or `components/platform`. Do not introduce one-off layout wrappers per page.
