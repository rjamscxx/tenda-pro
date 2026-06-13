'use client'

export default function FounderStory() {
  return (
    <div className="max-w-3xl mx-auto">
      <p className="text-xs text-accent font-semibold uppercase tracking-widest mb-3 text-center">
        Why Tenda Pro exists
      </p>
      <h2 className="text-[clamp(2rem,4vw,3.2rem)] font-semibold tracking-tighter text-ink leading-tight mb-12 text-center max-w-[24ch] mx-auto">
        Built by one person, for café owners like you.
      </h2>

      <div className="glass rounded-2xl p-8 md:p-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">

        {/* Avatar + identity */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-accent-2 flex items-center justify-center text-canvas font-bold text-lg shrink-0 select-none shadow-lg shadow-accent/20">
            RJ
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-ink leading-tight">RJ</p>
            <p className="text-xs text-ink-4 mt-0.5">Founder &amp; sole developer · Philippines</p>
          </div>
        </div>

        {/* Story */}
        <div className="space-y-4 text-ink-3 leading-relaxed text-[15px]">
          <p>
            I&apos;m an indie builder from the Philippines. I kept seeing the same scene at every
            café I&apos;d visit — a tired owner flipping between a Square dashboard, a QuickBooks
            tab, an Excel sheet for ingredients, and a notebook for the staff schedule. None of
            it talked to each other. None of it actually told them whether they&apos;d made money
            that day.
          </p>
          <p>
            The international tools weren&apos;t built for a small Manila café running on
            ₱-priced ingredients, GCash payments, and a 5-person team. The local options were
            either bloated POS systems or one-off spreadsheets. I figured someone should just
            build the thing — one app that handles sales, expenses, recipes, stock, people, and
            tells you straight up what your real margin is.
          </p>
          <p>
            That&apos;s Tenda Pro. It&apos;s the first tool I&apos;ve shipped to the public, and
            I&apos;m hands-on with every feature, every bug, and every customer email. If you
            try it and something doesn&apos;t work the way you need, message me directly — my
            email is below.
          </p>
        </div>

        {/* Sign-off */}
        <div className="mt-7 pt-6 border-t border-hair flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-semibold text-ink">— RJ</p>
            <a
              href="mailto:rjamscxx@gmail.com"
              className="text-xs text-accent hover:underline underline-offset-2"
            >
              rjamscxx@gmail.com
            </a>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 bg-accent/10 border border-accent/20">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-[11px] font-semibold text-accent uppercase tracking-widest">
              Looking for the first 100 cafés
            </span>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-ink-4 mt-6 max-w-[44ch] mx-auto leading-relaxed">
        Tenda Pro just launched. If you&apos;re among the first 100 café owners to sign up, you get
        direct access to me and a real seat at the table for what gets built next.
      </p>
    </div>
  )
}
