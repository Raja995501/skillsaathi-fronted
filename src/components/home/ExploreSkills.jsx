import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { skillApi } from '../../api/skillApi'

const ICONS = {
  Education: '🎓', 
  Technology: '💻', 
  Design: '🎨', 
  Music: '🎸', 
  Languages: '📖',
  Photography: '📷', 
  Business: '💼', 
  Sports: '🏏', 
  'Home Skills': '🍳', 
  'Local Skills': '🌱',
  'Web Development': '</>',
  'Graphic Design': '🎨',
  'Digital Marketing': '📢'
}

export default function ExploreSkills() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    skillApi.getCategories?.()
      .then((res) => setCategories(res.data?.data || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = query
    ? categories.filter((c) => c.name?.toLowerCase().includes(query.toLowerCase()))
    : categories

  const handleSearch = (e) => {
    e.preventDefault()
    if (!query.trim()) return
    navigate(`/dashboard/search?skill=${encodeURIComponent(query.trim())}`)
  }

  return (
    <section className="px-4 sm:px-6 md:px-[6%] py-12 sm:py-16 bg-white" id="skills">
      <div className="max-w-7xl mx-auto text-center">
        
        {/* Section Header */}
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight">
          Browse Skills. Explore. <span className="text-[#4B2ECF]">Learn.</span> <span className="text-[#FF7A00]">Grow.</span>
        </h2>
        <p className="text-gray-500 text-xs sm:text-sm mt-2 mb-8 max-w-xl mx-auto">
          Search what you want to learn or teach in your local community.
        </p>

        {/* Search Input Bar */}
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5 mb-10 sm:mb-12 max-w-xl mx-auto">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search skills e.g. Java, Web Development, Guitar..."
            className="flex-1 px-4 py-3 sm:py-3.5 rounded-xl border border-gray-200 text-xs sm:text-sm outline-none focus:border-[#4B2ECF] focus:ring-2 focus:ring-[#4B2ECF]/10 bg-gray-50/50 transition text-gray-800 placeholder:text-gray-400"
          />
          <button 
            type="submit" 
            className="px-6 py-3 sm:py-3.5 rounded-xl bg-[#4B2ECF] hover:bg-[#3b23ab] active:scale-95 text-white text-xs sm:text-sm font-bold transition shadow-md shadow-[#4B2ECF]/20 cursor-pointer shrink-0"
          >
            Search
          </button>
        </form>

        {/* Skeleton Loading State */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {[...Array(6)].map((_, idx) => (
              <div key={idx} className="bg-gray-50 p-5 rounded-2xl border border-gray-100 flex flex-col items-center gap-3 animate-pulse">
                <div className="w-12 h-12 rounded-xl bg-gray-200" />
                <div className="h-3 w-16 bg-gray-200 rounded-md" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          /* Empty Search State */
          <div className="py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200 max-w-md mx-auto">
            <p className="text-sm font-medium text-gray-600">No matching categories found</p>
            <p className="text-xs text-gray-400 mt-1">Try searching for a different keyword or browse directly.</p>
          </div>
        ) : (
          /* Categories Grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {filtered.map((c) => (
              <button
                key={c.id || c.name}
                onClick={() => navigate(`/dashboard/search?category=${c.id || encodeURIComponent(c.name)}`)}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 hover:border-[#4B2ECF]/40 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer group"
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-indigo-50/70 text-[#4B2ECF] flex items-center justify-center text-xl font-bold group-hover:scale-110 group-hover:bg-[#4B2ECF] group-hover:text-white transition-all duration-200">
                  {c.icon || ICONS[c.name] || '✨'}
                </div>
                <span className="font-bold text-xs text-gray-800 group-hover:text-[#4B2ECF] transition truncate w-full text-center">
                  {c.name}
                </span>
              </button>
            ))}
          </div>
        )}

      </div>
    </section>
  )
}