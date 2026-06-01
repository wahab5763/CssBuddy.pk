import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Topbar } from './Topbar'
import { Sidebar } from './Sidebar'
import { Footer } from './Footer'
import { MobileBottomNav } from './MobileBottomNav'

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col bg-[#eef0f4] dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <Topbar onMenuToggle={() => setMobileOpen((o) => !o)} isMobileOpen={mobileOpen} />

      <div className="flex flex-1 min-h-0">
        {/* Desktop sidebar */}
        <Sidebar
          className="hidden lg:flex flex-col border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto"
        />

        {/* Mobile overlay sidebar */}
        {mobileOpen && (
          <>
            <div
              className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <div className="fixed left-0 top-16 bottom-0 z-40 lg:hidden animate-slide-in shadow-card-lg">
              <Sidebar
                className="flex flex-col bg-white dark:bg-gray-950 h-full overflow-y-auto"
                onNavClick={() => setMobileOpen(false)}
              />
            </div>
          </>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 animate-fade-in">
            <Outlet />
          </div>
          <Footer />
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <MobileBottomNav />
    </div>
  )
}
