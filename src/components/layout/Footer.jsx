import { useNavigate } from 'react-router-dom'

const COLUMNS = [
  { 
    title: 'Quick Links', 
    links: [
      { name: 'Home', href: '#' },
      { name: 'Browse Skills', id: 'skills' },
      { name: 'How It Works', id: 'how' },
      { name: 'Core Features', id: 'features' },
    ] 
  },
  { 
    title: 'Support', 
    links: [
      { name: 'Help Center', href: '#' },
      { name: 'FAQs', href: '#' },
      { name: 'Privacy Policy', href: '#' },
      { name: 'Terms & Conditions', href: '#' },
    ] 
  },
]

export default function Footer() {
  const navigate = useNavigate()

  const handleLinkClick = (e, item) => {
    if (item.id) {
      e.preventDefault()
      const element = document.getElementById(item.id)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  return (
    <footer className="bg-[#0F172A] text-white font-sans border-t border-slate-800">
      {/* Top CTA Banner Section */}
      <div className="px-4 sm:px-6 lg:px-[6%] py-12 sm:py-14 border-b border-white/10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          
          <div className="md:col-span-2 text-center md:text-left">
            {/* Footer Logo */}
            <div className="flex items-center justify-center md:justify-start gap-2.5 mb-3">
              <div className="w-8 h-8 relative flex items-center justify-center shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <defs>
                    <linearGradient id="footerLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#818CF8" />
                      <stop offset="100%" stopColor="#FF7A00" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 65,25 C 40,25 30,40 50,55 C 70,70 60,85 35,85"
                    fill="none"
                    stroke="url(#footerLogoGrad)"
                    strokeWidth="16"
                    strokeLinecap="round"
                  />
                  <path d="M 50,10 L 75,22 L 50,34 L 25,22 Z" fill="#818CF8" />
                </svg>
              </div>
              <span className="text-xl font-extrabold tracking-tight">
                Skill <span className="text-[#FF7A00]">Equator</span>
              </span>
            </div>

            <p className="text-gray-400 text-xs sm:text-sm leading-relaxed max-w-md mx-auto md:mx-0">
              Skill Equator is a local skill exchange platform. Learn, teach, and grow together with your community.
            </p>
          </div>

          <div className="text-center md:text-right">
            <p className="font-bold text-sm mb-3 text-slate-200">Ready to Share Your Skill?</p>
            <button 
              onClick={() => navigate('/register')} 
              className="px-6 py-3 rounded-xl bg-[#FF7A00] hover:bg-[#e66e00] active:scale-95 text-white text-xs font-bold transition shadow-lg shadow-[#FF7A00]/20 cursor-pointer"
            >
              Get Started
            </button>
          </div>

        </div>
      </div>

      {/* Main Links Grid */}
      <div className="px-4 sm:px-6 lg:px-[6%] py-10 sm:py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-xs max-w-7xl mx-auto">
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="font-bold text-white text-sm mb-4 tracking-wide">{col.title}</p>
            <ul className="space-y-2.5 text-gray-400">
              {col.links.map((l) => (
                <li key={l.name}>
                  <a 
                    href={l.href || `#${l.id}`} 
                    onClick={(e) => handleLinkClick(e, l)}
                    className="hover:text-white transition duration-150 block"
                  >
                    {l.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Contact Info */}
        <div>
          <p className="font-bold text-white text-sm mb-4 tracking-wide">Contact</p>
          <ul className="space-y-2.5 text-gray-400">
            <li className="flex items-center gap-2">
              <span className="text-xs">📧</span> skillequator@gmail.com
            </li>
                        <li className="flex items-center gap-2">
              <span className="text-xs">📧</span> kumarraja80707@gmail.com
            </li>
            <li className="flex items-center gap-2">
              <span className="text-xs">📞</span> +91 7634099025
            </li>
             <li className="flex items-center gap-2">
              <span className="text-xs">📞</span> +91 9955012023
            </li>
            <li className="flex items-center gap-2">
              <span className="text-xs">📍</span> Delhi NCR, India
            </li>
          </ul>
        </div>

        {/* Social / Mission Column */}
        <div>
          <p className="font-bold text-white text-sm mb-4 tracking-wide">Community</p>
          <p className="text-gray-400 text-xs leading-relaxed mb-4">
            Join peers across India swapping tech, languages, music, and art.
          </p>
          <div className="flex items-center gap-3 text-base">
            <span className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center hover:bg-[#4B2ECF] transition cursor-pointer">🌐</span>
            <span className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center hover:bg-[#4B2ECF] transition cursor-pointer">💬</span>
            <span className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center hover:bg-[#4B2ECF] transition cursor-pointer">💼</span>
          </div>
        </div>
      </div>

      {/* Copyright Footer Bar */}
      <div className="px-4 sm:px-6 lg:px-[6%] py-4 text-center text-[11px] text-gray-500 border-t border-slate-800/80">
        © 2026 Skill Equator. All rights reserved. Built with ❤️ for peer learning.
      </div>
    </footer>
  )
}