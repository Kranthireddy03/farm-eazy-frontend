# Release quality — FarmEazy frontend

The **design system and component platform are frozen** for this release cycle.

## Platform freeze rule

> **No new generic components unless at least three different pages genuinely need them.**

Solve page-specific gaps with existing `AppPage`, `PageScaffold`, `InfoPanel`, `SummaryPanel`, `DetailPanel`, `DataTable`, and marketplace components.

Do not redesign pages that already **PASS** `PAGE_QUALITY_STANDARDS.md`.

## Release objective

Make FarmEazy feel like a **polished production SaaS** — not by adding UI parts, but by:

1. Finishing the marketplace journey
2. Failing pages only where standards fail
3. Consistent UX copy and feedback
4. Accessibility and performance audits (Phase 6)

## Per-page workflow

1. Evaluate with `docs/PAGE_QUALITY_STANDARDS.md`
2. Cross-check `docs/UX_AUDIT.md`
3. If **PASS** → leave unchanged
4. If **NEEDS IMPROVEMENT** → fix only failing areas
5. Record result in `docs/PAGE_REVIEWS.md`

## Quality bar (every shipped page)

- Clear information hierarchy
- Intentional visual balance (no unexplained desktop whitespace)
- Responsive layout
- Fast perceived performance (skeletons, not flash loaders)
- Accessible interactions
- Professional typography, spacing, colors, motion
- Consistent loading, empty, error, and success feedback

## Reference products

Stripe, Linear, Notion, GitHub, Vercel, Shopify, Atlassian — **purposeful**, not decorative.

## Avoid

- Decorative cards
- Duplicate KPIs
- Placeholder widgets
- Empty containers
- Unnecessary animations
- Artificial visual complexity

## Copy

Follow `docs/UX_COPY_GUIDE.md` for labels, terminology, and toast messages.
