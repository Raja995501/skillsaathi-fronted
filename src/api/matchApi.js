import apiClient from './axiosClient'

export const matchApi = {
  getMatches: () => apiClient.get('/matches'),
  getMatchDetail: (userId) => apiClient.get(`/matches/${userId}`),
}
