# 012 — Dashboard Phase 2 Premium Polish

**Date:** 2026-06-20
**Risk:** low-risk
**Status:** implementing

## What

Apply Phase 1 polish tokens (motion/elevation) more deeply to the dashboard page.
The tokens are already defined; this wires them to interactive elements and
progress bars that currently don't use them.

## Changes

### 1. `bar-enter` utility (globals.css)
A GPU-accelerated `scaleX(0 → 1)` keyframe animation for progress bars.
Works entirely in CSS — no client component needed.
`transform-origin: left` so bar grows from the leading edge.
`animation-delay: 150ms` ensures it starts after `card-enter` completes.

Targets:
- Daily target bar (header section)
- Revenue goal / expense budget bars
- Channel breakdown bars
- Expense category bars

### 2. `.lift` on KPI cards
Phase 1 defined `.lift` (translateY -1px hover) but it isn't on the KPI cards yet.
KPI cards already have `card-glow` for shadow transition; adding `.lift` gives
the physical "card lifting off" feel — the two compose cleanly.

### 3. `.press` on Log Sale button
The primary CTA should feel tactile. `.press` adds scale(0.97) on :active.
btn-primary already has color/shadow transitions; this adds the kinesthetic beat.

## Not doing
- New client components — all changes are CSS + className additions
- Structural layout changes — density and layout are locked
