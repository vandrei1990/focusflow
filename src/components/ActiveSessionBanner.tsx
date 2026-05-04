import { useNavigate, useLocation } from 'react-router-dom'
import { Pause, Play, Square } from 'lucide-react'
import { useStore } from '@/stores/useStore'
import { useLiveTimer } from '@/hooks/useLiveTimer'
import { formatDurationShort, cn } from '@/lib/utils'

export default function ActiveSessionBanner() {
  const location = useLocation()
  const navigate = useNavigate()
  const activeSession = useStore((s) => s.activeSession)
  const pauseSession = useStore((s) => s.pauseSession)
  const resumeSession = useStore((s) => s.resumeSession)
  const stopSession = useStore((s) => s.stopSession)
  const projects = useStore((s) => s.projects)
  const elapsed = useLiveTimer()

  // Don't show on timer page
  if (!activeSession || location.pathname === '/timer') return null

  const project = projects.find((p) => p.id === activeSession.projectId)
  const isPaused = Boolean(activeSession.pausedAt)

  return (
    <div
      className={cn(
        'mx-4 mt-2 mb-0 rounded-xl border p-3 flex items-center gap-3',
        'bg-indigo-950/60 border-indigo-600/40',
      )}
      style={{
        borderLeftColor: project?.color,
        borderLeftWidth: 3,
      }}
    >
      {/* Pulse dot */}
      <div className="relative flex-shrink-0">
        <span
          className={cn(
            'h-2.5 w-2.5 rounded-full block',
            !isPaused && 'animate-pulse',
          )}
          style={{ backgroundColor: project?.color ?? '#6366f1' }}
        />
        {!isPaused && (
          <span
            className="animate-ping-slow absolute inset-0 h-2.5 w-2.5 rounded-full opacity-40"
            style={{ backgroundColor: project?.color ?? '#6366f1' }}
          />
        )}
      </div>

      {/* Info - clickable to go to timer */}
      <button
        className="flex-1 text-left min-w-0"
        onClick={() => navigate('/timer')}
      >
        <p className="text-sm font-semibold text-slate-100 truncate">{activeSession.taskTitle}</p>
        <p className="text-xs text-slate-400">
          {isPaused ? 'Paused · ' : ''}
          <span className="timer-display font-mono">{formatDurationShort(elapsed)}</span>
          {activeSession.mode === 'pomodoro' && (
            <span className="ml-1 text-indigo-400">· Pomo</span>
          )}
        </p>
      </button>

      {/* Controls */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={isPaused ? resumeSession : pauseSession}
          className="p-1.5 rounded-lg hover:bg-slate-700/60 text-slate-300 hover:text-slate-100 transition-colors"
          title={isPaused ? 'Resume' : 'Pause'}
        >
          {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </button>
        <button
          onClick={stopSession}
          className="p-1.5 rounded-lg hover:bg-red-900/40 text-slate-400 hover:text-red-400 transition-colors"
          title="Stop session"
        >
          <Square className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
