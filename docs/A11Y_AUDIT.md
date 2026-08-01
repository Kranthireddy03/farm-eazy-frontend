# Accessibility audit (Phase 6)

## Platform primitives (PASS)

- `FormField` — associates `Label` with `htmlFor`, required marker `aria-hidden`, errors use `role="alert`.
- `Button` / `Input` — `focus-visible:ring-2` on interactive controls.
- `CheckoutStepIndicator` — `role="status"` and `aria-label` for progress.

## Commerce (improved this sprint)

- **Selling form** — migrated to `FormField` + labeled inputs; category chips are keyboard-focusable buttons.
- **Checkout** — payment/address radios use native `<input type="radio">` with visible labels; vendor blocks are text-only (no emoji-only cues).

## Legacy debt (monitor)

- Irrigation service listing cards — mixed contrast on dark gradients; prefer semantic `Card` over `glass-card`.
- Login / Register — custom glass UI; labels present but focus order on OTP step needs manual retest.
- Admin portal sidebar — emoji icons lack text alternatives when collapsed (use `title` on NavLink — present).

## Motion

- `AppPage` uses framer-motion; respect `prefers-reduced-motion` in future pass on shell animations.

## Manual checks

1. Tab through checkout: review → payment → address → place order.
2. Selling form: each step with keyboard only.
3. Screen reader: step indicator announces progress via `role="status"`.
