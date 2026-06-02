import { apiClient } from './client'

const base = '/groups'

export const studyGroupsApi = {
  myGroups: () => apiClient.get(`${base}/my`),
  messages: (id: number) => apiClient.get(`${base}/${id}/messages`),
  sendMessage: (id: number, content: string) =>
    apiClient.post(`${base}/${id}/messages`, { content }),
  members: (id: number) => apiClient.get(`${base}/${id}/members`),
}

/** WS URL helper — replaces http with ws in VITE_API_URL */
export function groupWsUrl(groupId: number, token: string): string {
  const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(
    /^http/,
    'ws'
  )
  return `${apiBase}/api/groups/${groupId}/ws?token=${token}`
}
