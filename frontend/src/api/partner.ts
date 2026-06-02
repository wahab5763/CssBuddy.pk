import { apiClient } from './client'

export function chatWsUrl(connId: number, token: string): string {
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/^http/, 'ws')
  return `${base}/api/partner/messages/${connId}/ws?token=${token}`
}

export const partnerApi = {
  getPreferences: () => apiClient.get('/api/partner/preferences'),
  upsertPreferences: (data: Record<string, unknown>) => apiClient.put('/api/partner/preferences', data),
  discover: (page = 1) => apiClient.get('/api/partner/discover', { params: { page } }),
  sendRequest: (receiverId: number, icebreaker?: string) =>
    apiClient.post(`/api/partner/connect/${receiverId}`, { icebreaker }),
  accept: (connId: number) => apiClient.post(`/api/partner/connect/${connId}/accept`),
  reject: (connId: number) => apiClient.post(`/api/partner/connect/${connId}/reject`),
  cancel: (connId: number) => apiClient.delete(`/api/partner/connect/${connId}`),
  connections: () => apiClient.get('/api/partner/connections'),
  incoming: () => apiClient.get('/api/partner/requests/incoming'),
  sent: () => apiClient.get('/api/partner/requests/sent'),
  messages: (connId: number) => apiClient.get(`/api/partner/messages/${connId}`),
  sendMessage: (connId: number, content: string) =>
    apiClient.post(`/api/partner/messages/${connId}`, { content }),
  markRead: (connId: number) => apiClient.patch(`/api/partner/messages/${connId}/read`),
}
