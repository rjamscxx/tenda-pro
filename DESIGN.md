# Design System: Sizzle — Restaurant & Café Owner Dashboard

> **Stitch prompt source of truth.** Use this document when generating any new screen, component, or section for Sizzle. Every rule is deliberate — do not revert to generic dashboard conventions.
> Stack: Next.js 16 · Tailwind CSS 4 · React 19 · Supabase · Drizzle ORM

---

## 1. Visual Theme & Atmosphere

Sizzle is an operator-grade restaurant management dashboard designed to feel like a **premium kitchen command center** — not a generic SaaS app. The atmosphere is:

- **Dark-first, warm-neutral base** — deep forest or espresso backgrounds that feel rich and enveloping, not harsh. Every dark surface has a subtle undertone (green, brown, navy, or charcoal) that matches the restaurant's vertical.
- **Density: 5/10 (Daily App Balanced)** — generous whitespace inside cards, compact table rows and sidebar nav. Information density increases as the user goes deeper (dashboard → POS → reports).
- **Variance: 6/10 (Offset Asymmetric)** — split-panel layouts, left-aligned headers, asymmetric KPI grids. No centered hero sections in the dashboard. No three-equal-column feature rows.
- **Motion: 6/10 (Fluid Spring)** — all transitions use a spring physics curve. Page loads stagger in via cascade delays. Nav transitions show a micro-spin indicator. No animation feels instant or linear.

The overall impression: **a well-lit, late-night restaurant back-office.** Confident. Operational. Premium without ostentation.

**Theme system:** Sizzle ships 14 curated themes, each mapped to a restaurant archetype (Sage Dark = Modern Café default, Espresso = Coffee Bar, Crimson = Steakhouse, Ocean = Seafood, Ember = BBQ, Rose = Bakery, Midnight = Fine Dining, Harvest = Brewery, etc.). All themes share identical token names — only the hex values change. Design against **Sage Dark** unless specified.

---

## 2. Color Palette & Roles

### Default: Sage Dark (deep forest green)

- **Deep Forest Canvas** (`#0E1714`) — Primary page background. The darkest layer. Nearly black with a visible green undertone. Never pure black.
- **Canvas Depth** (`#121D19`) — Used in the dashboard radial gradient background. One step lighter than canvas.
- **Sidebar Surface** (`#131E1A`) — Sidebar column background. Barely distinct from canvas — intentional.
- **Raised Surface** (`#18231F`) — Card fill, modal backgrounds, primary elevated containers.
- **Mid Surface** (`#1E2A25`) — Table row hover states, nested card fills, dropdown backgrounds.
- **Deep Surface** (`#243029`) — Tertiary fills, active dropdown items, deepest inset panels.
- **Cream Ink** (`#ECE6D5`) — Primary text. Warm cream, not clinical white. Reads warm against forest canvas.
- **Sage Ink** (`#B4BDB4`) — Secondary text, subtitles, sidebar venue name, helper copy.
- **Muted Sage** (`#929B93`) — Tertiary text, timestamps, table column headers.
- **Ghost Sage** (`#5C655F`) — Disabled text, lowest-priority metadata, icon fills at rest.
- **Hair Border** (`#28332E`) — All structural 1px dividers — between sections, table rows, card edges.
- **Deep Hair** (`#212C27`) — Nested borders, double-border effects inside panels.
- **Sage Mint Accent** (`#58C098`) — THE SINGLE ACCENT. Used for: primary buttons, active nav left-border indicator, focus rings, KPI positive values, progress fills, chart lines, badge fills. Saturation 58% — confident, never electric.
- **Lifted Accent** (`#79D1AE`) — Hover variant of accent; gradient endpoint for primary button shimmer.
- **Accent Glow** (`rgba(88, 192, 152, 0.18)`) — Box-shadow glow behind primary buttons and the active nav item. Warm halo, not neon ring.
- **Accent Dim** (`rgba(88, 192, 152, 0.12)`) — Badge backgrounds, KPI card highlight fills, subtle tint overlays.
- **Accent Tint** (`rgba(88, 192, 152, 0.22)`) — Dashboard background glow (top-right radial ellipse).
- **Danger Terracotta** (`#E48865`) — Destructive actions, negative financial values, error states, low-stock warnings. Warm orange-red — never alarm red.
- **Warn Amber** (`#E8C96A`) — Caution states, medium-priority alerts, expiring subscription banners.
- **Dashboard Gradient** — Two radial glows on the content background: accent-tint (22% opacity) at 85% right / 0% top; accent-dim (12% opacity) at 5% left / 100% bottom. Subtle depth without poster-glow.

### Light Variant: Sage Light (for light-mode preference)
- **Warm Linen Canvas** (`#F4F0E7`) — Parchment warmth, not clinical white.
- **Pure Surface** (`#FFFFFF`) — Card fill only (sparingly).
- **Dark Forest Ink** (`#1A2420`) — Primary text.
- **Forest Accent** (`#1F5F4A`) — Same role as Sage Mint but darker for contrast on light backgrounds.

### Stitch Color Principle
Always describe colors by **role and descriptive name** — never just a hex. Example: "Sage Mint Accent (#58C098) on the primary CTA" not just "#58C098 button". Stitch interprets the semantic context.

---

## 3. Typography Rules

**Primary Font:** `Outfit` — A geometric sans-serif with rounded character terminals and confident numerals. Installed via `--font-outfit` CSS variable. Set on `body` globally. **Never substitute Inter, Roboto, or system-ui for primary text.**

**Monospace Font:** System monospace stack via `--font-mono`. Used exclusively for financial figures, timestamps, percentages, IDs, receipt numbers, and quantity counts. Applied via `.tabular` class.

**Global settings on `body`:**
- `letter-spacing: -0.01em` — gives Outfit a tighter, premium feel across all text.
- `font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11'` — enables Outfit's alternate character forms.
- `-webkit-font-smoothing: antialiased` — crisp rendering on retina displays.

**Scale & Weight Hierarchy:**

| Role | Size | Weight | Color |
|---|---|---|---|
| Page heading | `text-xl` (20px) | 600 semibold | `var(--ink)` |
| Section heading | `text-base` (16px) | 600 semibold | `var(--ink)` |
| Card / panel title | `text-sm` (14px) | 600 semibold | `var(--ink)` |
| Table header | `text-[11px]` | 500 medium + uppercase + wider tracking | `var(--ink-4)` |
| Body / table rows | `text-sm` (14px) | 400 normal | `var(--ink-3)` or `var(--ink)` |
| KPI values | `text-[1.65rem]`–`text-3xl` | 700 bold + `.tabular` | `var(--accent)` |
| Labels / captions | `text-xs` (12px) | 500 medium | `var(--ink-3)` |
| Micro text / badges | `text-[10px]`–`text-[11px]` | 500 medium | context-dependent |

**Typography rules:**
- Max line width for any paragraph body text: **65 characters**.
- `tracking-tight` (`-0.025em`) on all headings 16px and above.
- Financial figures, all quantities, all dates: **must use `.tabular` class**.
- Gradient text (`.gradient-text`): accent → accent-2 diagonal sweep. Reserved for the Sizzle wordmark in the sidebar and hero headings on the marketing page only. **Never on buttons or interactive elements.**
- **No serif fonts in this dashboard.** Outfit (sans-serif) everywhere. No Times, Georgia, Garamond.

---

## 4. Component Stylings

### Primary Button (`.btn-primary`)
A gradient pill that flows between accent → accent-end → accent-2. The gradient **slides** on hover — it's a moving shimmer, not a flat fill.

- **Resting:** `linear-gradient(135deg, #58C098 0%, #3DA87A 50%, #79D1AE 100%)` at `background-position: 0%`. Text color: Deep Forest Canvas (the darkest background color).
- **Hover:** `background-position: 100%` (gradient slides right), `brightness(1.05)`, soft `box-shadow: 0 2px 20px rgba(88,192,152,0.18)`.
- **Active:** `brightness(0.92)`, gradient position resets to `0%`. Tactile −1px settle feel.
- **Disabled:** `opacity: 0.45`, `cursor: not-allowed`.
- **Shape:** `rounded-lg` (8px radius), `font-semibold`, `font-size: 0.875rem`.
- **Padding:** `px-4 py-2` standard; `w-full py-3` for full-width cart/checkout CTA.
- **No outer glow rings. No neon borders. No custom cursor.**

### Secondary Button (`.btn-secondary`)
Ghost-style. Surface-2 fill, 1px hair border, ink-2 text.
- Hover: border lifts to accent, text becomes ink, background darkens to surface-3.
- Used for: CSV export, Cancel, modal secondary actions.

### Danger Button (`.btn-danger`)
Soft danger-dim background (terracotta at 12% opacity) + danger-colored text.
- Hover: fills to solid danger background, canvas-colored text. Full-saturation warning.
- Used for: delete confirmations, destructive modal confirms only.

### Navigation Items (`.nav-item` + `.nav-active`)
- **Resting:** `text-ink-3`, subtle `transition: background 0.18s, color 0.18s, box-shadow 0.18s`.
  - Unlocked hover: `text-ink bg-surface/80`.
  - Locked (pro-only): `text-ink-4 hover:text-ink-3 hover:bg-surface/70` + `🔒` hidden emoji (EXCEPTION: lock icon only, not decorative emoji).
- **Active state:** 2px left accent border + gradient fill (`color-mix(in srgb, var(--accent) 16%, var(--surface))` → transparent). Accent-colored text, `font-weight: 600`. Inset `box-shadow: 0 0 20px var(--accent-glow)` creates a warm halo. `padding-left` reduced by 2px to compensate for border width.
- **Pending state (during navigation):** A 10px SVG spinner (`stroke-dasharray: 22`, `stroke-dashoffset: 16`) in accent color appears at the right edge. Rotates at `0.7s linear` (spinner stays linear — not spring). Disappears when route settles.
- Nav items use SVG strokes only. 16×16. Never icon color fills.

### Cards
- **Standard card:** `bg-surface rounded-xl border border-hair`.
- **Glass card (`.glass`):** `background: linear-gradient(135deg, surface@85%, surface-2@90%)`, `backdrop-filter: blur(12px)`, border with `color-mix(in srgb, var(--hair) 80%, var(--accent) 20%)` — slightly accent-tinted edge. Used for AI assistant panel and overlay elements.
- **Interactive row-cards:** hover reveals `border-l-2 border-l-accent` + `bg-surface-2` background shift. Delete/action buttons: `opacity-0 group-hover:opacity-100`.
- **KPI dashboard cards:** stagger in with `.card-enter .card-dN` (55ms step delays, spring curve). Never mount instantly.
- Cards only when elevation communicates hierarchy — for simple lists use table rows with `border-b border-hair`.

### Form Inputs (`.input-field`)
- **Resting:** `bg-canvas`, `border: 1px solid var(--hair)`, `rounded-lg`, `text-sm`, `text-ink`.
- **Focus:** `border-color: var(--accent)`, `box-shadow: 0 0 0 3px var(--accent-glow)` — a soft sage focus ring.
- **Label:** Always above the input. `text-xs font-medium text-ink-3 uppercase tracking-wider`. Never floating labels.
- **Error text:** Always below the input in danger color.
- **Placeholder:** `text-ink-4`.
- Selects: same visual treatment as text inputs.

### Badges (`.badge`)
Pill-shaped, `rounded-md` (6px), 11px text, 5 semantic variants:
- **Accent:** sage-dim bg, sage text — positive KPIs, active, pro features.
- **Success:** same as accent in Sage Dark (shared token).
- **Danger:** terracotta-dim bg, terracotta text — low stock, errors, deleted.
- **Warn:** amber-dim bg, amber text — expiring, medium priority.
- **Neutral:** surface-3 bg, ink-3 text — inactive, archived, secondary states.

Sales channel badges: **Dine-in** → accent-tinted, **Takeout** → sky-tinted (`bg-sky-400/15 text-sky-400`), **Delivery** → warn-tinted, **Other** → neutral.

### Tables
- **Head:** sticky `bg-canvas/90 backdrop-blur-sm` — stays visible on scroll. 11px uppercase wider-tracked headers.
- **Row hover:** `bg-surface-2` + `border-l-2 border-l-transparent hover:border-l-accent` — left accent stroke appears.
- **Action buttons on rows:** `opacity-0 group-hover:opacity-100` — hidden by default, revealed on row hover.
- **Tfoot:** `bg-surface-2/50`, `font-semibold text-ink` for totals. Subtle separator from body.

### Skeleton / Loading States (`.shimmer`)
Layout-matched skeletons. **Never circular spinners.**
- Shimmer: `linear-gradient(90deg, surface-2 → surface-3 → surface-2)`, `background-size: 200%`, `1.6s ease-in-out infinite`. Hardware-accelerated via `background-position` animation.

### Empty States
- Centered: `w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center` icon container + two-line copy below.
- Primary: `text-sm font-medium text-ink-2`. Secondary: `text-xs text-ink-4`.
- Optional accent-colored action link. Example: "No sales yet / Log your first sale to get started".

### POS (Point of Sale) — Full-Page Split Panel
Not a modal. Occupies the full dashboard content area as its own route (`/pos`).
- **Left panel:** `flex-1 overflow-hidden` — category tab strip + dish tile grid (2–4 column responsive).
- **Right cart sidebar:** `w-72 xl:w-80 flex flex-col border-l border-hair bg-surface` — always visible, not scrolled away.
- **Dish tiles:** `rounded-xl border`, accent-bordered + `bg-accent/8` when item is in cart. Quantity bubble (absolute positioned top-right corner). Sold-out state: `opacity-50 cursor-not-allowed`.
- **Charge button:** `w-full py-3 rounded-xl btn-primary` pinned at the bottom of the right panel.
- **Cart footer:** Channel selector → Table # + Note → Discount → Service Charge → Total row → Charge button.

### Receipt (Modal)
Triggered after a successful POS charge. Monospace receipt number header. Dashed `border-dashed` dividers for the thermal-receipt aesthetic. Accent-colored total figure. Print button targets `#sizzle-receipt-print` div.

---

## 5. Layout Principles

**Dashboard shell structure:**
- Fixed left sidebar: `w-56 shrink-0 flex flex-col bg-sidebar h-full border-r`.
- Sidebar right border: accent-tinted (`color-mix(in srgb, var(--hair) 60%, var(--accent) 40%)`).
- Content area: `flex-1 overflow-y-auto bg-canvas` with `.dashboard-bg` applied to main content.

**Standard page structure:**
- Page header: `px-6 py-5 flex items-center justify-between border-b border-hair`. Title left, actions right. **Never centered.**
- Filter bar: `px-6 py-2.5 border-b border-hair flex items-center gap-1.5 flex-wrap`.
- Content body: `flex-1 overflow-y-auto min-h-0`.

**Grid conventions:**
- KPI cards: 2-column or asymmetric grids. Never 4-equal-columns on standard dashboard.
- POS dish grid: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3`.
- Form pairs: `grid-cols-2 gap-3`.
- **CSS Grid over flexbox percentage math. No `calc()` hacks.**

**Spacing rhythm:**
- `px-6` is the standard horizontal page padding.
- `gap-2`–`gap-3` for button groups and badge rows.
- `gap-4`–`gap-6` between major card sections.
- `space-y-4` inside form modals.

**Mobile:**
- Sidebar collapses to slide-in sheet with close button.
- All multi-column grids collapse to single column below 768px.
- Touch targets minimum `44px` height on all interactive elements.
- `min-h-[100dvh]` for full-height sections. **Never `h-screen`** (iOS Safari address bar crash).

---

## 6. Motion & Interaction

**Spring curve:** `cubic-bezier(0.16, 1, 0.3, 1)` — overdamped spring. Fast start, smooth weighted settle. Used for ALL entrance animations. Never `ease-out` or `linear` for content reveals.

**Page transitions (`.page-enter`):**
- `opacity: 0→1`, `translateY(7px→0)`, over `0.24s` spring.
- Applied on page root wrapper every route change.

**Staggered card entrance (`.card-enter .card-dN`):**
- `opacity: 0→1`, `translateY(10px→0)`, `0.32s` spring.
- 55ms delay steps: d0=0ms, d1=55ms, d2=110ms, d3=165ms, d4=220ms, d5=275ms.
- Always stagger in reading order (top-left → bottom-right).

**Landing page (`.lp-fade-up`):**
- `opacity: 0→1`, `translateY(22px→0)`, `0.65s` spring.
- 80ms delay steps via `.lp-d1` → `.lp-d6`.

**Nav pending state:**
- Immediate visual response via React `useTransition`.
- 10px spinner at right edge of active nav item.
- Spinner: `0.7s linear` rotation (continuous rotation stays linear, not spring).

**Live / real-time indicators:**
- Pulsing dot: `opacity 1→0.3→1`, `2s cubic-bezier(0.4, 0, 0.6, 1) infinite`.
- `w-1.5 h-1.5 rounded-full bg-accent`. Used on the dashboard header to signal live data.

**Shimmer skeleton:** `1.6s ease-in-out infinite` background-position sweep.

**Nav items:** `0.18s ease` on background, color, box-shadow.

**Button interactions:** gradient position slides `0.4s ease`, brightness `0.15s ease`, box-shadow `0.15s ease`.

**Hardware-acceleration rule:** Animate **only** `transform` and `opacity`. Never animate `top`, `left`, `width`, `height`, `padding`, or `margin`. These trigger layout reflow.

**Reduced motion:** `@media (prefers-reduced-motion: reduce)` collapses all animation/transition durations to `0.01ms`. Every animation is opt-in.

---

## 7. Anti-Patterns (Banned for Stitch Generation)

These are hard bans. If any appear in a generated screen, regenerate:

| Banned | Reason |
|---|---|
| `Inter` font | Sizzle uses `Outfit`. Inter is generic. |
| Pure black `#000000` | Minimum darkness: `#0E1714` (Deep Forest Canvas). |
| Neon outer glow | Glows must use `var(--accent-glow)` (18% opacity max). No full-saturation color shadows. |
| Oversaturated accent | Accent saturation stays below 80%. No electric teal, hot green, or neon pink. |
| AI purple/blue neon aesthetic | Except the intentional Midnight theme (indigo). Never as default. |
| Gradient text on interactive elements | Gradient text only for the Sizzle wordmark and hero headlines. |
| Centered page headers | Dashboard headers: left-aligned title, right-aligned actions. Always. |
| 3-equal-column card grids | Use 2-column, asymmetric, or 4-column responsive POS grid instead. |
| Custom mouse cursor | `cursor: pointer` and `cursor: not-allowed` only. Nothing else. |
| Floating form labels | Labels always above the input field. Never floating. |
| Generic circular spinners | Use layout-matched shimmer skeletons for all loading states. |
| Serif fonts in dashboard | Outfit (sans-serif) everywhere. No Times, Georgia, Garamond, Palatino. |
| Emojis in UI | Zero emoji anywhere except the locked nav item `🔒` indicator (which is itself a design exception). |
| AI copywriting clichés | Banned words: "Elevate", "Seamless", "Unleash", "Next-Gen", "Powerful", "Revolutionize", "Game-Changing". |
| Filler UI chrome | No "Scroll to explore", scroll arrows, bouncing chevrons, "Swipe down" prompts. |
| Generic placeholder content | Never "John Doe", "Acme Corp", "Lorem Ipsum". Use: "Señorita's Kitchen", "Mesa Brew Co", "Rico's Grill". |
| Broken image links | All placeholder images: `picsum.photos` or inline SVG. No Unsplash URLs. |
| `h-screen` | Use `min-h-[100dvh]` for full-height sections (iOS Safari viewport fix). |
| Linear easing on entrances | Spring curve mandatory for all show/hide animations. |
| Cards without hierarchy rationale | Cards only when elevation communicates containment. Use table rows otherwise. |

---

## 8. Theme Palette Reference

All 14 themes share identical token names. Only hex values differ.

| Theme | Archetype | Canvas | Accent |
|---|---|---|---|
| `sage-dark` | Modern Café (default) | `#0E1714` | `#58C098` sage mint |
| `sage-light` | Modern Café (light) | `#F4F0E7` | `#1F5F4A` dark forest |
| `espresso` | Coffee Bar | `#1A1410` | `#D9A876` warm caramel |
| `citrus` | Fast Casual | `#0F1410` | `#C9E663` lime yellow |
| `crimson` | Steakhouse / Italian | `#14100F` | `#DC2626` bold red |
| `ocean` | Seafood / Beach Bar | `#060D14` | `#0EA5E9` sky blue |
| `rose` | Bakery / Patisserie | `#150C10` | `#E879A6` rose pink |
| `ember` | BBQ / Grill | `#130A04` | `#F97316` fire orange |
| `midnight` | Fine Dining / Bar | `#070714` | `#818CF8` soft indigo |
| `harvest` | Brewery / Farm-to-Table | `#14100A` | `#F59E0B` golden amber |
| `jade` | Tea House / Asian | `#071010` | `#10B981` emerald |
| `slate` | Modern Café (cool) | `#0E1017` | `#14B8A6` teal |
| `terracotta` | Mediterranean | `#140C08` | `#C2613B` terracotta orange |
| `ivory` | Premium Brunch (light) | `#FAFAF7` | `#8B5E3C` warm brown |

When generating a new screen: match the theme to the restaurant type in context. Apply via `[data-theme]` on `<html>`. All CSS token names (`--canvas`, `--accent`, `--ink`, etc.) are identical across every theme — only their resolved values change.

---

## 9. Stitch Prompt Recipes

### Stat / KPI Card
```
Dark surface card (bg-surface, rounded-xl, 1px hair border).
Label: 11px, medium, uppercase, wider tracking, ink-4 color. Example: "REVENUE TODAY".
Value: 1.65rem, bold, tabular (monospace), accent color. Example: "₱24,800".
Delta badge below: 11px pill, accent-dim background, accent text. "+12.4% vs yesterday".
Optional pulsing accent dot (w-1.5 h-1.5 bg-accent, 2s opacity pulse) for live data.
No drop-shadow. Card enters with 0.32s spring from translateY(10px).
```

### Data Table Row
```
Table in rounded-xl border border-hair container.
Header: sticky, canvas/90 backdrop-blur-sm, 11px uppercase tracking-wider, ink-4.
Row hover: bg-surface-2 + 2px accent left border appears on left edge.
Numeric cells: tabular monospace, text-right, accent color for totals.
Action buttons (delete): opacity-0, reveals at full opacity on row hover.
Tfoot: surface-2/50 background, font-semibold.
```

### Form Modal
```
Overlay: fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50.
Card: glass class (frosted surface, accent-tinted border), rounded-xl, p-6, max-w-sm w-full.
Title: text-lg font-semibold text-ink.
Labels: text-xs font-medium text-ink-3 uppercase tracking-wider mb-1. Always above input.
Inputs: bg-canvas border border-hair rounded-lg px-3 py-2.5 text-sm.
Focus ring: 3px accent-glow box-shadow.
Button row: flex gap-2 mt-6. btn-secondary left, btn-primary right.
```

### Sidebar Navigation
```
Width: w-56. Background: bg-sidebar. Right border: color-mix(hair 60%, accent 40%).
Logo row: h-[60px] — SizzleLogo (20px) + "Sizzle" in gradient-text + venue name below in ink-4.
Section headers: 10px, semibold, ink-4, uppercase, wider tracking.
Nav items: rounded-lg, 13px, 0.18s transitions.
Active: 2px left accent border, gradient fill, accent text, inset glow.
Pending: 10px spinner at right edge, 0.7s linear spin.
Bottom: Settings + Sign Out + user avatar chip.
```

### POS Split Panel
```
Full-height flex row (no modal, its own /pos route).
Left (flex-1): top bar (POS title + venue + datetime) + category tab strip + dish tile grid (2-4 col).
Right (w-72 xl:w-80): "Order" header + scrollable order list + cart footer (Channel → Table# + Note → Discount → Service Charge → Total → Charge button).
Dish tile: rounded-xl, accent border + accent/8 fill when in cart, quantity bubble top-right (accent bg, canvas text).
Charge button: w-full py-3 btn-primary rounded-xl, shows formatted total.
```
