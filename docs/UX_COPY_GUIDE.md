# UX copy guide

Consistent language makes the product feel engineered, not generated.

## Terminology (use exactly)

| Concept | UI label | Avoid |
|---------|----------|-------|
| Farm | Farm | field, parcel (unless area context) |
| Product | Product | item, listing (except seller “listings”) |
| Order | Order | purchase, transaction |
| Service request | Service request | ticket (user-facing) |
| Wishlist | Saved products | favorites, wish list |
| Marketplace | Marketplace | shop, store (except vendor) |
| Vendor | Vendor | seller (OK in product cards) |
| Coins | Coins | points, credits |

## Action labels

| Intent | Label |
|--------|--------|
| Create new entity | Create … |
| Save form / settings | Save |
| Update existing | Update … |
| Remove entity | Delete … |
| Dismiss without saving | Cancel |
| Continue flow | Continue … |
| Primary commerce | Add to cart, Proceed to checkout, Place order |
| Navigation back | Back to … |

Avoid: Submit (use Save or Create), OK, Done (unless wizard complete), vague “Go”.

## Toast messages

Be **specific** and **actionable**.

| Bad | Good |
|-----|------|
| Success | Product published successfully. |
| Error | Could not load orders. Try again. |
| Added to favorites | Product saved to your wishlist. |
| Failed | Could not update product. Check required fields. |

Pattern: **What happened** + optional **what to do next**.

## Empty states

Structure: **Title** (what’s missing) + **description** (why / what to do) + **primary action**.

Example: “No saved products yet” / “Save products from the marketplace to compare and buy later.” / “Browse marketplace”

## Validation

- State the field and requirement: “Quantity must be greater than zero.”
- Not: “Invalid input”

## Capitalization & tone

- Page titles: sentence case (“Order confirmation”, “Saved products”)
- Buttons: short, verb-first (“Create farm”, “View orders”)
- Professional, direct, no exclamation marks in errors
- Use “you” for user-facing guidance

## Status labels

Use backend enums in badges where needed, but prefer readable labels:

- PENDING → Pending
- CONFIRMED → Confirmed
- OUT_OF_STOCK → Out of stock
