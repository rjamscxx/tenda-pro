// The "Tenda Pro" wordmark — one source of truth so the brand text stays
// consistent everywhere. Minimal + professional: a calm medium weight in solid
// ink (no gradient), tight tracking, with "Pro" as a quiet muted suffix for
// gentle hierarchy. Pass a size via className (e.g. "text-[17px]").
export default function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`font-medium tracking-[-0.015em] leading-none text-ink ${className}`}>
      Tenda<span className="font-normal text-ink-3">&nbsp;Pro</span>
    </span>
  )
}
