import type { ReactNode } from 'react'
import { useAuthStore } from '@/store/authStore'
import { AuthModal } from '@/components/auth/AuthModal'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const user      = useAuthStore((s) => s.user)
  const isLoading = useAuthStore((s) => s.isLoading)

  if (isLoading) return null          // wait for session check before deciding
  if (!user) return <AuthModal defaultOpen />
  return <>{children}</>
}
