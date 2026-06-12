# Design System: Sizzle — Restaurant & Café Owner Dashboard

> **Stitch prompt source of truth.** Use this document when generating any new screen, component, or section for Sizzle. Every rule is deliberate — do not revert to generic dashboard conventions.
> Stack: Next.js 16 · Tailwind CSS 4 · React 19 · Supabase · Drizzle ORM

---

## 1. Visual Theme & Atmosphere

Sizzle is a **financial operating dashboard** for small restaurant and café owners — non-technical people who open it late at night to see if they made money today. The aesthetic is **calm, clean, and professional**: a warm-dark console where every peso reads clearly and nothing screams for attention. It should feel like a steady hand, not a casino. Trust and legibility beat spectacle at every turn.

- **Dark-first, warm-neutral base** — deep warm near-black backgrounds (ember/espresso undertone) that feel grounded and easy on the eyes at night. Never harsh, never pure black.
- **Density: 7/10 (Cockpit, breathing)** — real data lives here (KPIs, tables, charts), but generous gutters and clear grouping keep every screen scannable. When in doubt, add whitespace and remove a card. Density rises as the user goes deeper (dashboard → POS → reports).
- **Variance: 3/10 in the app (Predictable, scannable)** — the same KPI lives in the same place every day so owners build muscle memory. Left-aligned headers, structured grids. **Higher variance (5/10) is allowed only on the marketing landing hero.**
- **Motion: 3/10 (Restrained)** — subtle entrance fades and clean state transitions only. A financial dashboard that animates constantly erodes trust. No perpetual loops on data; reserve any live motion for a single genuine real-time indicator.

The overall impression: **a well-run kitchen pass at night** — focused, unhurried, everything in its place. Confident. Operational. Minimal without feeling empty.

**Theme system:** Sizzle ships **20 curated food-named palettes** (`ember`, `bourbon`, `truffle`, `fig-jam`, `velvet-cake`, `forest-floor`, `carbon-steel`, `smoke-blue`, `streetlight`, `kimchi`, `tangerine`, `cardamom`, `mint-leaf` — plus light palettes `almond-milk`, `chiffon`, `coconut-cream`, `porcelain`, `macaron`, `iced-matcha`, `lavender-honey`). All themes share identical token names — only the hex values change. **Design against `ember` (the default) unless specified.**

---

## 2. Color Palette & Roles

### Default: Ember (warm-dark, fire-orange accent) — real `:root` tokens

- **Deep Ember Canvas** (`#130A04`) — Primary page background. The darkest layer. Warm near-black, visible amber undertone. Never pure black.
- **Canvas Raise** (`#1A1008`) — Subtle raised background bands; dashboard depth.
- **Sidebar Char** (`#180E06`) — Sidebar column background. Barely distinct from canvas — intentional.
- **Surface** (`#1F1408`) — Card fill, modal backgrounds, primary elevated containers.
- **Surface Raise** (`#281A0C`) — Table row hover states, nested card fills, dropdown backgrounds.
- **Surface Deep** (`#301F10`) — Tertiary fills, active dropdown items, deepest inset panels.
- **Primary Ink** (`#F8ECE0`) — Primary text & key figures. Warm off-white, not clinical white.
- **Secondary Ink** (`#D0A880`) — Secondary text, subtitles, sidebar venue name, helper copy.
- **Tertiary Ink** (`#B88A5D`) — Tertiary text, timestamps, table column headers, axis labels.
- **Muted Ink** (`#A57450`) — Faintest metadata, icon fills at rest. **WCAG-AA on canvas/surface — do not go lower.**
- **Hairline** (`#3E2810`) — All structural 1px dividers — sections, table rows, card edges (the primary structural line).
- **Hairline Deep** (`#342008`) — Nested borders, double-border effects inside panels.
- **Ember Accent** (`#F97316`) — THE SINGLE ACCENT. Primary buttons, active nav indicator, focus rings, the one hero number, progress fills, chart primary series. Use it *sparingly* — it means "act here" or "this is the number that matters."
- **Ember Light** (`#FB923C`) — Hover variant of accent; gradient endpoint for the primary button.
- **Ember End** (`#EA580C`) — Deeper gradient stop for the primary button.
- **Ember Wash** (`rgba(249,115,22,0.12)`) — Badge backgrounds, active-row tint, subtle overlays (a flat fill, **not** a glow).
- **Warn Amber** (`#F59E0B`) — Low stock, expiring trial, attention-needed. Distinct from the ember accent (don't confuse the two).
- **Danger Red** (`#DC2626`) — Loss, over-budget, destructive actions, errors. Reserved & semantic — never decorative.

> **Financial semantics are reserved.** Positive (theme green token) / Danger / Warn carry meaning (up, loss, attention) — never used to "brighten up" a layout. Ember is the only decorative-capable color, and it's earned by rarity.

> **Glow restraint (retune):** legacy `--accent-glow` / radial dashboard glows exist in the codebase. On **new** work, prefer flat `Ember Wash` tints and hairline structure over ember halos — calmer reads more professional.

### Light palettes (e.g. `porcelain`, `almond-milk`, `chiffon`)
Same token roles, inverted: warm off-white canvas (never pure `#FFFFFF` as the page), deep warm ink, a darker accent for AA contrast. Cards may use pure white sparingly as a raised surface.

### Stitch Color Principle
Always describe colors by **role and descriptive name** — never just a hex. Example: "Ember Accent (#F97316) on the primary CTA" not just "#F97316 button". Stitch interprets the semantic context.

---

## 3. Typography Rules

**Primary (UI) Font — current reality:** the **native system sans stack** (`--font-sans`: `-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, …`). This renders as SF Pro on Apple, Segoe on Windows — clean, fast, zero web-font payload, and genuinely "seamless/native." It is the intended face today, not a fallback.

> **Recommended upgrade (for a more distinctive, premium-yet-minimal feel):** adopt **`Geist` Sans** as the UI face. You already load **`Geist Mono`** via `next/font`, so adding `Geist` Sans is a one-line change and pairs perfectly with it. Geist is clean, modern, and ownable without being loud — a better fit for "professional" than the generic system stack. **Do NOT use `Inter`** (generic AI tell) or any serif. If staying on system for now, that's acceptable and still clean.

**Monospace Font:** **`Geist Mono`** (loaded via `next/font`, `--font-mono`). Used exclusively for financial figures, currency, timestamps, percentages, IDs, receipt numbers, and quantity counts. Applied via `.tabular`. **Every peso amount and count is mono** (density > 7 → monospace alignment is mandatory; money columns align on the decimal).

**Global settings on `body`:**
- `letter-spacing: -0.01em` — a slightly tighter, intentional feel across all text.
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
- **No serif fonts in this dashboard.** Sans-serif everywhere (system stack or Geist). No Times, Georgia, Garamond.

---

## 4. Component Stylings

### Primary Button (`.btn-primary`)
A gradient pill that flows between accent → accent-end → accent-2. The gradient **slides** on hover — it's a moving shimmer, not a flat fill.

- **Resting:** ember gradient `linear-gradient(135deg, var(--accent) 0%, var(--accent-end) 50%, var(--accent-2) 100%)` (ember `#F97316` → `#EA580C` → `#FB923C`) at `background-position: 0%`. Text color: Deep Ember Canvas (the darkest background color). *(Calmer option for a more minimal read: a flat `var(--accent)` fill with no gradient slide.)*
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
- **Focus:** `border-color: var(--accent)`, `box-shadow: 0 0 0 3px var(--accent-glow)` — a soft ember focus ring.
- **Label:** Always above the input. `text-xs font-medium text-ink-3 uppercase tracking-wider`. Never floating labels.
- **Error text:** Always below the input in danger color.
- **Placeholder:** `text-ink-4`.
- Selects: same visual treatment as text inputs.

### Badges (`.badge`)
Pill-shaped, `rounded-md` (6px), 11px text, 5 semantic variants:
- **Accent:** ember-dim bg, ember text — active, pro features, highlighted figures.
- **Success:** positive (green) token bg + text — healthy margin, in-budget, revenue up.
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
| `Inter` font | Generic AI tell. Sizzle uses the system sans stack (or Geist). Never Inter. |
| Pure black `#000000` | Minimum darkness: `#130A04` (Deep Ember Canvas). Warm near-blacks only. |
| Neon outer glow | Glows must use `var(--accent-glow)` (18% opacity max). No full-saturation color shadows. |
| Oversaturated accent | Accent saturation stays below 80%. No electric teal, hot green, or neon pink. |
| AI purple/blue neon aesthetic | Except the intentional Midnight theme (indigo). Never as default. |
| Gradient text on interactive elements | Gradient text only for the Sizzle wordmark and hero headlines. |
| Centered page headers | Dashboard headers: left-aligned title, right-aligned actions. Always. |
| 3-equal-column card grids | Use 2-column, asymmetric, or 4-column responsive POS grid instead. |
| Custom mouse cursor | `cursor: pointer` and `cursor: not-allowed` only. Nothing else. |
| Floating form labels | Labels always above the input field. Never floating. |
| Generic circular spinners | Use layout-matched shimmer skeletons for all loading states. |
| Serif fonts in dashboard | Sans-serif everywhere (system or Geist). No Times, Georgia, Garamond, Palatino. |
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

All **20 food-named themes** share identical token names. Only hex values differ. The default is **`ember`** (the `:root` palette).

**Dark palettes:** `ember` (default · warm fire-orange), `bourbon`, `truffle`, `fig-jam`, `velvet-cake`, `forest-floor`, `carbon-steel`, `smoke-blue`, `streetlight`, `kimchi`, `tangerine`, `cardamom`, `mint-leaf`.

**Light palettes:** `almond-milk`, `chiffon`, `coconut-cream`, `porcelain`, `macaron`, `iced-matcha`, `lavender-honey`.

When generating a new screen, design against **`ember`** unless told otherwise. Apply themes via `[data-theme]` on `<html>`. All CSS token names (`--canvas`, `--surface`, `--accent`, `--ink`, `--ink-4`, `--hair`, etc.) are identical across every theme — only their resolved values change, so a screen built with tokens (never hard-coded hex) works in all 20 automatically. **Always reference tokens, not literal hex, in generated component code.**

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
