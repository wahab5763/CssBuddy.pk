import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export function AdminRoute({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user)
  if (!user || !user.is_admin) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}
