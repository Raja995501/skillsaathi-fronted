const FEATURES = [
  { icon: '🔎', title: 'Smart Matching', desc: 'Match users by skills they teach, skills they want, and preferred learning modes.' },
  { icon: '👤', title: 'Rich Profiles', desc: 'Showcase skills, experience level, city/state, bio, and personalized learning goals.' },
  { icon: '💬', title: 'Seamless Connect', desc: 'Send exchange requests and initiate conversations once a mutual connection is formed.' },
  { icon: '⭐', title: 'Trusted Ratings', desc: 'Build community trust through genuine feedback and ratings after skill exchanges.' },
  { icon: '📍', title: 'Location Filters', desc: 'Discover nearby peers for in-person exchanges or connect globally via online mode.' },
  { icon: '🛡️', title: 'Safety & Privacy', desc: 'Stay secure with robust user reporting, blocking, and community safety guidelines.' },
]

export default function CoreFeatures() {
  return (
    <section className="py-16 sm:py-24 bg-white" id="features">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-[#4B2ECF] bg-[#4B2ECF]/10 px-3 py-1 rounded-full">
            Capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-3 tracking-tight">
            Everything you need for seamless skill exchange
          </h2>
          <p className="text-sm sm:text-base text-gray-500 mt-3">
            Powerful tools engineered to help you discover, connect, and learn from peers efficiently.
          </p>
        </div>

        {/* Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group relative bg-[#F8FAFC] border border-gray-100 rounded-2xl p-6 sm:p-8 hover:bg-white hover:border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Icon Container */}
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-2xl sm:text-3xl mb-5 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>

                {/* Content */}
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-[#4B2ECF] transition-colors">
                  {f.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-2 leading-relaxed">
                  {f.desc}
                </p>
              </div>

              {/* Decorative accent bar on hover */}
              <div className="w-0 group-hover:w-12 h-1 bg-gradient-to-r from-[#4B2ECF] to-[#FF7A00] rounded-full mt-6 transition-all duration-300" />
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}