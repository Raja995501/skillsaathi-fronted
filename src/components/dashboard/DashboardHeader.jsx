import { useState } from 'react'
import { useNavigate } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

export default function DashboardHeader() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [showMobileSearch, setShowMobileSearch] = useState(false)

  // Support multiple backend naming formats if present
  const avatarSrc = user?.profilePictureUrl || user?.avatarUrl || user?.profileImage

  return (
    <header className="h-16 bg-white border-b border-gray-100 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">
      
      {/* Brand Logo & Name */}
      <div 
        onClick={() => navigate('/dashboard')} 
        className="flex items-center gap-2 sm:gap-2.5 cursor-pointer shrink-0"
      >
        <div className="w-7 h-7 sm:w-8 sm:h-8 relative flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
            <defs>
              <linearGradient id="dashLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4B2ECF" />
                <stop offset="100%" stopColor="#FF7A00" />
              </linearGradient>
            </defs>
            <path
              d="M 65,25 C 40,25 30,40 50,55 C 70,70 60,85 35,85"
              fill="none"
              stroke="url(#dashLogoGrad)"
              strokeWidth="16"
              strokeLinecap="round"
            />
            <path d="M 50,10 L 75,22 L 50,34 L 25,22 Z" fill="#4B2ECF" />
          </svg>
        </div>
        <span className="text-base sm:text-lg font-extrabold text-gray-900 tracking-tight">
          Skill <span className="text-[#FF7A00]">Equator</span>
        </span>
      </div>

      {/* Desktop Search Bar */}
      <div className="hidden sm:flex items-center w-64 md:w-80 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 focus-within:border-[#4B2ECF] transition-colors">
        <span className="text-gray-400 text-sm mr-2">🔍</span>
        <input 
          type="text" 
          placeholder="Search skills, people..." 
          className="bg-transparent text-xs text-gray-800 outline-none w-full"
        />
      </div>

      {/* Mobile Inline Expandable Search Bar */}
      {showMobileSearch && (
        <div className="absolute inset-x-0 top-0 h-16 bg-white border-b border-gray-100 px-4 flex items-center gap-2 z-50 sm:hidden">
          <div className="flex-1 flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
            <span className="text-gray-400 text-xs mr-2">🔍</span>
            <input 
              type="text" 
              placeholder="Search skills, people..." 
              className="bg-transparent text-xs text-gray-800 outline-none w-full"
              autoFocus
            />
          </div>
          <button 
            onClick={() => setShowMobileSearch(false)}
            className="text-xs font-bold text-gray-500 px-2 py-1"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Right Actions & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search Icon Trigger for Mobile */}
        <button 
          onClick={() => setShowMobileSearch(true)}
          className="sm:hidden w-8 h-8 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-600 text-xs active:scale-95"
          aria-label="Search"
        >
          🔍
        </button>

        {/* Notification Bell */}
        <button className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition cursor-pointer text-xs sm:text-sm">
          🔔
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FF7A00] rounded-full" />
        </button>

        {/* User Avatar & Info */}
        <div 
          onClick={() => navigate('/dashboard/profile')}
          className="flex items-center gap-2 pl-1.5 sm:pl-2 border-l border-gray-100 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 rounded-full bg-[#4B2ECF] text-white font-bold text-xs flex items-center justify-center overflow-hidden border border-gray-200 shrink-0">
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
          
          <div className="hidden md:flex flex-col">
            <span className="text-xs font-semibold text-gray-700 leading-tight">
              {user?.name || 'User'}
            </span>
            {user?.email && (
              <span className="text-[10px] text-gray-400 leading-tight truncate max-w-[110px]">
                {user.email}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}