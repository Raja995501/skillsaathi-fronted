import apiClient from './axiosClient'

export const userApi = {
  getMyProfile: () => apiClient.get('/users/me'),
  updateMyProfile: (payload) => apiClient.put('/users/me', payload),
  uploadProfilePicture: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.post('/users/me/profile-picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  getPublicProfile: (userId) => apiClient.get(`/users/${userId}`),
}
