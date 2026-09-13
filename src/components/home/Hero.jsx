import { useNavigate } from 'react-router-dom'

function scrollToId(id) {
  const element = document.getElementById(id)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  } else {
    // Fallback scroll down if section isn't directly targetable
    window.scrollTo({ top: 600, behavior: 'smooth' })
  }
}

export default function Hero() {
  const navigate = useNavigate()

  return (
    <section className="relative px-4 sm:px-6 lg:px-[6%] pt-10 sm:pt-16 pb-16 sm:pb-24 bg-gradient-to-b from-indigo-50/50 via-white to-white overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#4B2ECF]/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute top-40 right-10 w-72 h-72 bg-[#FF7A00]/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
        
        {/* Left Content */}
        <div className="text-center lg:text-left">
          {/* Top Pill Tag */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-gray-200/80 shadow-xs mb-6">
            <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
            <span className="text-xs font-semibold text-gray-700">Skill Exchange Community</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold leading-tight sm:leading-tight lg:leading-tight text-gray-900 tracking-tight">
            Share Skills. <br className="hidden sm:inline" />
            Learn Together. <br className="hidden sm:inline" />
            <span className="text-[#FF7A00]">Grow Together.</span>
          </h1>
          
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 leading-relaxed max-w-lg mx-auto lg:mx-0 mt-4 mb-8">
            Skill Equator is a local skill exchange platform where you can learn from others and teach what you know. Together, we grow!
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4">
            <button 
              onClick={() => scrollToId('skills')} 
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#4B2ECF] hover:bg-[#3b23ab] active:scale-95 text-white text-sm font-bold shadow-lg shadow-[#4B2ECF]/20 transition-all cursor-pointer"
            >
              Explore Skills
            </button>
            <button 
              onClick={() => navigate('/register')} 
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white border border-gray-200 hover:border-[#4B2ECF]/40 hover:bg-gray-50 active:scale-95 text-gray-800 text-sm font-bold transition-all shadow-xs cursor-pointer"
            >
              Join Now
            </button>
          </div>
        </div>

        {/* Right Hero Image */}
        <div className="relative flex justify-center lg:justify-end mt-4 lg:mt-0">
          <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl border-4 border-white max-w-md lg:max-w-lg w-full">
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1000"
              alt="People studying together"
              className="w-full h-[320px] sm:h-[400px] object-cover"
            />
          </div>

          {/* Overlay Floating Card */}
          <div className="absolute -bottom-5 -left-2 sm:left-4 z-20 bg-white/90 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl shadow-xl border border-white/60 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4B2ECF] text-white flex items-center justify-center text-lg font-bold shadow-md">
              🤝
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">Direct Skill Swaps</p>
              <p className="text-[11px] text-gray-500">100% Peer-to-Peer Learning</p>
            </div>
          </div>

          <div className="absolute -bottom-6 -right-4 w-36 h-36 bg-[#FF7A00]/15 rounded-full blur-2xl z-0" />
        </div>
      </div>

      {/* Hero Badges */}
      <div className="max-w-5xl mx-auto mt-16 sm:mt-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 bg-white p-4 sm:p-6 rounded-3xl shadow-xl shadow-gray-100/70 border border-gray-100">
          
          <div className="flex items-center gap-4 p-3 hover:bg-gray-50/60 rounded-2xl transition">
            <div className="w-12 h-12 rounded-2xl bg-[#4B2ECF]/10 text-[#4B2ECF] flex items-center justify-center text-xl shrink-0 font-bold">
              👥
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm sm:text-base">Learn</p>
              <p className="text-xs text-gray-500 mt-0.5">New skills from people around you</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-3 hover:bg-gray-50/60 rounded-2xl transition border-t md:border-t-0 md:border-l border-gray-100">
            <div className="w-12 h-12 rounded-2xl bg-[#FF7A00]/10 text-[#FF7A00] flex items-center justify-center text-xl shrink-0 font-bold">
              🎯
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm sm:text-base">Teach</p>
              <p className="text-xs text-gray-500 mt-0.5">Share your knowledge and help others</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-3 hover:bg-gray-50/60 rounded-2xl transition border-t md:border-t-0 md:border-l border-gray-100">
            <div className="w-12 h-12 rounded-2xl bg-[#22C55E]/10 text-[#22C55E] flex items-center justify-center text-xl shrink-0 font-bold">
              📈
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm sm:text-base">Grow</p>
              <p className="text-xs text-gray-500 mt-0.5">Build connections and grow together</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}