import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  withCredentials: true,
})

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refreshed = await useAuthStore.getState().refreshSession()
      if (refreshed) {
        const token = useAuthStore.getState().accessToken
        original.headers.Authorization = `Bearer ${token}`
        return apiClient(original)
      }
    }
    return Promise.reject(error)
  }
)
