import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import { searchApi } from '../../api/searchApi'
import { reviewApi } from '../../api/reviewApi'
import { connectionApi } from '../../api/connectionApi'
import { useToast } from '../../hooks/useToast'
import { useAuth } from '../../context/AuthContext'

export default function UserProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const showToast = useToast()
  const { user: currentUser } = useAuth()

  const [profileUser, setProfileUser] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState('NONE')
  const [connecting, setConnecting] = useState(false)

  // Review submission state
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true)
      try {
        const userRes = searchApi.getUserById 
          ? await searchApi.getUserById(id) 
          : await searchApi.search({ id })
        
        const userData = userRes?.data?.data || userRes?.data || {}
        setProfileUser(userData)

        // Check user object for status fields first
        let initialStatus = userData.connectionStatus || 
                            userData.status || 
                            userData.connectionState || 
                            (userData.isRequested ? 'PENDING' : 'NONE')

        // Fetch connections using the correct connectionApi.list() method
        try {
          const connectionsRes = await connectionApi.list()
          const connectionsList = connectionsRes?.data?.content || connectionsRes?.data?.data || connectionsRes?.data || []
          
          if (Array.isArray(connectionsList) && connectionsList.length > 0) {
            const existingConn = connectionsList.find(c => {
              const receiverId = c.otherUserId || c.receiver?.id || c.receiverId || c.recipientId
              const senderId = c.sender?.id || c.senderId || c.userId

              // Fixed: Removed targetConnId (c.id) check so we only match user IDs
              return String(receiverId) === String(id) || 
                     String(senderId) === String(id)
            })

            if (existingConn) {
              const matchedStatus = existingConn.status || existingConn.connectionStatus || existingConn.state
              if (matchedStatus) {
                initialStatus = matchedStatus
              }
            }
          }
        } catch (connErr) {
          console.error("Failed to fetch connections list:", connErr)
        }

        const normalizedStatus = typeof initialStatus === 'string' ? initialStatus.toUpperCase() : 'NONE'
        setConnectionStatus(normalizedStatus)

        const reviewRes = await reviewApi.getReviewsForUser(id)
        const reviewsList = reviewRes?.data?.data || reviewRes?.data || []
        setReviews(Array.isArray(reviewsList) ? reviewsList : [])

      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to load user profile')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchUserData()
    }
  }, [id, showToast])

  const handleConnect = async () => {
    const isConnected = ['ACCEPTED', 'CONNECTED', 'APPROVED'].includes(connectionStatus)
    const isPending = ['PENDING', 'REQUESTED'].includes(connectionStatus)
    if (!id || isConnected || isPending || connecting) return

    setConnecting(true)
    try {
      await connectionApi.sendRequest(id)
      setConnectionStatus('PENDING')
      showToast('Connection request sent successfully!')
    } catch (err) {
      setConnectionStatus('PENDING')
      const errorMsg = err?.response?.data?.message || err?.message || 'Connection request already exists or pending.'
      showToast(errorMsg)
    } finally {
      setConnecting(false)
    }
  }

  const handleAddReview = async (e) => {
    e.preventDefault()
    if (!id) return

    setSubmittingReview(true)
    try {
      const payload = {
        receiverId: id,
        rating: Number(rating),
        comment: comment.trim()
      }
      await reviewApi.createReview(payload)
      showToast('Review submitted successfully!')
      setComment('')
      setRating(5)

      const reviewRes = await reviewApi.getReviewsForUser(id)
      const reviewsList = reviewRes?.data?.data || reviewRes?.data || []
      setReviews(Array.isArray(reviewsList) ? reviewsList : [])
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit review')
    } finally {
      setSubmittingReview(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto p-8 space-y-6 animate-pulse">
          <div className="h-32 bg-gray-200 rounded-2xl" />
          <div className="h-48 bg-gray-200 rounded-2xl" />
        </div>
      </DashboardLayout>
    )
  }

  if (!profileUser) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto p-12 text-center bg-white rounded-2xl border border-gray-100 shadow-xs">
          <h2 className="text-base font-bold text-gray-800 mb-2">User not found</h2>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-[#4B2ECF] text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            Go Back
          </button>
        </div>
      </DashboardLayout>
    )
  }

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
    : 'New'

  const isConnected = ['ACCEPTED', 'CONNECTED', 'APPROVED'].includes(connectionStatus)
  const isPending = ['PENDING', 'REQUESTED'].includes(connectionStatus)
  const isSelf = currentUser && String(currentUser.id) === String(profileUser.id)

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 pb-12 font-sans">
        
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#4B2ECF] transition-colors cursor-pointer"
        >
          <span>←</span> Back
        </button>

        {/* Profile Header Card */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-[#4B2ECF] to-[#FF7A00] flex items-center justify-center text-white font-black text-2xl shadow-sm shrink-0">
              {profileUser.profilePictureUrl ? (
                <img
                  src={profileUser.profilePictureUrl}
                  alt={profileUser.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                profileUser.name?.[0]?.toUpperCase() || 'U'
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                  {profileUser.name}
                </h1>
                <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                  ⭐ {averageRating} <span className="text-gray-400 font-normal">({reviews.length} reviews)</span>
                </span>
              </div>

              <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
                <span>📍</span> {[profileUser.city, profileUser.state].filter(Boolean).join(', ') || 'Remote location'}
              </p>

              {profileUser.headline && (
                <p className="text-xs text-gray-600 font-medium pt-1">
                  {profileUser.headline}
                </p>
              )}
            </div>
          </div>

          {!isSelf && (
            <button
              onClick={handleConnect}
              disabled={isConnected || isPending || connecting}
              className={`w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                isConnected || isPending
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 cursor-default'
                  : 'bg-[#4B2ECF] hover:bg-[#3b22ab] text-white shadow-xs hover:shadow active:scale-[0.98]'
              } disabled:opacity-80`}
            >
              {connecting ? (
                <span>Sending...</span>
              ) : isConnected ? (
                <span>✅ Connected</span>
              ) : isPending ? (
                <span>✅ Request Sent</span>
              ) : (
                <span>🤝 Connect to Learn</span>
              )}
            </button>
          )}
        </div>

        {/* Bio Section */}
        {profileUser.bio && (
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">About</h3>
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-medium">
              {profileUser.bio}
            </p>
          </div>
        )}

        {/* Skills Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Skills Teaching</h3>
            {profileUser.skillsToTeach?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profileUser.skillsToTeach.map((st) => (
                  <span
                    key={st.id || st.skillId}
                    className="bg-purple-50 text-[#4B2ECF] border border-purple-100 text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1"
                  >
                    <span>✨</span> {st.skillName} {st.level && <span className="opacity-70 font-medium">({st.level})</span>}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">No teaching skills listed.</p>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Skills Wants to Learn</h3>
            {profileUser.skillsToLearn?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profileUser.skillsToLearn.map((sl) => (
                  <span
                    key={sl.id || sl.skillId}
                    className="bg-orange-50 text-[#FF7A00] border border-orange-100 text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1"
                  >
                    <span>🎯</span> {sl.skillName}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">No learning skills listed.</p>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-gray-100 shadow-xs space-y-5">
          <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
            <span>💬</span> Ratings & Reviews ({reviews.length})
          </h3>

          {!isSelf && (
            <form onSubmit={handleAddReview} className="bg-gray-50/70 p-4 sm:p-5 rounded-2xl border border-gray-100 space-y-3.5">
              <h4 className="text-xs font-bold text-gray-800">Leave a Review & Rating</h4>
              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-gray-600">Rating:</label>
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-amber-700 outline-none focus:border-[#4B2ECF] cursor-pointer"
                >
                  <option value={5}>⭐ 5 - Excellent</option>
                  <option value={4}>⭐ 4 - Very Good</option>
                  <option value={3}>⭐ 3 - Good</option>
                  <option value={2}>⭐ 2 - Fair</option>
                  <option value={1}>⭐ 1 - Poor</option>
                </select>
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write about your learning experience with this mentor..."
                rows={3}
                required
                className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-800 placeholder-gray-400 outline-none focus:border-[#4B2ECF] focus:ring-2 focus:ring-[#4B2ECF]/10 transition-all resize-none"
              />
              <button
                type="submit"
                disabled={submittingReview}
                className="px-4 py-2.5 bg-[#4B2ECF] hover:bg-[#3b22ab] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-[0.98] disabled:opacity-75"
              >
                {submittingReview ? 'Submitting...' : 'Post Review'}
              </button>
            </form>
          )}

          {reviews.length === 0 ? (
            <p className="text-xs text-gray-400 italic py-2">No reviews received yet for this user.</p>
          ) : (
            <div className="space-y-3">
              {reviews.map((rev, index) => (
                <div key={rev.id || index} className="p-4 bg-gray-50/70 border border-gray-100 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800">{rev.reviewerName || 'Anonymous User'}</span>
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      ⭐ {rev.rating} / 5
                    </span>
                  </div>
                  {rev.comment && (
                    <p className="text-xs text-gray-600 font-medium italic">"{rev.comment}"</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  )
}