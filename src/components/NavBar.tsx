import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useStore } from '@/stores/useStore'

// Desktop sidebar
export function Sidebar() {
  const activeSession = useStore((s) => s.activeSession)

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-60 bg-slate-900 border-r border-slate-800 z-20">
      {/* Logo */}
      <div className="p-5 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
              <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold text-white">FocusFlow</h1>
            <p className="text-xs text-slate-500">Time Tracker</p>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 p-3 space-y-0.5">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={cn(
                    'h-4.5 w-4.5 flex-shrink-0',
                    isActive ? 'text-indigo-400' : 'text-slate-500',
                  )}
                  size={18}
                />
                <span>{label}</span>
                {label === 'Timer' && activeSession && (
                  <span className="ml-auto h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800">
        <p className="text-xs text-slate-600 text-center">v{import.meta.env.VITE_APP_VERSION}</p>
      </div>
    </aside>
  )
}

// Mobile bottom tab bar
export function BottomNav() {
  const activeSession = useStore((s) => s.activeSession)

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 z-20 safe-bottom">
      <div className="flex items-center justify-around px-2 pt-2 pb-1">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl min-w-0 flex-1 transition-colors duration-150 relative',
                isActive ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300',
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <Icon
                    size={20}
                    className={cn(
                      'transition-colors',
                      isActive ? 'text-indigo-400' : 'text-slate-500',
                    )}
                  />
                  {label === 'Timer' && activeSession && (
                    <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
                  )}
                </div>
                <span className={cn('text-xs font-medium', isActive ? 'text-indigo-400' : '')}>
                  {label}
                </span>
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-4 rounded-full bg-indigo-500" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
