import { apiClient } from './client'
import type { NewsArticle } from '@/types'

export const newsApi = {
  feeds: (subjects: string[], limit = 20) =>
    apiClient.get<NewsArticle[]>('/api/news/feeds', { params: { subjects: subjects.join(','), limit } }),
}
