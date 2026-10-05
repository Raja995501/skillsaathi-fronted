import apiClient from './axiosClient'

export const chatApi = {
  getHistory: (connectionId, page = 0, size = 30) =>
    apiClient.get(`/connections/${connectionId}/messages`, { params: { page, size } }),
  markAsRead: (connectionId) => apiClient.post(`/connections/${connectionId}/messages/read`),
  
  uploadMedia: (connectionId, file) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.post(`/connections/${connectionId}/messages/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
}