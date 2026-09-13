import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import { searchApi } from '../../api/searchApi'
import { skillApi } from '../../api/skillApi'
import { connectionApi } from '../../api/connectionApi'
import { reviewApi } from '../../api/reviewApi'
import { useToast } from '../../hooks/useToast'
import { useAuth } from '../../context/AuthContext'

export default function SearchPage() {
  const navigate = useNavigate()
  const showToast = useToast()
  const { user: currentUser } = useAuth()

  const [categories, setCategories] = useState([])
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [online, setOnline] = useState('')
  const [sortByMatch, setSortByMatch] = useState(false)

  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Track status per user ID: 'CONNECTED', 'PENDING', or 'NONE'
  const [connectionStatuses, setConnectionStatuses] = useState({})
  const [loadingIds, setLoadingIds] = useState(new Set())
  
  // Map to store review details for each user: { [userId]: { average, count, latestComment, latestReviewer } }
  const [userReviewsMap, setUserReviewsMap] = useState({})

  const fetchSkills = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = {
        city: city || undefined,
        state: state || undefined,
        category: categoryId || undefined,
        online: online || undefined,
        sortByMatch,
        page: 0,
        size: 20
      }

      // Fetch search results and connections in parallel or sequence
      const [searchRes, connRes] = await Promise.all([
        searchApi.searchUsers ? searchApi.searchUsers(params) : searchApi.search(params),
        connectionApi.list().catch(() => ({ data: [] }))
      ])

      const data = searchRes?.data?.data || searchRes?.data || []
      const usersList = Array.isArray(data) ? data : []

      // Process existing connections to map status (Matching MatchesPage logic)
      const connectionsList = connRes?.data?.content || connRes?.data?.data || connRes?.data || []
      const statusMap = {}

      if (Array.isArray(connectionsList)) {
        connectionsList.forEach((c) => {
          const receiverId = c.otherUserId || c.receiver?.id || c.receiverId || c.recipientId
          const senderId = c.sender?.id || c.senderId || c.userId
          const status = c.status || c.connectionStatus || c.state

          usersList.forEach((u) => {
            if (String(receiverId) === String(u.id) || String(senderId) === String(u.id)) {
              statusMap[u.id] = status ? status.toUpperCase() : 'PENDING'
            }
          })
        })
      }
      setConnectionStatuses(statusMap)
      setResults(usersList)

      // Parallel API execution for reviews using Promise.all
      const reviewPromises = usersList
        .filter((u) => u.id)
        .map(async (u) => {
          try {
            const revRes = await reviewApi.getReviewsForUser(u.id)
            const reviewsList = revRes.data?.data || revRes.data || []

            if (reviewsList.length > 0) {
              const totalRating = reviewsList.reduce((acc, r) => acc + r.rating, 0)
              const avg = (totalRating / reviewsList.length).toFixed(1)
              const lastReview = reviewsList[reviewsList.length - 1]

              return {
                userId: u.id,
                data: {
                  average: avg,
                  count: reviewsList.length,
                  latestComment: lastReview?.comment || null,
                  latestReviewer: lastReview?.reviewerName || 'Student',
                },
              }
            }
          } catch (err) {
            console.error(`Failed to load reviews for user ${u.id}`, err)
          }
          return null
        })

      const reviewsResults = await Promise.all(reviewPromises)
      const reviewsMap = {}
      reviewsResults.forEach((result) => {
        if (result) {
          reviewsMap[result.userId] = result.data
        }
      })
      setUserReviewsMap(reviewsMap)

    } catch (err) {
      setError('Could not load skills right now.')
      showToast(err.response?.data?.message || 'Failed to load skills')
    } finally {
      setLoading(false)
    }
  }, [city, state, categoryId, online, sortByMatch, showToast])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res =
          (await skillApi.getCategories?.()) ||
          (await searchApi.getCategories?.())
        const data = res?.data?.data || res?.data || []
        setCategories(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error('Failed to fetch categories:', err)
      }
    }
    fetchCategories()
    fetchSkills()
  }, [fetchSkills])

  const handleSearch = (e) => {
    e.preventDefault()
    fetchSkills()
  }

  const handleConnect = async (userId) => {
    const currentStatus = connectionStatuses[userId]
    const isConnected = ['ACCEPTED', 'CONNECTED', 'APPROVED'].includes(currentStatus)
    const isPending = ['PENDING', 'REQUESTED'].includes(currentStatus)

    if (isConnected || isPending) return

    setLoadingIds((prev) => new Set(prev).add(userId))
    try {
      await connectionApi.sendRequest(userId)
      setConnectionStatuses((prev) => ({ ...prev, [userId]: 'PENDING' }))
      showToast('Connection request sent!')
    } catch (err) {
      setConnectionStatuses((prev) => ({ ...prev, [userId]: 'PENDING' }))
      showToast(err.response?.data?.message || 'Connection request already exists or pending.')
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev)
        next.delete(userId)
        return next
      })
    }
  }

  const filteredUsers = results.filter((user) => {
    if (currentUser?.id && String(user.id) === String(currentUser.id)) {
      return false
    }

    if (categoryId) {
      const selectedCategoryObj = categories.find(
        (c) => String(c.id) === String(categoryId)
      )
      const teachesSelectedCategory = user.skillsToTeach?.some(
        (st) =>
          String(st.categoryId) === String(categoryId) ||
          st.categoryName?.toLowerCase() ===
            selectedCategoryObj?.name?.toLowerCase()
      )
      return teachesSelectedCategory
    }

    return user.skillsToTeach && user.skillsToTeach.length > 0
  })

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-7 pb-12 font-sans">
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-[#4B2ECF] text-[11px] font-bold tracking-wide uppercase mb-2">
              <span>🚀</span> Skill Marketplace
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Browse Skills. Explore.{' '}
              <span className="text-[#4B2ECF]">Learn.</span>{' '}
              <span className="text-[#FF7A00]">Grow.</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
              Search mentors and skill partners by location or category.
            </p>
          </div>

          <div className="text-xs font-bold bg-gray-50 text-gray-600 px-4 py-2.5 rounded-xl border border-gray-100 shrink-0 self-start md:self-auto">
            Available Mentors:{' '}
            <span className="text-[#4B2ECF] font-black">
              {filteredUsers.length}
            </span>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-semibold flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        <form
          onSubmit={handleSearch}
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5 items-end">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Delhi"
                className="w-full px-3.5 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 placeholder-gray-400 outline-none focus:border-[#4B2ECF] focus:bg-white focus:ring-2 focus:ring-[#4B2ECF]/10 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                State
              </label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g. Bihar"
                className="w-full px-3.5 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 placeholder-gray-400 outline-none focus:border-[#4B2ECF] focus:bg-white focus:ring-2 focus:ring-[#4B2ECF]/10 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 outline-none focus:border-[#4B2ECF] focus:bg-white focus:ring-2 focus:ring-[#4B2ECF]/10 transition-all cursor-pointer"
              >
                <option value="">Any Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Preference Mode
              </label>
              <select
                value={online}
                onChange={(e) => setOnline(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 outline-none focus:border-[#4B2ECF] focus:bg-white focus:ring-2 focus:ring-[#4B2ECF]/10 transition-all cursor-pointer"
              >
                <option value="">Any Mode</option>
                <option value="ONLINE">Online</option>
                <option value="OFFLINE">In-Person</option>
                <option value="BOTH">Both</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#4B2ECF] hover:bg-[#3b22ab] text-white font-bold rounded-xl transition shadow-xs hover:shadow text-xs cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span>🔍</span> Search Skills
            </button>
          </div>

          <div className="flex items-center gap-2.5 pt-3 border-t border-gray-100">
            <input
              type="checkbox"
              id="sortByMatch"
              checked={sortByMatch}
              onChange={(e) => setSortByMatch(e.target.checked)}
              className="w-4 h-4 text-[#4B2ECF] rounded border-gray-300 focus:ring-[#4B2ECF] cursor-pointer accent-[#4B2ECF]"
            />
            <label
              htmlFor="sortByMatch"
              className="text-xs font-medium text-gray-600 cursor-pointer select-none"
            >
              Sort by best match score
            </label>
          </div>
        </form>

        {categories.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Popular Categories
              </h3>
              {categoryId && (
                <button
                  onClick={() => setCategoryId('')}
                  className="text-xs font-bold text-[#4B2ECF] hover:underline cursor-pointer"
                >
                  Clear Selection
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {categories.map((cat) => {
                const isSelected = String(categoryId) === String(cat.id)
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(isSelected ? '' : cat.id)}
                    className={`p-4 bg-white border rounded-2xl flex flex-col items-center justify-center gap-2 transition-all duration-200 cursor-pointer text-center group ${
                      isSelected
                        ? 'border-[#4B2ECF] bg-purple-50/40 shadow-xs ring-2 ring-[#4B2ECF]/15 scale-[1.02]'
                        : 'border-gray-100 hover:border-purple-200 hover:shadow-xs hover:scale-[1.01]'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4B2ECF]/10 to-[#FF7A00]/10 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                      {cat.icon || '✨'}
                    </div>
                    <span
                      className={`text-xs font-bold transition-colors ${
                        isSelected
                          ? 'text-[#4B2ECF]'
                          : 'text-gray-800 group-hover:text-[#4B2ECF]'
                      }`}
                    >
                      {cat.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div className="pt-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
              <span>🎯</span>
              {categoryId
                ? `${
                    categories.find((c) => String(c.id) === String(categoryId))
                      ?.name || 'Category'
                  } Mentors`
                : 'Available Skill Mentors'}
            </h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="p-5 bg-white border border-gray-100 rounded-2xl shadow-xs animate-pulse space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gray-200" />
                    <div className="space-y-2">
                      <div className="w-24 h-4 bg-gray-200 rounded" />
                      <div className="w-16 h-3 bg-gray-100 rounded" />
                    </div>
                  </div>
                  <div className="w-full h-10 bg-gray-100 rounded-xl" />
                </div>
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 bg-white rounded-2xl border border-gray-100 text-center shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center text-xl mx-auto mb-3">
                🔎
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">
                No mentors found for this category
              </h3>
              <p className="text-xs text-gray-500">
                Try selecting another category or adjusting your search filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredUsers.map((user) => {
                const teachesSkills =
                  user.skillsToTeach?.filter((st) => {
                    if (!categoryId) return true
                    return (
                      String(st.categoryId) === String(categoryId) ||
                      st.categoryName?.toLowerCase() ===
                        categories
                          .find((c) => String(c.id) === String(categoryId))
                          ?.name?.toLowerCase()
                    )
                  }) || []

                const status = connectionStatuses[user.id]
                const isConnected = ['ACCEPTED', 'CONNECTED', 'APPROVED'].includes(status)
                const isPending = ['PENDING', 'REQUESTED'].includes(status)
                const isLoading = loadingIds.has(user.id)
                const reviewData = userReviewsMap[user.id]

                return (
                  <div
                    key={user.id}
                    className="group p-5 bg-white border border-gray-100 hover:border-purple-100 rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-3.5">
                      <div className="flex items-start justify-between">
                        <div
                          onClick={() => navigate(`/profile/${user.id}`)}
                          className="flex items-center gap-3 cursor-pointer"
                        >
                          <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gradient-to-br from-[#4B2ECF] to-[#FF7A00] flex items-center justify-center text-white font-bold text-base shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                            {user.profilePictureUrl ? (
                              <img
                                src={user.profilePictureUrl}
                                alt={user.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              user.name?.[0]?.toUpperCase() || 'U'
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="font-bold text-gray-900 text-sm leading-tight group-hover:text-[#4B2ECF] transition-colors">
                                {user.name}
                              </h3>
                              {reviewData ? (
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0">
                                  ⭐ {reviewData.average} <span className="text-gray-400 text-[9px]">({reviewData.count})</span>
                                </span>
                              ) : (
                                <span className="text-[9px] text-gray-400 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded shrink-0">
                                  ⭐ New
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 font-medium mt-0.5 flex items-center gap-1">
                              <span>📍</span>{' '}
                              {[user.city, user.state]
                                .filter(Boolean)
                                .join(', ') || 'Remote'}
                            </p>
                          </div>
                        </div>

                        {user.matchPercentage && (
                          <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg shrink-0">
                            ⚡ {user.matchPercentage}% Match
                          </span>
                        )}
                      </div>

                      {teachesSkills.length > 0 && (
                        <div className="bg-[#F8FAFC] border border-gray-100 rounded-xl p-3">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                            Teaches:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {teachesSkills.map((st) => (
                              <span
                                key={st.id || st.skillId}
                                className="bg-purple-50 text-[#4B2ECF] border border-purple-100/80 text-[11px] px-2.5 py-0.5 rounded-lg font-bold"
                              >
                                {st.skillName}{' '}
                                {st.level && (
                                  <span className="opacity-70 font-medium">
                                    ({st.level})
                                  </span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {reviewData?.latestComment && (
                        <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-2.5 text-xs text-amber-900">
                          <span className="font-bold text-amber-800 block mb-0.5 text-[10px]">💬 Recent Review:</span>
                          <p className="italic text-gray-700 text-[11px]">"{reviewData.latestComment}"</p>
                        </div>
                      )}

                      {user.skillsToLearn && user.skillsToLearn.length > 0 && (
                        <div className="px-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                            Wants to learn:
                          </span>
                          <p className="text-xs text-gray-600 font-medium truncate">
                            {user.skillsToLearn
                              .map((sl) => sl.skillName)
                              .join(', ')}
                          </p>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleConnect(user.id)}
                      disabled={isConnected || isPending || isLoading}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                        isConnected
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 cursor-default'
                          : isPending
                          ? 'bg-amber-50 text-amber-700 border border-amber-200 cursor-default'
                          : 'bg-[#4B2ECF] hover:bg-[#3b22ab] text-white shadow-xs hover:shadow active:scale-[0.99]'
                      } disabled:opacity-80`}
                    >
                      {isLoading ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : isConnected ? (
                        <span>✅ Connected</span>
                      ) : isPending ? (
                        <span>⏳ Request Pending</span>
                      ) : (
                        <span>🤝 Connect to Learn</span>
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}