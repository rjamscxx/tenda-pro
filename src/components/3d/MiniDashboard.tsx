const BARS = [52, 68, 45, 74, 60, 83, 58, 77, 65, 88, 71, 94, 79, 91]

export default function MiniDashboard() {
  return (
    <div style={{ display: 'flex', height: '100%', fontFamily: 'system-ui, -apple-system, sans-serif', overflow: 'hidden' }}>

      {/* Sidebar */}
      <div style={{
        width: 44,
        background: 'var(--sidebar)',
        borderRight: '1px solid var(--hair)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '14px 0 12px',
        gap: 14,
        flexShrink: 0,
      }}>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: 'var(--accent)', marginBottom: 4 }} />
        {[true, false, false, false, false, false, false].map((active, i) => (
          <div key={i} style={{
            width: active ? 22 : 18,
            height: 4,
            borderRadius: 2,
            background: active ? 'var(--accent)' : 'var(--surface-3)',
            opacity: active ? 1 : 0.6,
          }} />
        ))}
      </div>

      {/* Main */}
      <div style={{ flex: 1, background: 'var(--canvas)', padding: '14px 14px 10px', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 8 }}>

        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.03em', lineHeight: 1 }}>
          Dashboard
        </div>

        {/* KPI cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
          {[
            { label: 'Revenue Today', value: '₱18.4K', sub: '+14.2%', pos: true },
            { label: 'Food Cost',     value: '28.4%',  sub: '−2.1%',  pos: true },
            { label: 'Gross Margin',  value: '71.6%',  sub: '+3.0%',  pos: true },
            { label: 'Low Stock',     value: '3',      sub: 'items',   pos: null },
          ].map(c => (
            <div key={c.label} style={{
              background: 'var(--surface)',
              border: '1px solid var(--hair)',
              borderRadius: 7,
              padding: '7px 8px',
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
            }}>
              <span style={{ fontSize: 7, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600 }}>{c.label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.03em', lineHeight: 1 }}>{c.value}</span>
              <span style={{ fontSize: 8, fontWeight: 600, color: c.pos === true ? 'var(--success)' : c.pos === false ? 'var(--danger)' : 'var(--ink-3)' }}>{c.sub}</span>
            </div>
          ))}
        </div>

        {/* Cashflow chart */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--hair)',
          borderRadius: 7,
          padding: '8px 10px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          minHeight: 0,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 8, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>30-day Revenue vs Expenses</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {[['var(--accent)', 'Revenue'], ['var(--danger)', 'Expenses']].map(([c, l]) => (
                <div key={l as string} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <div style={{ width: 6, height: 6, borderRadius: 1, background: c as string }} />
                  <span style={{ fontSize: 7, color: 'var(--ink-4)' }}>{l as string}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, flex: 1 }}>
            {BARS.map((h, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 2, height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ height: `${h * 0.55}%`, borderRadius: '2px 2px 0 0', background: 'var(--danger)', opacity: 0.45 }} />
                <div style={{ height: `${h}%`, borderRadius: '2px 2px 0 0', background: 'var(--accent)', opacity: 0.7 + (i / BARS.length) * 0.3 }} />
              </div>
            ))}
          </div>
        </div>

        {/* Top sellers */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--hair)',
          borderRadius: 7,
          padding: '8px 10px',
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 8, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Today&apos;s Top Sellers</div>
          {[
            { name: 'Iced Matcha Latte', rev: '₱4,200' },
            { name: 'Avocado Toast',     rev: '₱3,150' },
            { name: 'Cold Brew Coffee',  rev: '₱2,880' },
          ].map(d => (
            <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)', opacity: 0.7 }} />
                <span style={{ fontSize: 8.5, color: 'var(--ink-3)' }}>{d.name}</span>
              </div>
              <span style={{ fontSize: 8.5, fontWeight: 700, color: 'var(--accent)' }}>{d.rev}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
