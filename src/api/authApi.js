import apiClient from './axiosClient'

export const authApi = {
  register: (payload) => apiClient.post('/auth/register', payload),
  verifyEmail: (token) => apiClient.post('/auth/verify-email', { token }),
  login: (payload) => apiClient.post('/auth/login', payload),
  
  // ✅ Google Login Endpoint
  googleLogin: (payload) => apiClient.post('/auth/google', payload),
  
  refresh: (refreshToken) => apiClient.post('/auth/refresh', { refreshToken }),
  logout: (refreshToken) => apiClient.post('/auth/logout', { refreshToken }),
  forgotPassword: (email) => apiClient.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => apiClient.post('/auth/reset-password', { token, newPassword }),
}