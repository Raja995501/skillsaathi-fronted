import { useEffect, useState, useCallback } from 'react'
import AdminLayout from '../../components/admin/AdminLayout.jsx'
import { adminApi } from '../../api/adminApi'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchDashboardStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await adminApi.getDashboard()
      const data = res.data?.data || res.data
      setStats(data)
    } catch (err) {
      console.error('Failed to load admin dashboard stats:', err)
      setError('Unable to load platform analytics. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardStats()
  }, [fetchDashboardStats])

  const cards = [
    { label: 'Total Users', value: stats?.totalUsers, icon: '👥', color: 'bg-blue-50 text-blue-600' },
    { label: 'Total Skills', value: stats?.totalSkills, icon: '🧩', color: 'bg-purple-50 text-purple-600' },
    { label: 'Total Connections', value: stats?.totalConnections, icon: '🤝', color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Total Messages', value: stats?.totalMessages, icon: '💬', color: 'bg-sky-50 text-sky-600' },
    { label: 'Total Reviews', value: stats?.totalReviews, icon: '⭐', color: 'bg-amber-50 text-amber-600' },
    { label: 'Open Reports', value: stats?.openReports, icon: '🚩', color: 'bg-rose-50 text-rose-600' },
  ]

  return (
    <AdminLayout>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight mb-1">
          Admin Dashboard
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 font-medium">
          Platform-wide real-time metrics and operational overview.
        </p>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-medium flex items-center justify-between gap-3">
          <span>{error}</span>
          <button
            onClick={fetchDashboardStats}
            className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition active:scale-95 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {loading
          ? Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 animate-pulse"
              >
                <div className="w-10 h-10 rounded-xl bg-gray-200 mb-3" />
                <div className="h-8 w-24 bg-gray-200 rounded-lg mb-2" />
                <div className="h-4 w-32 bg-gray-150 rounded" />
              </div>
            ))
          : cards.map((c) => (
              <div
                key={c.label}
                className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all duration-200 hover:border-gray-200 group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${c.color} group-hover:scale-110 transition-transform`}
                  >
                    {c.icon}
                  </div>
                  {c.label === 'Open Reports' && (c.value > 0) && (
                    <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-rose-100 text-rose-700">
                      Action Needed
                    </span>
                  )}
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                  {c.value !== undefined && c.value !== null ? c.value.toLocaleString() : '—'}
                </p>
                <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-1">
                  {c.label}
                </p>
              </div>
            ))}
      </div>
    </AdminLayout>
  )
}