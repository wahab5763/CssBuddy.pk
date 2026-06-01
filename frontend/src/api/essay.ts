import { apiClient } from './client'
import type { Essay, EssayTopic } from '@/types'

export const essayApi = {
  categories: () => apiClient.get<string[]>('/api/essay/categories'),
  topics: (category?: string) =>
    apiClient.get<EssayTopic[]>('/api/essay/topics', { params: category ? { category } : {} }),
  submit: (form: FormData) =>
    apiClient.post('/api/essay/submit', form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  mySubmissions: () => apiClient.get<Essay[]>('/api/essay/my-submissions'),
  fileUrl: (id: number) => `/api/essay/submission/${id}/file`,
  delete: (id: number) => apiClient.delete(`/api/essay/submission/${id}`),
  adminAll: (params: Record<string, unknown>) => apiClient.get('/api/essay/admin/all', { params }),
  grade: (id: number, data: Record<string, unknown>) =>
    apiClient.patch(`/api/essay/admin/${id}/grade`, data),
}
