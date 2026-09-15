import { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout.jsx'
import { adminApi } from '../../api/adminApi'
import { useToast } from '../../hooks/useToast.jsx'

const PAGE_SIZE = 15

export default function AdminUsersPage() {
  const showToast = useToast()
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState(null)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const load = async (searchTerm = search, pageToLoad = 0) => {
    try {
      const { data } = await adminApi.listUsers(searchTerm || undefined, pageToLoad, PAGE_SIZE)
      setUsers(data.data.content)
      setTotalPages(data.data.totalPages)
      setPage(pageToLoad)
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load users', 'error')
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    load(search, 0)
  }

  const handleToggleBlock = async (u) => {
    try {
      if (u.blocked) await adminApi.unblockUser(u.id)
      else await adminApi.blockUser(u.id)
      showToast(u.blocked ? 'User unblocked' : 'User blocked')
      load(search, page)
    } catch (err) {
      showToast(err.response?.data?.message || 'Action failed')
    }
  }

  return (
    <AdminLayout>
      <h1 className="text-xl sm:text-2xl font-bold text-brand-navy mb-6">Manage Users</h1>

      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full sm:flex-1 sm:max-w-sm px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-brand-blue"
        />
        <button
          type="submit"
          className="px-5 py-2.5 rounded-lg bg-brand-blue text-white text-sm font-semibold cursor-pointer hover:bg-blue-700 transition"
        >
          Search
        </button>
      </form>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm min-w-[650px]">
          <thead className="bg-gray-50 text-left text-xs text-brand-muted uppercase">
            <tr>
              <th className="px-4 sm:px-5 py-3 font-semibold">Name</th>
              <th className="px-4 sm:px-5 py-3 font-semibold">Email</th>
              <th className="px-4 sm:px-5 py-3 font-semibold">Location</th>
              <th className="px-4 sm:px-5 py-3 font-semibold">Rating</th>
              <th className="px-4 sm:px-5 py-3 font-semibold">Status</th>
              <th className="px-4 sm:px-5 py-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {users?.map((u) => (
              <tr key={u.id} className="border-t border-gray-50">
                <td className="px-4 sm:px-5 py-3 font-medium text-brand-text whitespace-nowrap">{u.name}</td>
                <td className="px-4 sm:px-5 py-3 text-brand-muted whitespace-nowrap">{u.email}</td>
                <td className="px-4 sm:px-5 py-3 text-brand-muted whitespace-nowrap">
                  {[u.city, u.state].filter(Boolean).join(', ') || '—'}
                </td>
                <td className="px-4 sm:px-5 py-3 text-brand-muted whitespace-nowrap">⭐ {u.averageRating ?? '0.00'}</td>
                <td className="px-4 sm:px-5 py-3 whitespace-nowrap">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      u.blocked ? 'bg-red-50 text-red-500' : 'bg-green-50 text-brand-green'
                    }`}
                  >
                    {u.blocked ? 'Blocked' : 'Active'}
                  </span>
                  {!u.emailVerified && (
                    <span className="ml-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-500">
                      Unverified
                    </span>
                  )}
                </td>
                <td className="px-4 sm:px-5 py-3 text-right whitespace-nowrap">
                  <button
                    onClick={() => handleToggleBlock(u)}
                    className={`text-xs font-semibold cursor-pointer ${
                      u.blocked ? 'text-brand-blue' : 'text-red-500'
                    }`}
                  >
                    {u.blocked ? 'Unblock' : 'Block'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users?.length === 0 && <p className="text-center text-sm text-brand-muted py-8">No users found</p>}
      </div>

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-6">
          <button
            onClick={() => load(search, page - 1)}
            disabled={page === 0}
            className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm font-medium disabled:opacity-40 cursor-pointer"
          >
            ← Previous
          </button>
          <span className="px-3 py-2 text-sm text-brand-muted">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => load(search, page + 1)}
            disabled={page >= totalPages - 1}
            className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm font-medium disabled:opacity-40 cursor-pointer"
          >
            Next →
          </button>
        </div>
      )}
    </AdminLayout>
  )
}
