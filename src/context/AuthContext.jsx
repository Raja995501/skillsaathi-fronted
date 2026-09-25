import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import PropTypes from 'prop-types'
import { authApi } from '../api/authApi'
import { userApi } from '../api/userApi'
import { tokenStorage } from '../api/axiosClient'
import { subscribeToPush, unsubscribeFromPush } from '../services/pushService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadCurrentUser = useCallback(async () => {
    if (!tokenStorage.getAccessToken()) {
      setLoading(false)
      return null
    }
    try {
      const { data } = await userApi.getMyProfile()
      const profileData = data.data || data

      setUser((prevUser) => {
        const mergedRole = profileData.role || profileData.roles || prevUser?.role || prevUser?.roles
        return {
          ...prevUser,
          ...profileData,
          role: mergedRole
        }
      })
      return profileData
    } catch (error) {
      console.error('Failed to load current user:', error)
      if (error.response?.status === 401 || error.response?.status === 403) {
        tokenStorage.clear()
        setUser(null)
      }
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCurrentUser()
  }, [loadCurrentUser])

  // ✅ CROSS-TAB SYNC: Agar user doosre tab mein login/logout kare, toh yeh tab bhi auto-sync ho jaye
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === 'ss_access_token') {
        if (!event.newValue) {
          setUser(null)
        } else {
          loadCurrentUser()
        }
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [loadCurrentUser])

  useEffect(() => {
    if (user && tokenStorage.getAccessToken()) {
      subscribeToPush().catch((err) =>
        console.warn('Push subscription failed:', err)
      )
    }
  }, [user])

  const login = async (email, password) => {
    const { data } = await authApi.login({ email, password })
    const loginData = data.data || data
    const { accessToken, refreshToken, ...userInfo } = loginData

    tokenStorage.setTokens(accessToken, refreshToken)
    setUser(userInfo)

    const fullProfile = await loadCurrentUser()

    subscribeToPush().catch((err) =>
      console.warn('Push subscription failed:', err)
    )

    return fullProfile ? { ...userInfo, ...fullProfile } : userInfo
  }

  const googleLogin = async (googleToken) => {
    const { data } = await authApi.googleLogin({ token: googleToken })
    const loginData = data.data || data
    const { accessToken, refreshToken, ...userInfo } = loginData

    tokenStorage.setTokens(accessToken, refreshToken)
    setUser(userInfo)

    const fullProfile = await loadCurrentUser()

    subscribeToPush().catch((err) =>
      console.warn('Push subscription failed:', err)
    )

    return fullProfile ? { ...userInfo, ...fullProfile } : userInfo
  }

  const register = async (payload) => {
    return await authApi.register(payload)
  }

  const logout = async () => {
    const refreshToken = tokenStorage.getRefreshToken()
    try {
      unsubscribeFromPush().catch((err) =>
        console.warn('Push unsubscribe failed:', err)
      )
      if (refreshToken) await authApi.logout(refreshToken)
    } catch (error) {
      console.warn('Logout API call failed, clearing local tokens:', error)
    } finally {
      tokenStorage.clear()
      setUser(null)
    }
  }

  const refreshUser = async () => {
    try {
      const { data } = await userApi.getMyProfile()
      const profileData = data.data || data
      setUser((prevUser) => ({
        ...prevUser,
        ...profileData,
        role: profileData.role || profileData.roles || prevUser?.role || prevUser?.roles
      }))
      return profileData
    } catch (error) {
      console.error('Error refreshing user profile:', error)
      if (error.response?.status === 401 || error.response?.status === 403) {
        tokenStorage.clear()
        setUser(null)
      }
      return null
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        googleLogin,
        register,
        logout,
        refreshUser,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}