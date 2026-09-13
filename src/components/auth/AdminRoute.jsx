import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

/**
 * Backend already enforces this at the API level (SecurityConfig: /api/v1/admin/**
 * requires ROLE_ADMIN) — this is the UI-side mirror so a non-admin never even sees
 * the admin shell before their first API call 403s.
 */
export default function AdminRoute({ children }) {
  const { user, loading, isAuthenticated } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-brand-bg text-gray-500 text-xs sm:text-sm font-medium space-y-3">
        <div className="w-8 h-8 border-3 border-purple-200 border-t-[#4B2ECF] rounded-full animate-spin" />
        <span>Verifying admin access...</span>
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== 'ADMIN') return <Navigate to="/dashboard" replace />

  return children
}