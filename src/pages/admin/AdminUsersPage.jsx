import { useEffect, useState, useCallback } from 'react'
import AdminLayout from '../../components/admin/AdminLayout.jsx'
import { adminApi } from '../../api/adminApi'
import { useToast } from '../../hooks/useToast.jsx'

const TABS = ['OPEN', 'REVIEWED', 'DISMISSED']

export default function AdminReportsPage() {
  const showToast = useToast()
  const [activeTab, setActiveTab] = useState('OPEN')
  const [reports, setReports] = useState(null)
  const [loading, setLoading] = useState(true)
  const [resolvingId, setResolvingId] = useState(null)

  const loadReports = useCallback(async (status) => {
    setLoading(true)
    setReports(null)
    try {
      const res = await adminApi.listReports(status)
      const data = res.data?.data || res.data
      setReports(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load reports:', err)
      showToast(err.response?.data?.message || 'Failed to fetch moderation reports', 'error')
      setReports([])
    } finally { // <--- YAHAN SYNTAX ERROR THA (font-semibold ki jagah finally aayega)
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    let isMounted = true
    loadReports(activeTab)
    return () => {
      isMounted = false
    }
  }, [activeTab, loadReports])

  const handleResolve = async (id, status) => {
    if (resolvingId) return
    setResolvingId(id)
    try {
      await adminApi.resolveReport(id, status)
      showToast(`Report successfully marked as ${status.toLowerCase()}`, 'success')
      await loadReports(activeTab)
    } catch (err) {
      console.error('Report status update failed:', err)
      showToast(err.response?.data?.message || 'Could not update report status', 'error')
    } finally {
      setResolvingId(null)
    }
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'OPEN':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'REVIEWED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'DISMISSED':
        return 'bg-gray-100 text-gray-700 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight mb-1">
          Reports Moderation
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 font-medium">
          Review user-reported flags, policy violations, and community complaints.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-4">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 cursor-pointer ${
              activeTab === t
                ? 'bg-brand-blue text-white shadow-xs'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {t.charAt(0) + t.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
              <div className="h-4 w-1/3 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-1/4 bg-gray-150 rounded mb-4" />
              <div className="h-3 w-3/4 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && reports?.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center shadow-xs">
          <div className="text-3xl mb-2">🚩</div>
          <p className="text-sm font-bold text-gray-700">No {activeTab.toLowerCase()} reports</p>
          <p className="text-xs text-gray-400 mt-1">
            All user flags under this category have been resolved.
          </p>
        </div>
      )}

      {/* Reports List */}
      {!loading && reports?.length > 0 && (
        <div className="space-y-3">
          {reports.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs hover:border-gray-200 transition-all duration-150"
            >
              <div className="flex justify-between items-start gap-3 mb-2">
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    <span className="text-brand-blue">{r.reportedByName || 'Anonymous'}</span> reported{' '}
                    <span className="text-rose-600">{r.reportedUserName || 'User'}</span>
                  </p>
                  <p className="text-xs font-semibold text-gray-500 mt-0.5">
                    Reason: <span className="text-gray-700">{r.reason || 'Unspecified'}</span>
                  </p>
                </div>
                <span
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${getStatusBadgeClass(
                    r.status
                  )}`}
                >
                  {r.status}
                </span>
              </div>

              {r.description && (
                <div className="bg-gray-50 rounded-xl p-3 text-xs sm:text-sm text-gray-700 mb-4 border border-gray-100">
                  {r.description}
                </div>
              )}

              {r.status === 'OPEN' && (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleResolve(r.id, 'REVIEWED')}
                    disabled={resolvingId === r.id}
                    className="px-3 py-1.5 rounded-xl bg-brand-blue text-white text-xs font-bold hover:bg-blue-700 transition disabled:opacity-50 active:scale-95 cursor-pointer"
                  >
                    {resolvingId === r.id ? 'Updating...' : 'Mark Reviewed'}
                  </button>
                  <button
                    onClick={() => handleResolve(r.id, 'DISMISSED')}
                    disabled={resolvingId === r.id}
                    className="px-3 py-1.5 rounded-xl bg-gray-100 text-gray-700 border border-gray-200 text-xs font-bold hover:bg-gray-200 transition disabled:opacity-50 active:scale-95 cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  )
}