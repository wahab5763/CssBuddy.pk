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
        {/* Mobile overlay sidebar — only on small screens, nav is in topbar on xl+ */}
        {mobileOpen && (
          <>
            <div
              className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm xl:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <div className="fixed left-0 top-[62px] bottom-0 z-40 xl:hidden animate-slide-in shadow-card-lg">
              <Sidebar
                className="flex flex-col bg-white dark:bg-gray-950 h-full overflow-y-auto"
                onNavClick={() => setMobileOpen(false)}
              />
            </div>
          </>
        )}

        {/* Page content — full width since sidebar is hidden on desktop */}
        <main className="flex-1 overflow-y-auto pb-20 xl:pb-0">
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
