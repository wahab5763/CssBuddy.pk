import type { ReactNode } from 'react'
import { useAuthStore } from '@/store/authStore'
import { AuthModal } from '@/components/auth/AuthModal'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user)
  if (!user) return <AuthModal defaultOpen />
  return <>{children}</>
}
