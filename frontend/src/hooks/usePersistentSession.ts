import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/store/authStore'

const VISIBILITY_COOLDOWN_MS = 5 * 60 * 1000 // 5 minutes

export function usePersistentSession() {
  const refreshSession = useAuthStore((s) => s.refreshSession)
  const lastAttempt = useRef(0)

  useEffect(() => {
    // Initial session check on mount
    lastAttempt.current = Date.now()
    refreshSession()

    // Only re-check when the user returns to the tab AND enough time has passed
    const handleVisibility = () => {
      if (document.hidden) return
      const now = Date.now()
      if (now - lastAttempt.current < VISIBILITY_COOLDOWN_MS) return
      lastAttempt.current = now
      refreshSession()
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [refreshSession]) // stable Zustand selector — won't re-run
}
