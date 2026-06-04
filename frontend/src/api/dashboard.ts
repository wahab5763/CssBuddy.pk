import { apiClient } from './client'

export const dashboardApi = {
  summary:    ()              => apiClient.get('/api/dashboard/summary'),
  carousel:   ()              => apiClient.get('/api/dashboard/carousel'),
  vocab:      (count = 30)    => apiClient.get('/api/dashboard/vocab', { params: { count } }),
  flashcards: (count = 4)     => apiClient.get('/api/dashboard/flashcards', { params: { count } }),
  latestMcqs: (params: Record<string, unknown>) => apiClient.get('/api/dashboard/mcqs/latest', { params }),
}
