# 014 — Reports Phase 2 Premium Polish

**Date:** 2026-06-20
**Risk:** low-risk
**Status:** implementing

## What

Reports is the "money page" — owners check it before making decisions.
Everything that moves should feel deliberate and responsive.

## Changes

### 1. BarRow: bar-enter animation
Add `bar-enter` to the filled inner div in BarRow. Also key each BarRow
as `${selected}-${category/channel}` so React unmounts+remounts it on
month switch, causing the animation to re-run with the new data.
Same pattern for channel bars.

### 2. DonutChart: content-in fade on mount/switch
Add `content-in` to the DonutChart container div. Add `key={selected}` to
each DonutChart call so it unmounts+remounts when the month changes, giving
a graceful fade-in on every month switch. The SVG segment values update
alongside the animation.

### 3. KPI cards: .lift
Same `lift` class added to dashboard KPI cards — `translateY(-1px)` hover
makes them feel like pressable data panels.

### 4. Month pills + sort buttons: active:scale
Month pills: `active:scale-[0.97]` (they already have transition-all).
Sort Revenue/Qty toggle buttons: `active:scale-[0.95]`.
