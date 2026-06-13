import { apiClient } from './client'

export const adminApi = {
  stats: () => apiClient.get('/api/admin/stats'),
  users: (page = 1) => apiClient.get('/api/admin/users', { params: { page } }),
  toggleUser: (id: number) => apiClient.patch(`/api/admin/users/${id}/toggle`),
  deleteUser: (id: number) => apiClient.delete(`/api/admin/users/${id}`),
  uploadMcqs: (subject: string, file: File) => {
    const form = new FormData()
    form.append('subject', subject)
    form.append('file', file)
    return apiClient.post('/api/admin/mcqs/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  uploadNote: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return apiClient.post('/api/admin/notes/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  deleteNote: (filename: string) => apiClient.delete(`/api/admin/notes/${filename}`),
  createTopic: (data: Record<string, unknown>) => apiClient.post('/api/admin/topics', data),
  updateTopic: (id: number, data: Record<string, unknown>) => apiClient.patch(`/api/admin/topics/${id}`, data),
  deleteTopic: (id: number) => apiClient.delete(`/api/admin/topics/${id}`),
  scrapeMcqs: (subject: string, pages: number) => {
    const form = new FormData()
    form.append('subject', subject)
    form.append('pages', String(pages))
    return apiClient.post('/api/admin/mcqs/scrape', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  scrapeStatus: (jobId: string) => apiClient.get(`/api/admin/mcqs/scrape/status/${jobId}`),
}
