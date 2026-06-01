import { apiClient } from './client'

export const dashboardApi = {
  summary: () => apiClient.get('/api/dashboard/summary'),
  flashcards: (count = 8) => apiClient.get('/api/dashboard/flashcards', { params: { count } }),
  latestMcqs: (params: Record<string, unknown>) => apiClient.get('/api/dashboard/mcqs/latest', { params }),
}
