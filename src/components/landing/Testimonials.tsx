'use client'

const testimonials = [
  {
    name: 'Marivic Santos',
    role: 'Owner · Kape\'t Kwento Café, Cebu City',
    quote:
      'Before Sizzle, I had four different notebooks. Now I open one tab and I know exactly how much I made, what\'s running low, and whether I\'m hitting my target for the month. It\'s the first tool that actually fits how we work.',
  },
  {
    name: 'Carlo Reyes',
    role: 'Head Chef & Co-Owner · The Plated Table, BGC',
    quote:
      'Recipe costing used to be guesswork. Sizzle told me my best-selling pasta was only giving me 58% margin — I repriced it and my food cost dropped by 4 points in one month. That\'s real money.',
  },
  {
    name: 'Ana Bautista',
    role: 'Operations Manager · Merienda House (3 branches), Davao',
    quote:
      'Managing payroll for 18 staff across three locations used to take me a full Sunday. With Sizzle it\'s done in 20 minutes. The waste log alone has saved us roughly ₱8,000 a month.',
  },
]

function StarRow() {
  return (
    <div className="flex gap-0.5 mb-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="currentColor"
          className="text-warn"
        >
          <path d="M6 1l1.39 2.82L10.5 4.27l-2.25 2.19.53 3.1L6 8l-2.78 1.46.53-3.1L1.5 4.27l3.11-.45L6 1z" />
        </svg>
      ))}
    </div>
  )
}

export default function Testimonials() {
  return (
    <div>
      <p className="text-xs text-accent font-semibold uppercase tracking-widest mb-3">
        What owners are saying
      </p>
      <h2 className="text-[clamp(2rem,4vw,3.2rem)] font-semibold tracking-tighter text-ink leading-tight mb-10">
        Real results from real kitchens.
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {testimonials.map((t) => (
          <div
            key={t.name}
            className="glass rounded-2xl p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] flex flex-col"
          >
            <StarRow />
            <p className="text-ink-3 text-sm leading-relaxed flex-1 mb-6">
              &ldquo;{t.quote}&rdquo;
            </p>
            <div>
              <p className="text-ink font-semibold text-sm">{t.name}</p>
              <p className="text-ink-4 text-xs mt-0.5">{t.role}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
