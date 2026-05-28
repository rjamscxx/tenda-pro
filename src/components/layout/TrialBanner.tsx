'use client'

interface Props {
  daysLeft: number
}

export default function TrialBanner({ daysLeft }: Props) {
  const urgent = daysLeft <= 3

  return (
    <div className={`w-full px-4 py-2.5 flex items-center justify-between gap-4 text-sm shrink-0 ${
      urgent
        ? 'bg-danger/10 border-b border-danger/20 text-danger'
        : 'bg-accent/8 border-b border-accent/15 text-accent'
    }`}>
      <span className="text-xs font-medium">
        {daysLeft === 0
          ? 'Your Pro trial ends today.'
          : `Pro trial: ${daysLeft} day${daysLeft === 1 ? '' : 's'} left.`
        }
        {' '}Upgrade to keep all features after the trial.
      </span>
      <a
        href="/settings#plan"
        className={`shrink-0 px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${
          urgent
            ? 'border-danger/40 hover:bg-danger/10'
            : 'border-accent/40 hover:bg-accent/10'
        }`}
      >
        View plans
      </a>
    </div>
  )
}
