import apiClient from './axiosClient'

export const adminApi = {
  getDashboard: () => apiClient.get('/admin/dashboard'),

  listUsers: (search, page = 0, size = 20) => apiClient.get('/admin/users', { params: { search, page, size } }),
  blockUser: (id) => apiClient.put(`/admin/users/${id}/block`),
  unblockUser: (id) => apiClient.put(`/admin/users/${id}/unblock`),

  createCategory: (name) => apiClient.post('/admin/skills/categories', { name }),
  deleteCategory: (id) => apiClient.delete(`/admin/skills/categories/${id}`),

  createSkill: (name, categoryId) => apiClient.post('/admin/skills', { name, categoryId }),
  deleteSkill: (id) => apiClient.delete(`/admin/skills/${id}`),

  listReports: (status) => apiClient.get('/admin/reports', { params: { status } }),
  resolveReport: (id, status) => apiClient.put(`/admin/reports/${id}`, { status }),
}
