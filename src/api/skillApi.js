import apiClient from './axiosClient'

export const skillApi = {
  getCategories: () => apiClient.get('/skills/categories'),
  getSkills: (categoryId, search) => apiClient.get('/skills', { params: { category: categoryId, search } }),
  getMySkills: () => apiClient.get('/users/me/skills'),
  addSkill: (payload) => apiClient.post('/users/me/skills', payload),
  updateSkill: (id, payload) => apiClient.put(`/users/me/skills/${id}`, payload),
  removeSkill: (id) => apiClient.delete(`/users/me/skills/${id}`),
}
