'use client'

// Live mini app-screen components for the landing page screenshot gallery.
// All colors use CSS variables so they respond to data-theme changes automatically.

import React from 'react'

// ── Shared shell ───────────────────────────────────────────────────────────────

function MiniSidebar({ activeIdx = 0 }: { activeIdx?: number }) {
  return (
    <div style={{
      width: 40, background: 'var(--sidebar)', borderRight: '1px solid var(--hair)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '12px 0 10px', gap: 11, flexShrink: 0,
    }}>
      <div style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--accent)', marginBottom: 2 }} />
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} style={{
          width: i === activeIdx ? 20 : 15, height: 3, borderRadius: 2,
          background: i === activeIdx ? 'var(--accent)' : 'var(--surface-3)',
          opacity: i === activeIdx ? 1 : 0.5,
        }} />
      ))}
    </div>
  )
}

function MiniPage({ children, activeIdx = 0 }: { children: React.ReactNode; activeIdx?: number }) {
  return (
    <div style={{ display: 'flex', height: '100%', fontFamily: 'system-ui,-apple-system,sans-serif', overflow: 'hidden', background: 'var(--canvas)' }}>
      <MiniSidebar activeIdx={activeIdx} />
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'var(--canvas)' }}>
        {children}
      </div>
    </div>
  )
}

function MiniHeader({ title, sub, action }: { title: string; sub?: string; action?: string }) {
  return (
    <div style={{
      padding: '9px 12px 8px', borderBottom: '1px solid var(--hair)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
    }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1 }}>{title}</div>
        {sub && <div style={{ fontSize: 7.5, color: 'var(--ink-4)', marginTop: 2 }}>{sub}</div>}
      </div>
      {action && (
        <div style={{ fontSize: 7.5, fontWeight: 600, color: 'var(--canvas)', background: 'var(--accent)', padding: '3px 8px', borderRadius: 4, flexShrink: 0 }}>
          {action}
        </div>
      )}
    </div>
  )
}

// ── Sales ──────────────────────────────────────────────────────────────────────

export function SalesMock() {
  const channels = [
    { label: 'Dine-in',  pct: 62, value: '₱11,445' },
    { label: 'Takeout',  pct: 24, value: '₱4,430'  },
    { label: 'Delivery', pct: 14, value: '₱2,585'  },
  ]
  const rows = [
    { time: '11:42', item: 'Iced Matcha Latte', ch: 'Dine-in',  amt: '₱185' },
    { time: '11:38', item: 'Avocado Toast',     ch: 'Takeout',  amt: '₱295' },
    { time: '11:30', item: 'Cold Brew Coffee',  ch: 'Dine-in',  amt: '₱165' },
    { time: '11:24', item: 'Spam Silog',        ch: 'Delivery', amt: '₱220' },
    { time: '11:18', item: 'Champorado',        ch: 'Dine-in',  amt: '₱120' },
    { time: '11:05', item: 'Turon w/ Langka',   ch: 'Takeout',  amt: '₱65'  },
  ]
  const bars = [42, 65, 48, 72, 58, 80, 64, 55, 78, 68, 90, 73, 95, 82]

  return (
    <MiniPage activeIdx={0}>
      <MiniHeader title="Sales" sub="Today, May 26 · ₱18,460 total" action="+ Log Sale" />
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '8px 10px', gap: 7 }}>

        <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
          {channels.map(c => (
            <div key={c.label} style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--hair)', borderRadius: 6, padding: '5px 7px' }}>
              <div style={{ fontSize: 7, color: 'var(--ink-4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>{c.label}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1.3, marginTop: 2 }}>{c.value}</div>
              <div style={{ fontSize: 7.5, color: 'var(--accent)', fontWeight: 600, marginTop: 1 }}>{c.pct}%</div>
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--hair)', borderRadius: 6, overflow: 'hidden', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '30px 1fr 50px 36px', padding: '4px 8px', borderBottom: '1px solid var(--hair)', gap: 4 }}>
            {['Time', 'Item', 'Channel', 'Amt'].map(h => (
              <span key={h} style={{ fontSize: 6.5, color: 'var(--ink-4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</span>
            ))}
          </div>
          {rows.map((r, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '30px 1fr 50px 36px', padding: '4px 8px', gap: 4, borderBottom: i < rows.length - 1 ? '1px solid var(--hair)' : 'none', alignItems: 'center' }}>
              <span style={{ fontSize: 7.5, color: 'var(--ink-4)', fontFamily: 'monospace' }}>{r.time}</span>
              <span style={{ fontSize: 8, color: 'var(--ink)', fontWeight: 500 }}>{r.item}</span>
              <span style={{ fontSize: 7.5, color: 'var(--ink-3)' }}>{r.ch}</span>
              <span style={{ fontSize: 8, color: 'var(--accent)', fontWeight: 700, textAlign: 'right' }}>{r.amt}</span>
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--hair)', borderRadius: 6, padding: '5px 8px', flexShrink: 0 }}>
          <div style={{ fontSize: 7, color: 'var(--ink-4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>14-day trend</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 24 }}>
            {bars.map((h, i) => (
              <div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: '2px 2px 0 0', background: 'var(--accent)', opacity: 0.4 + (i / bars.length) * 0.6 }} />
            ))}
          </div>
        </div>

      </div>
    </MiniPage>
  )
}

// ── Menu ───────────────────────────────────────────────────────────────────────

export function MenuMock() {
  const items = [
    { name: 'Iced Matcha Latte', price: '₱185', cost: '₱46',  costPct: 25, margin: 75 },
    { name: 'Avocado Toast',     price: '₱295', cost: '₱89',  costPct: 30, margin: 70 },
    { name: 'Cold Brew Coffee',  price: '₱165', cost: '₱41',  costPct: 25, margin: 75 },
    { name: 'Mushroom Pasta',    price: '₱260', cost: '₱101', costPct: 39, margin: 61 },
    { name: 'Turon w/ Langka',   price: '₱65',  cost: '₱18',  costPct: 28, margin: 72 },
    { name: 'Spam Silog',        price: '₱220', cost: '₱88',  costPct: 40, margin: 60 },
    { name: 'Champorado',        price: '₱120', cost: '₱24',  costPct: 20, margin: 80 },
  ]
  const marginColor = (m: number) => m >= 70 ? 'var(--success)' : m >= 60 ? 'var(--warn)' : 'var(--danger)'

  return (
    <MiniPage activeIdx={2}>
      <MiniHeader title="Menu" sub="7 items · Recipe costs up to date" action="+ Add Item" />
      <div style={{ flex: 1, overflow: 'hidden', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--hair)', borderRadius: 6, overflow: 'hidden', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 34px 34px 52px 36px', padding: '4px 8px', borderBottom: '1px solid var(--hair)', gap: 4 }}>
            {['Item', 'Price', 'Cost', 'Food %', 'Margin'].map(h => (
              <span key={h} style={{ fontSize: 6.5, color: 'var(--ink-4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</span>
            ))}
          </div>
          {items.map((it, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 34px 34px 52px 36px', padding: '5px 8px', gap: 4, borderBottom: i < items.length - 1 ? '1px solid var(--hair)' : 'none', alignItems: 'center' }}>
              <span style={{ fontSize: 8, color: 'var(--ink)', fontWeight: 500 }}>{it.name}</span>
              <span style={{ fontSize: 8, color: 'var(--ink-2)', textAlign: 'right' }}>{it.price}</span>
              <span style={{ fontSize: 8, color: 'var(--ink-3)', textAlign: 'right' }}>{it.cost}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <div style={{ flex: 1, height: 3, background: 'var(--surface-3)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${it.costPct * 2.5}%`, background: it.costPct >= 35 ? 'var(--danger)' : 'var(--warn)', borderRadius: 2 }} />
                </div>
                <span style={{ fontSize: 7, color: it.costPct >= 35 ? 'var(--danger)' : 'var(--ink-3)', fontWeight: 600, minWidth: 18 }}>{it.costPct}%</span>
              </div>
              <span style={{ fontSize: 8.5, fontWeight: 700, color: marginColor(it.margin), textAlign: 'right' }}>{it.margin}%</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {([['var(--success)', '≥ 70% margin'], ['var(--warn)', '60–70%'], ['var(--danger)', '< 60%']] as const).map(([c, l]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <div style={{ width: 6, height: 6, borderRadius: 2, background: c }} />
              <span style={{ fontSize: 7, color: 'var(--ink-4)' }}>{l}</span>
            </div>
          ))}
        </div>

      </div>
    </MiniPage>
  )
}

// ── Expenses ───────────────────────────────────────────────────────────────────

export function ExpensesMock() {
  const cats = [
    { label: 'Ingredients', spent: 84200, budget: 90000 },
    { label: 'Labor',       spent: 52800, budget: 55000 },
    { label: 'Rent',        spent: 28000, budget: 28000 },
    { label: 'Utilities',   spent: 12400, budget: 15000 },
    { label: 'Packaging',   spent: 4800,  budget: 6000  },
    { label: 'Marketing',   spent: 2200,  budget: 5000  },
  ]
  const fmt = (n: number) => n >= 1000 ? `₱${(n / 1000).toFixed(0)}K` : `₱${n}`
  const pct = (s: number, b: number) => Math.round((s / b) * 100)
  const barColor = (p: number) => p >= 100 ? 'var(--danger)' : p >= 85 ? 'var(--warn)' : 'var(--accent)'

  return (
    <MiniPage activeIdx={1}>
      <MiniHeader title="Expenses" sub="May 2026 · ₱184,400 total" action="+ Add" />
      <div style={{ flex: 1, overflow: 'hidden', padding: '7px 10px', display: 'flex', flexDirection: 'column', gap: 5 }}>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--hair)', borderRadius: 6, padding: '5px 8px', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 7.5, color: 'var(--ink-3)' }}>Total this month</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em' }}>₱184.4K</span>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--hair)', borderRadius: 6, overflow: 'hidden', flex: 1 }}>
          {cats.map((c, i) => {
            const p = pct(c.spent, c.budget)
            return (
              <div key={c.label} style={{ padding: '5px 8px', borderBottom: i < cats.length - 1 ? '1px solid var(--hair)' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 8, color: 'var(--ink-2)', fontWeight: 500 }}>{c.label}</span>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'baseline' }}>
                    <span style={{ fontSize: 8, fontWeight: 700, color: p >= 100 ? 'var(--danger)' : 'var(--ink)' }}>{fmt(c.spent)}</span>
                    <span style={{ fontSize: 7, color: 'var(--ink-4)' }}>/ {fmt(c.budget)}</span>
                  </div>
                </div>
                <div style={{ height: 3, background: 'var(--surface-3)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(p, 100)}%`, background: barColor(p), borderRadius: 2 }} />
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </MiniPage>
  )
}

// ── Reports ────────────────────────────────────────────────────────────────────

export function ReportsMock() {
  const months = [
    { m: 'Dec', rev: 320, foodCost: 96,  net: 176 },
    { m: 'Jan', rev: 345, foodCost: 103, net: 190 },
    { m: 'Feb', rev: 368, foodCost: 110, net: 202 },
    { m: 'Mar', rev: 390, foodCost: 117, net: 214 },
    { m: 'Apr', rev: 405, foodCost: 122, net: 222 },
    { m: 'May', rev: 420, foodCost: 126, net: 194 },
  ]

  return (
    <MiniPage activeIdx={4}>
      <MiniHeader title="Reports · P&L" sub="May 2026" />
      <div style={{ flex: 1, overflow: 'hidden', padding: '7px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>

        <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
          {[
            { label: 'Revenue',    value: '₱420K', color: 'var(--accent)'  },
            { label: 'Food Cost',  value: '30%',   color: 'var(--warn)'    },
            { label: 'Net Margin', value: '46%',   color: 'var(--success)' },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--hair)', borderRadius: 6, padding: '5px 7px' }}>
              <div style={{ fontSize: 7, color: 'var(--ink-4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>{s.label}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: s.color, letterSpacing: '-0.02em', lineHeight: 1.3, marginTop: 2 }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--hair)', borderRadius: 6, overflow: 'hidden', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 1fr 1fr', padding: '4px 8px', borderBottom: '1px solid var(--hair)', gap: 4 }}>
            {['Mo', 'Revenue', 'Food Cost', 'Net'].map(h => (
              <span key={h} style={{ fontSize: 6.5, color: 'var(--ink-4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</span>
            ))}
          </div>
          {months.map((r, i) => (
            <div key={r.m} style={{
              display: 'grid', gridTemplateColumns: '28px 1fr 1fr 1fr',
              padding: '4px 8px', gap: 4,
              borderBottom: i < months.length - 1 ? '1px solid var(--hair)' : 'none',
              background: i === months.length - 1 ? 'var(--surface-2)' : 'transparent',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: 8, color: 'var(--ink-3)', fontWeight: i === months.length - 1 ? 700 : 400 }}>{r.m}</span>
              <span style={{ fontSize: 8, color: 'var(--accent)', fontWeight: 600 }}>₱{r.rev}K</span>
              <span style={{ fontSize: 8, color: 'var(--ink-3)' }}>₱{r.foodCost}K</span>
              <span style={{ fontSize: 8, color: 'var(--success)', fontWeight: 600 }}>₱{r.net}K</span>
            </div>
          ))}
        </div>

      </div>
    </MiniPage>
  )
}

// ── Employees ──────────────────────────────────────────────────────────────────

export function EmployeesMock() {
  const staff = [
    { name: 'Ana Cruz',      initials: 'AC', role: 'Barista',        type: 'Daily',   rate: '₱650/day',  active: true  },
    { name: 'Ben Reyes',     initials: 'BR', role: 'Head Cook',      type: 'Monthly', rate: '₱18K/mo',   active: true  },
    { name: 'Carla Sy',      initials: 'CS', role: 'Cashier',        type: 'Daily',   rate: '₱580/day',  active: true  },
    { name: 'Diego Tan',     initials: 'DT', role: 'Kitchen Helper', type: 'Hourly',  rate: '₱95/hr',    active: true  },
    { name: 'Ella Bautista', initials: 'EB', role: 'Barista',        type: 'Daily',   rate: '₱630/day',  active: false },
  ]

  return (
    <MiniPage activeIdx={5}>
      <MiniHeader title="Employees" sub="5 staff · Est. ₱52,800/mo labor" action="+ Add" />
      <div style={{ flex: 1, overflow: 'hidden', padding: '7px 10px', display: 'flex', flexDirection: 'column', gap: 5 }}>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--hair)', borderRadius: 6, overflow: 'hidden', flex: 1 }}>
          {staff.map((s, i) => (
            <div key={s.name} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '5px 8px', borderBottom: i < staff.length - 1 ? '1px solid var(--hair)' : 'none',
              opacity: s.active ? 1 : 0.45,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', background: 'var(--accent-dim)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 7, fontWeight: 700, color: 'var(--accent)', flexShrink: 0,
                }}>
                  {s.initials}
                </div>
                <div>
                  <div style={{ fontSize: 8.5, fontWeight: 600, color: 'var(--ink)' }}>{s.name}</div>
                  <div style={{ fontSize: 7, color: 'var(--ink-4)' }}>{s.role}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 7, color: 'var(--ink-4)', background: 'var(--surface-2)', padding: '2px 5px', borderRadius: 3, marginBottom: 2 }}>{s.type}</div>
                <div style={{ fontSize: 8, fontWeight: 600, color: 'var(--ink-2)' }}>{s.rate}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--hair)', borderRadius: 6, padding: '5px 8px', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 7.5, color: 'var(--ink-3)' }}>Est. monthly labor cost</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em' }}>₱52,800</span>
        </div>

      </div>
    </MiniPage>
  )
}

// ── Waste ──────────────────────────────────────────────────────────────────────

export function WasteMock() {
  const entries = [
    { date: '26', item: 'Chicken Breast', reason: 'Spoiled',  qty: '1.2 kg', loss: '₱336' },
    { date: '25', item: 'Cooking Oil',    reason: 'Overuse',  qty: '0.8 L',  loss: '₱96'  },
    { date: '24', item: 'Lettuce Mix',    reason: 'Expired',  qty: '500 g',  loss: '₱85'  },
    { date: '23', item: 'Heavy Cream',    reason: 'Expired',  qty: '250 ml', loss: '₱75'  },
    { date: '22', item: 'Avocado',        reason: 'Overripe', qty: '3 pcs',  loss: '₱135' },
  ]

  return (
    <MiniPage activeIdx={3}>
      <MiniHeader title="Waste Log" sub="May 2026 · Est. loss ₱2,840" action="+ Log" />
      <div style={{ flex: 1, overflow: 'hidden', padding: '7px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>

        <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
          {[
            { label: 'Est. Loss', value: '₱2,840', color: 'var(--danger)' },
            { label: '% Revenue', value: '1.5%',   color: 'var(--ink)'    },
            { label: 'Entries',   value: '18',      color: 'var(--ink)'    },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--hair)', borderRadius: 6, padding: '5px 7px' }}>
              <div style={{ fontSize: 7, color: 'var(--ink-4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>{s.label}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: s.color, letterSpacing: '-0.02em', lineHeight: 1.3, marginTop: 2 }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--hair)', borderRadius: 6, overflow: 'hidden', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '20px 1fr 42px 36px 36px', padding: '4px 8px', borderBottom: '1px solid var(--hair)', gap: 4 }}>
            {['Day', 'Ingredient', 'Reason', 'Qty', 'Loss'].map(h => (
              <span key={h} style={{ fontSize: 6.5, color: 'var(--ink-4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</span>
            ))}
          </div>
          {entries.map((r, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '20px 1fr 42px 36px 36px', padding: '4px 8px', gap: 4, borderBottom: i < entries.length - 1 ? '1px solid var(--hair)' : 'none', alignItems: 'center' }}>
              <span style={{ fontSize: 7.5, color: 'var(--ink-4)', fontFamily: 'monospace' }}>{r.date}</span>
              <span style={{ fontSize: 8, color: 'var(--ink)', fontWeight: 500 }}>{r.item}</span>
              <span style={{ fontSize: 7.5, color: 'var(--ink-3)' }}>{r.reason}</span>
              <span style={{ fontSize: 7.5, color: 'var(--ink-3)' }}>{r.qty}</span>
              <span style={{ fontSize: 8, color: 'var(--danger)', fontWeight: 700, textAlign: 'right' }}>{r.loss}</span>
            </div>
          ))}
        </div>

      </div>
    </MiniPage>
  )
}

// ── Payroll ────────────────────────────────────────────────────────────────────

export function PayrollMock() {
  const run = [
    { name: 'Ana Cruz',  days: '15',  gross: '₱9,750', ded: '—',    net: '₱9,750' },
    { name: 'Ben Reyes', days: 'mo',  gross: '₱9,000', ded: '₱450', net: '₱8,550' },
    { name: 'Carla Sy',  days: '15',  gross: '₱8,700', ded: '—',    net: '₱8,700' },
  ]
  const prev = [
    { period: 'Apr 16–30', net: '₱26,400' },
    { period: 'Apr 1–15',  net: '₱24,200' },
  ]

  return (
    <MiniPage activeIdx={6}>
      <MiniHeader title="Payroll Runs" sub="May 1–15, 2026 · 3 employees" action="Run Payroll" />
      <div style={{ flex: 1, overflow: 'hidden', padding: '7px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--hair)', borderRadius: 6, padding: '6px 10px', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 16 }}>
            {[
              { label: 'Gross Pay',  value: '₱27,450', color: 'var(--ink)'     },
              { label: 'Deductions', value: '−₱450',   color: 'var(--danger)'  },
              { label: 'Net Pay',    value: '₱27,000', color: 'var(--success)' },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: 7, color: 'var(--ink-4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>{s.label}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: s.color, letterSpacing: '-0.02em', marginTop: 2 }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--hair)', borderRadius: 6, overflow: 'hidden', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 24px 46px 38px 46px', padding: '4px 8px', borderBottom: '1px solid var(--hair)', gap: 4 }}>
            {['Employee', 'Days', 'Gross', 'Ded.', 'Net'].map(h => (
              <span key={h} style={{ fontSize: 6.5, color: 'var(--ink-4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</span>
            ))}
          </div>
          {run.map((r, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 24px 46px 38px 46px', padding: '5px 8px', gap: 4, borderBottom: '1px solid var(--hair)', alignItems: 'center' }}>
              <span style={{ fontSize: 8, color: 'var(--ink)', fontWeight: 500 }}>{r.name}</span>
              <span style={{ fontSize: 7.5, color: 'var(--ink-4)', textAlign: 'center' }}>{r.days}</span>
              <span style={{ fontSize: 8, color: 'var(--ink-2)', textAlign: 'right' }}>{r.gross}</span>
              <span style={{ fontSize: 8, color: 'var(--danger)', textAlign: 'right' }}>{r.ded}</span>
              <span style={{ fontSize: 8, fontWeight: 700, color: 'var(--success)', textAlign: 'right' }}>{r.net}</span>
            </div>
          ))}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 24px 46px 38px 46px', padding: '4px 8px', gap: 4, background: 'var(--surface-2)', alignItems: 'center' }}>
            <span style={{ fontSize: 8, color: 'var(--ink-3)', fontWeight: 700 }}>Total</span>
            <span />
            <span style={{ fontSize: 8, fontWeight: 700, color: 'var(--ink)', textAlign: 'right' }}>₱27,450</span>
            <span style={{ fontSize: 8, fontWeight: 700, color: 'var(--danger)', textAlign: 'right' }}>₱450</span>
            <span style={{ fontSize: 8, fontWeight: 700, color: 'var(--success)', textAlign: 'right' }}>₱27,000</span>
          </div>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--hair)', borderRadius: 6, padding: '5px 8px', flexShrink: 0 }}>
          <div style={{ fontSize: 7, color: 'var(--ink-4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Previous runs</div>
          {prev.map(p => (
            <div key={p.period} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: 8, color: 'var(--ink-3)' }}>{p.period}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontSize: 8, fontWeight: 600, color: 'var(--ink-2)' }}>{p.net}</span>
                <span style={{ fontSize: 7, color: 'var(--success)', fontWeight: 600 }}>Paid</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </MiniPage>
  )
}

// ── POS ───────────────────────────────────────────────────────────────────────

export function POSMock() {
  const items = [
    { name: 'Iced Matcha', price: '₱185' },
    { name: 'Cold Brew', price: '₱165' },
    { name: 'Avocado Toast', price: '₱295' },
    { name: 'Spam Silog', price: '₱220' },
    { name: 'Champorado', price: '₱120' },
    { name: 'Turon', price: '₱65' },
  ]
  return (
    <MiniPage activeIdx={7}>
      <MiniHeader title="Point of Sale" sub="Fast item picker · channel selector" action="Record Sale" />
      <div style={{ flex: 1, overflow: 'hidden', padding: '7px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>

        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {['Dine-in', 'Takeout', 'Delivery'].map((c, i) => (
            <div key={c} style={{
              flex: 1, textAlign: 'center', padding: '4px 0',
              background: i === 0 ? 'var(--accent)' : 'var(--surface)',
              border: i === 0 ? 'none' : '1px solid var(--hair)',
              borderRadius: 5,
              fontSize: 7, fontWeight: 700, letterSpacing: '.03em',
              color: i === 0 ? 'var(--canvas)' : 'var(--ink-4)',
            }}>
              {c}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, flex: 1 }}>
          {items.map((item, i) => (
            <div key={i} style={{
              background: i === 0 ? 'color-mix(in srgb, var(--accent) 18%, var(--surface))' : 'var(--surface)',
              border: i === 0 ? '1px solid var(--accent)' : '1px solid var(--hair)',
              borderRadius: 5, padding: '6px 6px',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 7.5, color: 'var(--ink)', fontWeight: 600, lineHeight: 1.2 }}>{item.name}</span>
              <span style={{ fontSize: 9, color: i === 0 ? 'var(--accent)' : 'var(--ink-3)', fontWeight: 700, marginTop: 4 }}>{item.price}</span>
            </div>
          ))}
        </div>

        <div style={{
          background: 'var(--surface)', border: '1px solid var(--hair)',
          borderRadius: 6, padding: '6px 8px', flexShrink: 0,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: 7, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600 }}>Selected</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em', marginTop: 2 }}>₱185</div>
          </div>
          <div style={{ fontSize: 8, fontWeight: 700, color: 'var(--canvas)', background: 'var(--accent)', padding: '5px 10px', borderRadius: 4 }}>
            Record Sale
          </div>
        </div>

      </div>
    </MiniPage>
  )
}

// ── QR Menu ────────────────────────────────────────────────────────────────────

export function QRMenuMock() {
  const menuItems = [
    { name: 'Iced Matcha Latte', price: '₱185', cat: 'Drinks' },
    { name: 'Cold Brew Coffee',  price: '₱165', cat: 'Drinks' },
    { name: 'Avocado Toast',     price: '₱295', cat: 'Food'   },
    { name: 'Spam Silog',        price: '₱220', cat: 'Food'   },
    { name: 'Champorado',        price: '₱120', cat: 'Food'   },
  ]
  return (
    <div style={{
      display: 'flex', height: '100%', fontFamily: 'system-ui,-apple-system,sans-serif',
      overflow: 'hidden', background: 'var(--canvas)', flexDirection: 'column',
    }}>
      <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid var(--hair)', background: 'var(--sidebar)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em' }}>Brewed Horizon Café</div>
            <div style={{ fontSize: 7.5, color: 'var(--ink-4)', marginTop: 1 }}>Scan QR · View menu</div>
          </div>
          <div style={{
            width: 28, height: 28, background: 'var(--surface-2)',
            borderRadius: 4, border: '1px solid var(--hair)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="5" rx="1" stroke="var(--ink)" strokeWidth="1.3" opacity="0.5"/>
              <rect x="8" y="1" width="5" height="5" rx="1" stroke="var(--ink)" strokeWidth="1.3" opacity="0.5"/>
              <rect x="1" y="8" width="5" height="5" rx="1" stroke="var(--ink)" strokeWidth="1.3" opacity="0.5"/>
              <rect x="9.5" y="9.5" width="2" height="2" fill="var(--accent)" rx="0.3"/>
            </svg>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 7 }}>
          {['All', 'Drinks', 'Food'].map((cat, i) => (
            <div key={cat} style={{
              fontSize: 7.5, fontWeight: 600, padding: '2px 8px', borderRadius: 12,
              background: i === 0 ? 'var(--accent)' : 'transparent',
              color: i === 0 ? 'var(--canvas)' : 'var(--ink-4)',
              border: i === 0 ? 'none' : '1px solid var(--hair)',
            }}>
              {cat}
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'hidden', padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {menuItems.map((item, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '5px 8px',
            background: 'var(--surface)', border: '1px solid var(--hair)', borderRadius: 6,
          }}>
            <div>
              <div style={{ fontSize: 8.5, fontWeight: 600, color: 'var(--ink)' }}>{item.name}</div>
              <div style={{ fontSize: 7, color: 'var(--ink-4)', marginTop: 1 }}>{item.cat}</div>
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)' }}>{item.price}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Inventory ──────────────────────────────────────────────────────────────────

export function InventoryMock() {
  const items = [
    { name: 'All-purpose Cream', stock: '2.4',  unit: 'L',    status: 'ok'  },
    { name: 'Chicken Breast',    stock: '0.8',  unit: 'kg',   status: 'low' },
    { name: 'Matcha Powder',     stock: '380',  unit: 'g',    status: 'ok'  },
    { name: 'Avocado',           stock: '4',    unit: 'pcs',  status: 'ok'  },
    { name: 'Arabica Beans',     stock: '1.2',  unit: 'kg',   status: 'ok'  },
    { name: 'Cooking Oil',       stock: '3.2',  unit: 'L',    status: 'ok'  },
    { name: 'Heavy Cream',       stock: '0',    unit: 'L',    status: 'out' },
    { name: 'Brown Sugar',       stock: '2.8',  unit: 'kg',   status: 'ok'  },
    { name: 'Sourdough Bread',   stock: '6',    unit: 'pcs',  status: 'ok'  },
    { name: 'Spam (canned)',     stock: '2',    unit: 'cans', status: 'low' },
  ]
  const statusColor = (s: string) => s === 'out' ? 'var(--danger)' : s === 'low' ? 'var(--warn)' : 'var(--success)'
  const statusLabel = (s: string) => s === 'out' ? 'OUT' : s === 'low' ? 'LOW' : 'OK'

  return (
    <MiniPage activeIdx={3}>
      <MiniHeader title="Inventory" sub="10 items · 1 out of stock · 2 low" action="+ Add Item" />
      <div style={{ flex: 1, overflow: 'hidden', padding: '7px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>

        <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
          {[
            { label: 'In Stock', value: '7', color: 'var(--success)' },
            { label: 'Low Stock', value: '2', color: 'var(--warn)' },
            { label: 'Out',      value: '1', color: 'var(--danger)' },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--hair)', borderRadius: 6, padding: '6px 7px', textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 7, color: 'var(--ink-4)', marginTop: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--hair)', borderRadius: 6, overflow: 'hidden', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 36px 32px 38px', padding: '4px 8px', borderBottom: '1px solid var(--hair)', gap: 4 }}>
            {['Ingredient', 'Stock', 'Unit', 'Status'].map(h => (
              <span key={h} style={{ fontSize: 6.5, color: 'var(--ink-4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</span>
            ))}
          </div>
          {items.map((it, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '1fr 36px 32px 38px',
              padding: '3.5px 8px', gap: 4,
              borderBottom: i < items.length - 1 ? '1px solid var(--hair)' : 'none',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: 8, color: it.status !== 'ok' ? 'var(--ink)' : 'var(--ink-3)', fontWeight: it.status !== 'ok' ? 600 : 400 }}>{it.name}</span>
              <span style={{ fontSize: 8, color: 'var(--ink-2)', textAlign: 'right', fontFamily: 'monospace' }}>{it.stock}</span>
              <span style={{ fontSize: 7.5, color: 'var(--ink-4)' }}>{it.unit}</span>
              <span style={{
                fontSize: 7, fontWeight: 700, color: statusColor(it.status),
                background: `color-mix(in srgb, ${statusColor(it.status)} 15%, transparent)`,
                padding: '1px 4px', borderRadius: 3, textAlign: 'center',
              }}>
                {statusLabel(it.status)}
              </span>
            </div>
          ))}
        </div>

      </div>
    </MiniPage>
  )
}
