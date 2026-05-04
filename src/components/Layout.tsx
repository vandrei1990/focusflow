import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useStore } from '@/stores/useStore'
import { Sidebar, BottomNav } from './NavBar'
import ActiveSessionBanner from './ActiveSessionBanner'

export default function Layout() {
  const darkMode = useStore((s) => s.settings.darkMode)

  // Sync dark mode to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  return (
    <div className="min-h-screen bg-slate-900 dark:bg-slate-900 text-slate-100">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="md:ml-60 min-h-screen flex flex-col">
        {/* Active session banner (non-timer pages) */}
        <ActiveSessionBanner />

        {/* Page content */}
        <main className="flex-1 pb-20 md:pb-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  )
}
