import apiClient from './axiosClient'

export const reviewApi = {
  submitReview: (connectionId, payload) => apiClient.post(`/connections/${connectionId}/review`, payload),
  getReviewsForUser: (userId) => apiClient.get(`/users/${userId}/reviews`),
}
