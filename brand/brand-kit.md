# ValueSuppliers.co — Brand Kit v1.0

---

## 1. Brand Foundation

### Company
**ValueSuppliers.co**
B2B + retail supplier of disposable gloves and cannabis trimming equipment.

### Tagline (primary)
**"Supplied for the Grow."**

### Alternate taglines
- "Professional Grade. Value Priced."
- "From Hobby to Harvest."
- "The Supply Chain for Serious Growers."

### Mission
To make professional-grade trimming supplies and disposable gloves accessible at every scale — from the home grower to the licensed commercial operation.

### Customer Tiers
| Tier | Who | Key Need |
|------|-----|----------|
| Retail | Hobby growers, home cultivators | Easy ordering, low minimums |
| Wholesale | Hydro stores, dispensaries, small grows | Case pricing, fast restock |
| Distribution | Licensed grows, commercial operations, resellers | Volume discounts, NET terms, dedicated rep |

---

## 2. Logo System

### Primary Wordmark
- **Text:** `VALUE SUPPLIERS` — Barlow Condensed Bold, all caps, tight tracking (-0.02em)
- **TLD:** `.co` — set in accent amber (#C8922A), slightly smaller (80% of wordmark size)
- **Full lockup:** `VALUE SUPPLIERS.co`

### Icon / Monogram
- Stylized **VS** monogram in a hexagonal badge shape
- Hexagon references the cannabis industry without being explicit
- Works as favicon, embossed stamp, apparel patch

### Logo Variants
| Variant | Usage |
|---------|-------|
| Full wordmark (dark) | Light backgrounds, primary usage |
| Full wordmark (light) | Dark backgrounds, packaging |
| VS badge only | Favicon, small format, apparel |
| Stacked (badge + wordmark) | Square format, social profile images |

### Clear Space
Minimum clear space = height of the letter "V" on all sides.

### What NOT to do
- Do not stretch or compress the logo
- Do not use amber on amber backgrounds
- Do not use low-contrast color combinations
- Do not add drop shadows or gradients to the wordmark

---

## 3. Color System

### Primary Palette
| Name | Role | Hex | RGB |
|------|------|-----|-----|
| Forest | Primary brand color | `#1B3A2D` | 27, 58, 45 |
| Amber | Accent / CTA / highlights | `#C8922A` | 200, 146, 42 |
| Charcoal | Body text / dark backgrounds | `#1C1C1C` | 28, 28, 28 |
| Off-White | Page backgrounds | `#F5F4F0` | 245, 244, 240 |
| White | Cards / panels | `#FFFFFF` | 255, 255, 255 |

### Secondary Palette
| Name | Role | Hex |
|------|------|-----|
| Muted Green | Success states, badges, tier indicators | `#4A7C59` |
| Light Sage | Subtle backgrounds, hover states | `#E8EDE9` |
| Warm Gray | Borders, dividers, muted text | `#9A9590` |
| Dark Amber | Amber hover/pressed state | `#A67320` |
| Alert Red | Errors, out of stock | `#C0392B` |

### Semantic Tokens
| Token | Value | Usage |
|-------|-------|-------|
| `color-bg-primary` | `#F5F4F0` | Page background |
| `color-bg-card` | `#FFFFFF` | Cards, panels |
| `color-bg-dark` | `#1B3A2D` | Hero sections, nav |
| `color-text-primary` | `#1C1C1C` | Body text |
| `color-text-secondary` | `#9A9590` | Captions, labels |
| `color-text-inverse` | `#FFFFFF` | Text on dark backgrounds |
| `color-accent` | `#C8922A` | CTAs, links, highlights |
| `color-accent-hover` | `#A67320` | Hover states |
| `color-border` | `#E2E0DB` | Borders, dividers |
| `color-success` | `#4A7C59` | Tier badges, confirmations |

### Tier Color Coding
| Tier | Color | Hex |
|------|-------|-----|
| Retail | Warm Gray | `#9A9590` |
| Wholesale | Muted Green | `#4A7C59` |
| Distribution | Amber | `#C8922A` |

---

## 4. Typography

### Font Stack
| Role | Font | Weight | Source |
|------|------|--------|--------|
| Display / Hero | Barlow Condensed | 700 (Bold) | Google Fonts |
| Headings | Barlow | 600–700 | Google Fonts |
| Body | Inter | 400, 500 | Google Fonts |
| Labels / Badges | Barlow | 600, uppercase | Google Fonts |
| Monospace (prices, SKUs) | JetBrains Mono | 400 | Google Fonts |

### Type Scale
| Name | Size | Line Height | Weight | Usage |
|------|------|-------------|--------|-------|
| `display` | 72px / 4.5rem | 1.0 | 700 Condensed | Hero headlines |
| `h1` | 48px / 3rem | 1.1 | 700 Condensed | Page titles |
| `h2` | 36px / 2.25rem | 1.2 | 700 | Section headings |
| `h3` | 24px / 1.5rem | 1.3 | 600 | Card headings |
| `h4` | 18px / 1.125rem | 1.4 | 600 | Sub-headings |
| `body-lg` | 18px / 1.125rem | 1.6 | 400 | Lead text |
| `body` | 16px / 1rem | 1.6 | 400 | Body copy |
| `body-sm` | 14px / 0.875rem | 1.5 | 400 | Captions, secondary |
| `label` | 12px / 0.75rem | 1 | 600 uppercase | Tags, badges, labels |
| `price` | 20px / 1.25rem | 1 | 500 mono | Product pricing |
| `price-lg` | 28px / 1.75rem | 1 | 500 mono | Hero pricing |

---

## 5. Spacing & Layout

### Spacing Scale (8px base)
```
2px  — xs  (micro gaps)
4px  — sm  (icon padding)
8px  — md  (tight spacing)
16px — lg  (standard gap)
24px — xl  (section spacing)
32px — 2xl
48px — 3xl
64px — 4xl
96px — 5xl (hero sections)
128px — 6xl
```

### Grid
- Max content width: **1280px**
- Gutters: **24px** (mobile), **48px** (desktop)
- Columns: 4 (mobile), 8 (tablet), 12 (desktop)
- Card grid: 1 → 2 → 3 → 4 columns

### Border Radius
| Token | Value | Usage |
|-------|-------|-------|
| `radius-sm` | 4px | Badges, tags |
| `radius-md` | 8px | Inputs, small cards |
| `radius-lg` | 16px | Cards, panels |
| `radius-xl` | 24px | Large cards, modals |
| `radius-full` | 9999px | Pills, avatars |

---

## 6. Component Style Guide

### Buttons

**Primary (CTA)**
- Background: Amber `#C8922A`
- Text: White, Barlow 600, uppercase, tracked
- Padding: 12px 24px
- Radius: 8px
- Hover: Dark Amber `#A67320`
- Example: "Order Now", "Get Wholesale Pricing", "Add to Cart"

**Secondary**
- Background: Transparent
- Border: 2px Forest `#1B3A2D`
- Text: Forest, Barlow 600, uppercase
- Hover: Forest bg, white text
- Example: "Learn More", "View Catalog"

**Ghost**
- Background: Transparent
- Text: Warm Gray, no border
- Hover: underline
- Example: "View details →"

**Tier Badge Button**
- Outlined pill style, color-coded by tier
- Example: "Apply for Wholesale", "Distribution Inquiry"

### Cards

**Product Card**
- White background, `radius-lg`
- Subtle border `#E2E0DB`
- Product image (square, object-cover)
- Category label (uppercase, small, amber)
- Product name (h3, Barlow 600)
- Price display: retail price visible, wholesale price shown after login OR with "Login for pricing" badge
- Case quantity (e.g., "100 ct / case")
- "Add to Cart" primary button
- Hover: slight shadow lift, border darkens

**Tier Info Card**
- Forest dark background
- Amber accent line on top border
- Icon + tier name + key benefits list
- CTA button

**Testimonial / Trust Card**
- Light sage background
- Star rating
- Quote text
- Customer name + business type

### Navigation

**Desktop**
- Logo left
- Nav links center: Catalog | Wholesale | Distribution | About | Contact
- Right: Search icon | Account icon | Cart icon
- Dark Forest background when on dark sections, white when scrolled

**Mobile**
- Hamburger menu
- Full-screen slide-out drawer
- Tier quick-links at bottom of drawer

### Forms (Wholesale/Distribution Application)

- Clean, single-column layout
- Labeled inputs with floating labels
- Business type selector (Hydro Store / Licensed Grow / Dispensary / Other)
- Monthly volume estimator
- File upload for business license
- Forest submit button

### Pricing Display

- Retail price always visible
- Wholesale/Distribution price: shown post-login OR teased with "Log in for wholesale pricing"
- Case quantity always shown (e.g., "1 case = 100 units")
- Per-unit price calculated and displayed
- Bulk tiers shown in a simple table on product page

---

## 7. Imagery & Photography Direction

### Style
- Clean, well-lit product shots on white or light sage background
- Lifestyle shots: gloves in use in grow room environments (professional, not stoner aesthetic)
- Macro shots of glove texture, material detail, packaging
- No people's faces — hands and product only
- Industrial/professional feel

### What to Avoid
- Explicit cannabis imagery (leaves, buds) — keep it professional supply
- Low-quality or stock-looking photos
- Cluttered backgrounds

### Icons
- Line-icon style, 2px stroke
- Rounded caps
- From: Lucide Icons or custom set
- Key icons needed: glove, box/case, truck, badge/certified, scale/weight, leaf (subtle), handshake

---

## 8. Brand Voice & Copy

### Voice Attributes
| Attribute | Description |
|-----------|-------------|
| Direct | No fluff. Buyers are professionals. |
| Reliable | Consistent tone. Doesn't oversell. |
| Value-forward | Price and quantity are features, not afterthoughts. |
| Industry-aware | Understands the grow world without being explicit |
| Accessible | Works for the hobby grower AND the commercial op |

### Tone by Section
| Section | Tone |
|---------|------|
| Hero | Bold, confident, single clear statement |
| Product pages | Spec-forward, factual, concise |
| Wholesale/Distribution | Professional B2B, ROI-minded |
| About | Grounded, honest, supply-chain focused |
| CTA copy | Action-oriented, value-driven |

### CTA Examples
- "Order by the Case"
- "Get Wholesale Pricing"
- "Apply for Distribution"
- "See All Products"
- "Restock Your Supply"
- "Request a Quote"
- "Set Up Your Account"

### Headlines (hero examples)
- "Everything Your Grow Needs. One Supplier."
- "Case Pricing. No Minimums to Start."
- "Gloves, Trimmers, and More — Built for the Trade."
- "Wholesale Supply for Hydro Stores, Grows, and Distributors."

### Product Copy Pattern
```
[Product Name]
[Material] | [Size options] | [Count per case]

[1-sentence description of what it is]
[1-sentence on key performance attribute]
[1-sentence on ideal use case]

Retail: $X.XX / case
Wholesale: [Login or price]
Distribution: [Inquiry]
```

---

## 9. Site Personality Summary

ValueSuppliers.co should feel like walking into a well-organized professional supply warehouse — clean, efficient, everything clearly labeled and priced. Not a luxury brand, not a discount bin. The visual language says "we supply serious operations." The tone says "we know what you need, here it is."

Think: **Uline meets the grow industry.**

---

*Brand Kit v1.0 — ValueSuppliers.co — March 2026*
