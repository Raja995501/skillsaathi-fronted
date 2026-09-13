import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import DashboardLayout from '../../components/dashboard/DashboardLayout.jsx'
import { connectionApi } from '../../api/connectionApi'
import { chatApi } from '../../api/chatApi'
import { useAuth } from '../../context/AuthContext.jsx'
import { useWebSocket } from '../../context/WebSocketContext.jsx'

export default function ChatPage() {
  const { user } = useAuth()
  const { connected, subscribe, publish } = useWebSocket()
  const [searchParams, setSearchParams] = useSearchParams()

  const [conversations, setConversations] = useState([])
  const [activeId, setActiveId] = useState(searchParams.get('connectionId') || null)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [otherTyping, setOtherTyping] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState({})

  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  const currentUserId = user?.id || user?.userId || user?._id

  // Fetch initial conversations
  useEffect(() => {
    let isMounted = true
    connectionApi.list('ACCEPTED').then((res) => {
      if (!isMounted) return
      const list = res.data?.data || res.data || []
      setConversations(list)
      if (!activeId && list.length > 0) {
        setActiveId(list[0].id)
      }
    })
    return () => {
      isMounted = false
    }
  }, [])

  // Sync activeId with URL search parameters
  useEffect(() => {
    if (activeId) {
      setSearchParams({ connectionId: activeId }, { replace: true })
    }
  }, [activeId, setSearchParams])

  // Fetch history when active conversation changes
  useEffect(() => {
    if (!activeId) return
    let isMounted = true

    chatApi.getHistory(activeId).then((res) => {
      if (!isMounted) return
      const historyData = res.data?.data?.content || res.data?.data || []
      setMessages([...historyData].reverse())
    })

    chatApi.markAsRead(activeId)
    setOtherTyping(false)

    return () => {
      isMounted = false
    }
  }, [activeId])

  // Real-time Subscriptions & Online Presence
  useEffect(() => {
    if (!activeId || !connected) return

    // 1. Messages Subscription
    const unsubMessages = subscribe(`/topic/connection.${activeId}`, (msg) => {
      setMessages((prev) => [...prev, msg])
      const msgSender = msg.senderId ?? msg.sender ?? msg.userId
      if (String(msgSender) !== String(currentUserId)) {
        chatApi.markAsRead(activeId)
      }
    })

    // 2. Typing Subscription
    const unsubTyping = subscribe(`/topic/connection.${activeId}.typing`, (event) => {
      const eventSender = event.userId ?? event.senderId ?? event.sender ?? event.id
      const isTypingState = event.typing ?? event.isTyping

      if (eventSender != null && String(eventSender) !== String(currentUserId)) {
        setOtherTyping(Boolean(isTypingState))
      }
    })

    // 3. Read Receipts Subscription
    const unsubRead = subscribe(`/topic/connection.${activeId}.read`, () => {
      setMessages((prev) =>
        prev.map((m) => {
          const msgSender = m.senderId ?? m.sender ?? m.userId
          return String(msgSender) === String(currentUserId) ? { ...m, status: 'READ' } : m
        })
      )
    })

    // 4. Online Presence Subscription
    const unsubPresence = subscribe('/topic/presence', (event) => {
      const targetUser = event.userId || event.id
      if (targetUser) {
        setOnlineUsers((prev) => ({
          ...prev,
          [targetUser]: Boolean(event.online ?? event.status === 'ONLINE'),
        }))
      }
    })

    publish('/app/user.presence', { userId: currentUserId, online: true })

    return () => {
      unsubMessages()
      unsubTyping()
      unsubRead()
      unsubPresence()
    }
  }, [activeId, connected, subscribe, publish, currentUserId])

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, otherTyping])

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => clearTimeout(typingTimeoutRef.current)
  }, [])

  const handleSend = (e) => {
    e.preventDefault()
    if (!draft.trim() || !activeId) return
    publish('/app/chat.send', { connectionId: activeId, content: draft.trim(), senderId: currentUserId })
    setDraft('')
    publish('/app/chat.typing', { connectionId: activeId, typing: false, userId: currentUserId })
  }

  const handleTyping = useCallback(
    (value) => {
      setDraft(value)
      if (!activeId) return
      publish('/app/chat.typing', { connectionId: activeId, typing: true, userId: currentUserId })
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = setTimeout(() => {
        publish('/app/chat.typing', { connectionId: activeId, typing: false, userId: currentUserId })
      }, 2000)
    },
    [activeId, publish, currentUserId]
  )

  const activeConversation = useMemo(
    () => conversations.find((c) => String(c.id) === String(activeId)),
    [conversations, activeId]
  )

  const isUserOnline = useCallback(
    (otherUserId) => {
      if (!otherUserId) return false
      return onlineUsers[otherUserId] ?? false
    },
    [onlineUsers]
  )

  return (
    <DashboardLayout>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm h-[calc(100vh-130px)] flex overflow-hidden font-sans">
        
        {/* Sidebar */}
        <div className="w-80 border-r border-gray-100 flex flex-col shrink-0 bg-slate-50/40">
          <div className="p-4 border-b border-gray-100 bg-white flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-gray-900 text-lg tracking-tight">Messages</h2>
              <p className="text-xs text-gray-400 font-medium">Active conversations</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {conversations.length === 0 && (
              <div className="text-center py-12 px-4 space-y-2">
                <div className="w-12 h-12 rounded-full bg-purple-50 text-[#4B2ECF] flex items-center justify-center text-xl mx-auto">
                  💬
                </div>
                <p className="text-xs text-gray-500 font-medium">
                  No conversations yet. Accept a connection request to start chatting.
                </p>
              </div>
            )}

            {conversations.map((c) => {
              const isSelected = String(activeId) === String(c.id)
              const otherUserId = c.otherUserId || c.userId || c.id
              const online = isUserOnline(otherUserId)

              return (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-[#4B2ECF] text-white shadow-md shadow-indigo-100'
                      : 'hover:bg-white text-gray-700 hover:shadow-sm'
                  }`}
                >
                  <div className="relative shrink-0">
                    <div
                      className={`w-11 h-11 rounded-full overflow-hidden flex items-center justify-center font-bold text-sm ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-gradient-to-br from-[#4B2ECF] to-orange-400 text-white shadow-sm'
                      }`}
                    >
                      {c.otherUserProfilePicture ? (
                        <img src={c.otherUserProfilePicture} alt="" className="w-full h-full object-cover" />
                      ) : (
                        c.otherUserName?.[0]?.toUpperCase() || 'U'
                      )}
                    </div>

                    <span 
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 ${
                        isSelected ? 'border-[#4B2ECF]' : 'border-white'
                      } ${online ? 'bg-green-500' : 'bg-gray-300'}`}
                      title={online ? 'Online' : 'Offline'}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                        {c.otherUserName}
                      </p>
                    </div>
                    <p className={`text-xs truncate font-medium ${isSelected ? 'text-purple-100' : 'text-gray-400'}`}>
                      {online ? 'Online' : 'Click to view chat history'}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50/20">
          {!activeConversation ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-purple-50 text-[#4B2ECF] flex items-center justify-center text-2xl shadow-inner">
                ✉️
              </div>
              <p className="text-sm font-semibold text-gray-500">Select a conversation from the sidebar to start messaging</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="px-6 py-3.5 border-b border-gray-100 bg-white flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[#4B2ECF] to-orange-400 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                      {activeConversation.otherUserProfilePicture ? (
                        <img src={activeConversation.otherUserProfilePicture} alt="" className="w-full h-full object-cover" />
                      ) : (
                        activeConversation.otherUserName?.[0]?.toUpperCase()
                      )}
                    </div>
                    <span 
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                        isUserOnline(activeConversation.otherUserId) ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">{activeConversation.otherUserName}</h3>
                    {otherTyping ? (
                      <p className="text-xs text-[#4B2ECF] animate-pulse font-semibold flex items-center gap-1">
                        <span>typing</span>
                        <span className="inline-flex gap-0.5">
                          <span className="w-1 h-1 bg-[#4B2ECF] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1 h-1 bg-[#4B2ECF] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1 h-1 bg-[#4B2ECF] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                      </p>
                    ) : (
                      <p className="text-[11px] font-medium flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${isUserOnline(activeConversation.otherUserId) ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <span className={isUserOnline(activeConversation.otherUserId) ? 'text-green-600 font-semibold' : 'text-gray-400'}>
                          {isUserOnline(activeConversation.otherUserId) ? 'Online' : 'Offline'}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
                {messages.map((m, idx) => {
                  const msgSender = m.senderId ?? m.sender ?? m.userId
                  const isMine = String(msgSender) === String(currentUserId)
                  const isRead = m.status === 'READ'

                  return (
                    <div key={m.id || idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm shadow-xs relative group ${
                          isMine
                            ? 'bg-[#4B2ECF] text-white rounded-br-xs'
                            : 'bg-white border border-gray-100 text-gray-900 rounded-bl-xs shadow-sm'
                        }`}
                      >
                        <p className="leading-relaxed font-medium text-[13.5px] whitespace-pre-wrap">{m.content}</p>

                        <div
                          className={`flex items-center gap-1 text-[10px] mt-1 ${
                            isMine ? 'text-indigo-200 justify-end' : 'text-gray-400'
                          }`}
                        >
                          {m.createdAt && (
                            <span className="font-medium opacity-90">
                              {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}

                          {isMine && (
                            <span className="ml-1 inline-flex items-center text-[12px] font-bold">
                              {isRead ? (
                                <span className="text-sky-300 font-black tracking-tighter" title="Read">✓✓</span>
                              ) : (
                                <span className="text-gray-300 opacity-80" title="Sent">✓</span>
                              ) }
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Form */}
              <form onSubmit={handleSend} className="p-3.5 bg-white border-t border-gray-100 flex items-center gap-2">
                <input
                  value={draft}
                  onChange={(e) => handleTyping(e.target.value)}
                  placeholder={connected ? 'Type a message...' : 'Connecting to server...'}
                  disabled={!connected}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-800 outline-none focus:border-[#4B2ECF] focus:bg-white disabled:bg-gray-100 transition-all"
                />
                <button
                  type="submit"
                  disabled={!connected || !draft.trim()}
                  className="px-5 py-2.5 rounded-xl bg-[#4B2ECF] hover:bg-[#3b22ab] text-white text-sm font-bold disabled:opacity-40 transition-all shadow-sm hover:shadow flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <span>Send</span>
                  <span className="text-xs">➔</span>
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}