import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://skillsaathi-backend.onrender.com/api/v1'

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// --- Token storage (kept in one place so AuthContext and this file always agree) ---
export const tokenStorage = {
  getAccessToken: () => localStorage.getItem('ss_access_token'),
  getRefreshToken: () => localStorage.getItem('ss_refresh_token'),
  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem('ss_access_token', accessToken)
    localStorage.setItem('ss_refresh_token', refreshToken)
  },
  clear: () => {
    localStorage.removeItem('ss_access_token')
    localStorage.removeItem('ss_refresh_token')
  },
}

// Attach the access token to every outgoing request.
apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// On a 401, try ONE silent refresh-and-retry before giving up.
let isRefreshing = false
let pendingQueue = []

function processQueue(error, token) {
  pendingQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve(token)))
  pendingQueue = []
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status !== 401 || originalRequest._retry || originalRequest.url?.includes('/auth/')) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject })
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`
        return apiClient(originalRequest)
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const refreshToken = tokenStorage.getRefreshToken()
      if (!refreshToken) throw error

      // Corrected refresh URL with /api/v1 prefix
      const { data } = await axios.post(`${BASE_URL}/api/v1/auth/refresh`, { refreshToken })
      const { accessToken, refreshToken: newRefreshToken } = data.data

      tokenStorage.setTokens(accessToken, newRefreshToken)
      processQueue(null, accessToken)

      originalRequest.headers.Authorization = `Bearer ${accessToken}`
      return apiClient(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError, null)
      tokenStorage.clear()
      window.location.href = '/login'
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export default apiClient
