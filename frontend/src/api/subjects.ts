import { apiClient } from './client'

export interface SubjectList {
  compulsory: string[]
  optional: string[]
}

export interface SubjectStat {
  subject: string
  user_count: number
}

export const subjectsApi = {
  all: () => apiClient.get<SubjectList>('/api/subjects/'),
  stats: () => apiClient.get<SubjectStat[]>('/api/subjects/stats'),
  groups: () => apiClient.get<{ subject: string; member_count: number }[]>('/api/partner/groups'),
  groupMembers: (subject: string, page = 1) =>
    apiClient.get(`/api/partner/groups/${encodeURIComponent(subject)}/members`, { params: { page } }),
}
