import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/dashboard/DashboardLayout.jsx'
import { matchApi } from '../../api/matchApi'
import { connectionApi } from '../../api/connectionApi'
import { reviewApi } from '../../api/reviewApi'
import { useToast } from '../../hooks/useToast.jsx'

export default function MatchesPage() {
  const showToast = useToast()
  const [matches, setMatches] = useState(null)
  
  // Track status per user ID: 'CONNECTED', 'PENDING', or 'NONE'
  const [connectionStatuses, setConnectionStatuses] = useState({})
  
  const [loadingIds, setLoadingIds] = useState(new Set())
  const [error, setError] = useState('')

  // Map to store review details for each user: { [userId]: { average, count, latestComment, latestReviewer } }
  const [userReviewsMap, setUserReviewsMap] = useState({})

  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      try {
        // Fetch matches and connections in parallel or sequence
        const [matchRes, connRes] = await Promise.all([
          matchApi.getMatches(),
          connectionApi.list().catch(() => ({ data: [] }))
        ])

        const matchData = matchRes.data?.data || matchRes.data || []
        
        if (!isMounted) return
        setMatches(matchData)

        // Process existing connections to map status
        const connectionsList = connRes?.data?.content || connRes?.data?.data || connRes?.data || []
        const statusMap = {}

        if (Array.isArray(connectionsList)) {
          connectionsList.forEach((c) => {
            const receiverId = c.otherUserId || c.receiver?.id || c.receiverId || c.recipientId
            const senderId = c.sender?.id || c.senderId || c.userId
            const status = c.status || c.connectionStatus || c.state

            matchData.forEach((m) => {
              if (String(receiverId) === String(m.userId) || String(senderId) === String(m.userId)) {
                statusMap[m.userId] = status ? status.toUpperCase() : 'PENDING'
              }
            })
          })
        }
        setConnectionStatuses(statusMap)

        // Parallel API execution for reviews using Promise.all
        const reviewPromises = matchData
          .filter((m) => m.userId)
          .map(async (m) => {
            try {
              const revRes = await reviewApi.getReviewsForUser(m.userId)
              const reviewsList = revRes.data?.data || revRes.data || []

              if (reviewsList.length > 0) {
                const totalRating = reviewsList.reduce((acc, r) => acc + r.rating, 0)
                const avg = (totalRating / reviewsList.length).toFixed(1)
                const lastReview = reviewsList[reviewsList.length - 1]

                return {
                  userId: m.userId,
                  data: {
                    average: avg,
                    count: reviewsList.length,
                    latestComment: lastReview?.comment || null,
                    latestReviewer: lastReview?.reviewerName || 'Student',
                  },
                }
              }
            } catch (err) {
              console.error(`Failed to load reviews for user ${m.userId}`, err)
            }
            return null
          })

        const reviewsResults = await Promise.all(reviewPromises)

        if (!isMounted) return

        const reviewsMap = {}
        reviewsResults.forEach((result) => {
          if (result) {
            reviewsMap[result.userId] = result.data
          }
        })

        setUserReviewsMap(reviewsMap)
      } catch (err) {
        if (isMounted) {
          setError('Could not load matches right now.')
        }
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }
  }, [])

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

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6 font-sans">
        
        {/* Header Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-[#4B2ECF] text-[11px] font-bold tracking-wide uppercase mb-2">
              <span>⚡</span> Smart Algorithm Matches
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Your Matches</h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              People whose skills complement yours, ranked by fit.
            </p>
          </div>

          {matches && (
            <div className="text-xs font-bold bg-gray-50 text-gray-600 px-3.5 py-2 rounded-xl border border-gray-100 shrink-0 self-start sm:self-auto">
              Total Found: <span className="text-[#4B2ECF] font-black">{matches.length}</span>
            </div>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-semibold flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Loading Skeleton */}
        {matches === null && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm animate-pulse space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gray-200" />
                    <div className="space-y-2">
                      <div className="w-28 h-4 bg-gray-200 rounded" />
                      <div className="w-16 h-3 bg-gray-100 rounded" />
                    </div>
                  </div>
                  <div className="w-12 h-6 bg-gray-200 rounded-full" />
                </div>
                <div className="w-full h-12 bg-gray-100 rounded-xl" />
                <div className="w-full h-10 bg-gray-200 rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {matches?.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-purple-50 text-[#4B2ECF] flex items-center justify-center text-2xl mx-auto mb-3">
              🔍
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">No matches found yet</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed font-medium">
              Add skills you can teach and skills you want to learn on your profile — matches appear automatically.
            </p>
          </div>
        )}

        {/* Matches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {matches?.map((m) => {
            const status = connectionStatuses[m.userId]
            const isConnected = ['ACCEPTED', 'CONNECTED', 'APPROVED'].includes(status)
            const isPending = ['PENDING', 'REQUESTED'].includes(status)
            const isLoading = loadingIds.has(m.userId)
            const reviewData = userReviewsMap[m.userId]

            return (
              <div 
                key={m.userId} 
                className="group bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md hover:border-purple-100 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Top Profile Info */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gradient-to-br from-[#4B2ECF] to-[#FF7A00] text-white flex items-center justify-center font-bold text-base shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                        {m.profilePictureUrl ? (
                          <img src={m.profilePictureUrl} alt={m.name} className="w-full h-full object-cover" />
                        ) : (
                          m.name?.[0]?.toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-bold text-gray-900 text-base leading-tight group-hover:text-[#4B2ECF] transition-colors">
                            {m.name}
                          </h2>
                          {reviewData ? (
                            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                              ⭐ {reviewData.average} <span className="text-gray-400 text-[10px]">({reviewData.count})</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md shrink-0">
                              ⭐ New
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-medium text-gray-400 mt-1 flex items-center gap-1">
                          <span>📍</span> {[m.city, m.state].filter(Boolean).join(', ') || 'Remote'}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl shrink-0 flex items-center gap-1">
                      <span>⚡</span> {m.matchPercentage}%
                    </span>
                  </div>

                  {/* Match Reason Box */}
                  <div className="bg-[#F8FAFC] border border-gray-100 rounded-xl p-3.5 mb-3 text-xs text-gray-600 font-medium leading-relaxed">
                    <span className="text-[#4B2ECF] font-bold block mb-1">Why you match:</span>
                    {m.matchReason}
                  </div>

                  {/* Recent Review Quote */}
                  {reviewData?.latestComment && (
                    <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3 mb-5 text-xs text-amber-900">
                      <span className="font-bold text-amber-800 block mb-0.5">💬 Recent Review:</span>
                      <p className="italic text-gray-700">"{reviewData.latestComment}"</p>
                    </div>
                  )}
                </div>

                {/* Connect Action Button */}
                <button
                  onClick={() => handleConnect(m.userId)}
                  disabled={isConnected || isPending || isLoading}
                  className={`w-full py-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                    isConnected
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 cursor-default'
                      : isPending
                      ? 'bg-amber-50 text-amber-700 border border-amber-200 cursor-default'
                      : 'bg-[#4B2ECF] hover:bg-[#3b22ab] text-white shadow-sm hover:shadow-md active:scale-[0.99]'
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
                    <span>🤝 Connect</span>
                  )}
                </button>
              </div>
            )
          })}
        </div>

      </div>
    </DashboardLayout>
  )
}