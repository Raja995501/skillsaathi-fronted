import apiClient from './axiosClient'

export const notificationApi = {
  getNotifications: (read, page = 0, size = 20) =>
    apiClient.get('/notifications', { params: { read, page, size } }),
  unreadCount: () => apiClient.get('/notifications/unread-count'),
  markAsRead: (id) => apiClient.post(`/notifications/${id}/read`),
  markAllAsRead: () => apiClient.post('/notifications/read-all'),
}
