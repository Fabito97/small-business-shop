# Brand & Design System

**Placeholder brand:** *Meridian Time*. Tagline: "Wear the hour." (The owner's real name/logo replaces this via `config/brand.ts`.)
**Feeling:** premium, calm, confident, editorial. Think boutique watch house, not a bargain marketplace. Lots of whitespace, large product photography, restrained gold accents.

## Color tokens (define as CSS variables / Tailwind theme)
| Token | Hex | Use |
|---|---|---|
| `--ink` | `#0E0E10` | Primary text, dark sections, header on hero |
| `--charcoal` | `#1C1C20` | Cards on dark, footer |
| `--ivory` | `#FAF7F2` | Page background |
| `--sand` | `#EDE6DA` | Alt sections, borders, skeletons |
| `--gold` | `#B8956A` | Accent, prices hover, links, focus ring |
| `--gold-deep` | `#8F6E47` | Button hover, active states |
| `--muted` | `#6B6B72` | Secondary text |
| `--success` | `#2F7D5B` | In stock, delivered |
| `--warning` | `#B7791F` | Low stock, pending |
| `--danger` | `#B3392F` | Errors, cancelled |

Buttons: Primary = ink bg / ivory text (hover gold-deep). Secondary = outline ink. Accent CTA (hero only) = gold bg / ink text.

## Typography (via `next/font/google`)
- Headings: **Cormorant Garamond** (500/600), generous size, tight leading. Slight letter-spacing on small caps labels.
- Body/UI: **Inter** (400/500/600).
- Scale: hero `text-5xl md:text-7xl`, h2 `text-3xl md:text-4xl`, body `text-base`, labels `text-xs uppercase tracking-[0.2em]`.

## Layout & shape
- Container `max-w-7xl`, `px-4 sm:px-6 lg:px-8`. Section spacing `py-16 md:py-24`.
- Radius: small (`rounded-md`) for buttons/inputs, `rounded-lg` cards. No heavy shadows; use 1px sand borders + subtle hover lift.
- Product images: 4:5 aspect ratio, `object-cover`, soft sand placeholder while loading, zoom-on-hover scale 1.03.

## Components to standardise
`Button`, `Input`, `Select`, `Badge` (stock/status), `ProductCard`, `SectionHeading` (small gold label + serif title), `Price` (uses `formatNaira`), `QuantityStepper`, `EmptyState`, `Skeleton`, `StatusBadge` (pending=warning, confirmed=gold, shipped=ink, delivered=success, cancelled=danger).

## Interaction & polish
- Add-to-cart: button shows brief check state; drawer slides in; toast not needed if drawer opens.
- Sticky header with blur backdrop after scroll; cart badge animates on change.
- Focus rings visible (gold). Buttons min 44px tall on mobile.
- Skeletons for product grid and tables. Smooth 150-200ms transitions. No gratuitous animation.
- Accessibility: alt text on all images, labels on all inputs, color contrast AA.

## Copy tone
Short, warm, assured. Examples: "Crafted to keep time. Chosen to be remembered." / "Free delivery on orders over ₦1,000,000." / "Your order is placed. We'll be in touch shortly."

## Required assets
- Logo: text wordmark in Cormorant (no image file needed) with a small SVG mark optional.
- Favicon + OG image (simple ink background with wordmark).
- Hero image: use a high-quality watch photo (Unsplash placeholder; owner replaces later).

## Trust elements to include
Authenticity guarantee, 12-month warranty, nationwide delivery, WhatsApp support link (number from config).
