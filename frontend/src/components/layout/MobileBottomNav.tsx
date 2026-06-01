import { NavLink } from 'react-router-dom'
import { Home, BookOpen, FileText, Newspaper, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

const BOTTOM_NAV = [
  { to: '/dashboard',   label: 'Home',     icon: Home },
  { to: '/practice',    label: 'Practice', icon: BookOpen },
  { to: '/past-papers', label: 'Papers',   icon: FileText },
  { to: '/news',        label: 'News',     icon: Newspaper },
  { to: '/partner',     label: 'Partner',  icon: Users },
]

export function MobileBottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 mobile-nav">
      <div className="flex items-center justify-around py-1.5 px-1">
        {BOTTOM_NAV.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) => cn(
              'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-150 min-w-[52px]',
              isActive
                ? 'text-primary'
                : 'text-gray-400 dark:text-gray-500'
            )}>
            {({ isActive }) => (
              <>
                <span className={cn('transition-transform', isActive && 'scale-110')}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                </span>
                <span className="text-[10px] font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
