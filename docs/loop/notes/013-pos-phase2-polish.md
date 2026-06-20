# 013 — POS Phase 2 Premium Polish

**Date:** 2026-06-20
**Risk:** low-risk
**Status:** implementing

## What

The POS is a high-touch surface operated under time pressure. Every tap
target should give immediate kinesthetic feedback. Current state: hover
states change color/border but there's no scale response on press.

## Changes

### 1. `btn-primary` press feel (globals.css)
Extend `.btn-primary` transition to include `transform 140ms --ease-out`,
and add `:active:not(:disabled) { transform: scale(0.97) }` directly in the
class — avoids conflict with `.press` overriding the existing gradient
background-position/filter/box-shadow transitions.

### 2. `active:scale-[0.97]` on dish tiles (Tailwind)
Non-sold-out tiles get `active:scale-[0.97]` via Tailwind's active: variant.
`transition-all` already on the tile means the transform is included, giving
a 150ms ease-in-out shrink. Sold-out tiles are `pointer-events: none` so
this never fires on them.

### 3. `active:scale-[0.97]` on qty +/- buttons, Clear, category tabs,
   channel selector, discount/SC quick-select buttons, mobile View Order CTA.

## Not doing
- Structural layout changes
- New client state
- Receipt modal styling (white paper receipt is intentional, no dark-mode)
