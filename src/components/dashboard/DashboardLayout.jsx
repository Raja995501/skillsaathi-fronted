import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import NotificationBell from './NotificationBell.jsx'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Overview', icon: '🏠', end: true },
  { to: '/dashboard/matches', label: 'Matches', icon: '🔎' },
  { to: '/dashboard/search', label: 'Browse', icon: '🌐' },
  { to: '/dashboard/connections', label: 'Connections', icon: '🤝' },
  { to: '/dashboard/chat', label: 'Messages', icon: '💬' },
  { to: '/dashboard/profile', label: 'My Profile', icon: '👤' },
]

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Robust Case-Insensitive Admin Check (Handles string, object, array, and nested authority)
  const checkIsAdmin = (u) => {
    if (!u) return false
    
    const roleVal = u.role || u.roles || u.authorities
    
    if (typeof roleVal === 'string') {
      const cleanRole = roleVal.toUpperCase()
      return cleanRole === 'ADMIN' || cleanRole === 'ROLE_ADMIN'
    }
    
    if (Array.isArray(roleVal)) {
      return roleVal.some((r) => {
        const str = typeof r === 'string' ? r : r?.authority || r?.name || ''
        const clean = str.toUpperCase()
        return clean === 'ADMIN' || clean === 'ROLE_ADMIN'
      })
    }
    
    if (typeof roleVal === 'object' && roleVal !== null) {
      const name = (roleVal.name || roleVal.authority || '').toUpperCase()
      return name === 'ADMIN' || name === 'ROLE_ADMIN'
    }

    return false
  }

  const isAdmin = checkIsAdmin(user)

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const avatarSrc = user?.profilePictureUrl || user?.avatarUrl || user?.profileImage

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans flex flex-col">
      {/* TOP NAVBAR */}
      <header className="h-[70px] bg-white border-b border-gray-100 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 shrink-0">
        
        {/* Left: Brand Logo & Mobile Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-gray-50 text-gray-700 text-lg font-bold border border-gray-100 active:scale-95"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>

          <div 
            onClick={() => navigate('/dashboard')} 
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer shrink-0"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 relative flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
                <defs>
                  <linearGradient id="dashNavLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4B2ECF" />
                    <stop offset="100%" stopColor="#FF7A00" />
                  </linearGradient>
                </defs>
                <path
                  d="M 65,25 C 40,25 30,40 50,55 C 70,70 60,85 35,85"
                  fill="none"
                  stroke="url(#dashNavLogoGrad)"
                  strokeWidth="16"
                  strokeLinecap="round"
                />
                <path d="M 50,10 L 75,22 L 50,34 L 25,22 Z" fill="#4B2ECF" />
              </svg>
            </div>
            <span className="text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight">
              Skill <span className="text-[#FF7A00]">Equator</span>
            </span>
          </div>
        </div>

        {/* Center: Live Quick Highlights & Action Button (Desktop Only) */}
        <div className="hidden md:flex items-center gap-4">
          <div 
            onClick={() => navigate('/dashboard/matches')}
            className="flex items-center gap-2 bg-blue-50/70 text-[#4B2ECF] px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer hover:bg-blue-100/70 transition"
          >
            <span>⚡</span>
            <span>Matches Active</span>
          </div>

          <div 
            onClick={() => navigate('/dashboard/connections')}
            className="flex items-center gap-2 bg-orange-50/70 text-[#FF7A00] px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer hover:bg-orange-100/70 transition"
          >
            <span>📩</span>
            <span>Pending Requests</span>
          </div>

          <button 
            onClick={() => navigate('/dashboard/profile')}
            className="flex items-center gap-1.5 bg-[#4B2ECF] text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold hover:bg-[#3b22ab] transition shadow-sm cursor-pointer ml-2"
          >
            <span>+</span> Add My Skill
          </button>
        </div>

        {/* Right: Notifications & Profile Info */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <NotificationBell />

          <div 
            onClick={() => navigate('/dashboard/profile')}
            className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-gray-100 cursor-pointer"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-[#4B2ECF] to-[#FF7A00] text-white flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 shadow-sm overflow-hidden border border-gray-200">
              {avatarSrc ? (
                <img 
                  key={avatarSrc}
                  src={avatarSrc} 
                  alt={user?.name || 'Profile'} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                />
              ) : (
                user?.name?.[0]?.toUpperCase() || 'U'
              )}
            </div>

            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-gray-800 leading-none">{user?.name || 'User'}</p>
              <p className="text-[10px] text-gray-400 mt-1 truncate max-w-[120px]">{user?.email}</p>
            </div>
          </div>
        </div>
      </header>

      {/* BODY CONTENT */}
      <div className="flex flex-1 relative min-h-[calc(100vh-70px)]">
        
        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          />
        )}

        {/* Left Sidebar Navigation */}
        <aside
          className={`fixed md:sticky top-[70px] left-0 h-[calc(100vh-70px)] w-64 bg-white border-r border-gray-100 flex flex-col shrink-0 justify-between z-50 transition-transform duration-300 ease-in-out ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <nav className="p-4 space-y-1.5 overflow-y-auto">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#4B2ECF]/10 text-[#4B2ECF]'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <span className="text-base">{item.icon}</span> {item.label}
              </NavLink>
            ))}

            {/* Dynamic Admin Panel Link */}
            {isAdmin && (
              <NavLink
                to="/admin"
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all mt-3 ${
                    isActive
                      ? 'bg-[#4B2ECF] text-white'
                      : 'text-gray-800 bg-gray-50 hover:bg-gray-100'
                  }`
                }
              >
                <span className="text-base">🛡️</span> Admin Panel
              </NavLink>
            )}
          </nav>

          <div className="p-4 border-t border-gray-100">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-xs font-bold text-red-500 hover:bg-red-50 p-2.5 rounded-xl transition w-full text-left cursor-pointer"
            >
              <span>🚪</span> Log out
            </button>
          </div>
        </aside>

        {/* Main Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 max-w-full min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}