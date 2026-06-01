import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Moon, Sun, LogIn, LogOut, Menu, X, ChevronDown, UserCog, BookOpen } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import { AuthModal } from '@/components/auth/AuthModal'
import { EditProfileModal } from '@/components/profile/EditProfileModal'
import { cn } from '@/lib/utils'

interface TopbarProps { onMenuToggle: () => void; isMobileOpen: boolean }

function UserMenu() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const [open, setOpen] = useState(false)
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
        <button onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center text-white font-bold text-sm shadow-sm">
            {user.name[0].toUpperCase()}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-tight">{user.name.split(' ')[0]}</p>
            <p className="text-xs text-gray-400">{user.profile?.exam_type || 'CSS'} · {user.profile?.prep_level || 'Aspirant'}</p>
          </div>
          <ChevronDown size={14} className={cn('text-gray-400 transition-transform', open && 'rotate-180')} />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-60 card shadow-card-lg py-1 z-50 animate-fade-in">
            {/* User summary */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.name}</p>
              <p className="text-xs text-gray-400 truncate mb-2">{user.email}</p>
              <div className="flex flex-wrap gap-1.5">
                {user.profile?.prep_level && <span className="badge-primary">{user.profile.prep_level}</span>}
                {user.profile?.exam_year && <span className="badge-gray">{user.profile.exam_type} {user.profile.exam_year}</span>}
              </div>
              {/* Optional subjects summary */}
              {optCount > 0 && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
                  <BookOpen size={11} />
                  <span>{optCount} optional{optCount > 1 ? 's' : ''}: {user.optional_subjects.slice(0, 2).join(', ')}{optCount > 2 ? ` +${optCount - 2}` : ''}</span>
                </div>
              )}
            </div>

            {/* Edit profile */}
            <button
              onClick={() => { setEditOpen(true); setOpen(false) }}
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

export function Topbar({ onMenuToggle, isMobileOpen }: TopbarProps) {
  const user = useAuthStore((s) => s.user)
  const { isDark, toggle: toggleTheme } = useThemeStore()
  const [authOpen, setAuthOpen] = useState(false)

  return (
    <>
      <header className="h-16 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 flex items-center px-4 gap-3 sticky top-0 z-40">
        {/* Mobile menu toggle */}
        <button onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300">
          {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Logo — visible on mobile only */}
        <Link to="/dashboard" className="lg:hidden flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-brand flex items-center justify-center">
            <span className="text-white font-black text-xs">CB</span>
          </div>
          <span className="font-bold text-gray-900 dark:text-white text-sm">CssBuddy.pk</span>
        </Link>

        <div className="flex-1" />

        {/* Theme toggle */}
        <button onClick={toggleTheme}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
          title="Toggle theme">
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Auth */}
        {user ? (
          <UserMenu />
        ) : (
          <button onClick={() => setAuthOpen(true)}
            className="btn-primary gap-1.5 text-sm">
            <LogIn size={15} /> Sign In
          </button>
        )}
      </header>

      {authOpen && <AuthModal defaultOpen onClose={() => setAuthOpen(false)} />}
    </>
  )
}
