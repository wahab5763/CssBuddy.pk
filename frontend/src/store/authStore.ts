import { create } from 'zustand'
import type { User } from '@/types'
import { apiClient } from '@/api/client'

interface AuthState {
  user: User | null
  accessToken: string | null
  isLoading: boolean

  setAuth: (user: User, token: string) => void
  clearAuth: () => void
  setLoading: (v: boolean) => void
  refreshSession: () => Promise<boolean>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isLoading: true,

  setAuth: (user, accessToken) => set({ user, accessToken }),
  clearAuth: () => set({ user: null, accessToken: null }),
  setLoading: (isLoading) => set({ isLoading }),

  refreshSession: async () => {
    try {
      const res = await apiClient.get<{ access_token: string; user: User }>('/api/auth/refresh')
      set({ user: res.data.user, accessToken: res.data.access_token, isLoading: false })
      return true
    } catch {
      set({ user: null, accessToken: null, isLoading: false })
      return false
    }
  },

  login: async (email, password) => {
    const res = await apiClient.post<{ access_token: string; user: User }>('/api/auth/login', { email, password })
    set({ user: res.data.user, accessToken: res.data.access_token })
  },

  logout: async () => {
    try {
      await apiClient.delete('/api/auth/logout')
    } catch {}
    set({ user: null, accessToken: null })
  },
}))
