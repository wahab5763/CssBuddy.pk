import { apiClient } from './client'
import type { Book, PaginatedResponse } from '@/types'

export const booksApi = {
  list: (params: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<Book>>('/api/books/', { params }),
  get: (id: number) => apiClient.get<Book>(`/api/books/${id}`),
  create: (form: FormData) =>
    apiClient.post<Book>('/api/books/', form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  toggleAvailability: (id: number) => apiClient.patch(`/api/books/${id}/status`),
  delete: (id: number) => apiClient.delete(`/api/books/${id}`),
}
