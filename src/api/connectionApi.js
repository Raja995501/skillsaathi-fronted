import apiClient from './axiosClient'

export const connectionApi = {
  sendRequest: (userId) => apiClient.post(`/connections/${userId}/request`),
  cancel: (id) => apiClient.post(`/connections/${id}/cancel`),
  accept: (id) => apiClient.post(`/connections/${id}/accept`),
  reject: (id) => apiClient.post(`/connections/${id}/reject`),
  block: (id) => apiClient.post(`/connections/${id}/block`),
  list: (status) => apiClient.get('/connections', { params: { status } }),
}
