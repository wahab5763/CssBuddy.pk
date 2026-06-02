import { useState, useRef, useEffect } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Moon, Sun, LogIn, LogOut, Menu, X, ChevronDown, UserCog, BookOpen, GraduationCap } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import { AuthModal } from '@/components/auth/AuthModal'
import { EditProfileModal } from '@/components/profile/EditProfileModal'
import { cn } from '@/lib/utils'

/* ── Colour tokens (match landing page) ─────────────────── */
const TEAL   = '#1D6660'
const ORANGE = '#F97316'

/* ── Nav items ───────────────────────────────────────────── */
const NAV = [
  { to: '/dashboard',   label: 'Home'           },
  { to: '/study-plan',  label: 'Study Plan'      },
  { to: '/practice',    label: 'Practice'        },
  { to: '/books',       label: 'Books Market'    },
  { to: '/past-papers', label: 'Past Papers'     },
  { to: '/news',        label: 'News & Affairs'  },
  { to: '/premium',     label: 'Premium Notes'   },
  { to: '/partner',     label: 'Study Partner'   },
  { to: '/essay',       label: 'Essay Writing'   },
]

interface TopbarProps { onMenuToggle: () => void; isMobileOpen: boolean }

/* ── User dropdown ───────────────────────────────────────── */
function UserMenu() {
  const user   = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const [open, setOpen]       = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (!user) return null

  const optCount = user.optional_subjects?.length ?? 0

  return (
    <>
      <div ref={ref} className="relative">
        <button onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm"
            style={{ background: `linear-gradient(135deg, ${TEAL}, #2D9E95)` }}>
            {user.name[0].toUpperCase()}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 leading-tight">{user.name.split(' ')[0]}</p>
            <p className="text-[10px] text-gray-400">{user.profile?.exam_type || 'CSS'}</p>
          </div>
          <ChevronDown size={13} className={cn('text-gray-400 transition-transform', open && 'rotate-180')} />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-60 card shadow-card-lg py-1 z-50 animate-fade-in">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.name}</p>
              <p className="text-xs text-gray-400 truncate mb-2">{user.email}</p>
              <div className="flex flex-wrap gap-1.5">
                {user.profile?.prep_level && <span className="badge-primary">{user.profile.prep_level}</span>}
                {user.profile?.exam_year  && <span className="badge-gray">{user.profile.exam_type} {user.profile.exam_year}</span>}
              </div>
              {optCount > 0 && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
                  <BookOpen size={11} />
                  <span>{optCount} optional{optCount > 1 ? 's' : ''}: {user.optional_subjects.slice(0, 2).join(', ')}{optCount > 2 ? ` +${optCount - 2}` : ''}</span>
                </div>
              )}
            </div>

            <button onClick={() => { setEditOpen(true); setOpen(false) }}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <UserCog size={15} className="text-primary" /> Edit Profile & Subjects
            </button>

            <div className="border-t border-gray-100 dark:border-gray-800 mt-1" />

            <button onClick={() => { logout(); setOpen(false) }}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
              <LogOut size={15} /> Sign Out
            </button>
          </div>
        )}
      </div>

      {editOpen && <EditProfileModal onClose={() => setEditOpen(false)} />}
    </>
  )
}

/* ── Main Topbar ─────────────────────────────────────────── */
export function Topbar({ onMenuToggle, isMobileOpen }: TopbarProps) {
  const user = useAuthStore((s) => s.user)
  const { isDark, toggle: toggleTheme } = useThemeStore()
  const [authOpen, setAuthOpen] = useState(false)

  return (
    <>
      <header className="h-[62px] bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 flex items-center px-3 sm:px-5 gap-3 sticky top-0 z-40 shadow-sm">

        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
            style={{ background: `linear-gradient(135deg, ${TEAL}, #2D9E95)` }}>
            <GraduationCap size={19} className="text-white" />
          </div>
          <div className="hidden sm:block leading-tight">
            <p className="font-black text-base text-gray-900 dark:text-white leading-none tracking-tight">
              CssBuddy<span style={{ color: ORANGE }}>.pk</span>
            </p>
            <p className="text-[9px] text-gray-400 font-medium">CSS/PMS Prep</p>
          </div>
        </Link>

        {/* ── Desktop nav links ─── */}
        <nav className="hidden xl:flex items-center gap-0.5 flex-1 justify-center">
          {NAV.map(({ to, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => cn(
                'px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150',
                isActive
                  ? 'text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
              style={({ isActive }) => isActive ? { background: TEAL } : {}}>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex-1 xl:hidden" />

        {/* Right actions */}
        <div className="flex items-center gap-1.5">
          {/* Theme toggle */}
          <button onClick={toggleTheme}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
            title="Toggle theme">
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Auth */}
          {user ? (
            <UserMenu />
          ) : (
            <button onClick={() => setAuthOpen(true)}
              className="text-xs font-bold px-4 py-2 rounded-lg text-white hover:opacity-90 transition-opacity"
              style={{ background: ORANGE }}>
              Sign In
            </button>
          )}

          {/* Mobile hamburger */}
          <button onClick={onMenuToggle}
            className="xl:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300">
            {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {authOpen && <AuthModal defaultOpen onClose={() => setAuthOpen(false)} />}
    </>
  )
}
