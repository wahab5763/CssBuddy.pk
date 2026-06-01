import { apiClient } from './client'
import type { User } from '@/types'

export const authApi = {
  register: (data: Record<string, unknown>) =>
    apiClient.post<{ access_token: string; user: User }>('/api/auth/register', data),
  updateMe: (data: Record<string, unknown>) =>
    apiClient.patch<User>('/api/auth/me', data),
  updateProfile: (data: Record<string, unknown>) =>
    apiClient.patch<User>('/api/auth/me/profile', data),
  updateOptionals: (subjects: string[]) =>
    apiClient.patch<User>('/api/auth/me/optionals', { optional_subjects: subjects }),
  changePassword: (current: string, next: string) =>
    apiClient.patch('/api/auth/me/password', { current_password: current, new_password: next }),
}
