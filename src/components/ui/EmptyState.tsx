interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  body?: string
  action?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    href: string
  }
  compact?: boolean
}

export default function EmptyState({
  icon,
  title,
  body,
  action,
  secondaryAction,
  compact = false,
}: EmptyStateProps) {
  if (compact) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-2 text-center px-4">
        <div className="text-ink-4 opacity-40">{icon}</div>
        <p className="text-[13px] text-ink-3">{title}</p>
        {body && <p className="text-[12px] text-ink-4">{body}</p>}
        {action && (
          <button
            onClick={action.onClick}
            className="mt-1 text-[12px] text-accent hover:underline"
          >
            {action.label}
          </button>
        )}
        {secondaryAction && (
          <a
            href={secondaryAction.href}
            className="mt-1 text-[12px] text-accent hover:underline"
          >
            {secondaryAction.label}
          </a>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 text-center px-4">
      <div className="w-14 h-14 rounded-2xl bg-surface-2 border border-hair flex items-center justify-center text-ink-3">
        {icon}
      </div>
      <div className="space-y-1 max-w-[28ch]">
        <p className="text-sm font-semibold text-ink-2">{title}</p>
        {body && <p className="text-xs text-ink-4 leading-relaxed">{body}</p>}
      </div>
      {(action || secondaryAction) && (
        <div className="flex items-center gap-2 flex-wrap justify-center">
          {secondaryAction && (
            <a
              href={secondaryAction.href}
              className="px-4 py-2 rounded-lg bg-surface-2 border border-hair text-xs text-ink-2 hover:text-ink hover:bg-surface-3 transition-colors"
            >
              {secondaryAction.label}
            </a>
          )}
          {action && (
            <button
              onClick={action.onClick}
              className="px-4 py-2 rounded-lg btn-primary text-xs font-medium"
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
