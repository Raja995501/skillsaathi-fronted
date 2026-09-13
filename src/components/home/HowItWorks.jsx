const STEPS = [
  { num: 1, icon: '👤', title: 'Sign Up', desc: 'Create your free account in minutes and build your profile.' },
  { num: 2, icon: '🔍', title: 'Discover', desc: 'Find skills you want to learn or teach in your local community.' },
  { num: 3, icon: '🤝', title: 'Connect', desc: 'Send exchange requests and connect with peers around you.' },
  { num: 4, icon: '🚀', title: 'Learn & Grow', desc: 'Exchange skills, build connections, and grow together.' },
]

export default function HowItWorks() {
  return (
    <section className="px-4 sm:px-6 lg:px-[6%] py-16 sm:py-24 bg-gray-50/60 relative overflow-hidden" id="how">
      <div className="max-w-7xl mx-auto text-center">
        
        {/* Section Header */}
        <div className="max-w-xl mx-auto mb-12 sm:mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-[#4B2ECF] bg-[#4B2ECF]/10 px-3 py-1 rounded-full">
            Simple Process
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 mt-3 tracking-tight">
            How Skill Equator Works?
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-2">
            Simple. Useful. Community-driven skill exchange platform.
          </p>
        </div>
        
        {/* Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 relative">
          {STEPS.map((s, idx) => (
            <div 
              key={s.num} 
              className="group relative bg-white p-6 sm:p-7 rounded-2xl border border-gray-100 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center z-10"
            >
              {/* Step Number Tag */}
              <span className="absolute top-4 right-4 text-[11px] font-extrabold text-[#4B2ECF] bg-[#4B2ECF]/10 px-2.5 py-0.5 rounded-full">
                Step 0{s.num}
              </span>

              {/* Icon Container */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#4B2ECF]/10 text-[#4B2ECF] flex items-center justify-center text-2xl sm:text-3xl font-bold mb-5 group-hover:bg-[#4B2ECF] group-hover:text-white group-hover:scale-110 transition-all duration-300 shadow-xs">
                {s.icon}
              </div>

              {/* Content */}
              <h3 className="font-bold text-gray-900 text-base sm:text-lg mb-2 group-hover:text-[#4B2ECF] transition-colors">
                {s.title}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                {s.desc}
              </p>

              {/* Step Progress Line Connector (Hidden on last item & mobile) */}
              {idx < STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                  <span className="text-gray-300 font-bold text-lg">→</span>
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}