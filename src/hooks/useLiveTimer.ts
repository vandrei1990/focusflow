import { useState, useEffect } from 'react'
import { useStore } from '@/stores/useStore'
import { getElapsedSeconds } from '@/lib/utils'

export function useLiveTimer(): number {
  const activeSession = useStore((s) => s.activeSession)
  const [elapsed, setElapsed] = useState<number>(0)

  useEffect(() => {
    if (!activeSession) {
      setElapsed(0)
      return
    }

    const tick = () => {
      const secs = getElapsedSeconds(
        activeSession.startedAt,
        activeSession.totalPausedSeconds,
        activeSession.pausedAt,
      )
      setElapsed(secs)
    }

    tick()

    // If paused, don't tick
    if (activeSession.pausedAt) {
      return
    }

    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [activeSession])

  return elapsed
}
