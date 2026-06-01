import { NavLink } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import {
  Home, BookOpen, FileText, Newspaper, Star, Users, PenLine,
  ShieldCheck, Calendar, BookMarked, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/dashboard',   label: 'Home',             icon: Home,        color: 'text-teal-600'  },
  { to: '/study-plan',  label: 'Study Plan',        icon: Calendar,    color: 'text-blue-500'  },
  { to: '/practice',    label: 'Practice',          icon: BookOpen,    color: 'text-teal-500'  },
  { to: '/books',       label: 'Books Market',      icon: BookMarked,  color: 'text-orange-500'},
  { to: '/past-papers', label: 'Past Papers',       icon: FileText,    color: 'text-red-500'   },
  { to: '/news',        label: 'News & Affairs',    icon: Newspaper,   color: 'text-sky-500'   },
  { to: '/premium',     label: 'Premium Notes',     icon: Star,        color: 'text-yellow-500'},
  { to: '/partner',     label: 'Study Partner',     icon: Users,       color: 'text-teal-400'  },
  { to: '/essay',       label: 'Essay Writing',     icon: PenLine,     color: 'text-pink-500'  },
]

interface SidebarProps { className?: string; onNavClick?: () => void }

export function Sidebar({ className, onNavClick }: SidebarProps) {
  const user = useAuthStore((s) => s.user)

  return (
    <aside className={cn('flex flex-col w-64', className)}>
      {/* Brand */}
      <div className="px-5 py-5 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow-sm">
            <span className="text-white font-black text-sm">CB</span>
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white text-sm leading-tight">CssBuddy.pk</p>
            <p className="text-xs text-gray-400">CSS · PMS Prep</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 px-3 mb-2">Menu</p>

        {NAV.map(({ to, label, icon: Icon, color }) => (
          <NavLink key={to} to={to} onClick={onNavClick}
            className={({ isActive }) => cn(
              'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
              isActive
                ? 'bg-primary text-white shadow-glow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            )}>
            {({ isActive }) => (
              <>
                <span className={cn('transition-colors', isActive ? 'text-white' : color)}>
                  <Icon size={17} />
                </span>
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight size={14} className="opacity-60" />}
              </>
            )}
          </NavLink>
        ))}

        {user?.is_admin && (
          <>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 px-3 mt-4 mb-2">Admin</p>
            <NavLink to="/admin" onClick={onNavClick}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-red-500 text-white'
                  : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
              )}>
              <ShieldCheck size={17} />
              Admin Panel
            </NavLink>
          </>
        )}
      </nav>

      {/* User profile strip */}
      {user && (
        <div className="px-4 py-4 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center text-white font-bold text-xs shrink-0">
              {user.name[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{user.name}</p>
              <p className="text-xs text-gray-400 truncate">{user.profile?.exam_type || 'CSS'} · {user.profile?.prep_level || 'Aspirant'}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
