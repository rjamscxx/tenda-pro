export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-full flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: 'var(--gradient-hero)' }}
    >
      {/* Radial glow orb */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full flex items-center justify-center">
        {children}
      </div>
    </div>
  )
}
