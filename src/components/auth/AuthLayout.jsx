import { Link } from 'react-router-dom'

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f8fbff] to-[#eef4ff] px-4 sm:px-6 py-6 sm:py-10 font-sans">
      <div className="w-full max-w-md">
        {/* True horizontal center container */}
        <div className="w-full flex justify-center mb-6 sm:mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 group cursor-pointer">
            <div className="w-9 h-9 relative flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xs">
                <defs>
                  <linearGradient id="authLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4B2ECF" />
                    <stop offset="100%" stopColor="#FF7A00" />
                  </linearGradient>
                </defs>
                <path
                  d="M 65,25 C 40,25 30,40 50,55 C 70,70 60,85 35,85"
                  fill="none"
                  stroke="url(#authLogoGrad)"
                  strokeWidth="16"
                  strokeLinecap="round"
                />
                <path d="M 50,10 L 75,22 L 50,34 L 25,22 Z" fill="#4B2ECF" />
              </svg>
            </div>
            <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-900">
              Skill <span className="text-[#FF7A00]">Equator</span>
            </span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-[0_20px_60px_rgba(24,59,122,0.1)] p-5 sm:p-8 border border-gray-100/80">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{title}</h1>
          {subtitle && <p className="text-gray-500 text-xs sm:text-sm mb-5 sm:mb-6">{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  )
}