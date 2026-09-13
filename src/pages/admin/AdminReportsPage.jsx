import { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout.jsx'
import { adminApi } from '../../api/adminApi'
import { useToast } from '../../hooks/useToast.jsx'

const TABS = ['OPEN', 'REVIEWED', 'DISMISSED']

export default function AdminReportsPage() {
  const showToast = useToast()
  const [activeTab, setActiveTab] = useState('OPEN')
  const [reports, setReports] = useState(null)

  const load = async (status) => {
    setReports(null)
    const { data } = await adminApi.listReports(status)
    setReports(data.data)
  }

  useEffect(() => {
    load(activeTab)
  }, [activeTab])

  const handleResolve = async (id, status) => {
    try {
      await adminApi.resolveReport(id, status)
      showToast(`Report marked as ${status.toLowerCase()}`)
      load(activeTab)
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not update report')
    }
  }

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-brand-navy mb-6">Reports</h1>

      <div className="flex gap-2 mb-6">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === t ? 'bg-brand-blue text-white' : 'bg-white text-brand-muted border border-gray-200'
            }`}
          >
            {t.charAt(0) + t.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {reports === null && <p className="text-brand-muted text-sm">Loading...</p>}
      {reports?.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <p className="text-brand-muted text-sm">No {activeTab.toLowerCase()} reports.</p>
        </div>
      )}

      <div className="space-y-3">
        {reports?.map((r) => (
          <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-sm font-semibold text-brand-text">
                  {r.reportedByName} reported {r.reportedUserName}
                </p>
                <p className="text-xs text-brand-muted mt-0.5">Reason: {r.reason}</p>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-brand-muted shrink-0">
                {r.status}
              </span>
            </div>
            {r.description && <p className="text-sm text-brand-text mb-3">{r.description}</p>}

            {r.status === 'OPEN' && (
              <div className="flex gap-2">
                <button onClick={() => handleResolve(r.id, 'REVIEWED')}
                  className="px-3 py-1.5 rounded-lg bg-brand-blue text-white text-xs font-semibold">
                  Mark Reviewed
                </button>
                <button onClick={() => handleResolve(r.id, 'DISMISSED')}
                  className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold">
                  Dismiss
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </AdminLayout>
  )
}
