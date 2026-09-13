import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/dashboard/DashboardLayout.jsx'
import { connectionApi } from '../../api/connectionApi'
import { reviewApi } from '../../api/reviewApi'
import { useToast } from '../../hooks/useToast.jsx'
import RatingModal from '../../components/dashboard/RatingModal.jsx'

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const TABS = [
  { key: 'received', label: 'Received Requests', icon: '📥' },
  { key: 'sent', label: 'Sent Requests', icon: '📤' },
  { key: 'accepted', label: 'Connected Mentors', icon: '🤝' },
]

export default function ConnectionsPage() {
  const showToast = useToast()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('received') // received | sent | accepted
  const [connections, setConnections] = useState(null)
  const [actionLoadingId, setActionLoadingId] = useState(null)

  // Rating Modal States
  const [selectedUserForRating, setSelectedUserForRating] = useState(null)
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false)

  const load = useCallback(async (tab, isMounted = { current: true }) => {
    setConnections(null)
    try {
      const status = tab === 'accepted' ? 'ACCEPTED' : 'PENDING'
      const { data } = await connectionApi.list(status)
      if (!isMounted.current) return

      const listData = data?.data || data || []

      const filtered = tab === 'received' 
        ? listData.filter((c) => c.direction === 'INCOMING')
        : tab === 'sent' 
        ? listData.filter((c) => c.direction === 'OUTGOING')
        : listData

      setConnections(filtered)
    } catch (err) {
      if (!isMounted.current) return
      showToast(err.response?.data?.message || 'Failed to load connections')
      setConnections([])
    }
  }, [showToast])

  useEffect(() => {
    const isMounted = { current: true }
    load(activeTab, isMounted)

    return () => {
      isMounted.current = false
    }
  }, [activeTab, load])

  const handleAction = async (action, id) => {
    setActionLoadingId(id)
    try {
      await connectionApi[action](id)
      await load(activeTab)
      showToast(
        action === 'accept' ? 'Connection accepted!' :
        action === 'reject' ? 'Request declined' :
        action === 'cancel' ? 'Request cancelled' : 'User blocked'
      )
    } catch (err) {
      showToast(err.response?.data?.message || 'Something went wrong')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleOpenRatingModal = (connection) => {
    setSelectedUserForRating({
      connectionId: connection.id,
      userId: connection.otherUserId,
      name: connection.otherUserName,
    })
    setIsRatingModalOpen(true)
  }

  const handleRatingSubmit = async (ratingData) => {
    try {
      await reviewApi.submitReview(selectedUserForRating.connectionId, {
        rating: ratingData.rating,
        comment: ratingData.comment,
      })

      showToast(`Rating submitted for ${selectedUserForRating?.name}!`)
      setIsRatingModalOpen(false)
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit rating')
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6 pb-12 font-sans">
        
        {/* Header Banner */}
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-[#4B2ECF] text-[11px] font-bold tracking-wide uppercase mb-2">
              <span>⚡</span> Network Hub
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Manage Connections & <span className="text-[#4B2ECF]">Requests</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
              Review incoming invitations, track sent requests, or rate active learning partners.
            </p>
          </div>
        </div>

        {/* Tabs & Content Container */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          
          {/* Tabs Navigation */}
          <div className="flex border-b border-gray-100 bg-gray-50/50 p-1.5 sm:p-2 gap-1.5">
            {TABS.map((t) => {
              const isActive = activeTab === t.key
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`flex-1 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                    isActive
                      ? 'bg-white text-[#4B2ECF] shadow-sm border border-gray-100/80 scale-[1.01]'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-white/60'
                  }`}
                >
                  <span className="text-base">{t.icon}</span>
                  <span>{t.label}</span>
                  {connections && isActive && (
                    <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-50 text-[#4B2ECF]">
                      {connections.length}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Skeleton Loading State */}
          {connections === null && (
            <div className="divide-y divide-gray-50 p-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between py-4 px-2 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gray-200" />
                    <div className="space-y-2">
                      <div className="w-32 h-4 bg-gray-200 rounded" />
                      <div className="w-20 h-3 bg-gray-100 rounded" />
                    </div>
                  </div>
                  <div className="w-24 h-8 bg-gray-200 rounded-xl" />
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {connections?.length === 0 && (
            <div className="py-16 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 text-[#4B2ECF] flex items-center justify-center text-2xl mx-auto shadow-inner">
                {activeTab === 'received' ? '📥' : activeTab === 'sent' ? '📤' : '🤝'}
              </div>
              <h3 className="text-sm font-bold text-gray-900">
                {activeTab === 'received'
                  ? 'No pending requests received'
                  : activeTab === 'sent'
                  ? 'No pending requests sent'
                  : 'No active connections yet'}
              </h3>
              <p className="text-xs text-gray-400 max-w-xs mx-auto">
                Explore available mentors from the marketplace to start exchanging skills.
              </p>
            </div>
          )}

          {/* Connection Item List */}
          {connections && connections.length > 0 && (
            <div className="divide-y divide-gray-100">
              {connections.map((c) => {
                const isLoadingThis = actionLoadingId === c.id

                return (
                  <div
                    key={c.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 hover:bg-gray-50/60 transition-colors"
                  >
                    {/* User Profile Details */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gradient-to-br from-[#4B2ECF] to-[#FF7A00] flex items-center justify-center text-white font-bold text-base shrink-0 shadow-sm">
                        {c.otherUserProfilePicture ? (
                          <img
                            src={c.otherUserProfilePicture}
                            alt={c.otherUserName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          c.otherUserName?.[0]?.toUpperCase() || 'U'
                        )}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900 text-sm truncate">{c.otherUserName}</p>
                          {c.matchPercentage && (
                            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md shrink-0">
                              ⚡ {c.matchPercentage}% Match
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-medium text-gray-400 truncate flex items-center gap-1.5">
                          <span>🕒 Requested {timeAgo(c.createdAt)}</span>
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {activeTab === 'received' && c.status === 'PENDING' && (
                        <>
                          <button
                            disabled={isLoadingThis}
                            onClick={() => handleAction('accept', c.id)}
                            className="px-4 py-2 rounded-xl bg-[#4B2ECF] hover:bg-[#3b22ab] text-white text-xs font-bold transition shadow-sm hover:shadow cursor-pointer disabled:opacity-70 flex items-center gap-1.5 active:scale-[0.98]"
                          >
                            {isLoadingThis ? (
                              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <span>✓</span>
                            )}
                            Accept
                          </button>
                          <button
                            disabled={isLoadingThis}
                            onClick={() => handleAction('reject', c.id)}
                            className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 text-xs font-bold transition cursor-pointer disabled:opacity-70 active:scale-[0.98]"
                          >
                            Decline
                          </button>
                        </>
                      )}

                      {activeTab === 'sent' && c.status === 'PENDING' && (
                        <button
                          disabled={isLoadingThis}
                          onClick={() => handleAction('cancel', c.id)}
                          className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold transition cursor-pointer disabled:opacity-70 active:scale-[0.98]"
                        >
                          {isLoadingThis ? 'Cancelling...' : 'Cancel Request'}
                        </button>
                      )}

                      {activeTab === 'accepted' && (
                        <>
                          {/* Rate User Button */}
                          <button
                            onClick={() => handleOpenRatingModal(c)}
                            className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 active:scale-[0.98]"
                          >
                            <span>⭐</span> Rate User
                          </button>

                          {/* Message Button */}
                          <button
                            onClick={() => navigate(`/dashboard/chat?connectionId=${c.id}`)}
                            className="px-4 py-2 rounded-xl bg-[#4B2ECF] hover:bg-[#3b22ab] text-white text-xs font-bold transition shadow-sm hover:shadow cursor-pointer flex items-center gap-1.5 active:scale-[0.98]"
                          >
                            <span>💬</span> Message
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Rating Modal Integration */}
      <RatingModal
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
        targetUser={selectedUserForRating}
        onSubmit={handleRatingSubmit}
      />
    </DashboardLayout>
  )
}