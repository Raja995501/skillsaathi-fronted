import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/dashboard/DashboardLayout.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { matchApi } from '../../api/matchApi'
import { connectionApi } from '../../api/connectionApi'

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ matches: null, pending: null, connected: null })

  useEffect(() => {
    let isMounted = true

    Promise.allSettled([
      matchApi.getMatches(),
      connectionApi.list('PENDING'),
      connectionApi.list('ACCEPTED'),
    ]).then(([matchesRes, pendingRes, connectedRes]) => {
      if (!isMounted) return

      const getLength = (res) => {
        if (res.status !== 'fulfilled') return 0
        const data = res.value?.data?.data || res.value?.data || []
        return Array.isArray(data) ? data.length : 0
      }

      setStats({
        matches: getLength(matchesRes),
        pending: getLength(pendingRes),
        connected: getLength(connectedRes),
      })
    }).catch((err) => {
      console.error("Dashboard stats fetch error:", err)
    })

    return () => {
      isMounted = false
    }
  }, [])

  const cards = [
    { label: 'Potential Matches', value: stats.matches, to: '/dashboard/matches', color: 'text-brand-blue' },
    { label: 'Pending Requests', value: stats.pending, to: '/dashboard/connections', color: 'text-brand-orange' },
    { label: 'Active Connections', value: stats.connected, to: '/dashboard/connections', color: 'text-brand-green' },
  ]

  const firstName = user?.name?.split(' ')[0] || user?.fullName?.split(' ')[0] || 'User'

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold text-brand-navy mb-1">
        Welcome back, {firstName} 👋
      </h1>
      <p className="text-brand-muted text-sm mb-6">Here's what's happening with your skill exchanges.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {cards.map((c) => (
          <Link
            key={c.label}
            to={c.to}
            className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow"
          >
            <p className={`text-3xl font-bold ${c.color}`}>{c.value ?? '—'}</p>
            <p className="text-sm text-brand-muted mt-1">{c.label}</p>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-brand-text mb-2">Get started</h2>
        <p className="text-sm text-brand-muted mb-4">
          Add the skills you can teach and want to learn to start seeing matches.
        </p>
        <Link to="/dashboard/profile" className="text-sm text-brand-blue font-semibold">
          Go to My Profile →
        </Link>
      </div>
    </DashboardLayout>
  )
}