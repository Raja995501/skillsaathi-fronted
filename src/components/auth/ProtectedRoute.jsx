import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    // Brief flash while checking localStorage session — avoids premature redirect-to-login on page refresh
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-gray-500 text-xs sm:text-sm font-medium space-y-3">
        <div className="w-8 h-8 border-3 border-purple-200 border-t-[#4B2ECF] rounded-full animate-spin" />
        <span>Authenticating session...</span>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}