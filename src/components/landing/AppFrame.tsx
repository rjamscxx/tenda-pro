interface AppFrameProps {
  children: React.ReactNode
  url: string
  height?: number
  className?: string
}

export default function AppFrame({ children, url, height = 320, className = '' }: AppFrameProps) {
  return (
    <div className={`rounded-2xl overflow-hidden border border-white/[0.07] shadow-[0_20px_60px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.08)] ${className}`}>
      <div className="bg-[#161a1d] border-b border-white/[0.06]">
        <div className="flex items-center gap-0 px-3 pt-2.5">
          <div className="flex items-center gap-1.5 mr-3 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-t-md bg-[#1e2328] border border-b-0 border-white/[0.08] text-[10px] text-white/50">
            <svg width="10" height="10" viewBox="0 0 20 20" fill="none" className="shrink-0 opacity-60">
              <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2"/>
              <path d="M6 10h8M10 6v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Tenda
          </div>
          <div className="flex-1" />
        </div>
        <div className="flex items-center gap-2 px-3 pb-2 pt-1">
          <div className="flex-1 flex items-center gap-2 bg-[#0e1114] rounded-md px-3 py-[5px] border border-white/[0.06]">
            <svg width="9" height="10" viewBox="0 0 9 10" fill="none" className="shrink-0 opacity-40">
              <rect x="1" y="4" width="7" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M3 4V3a1.5 1.5 0 0 1 3 0v1" stroke="currentColor" strokeWidth="1.2"/>
            </svg>
            <span className="text-[10px] text-white/35 font-mono leading-none">{url}</span>
          </div>
        </div>
      </div>
      <div style={{ height, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  )
}
