import apiClient from './axiosClient'

export const chatApi = {
  getHistory: (connectionId, page = 0, size = 30) =>
    apiClient.get(`/connections/${connectionId}/messages`, { params: { page, size } }),
  markAsRead: (connectionId) => apiClient.post(`/connections/${connectionId}/messages/read`),
}
