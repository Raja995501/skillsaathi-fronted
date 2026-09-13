import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

export default function Navbar() {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)

  const handleNavClick = (action) => {
    setIsOpen(false)
    action()
  }

  return (
    <header className="h-[76px] bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-[6%] sticky top-0 z-50 font-sans shadow-xs">
      {/* Brand Logo with Graduation Cap */}
      <div 
        onClick={() => scrollToId('home')} 
        className="flex items-center gap-2.5 cursor-pointer"
      >
        <div className="w-9 h-9 relative flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xs">
            <defs>
              <linearGradient id="navLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4B2ECF" />
                <stop offset="100%" stopColor="#FF7A00" />
              </linearGradient>
            </defs>
            <path
              d="M 65,25 C 40,25 30,40 50,55 C 70,70 60,85 35,85"
              fill="none"
              stroke="url(#navLogoGrad)"
              strokeWidth="16"
              strokeLinecap="round"
            />
            <path d="M 50,10 L 75,22 L 50,34 L 25,22 Z" fill="#4B2ECF" />
          </svg>
        </div>
        <span className="text-xl font-extrabold tracking-tight text-gray-900">
          Skill <span className="text-[#FF7A00]">Equator</span>
        </span>
      </div>

      {/* Desktop Nav Links */}
      <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-gray-600">
        <button onClick={() => scrollToId('home')} className="hover:text-[#4B2ECF] transition cursor-pointer">Home</button>
        <button onClick={() => scrollToId('skills')} className="hover:text-[#4B2ECF] transition cursor-pointer">Browse Skills</button>
        <button onClick={() => navigate('/dashboard/search')} className="hover:text-[#4B2ECF] transition cursor-pointer">Find People</button>
        <button onClick={() => scrollToId('how')} className="hover:text-[#4B2ECF] transition cursor-pointer">How It Works</button>
      </nav>

      {/* Action Buttons & Mobile Hamburger Toggle */}
      <div className="flex items-center gap-3">
        {/* Desktop Buttons */}
        <div className="hidden sm:flex items-center gap-3">
          <button 
            onClick={() => navigate('/login')} 
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-[#4B2ECF] border border-[#4B2ECF]/30 hover:bg-[#4B2ECF]/5 transition cursor-pointer"
          >
            Login
          </button>
          <button 
            onClick={() => navigate('/register')} 
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#4B2ECF] hover:bg-[#3b23ab] shadow-md shadow-[#4B2ECF]/20 transition cursor-pointer"
          >
            Sign Up
          </button>
        </div>

        {/* Mobile Menu Icon (Show on Mobile only) */}
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="md:hidden p-2 text-gray-700 hover:text-[#4B2ECF] focus:outline-none"
          aria-label="Toggle Menu"
        >
          {isOpen ? (
            <span className="text-2xl font-bold">✕</span>
          ) : (
            <span className="text-2xl font-bold">☰</span>
          )}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="absolute top-[76px] left-0 right-0 bg-white border-b border-gray-200 shadow-lg p-5 md:hidden flex flex-col gap-4">
          <button 
            onClick={() => handleNavClick(() => scrollToId('home'))} 
            className="text-left font-semibold text-gray-700 hover:text-[#4B2ECF] py-1"
          >
            Home
          </button>
          <button 
            onClick={() => handleNavClick(() => scrollToId('skills'))} 
            className="text-left font-semibold text-gray-700 hover:text-[#4B2ECF] py-1"
          >
            Browse Skills
          </button>
          <button 
            onClick={() => handleNavClick(() => navigate('/dashboard/search'))} 
            className="text-left font-semibold text-gray-700 hover:text-[#4B2ECF] py-1"
          >
            Find People
          </button>
          <button 
            onClick={() => handleNavClick(() => scrollToId('how'))} 
            className="text-left font-semibold text-gray-700 hover:text-[#4B2ECF] py-1"
          >
            How It Works
          </button>

          {/* Mobile Auth Buttons */}
          <div className="pt-3 border-t border-gray-100 flex flex-col gap-2 sm:hidden">
            <button 
              onClick={() => handleNavClick(() => navigate('/login'))} 
              className="w-full py-2.5 rounded-xl text-sm font-bold text-[#4B2ECF] border border-[#4B2ECF]/30 hover:bg-[#4B2ECF]/5 text-center"
            >
              Login
            </button>
            <button 
              onClick={() => handleNavClick(() => navigate('/register'))} 
              className="w-full py-2.5 rounded-xl text-sm font-bold text-white bg-[#4B2ECF] hover:bg-[#3b23ab] shadow-md shadow-[#4B2ECF]/20 text-center"
            >
              Sign Up
            </button>
          </div>
        </div>
      )}
    </header>
  )
}