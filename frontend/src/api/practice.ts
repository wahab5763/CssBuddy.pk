import { apiClient } from './client'
import type { Mcq, PaginatedResponse, QuizSubmitResponse, SubjectCount } from '@/types'

export const practiceApi = {
  subjects: () => apiClient.get<SubjectCount[]>('/api/practice/subjects'),
  questionBank: (params: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<Mcq>>('/api/practice/mcqs', { params }),
  startQuiz: (subject: string, count: number, mode: string) =>
    apiClient.get<{ subject: string; questions: Mcq[]; total: number }>('/api/practice/quiz/start', {
      params: { subject, count, mode },
    }),
  submitQuiz: (subject: string, answers: { mcq_id: number; selected: string }[]) =>
    apiClient.post<QuizSubmitResponse>('/api/practice/quiz/submit', { answers }, { params: { subject } }),
  downloadPdf: (subject: string, answers: { mcq_id: number; selected: string }[]) =>
    apiClient.post('/api/practice/quiz/pdf', { answers }, {
      params: { subject },
      responseType: 'blob',
    }),
}
