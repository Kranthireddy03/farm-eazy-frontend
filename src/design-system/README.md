# FarmEazy Design System

Single source of visual truth for the main frontend.

## Tokens

| Layer | Location |
|-------|----------|
| CSS variables | `tokens.css` (spacing, typography, radius, shadows, motion) |
| Semantic colors | `src/index.css` (`--primary`, `--muted`, etc.) |
| Tailwind mapping | `tailwind.config.js` |
| JS helpers | `index.js` (`typography`, `iconSize`, `motion`) |

## Components

Use shared primitives from `src/components/ui/` — do not one-off page styles for buttons, cards, tables, or forms.

## Page structure

Every authenticated page should use:

1. `AppShell` (sidebar, header, footer — never duplicate)
2. `AppPage` (breadcrumbs + `PageHeader` + optional `PageToolbar`)
3. Domain components (`ProductCard`, `DataTable`, `KpiCard`, etc.)

## Theme

`ThemeContext` supports `light`, `dark`, and `system`. Header toggle cycles all three.
