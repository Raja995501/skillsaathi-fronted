import { useState } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: '📊', end: true },
  { to: '/admin/users', label: 'Users', icon: '👥' },
  { to: '/admin/skills', label: 'Skills & Categories', icon: '🧩' },
  { to: '/admin/reports', label: 'Reports', icon: '🚩' },
]

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-brand-bg font-sans flex flex-col md:flex-row">
      
      {/* Mobile Top Header */}
      <div className="md:hidden bg-brand-navy border-b border-white/10 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-lg font-extrabold text-white">
            Skill <span className="text-brand-orange">Equator</span>
          </span>
          <span className="text-[9px] font-bold text-white/60 border border-white/20 rounded px-1.5 py-0.5">ADMIN</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg bg-white/10 text-white text-lg font-bold active:scale-95"
          aria-label="Toggle navigation"
        >
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* Admin Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-brand-navy flex flex-col shrink-0 z-50 transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Logo (Desktop) */}
        <div className="hidden md:flex h-[70px] items-center px-6 border-b border-white/10">
          <span className="text-xl font-extrabold text-white">
            Skill <span className="text-brand-orange">Equator</span>
          </span>
          <span className="ml-2 text-[10px] font-bold text-white/60 border border-white/20 rounded px-1.5 py-0.5">ADMIN</span>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5'
                }`
              }
            >
              <span>{item.icon}</span> {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User Info & Actions */}
        <div className="p-4 border-t border-white/10">
          <Link
            to="/dashboard"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block text-xs text-white/60 hover:text-white mb-3"
          >
            ← Back to regular app
          </Link>
          <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
          <button onClick={handleLogout} className="text-xs text-red-300 font-semibold hover:underline mt-1 cursor-pointer">
            Log out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 max-w-full">{children}</main>
    </div>
  )
}