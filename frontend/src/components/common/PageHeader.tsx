import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  icon: ReactNode
  title: string
  subtitle: string
  greeting?: string      // small line shown above the title (Dashboard only)
  badge?: string         // small pill badge alongside title
  extra?: ReactNode      // right-side slot for action buttons / chips
  className?: string
}

export function PageHeader({ icon, title, subtitle, greeting, badge, extra, className }: PageHeaderProps) {
  return (
    <div
      className={cn('relative overflow-hidden rounded-2xl px-6 py-6 sm:px-8 sm:py-7 text-white shadow-lg mb-6', className)}
      style={{ background: 'linear-gradient(135deg, #1D6660 0%, #2D9E95 55%, #0f4c48 100%)' }}
    >
      {/* dot-grid texture */}
      <div
        className="absolute inset-0 opacity-[0.08] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '20px 20px' }}
      />
      {/* glow blobs */}
      <div className="absolute -top-14 -right-14 w-52 h-52 rounded-full bg-teal-300/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-emerald-300/15 blur-2xl pointer-events-none" />
      <div className="absolute top-2 right-1/3 w-24 h-24 rounded-full bg-white/5 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-4">

          {/* Icon box */}
          <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/25 backdrop-blur-sm flex items-center justify-center shrink-0 shadow-inner">
            {icon}
          </div>

          <div>
            {greeting && (
              <p className="text-white/70 text-sm font-medium mb-0.5 leading-none">{greeting}</p>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black tracking-tight text-white leading-tight">{title}</h1>
              {badge && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 border border-white/30 text-white/90 backdrop-blur-sm">
                  {badge}
                </span>
              )}
            </div>
            <p className="text-white/65 text-sm mt-1 leading-relaxed max-w-2xl">{subtitle}</p>
          </div>
        </div>

        {extra && (
          <div className="shrink-0 sm:ml-4">{extra}</div>
        )}
      </div>
    </div>
  )
}
