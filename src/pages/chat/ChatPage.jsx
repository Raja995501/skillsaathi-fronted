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
    return () => { isMounted = false }
  }, [])

  useEffect(() => {
    if (activeId) {
      setSearchParams({ connectionId: activeId }, { replace: true })
    }
  }, [activeId, setSearchParams])

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

    return () => { isMounted = false }
  }, [activeId])

  useEffect(() => {
    if (!connected) return

    const unsubPresence = subscribe('/topic/presence', (event) => {
      const targetUser = event.userId || event.id || event.senderId
      if (targetUser != null) {
        const isOnline = Boolean(event.online ?? event.status === 'ONLINE')
        setOnlineUsers((prev) => ({ ...prev, [String(targetUser)]: isOnline }))
      }
    })

    if (currentUserId) {
      publish('/app/user.presence', { userId: currentUserId, online: true })
    }

    if (!activeId) {
      return () => { unsubPresence() }
    }

    const unsubMessages = subscribe(`/topic/connection.${activeId}`, (msg) => {
      setMessages((prev) => {
        if (msg.id && prev.some((m) => m.id === msg.id)) return prev
        return [...prev, msg]
      })
      const msgSender = msg.senderId ?? msg.sender ?? msg.userId
      if (String(msgSender) !== String(currentUserId)) {
        chatApi.markAsRead(activeId)
      }
    })

    const unsubTyping = subscribe(`/topic/connection.${activeId}.typing`, (event) => {
      const eventSender = event.userId ?? event.senderId ?? event.sender ?? event.id
      const isTypingState = event.typing ?? event.isTyping

      if (eventSender != null && String(eventSender) !== String(currentUserId)) {
        setOtherTyping(Boolean(isTypingState))
      }
    })

    const unsubRead = subscribe(`/topic/connection.${activeId}.read`, () => {
      setMessages((prev) =>
        prev.map((m) => {
          const msgSender = m.senderId ?? m.sender ?? m.userId
          return String(msgSender) === String(currentUserId) ? { ...m, status: 'READ' } : m
        })
      )
    })

    return () => {
      unsubMessages()
      unsubTyping()
      unsubRead()
      unsubPresence()
    }
  }, [activeId, connected, subscribe, publish, currentUserId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    return () => clearTimeout(typingTimeoutRef.current)
  }, [])

  const handleSend = (e) => {
    e.preventDefault()
    if (!draft.trim() || !activeId) return
    const messageContent = draft.trim()
    setDraft('')
    publish('/app/chat.send', { connectionId: activeId, content: messageContent, senderId: currentUserId })
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
      return onlineUsers[String(otherUserId)] ?? false
    },
    [onlineUsers]
  )

  const formatMessageTime = (dateString) => {
    if (!dateString) return ''
    let fixedDateString = dateString
    if (typeof dateString === 'string' && !dateString.endsWith('Z') && !dateString.includes('+')) {
      fixedDateString = dateString + 'Z'
    }
    const date = new Date(fixedDateString)
    if (isNaN(date.getTime())) return ''
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
  }

  return (
    <DashboardLayout>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm h-[calc(100vh-140px)] sm:h-[calc(100vh-150px)] lg:h-[calc(100vh-160px)] flex overflow-hidden font-sans">

        {/* ✅ YAHAN CHANGE KIYA HAI: Sidebar ko lg:w-56 kar diya (pehle lg:w-80 tha) */}
        <div
          className={`w-full lg:w-56 border-r border-gray-100 flex-col shrink-0 bg-slate-50/40 ${
            activeId ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <div className="p-4 border-b border-gray-100 bg-white flex items-center justify-between shrink-0">
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
                      {online ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Chat Area */}
        <div
          className={`flex-1 flex flex-col min-w-0 bg-slate-50/25 ${
            !activeId ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {!activeConversation ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 space-y-3 px-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-purple-50 text-[#4B2ECF] flex items-center justify-center text-2xl shadow-inner">
                ✉️
              </div>
              <p className="text-sm font-semibold text-gray-500">Select a conversation from the sidebar to start messaging</p>
            </div>
          ) : (
            <>
              <div className="px-3 sm:px-5 py-3 border-b border-gray-100 bg-white flex items-center justify-between shadow-xs shrink-0">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => setActiveId(null)}
                    className="lg:hidden shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
                    aria-label="Back to conversations"
                  >
                    ←
                  </button>

                  <div className="relative shrink-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-gradient-to-br from-[#4B2ECF] to-orange-400 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                      {activeConversation.otherUserProfilePicture ? (
                        <img src={activeConversation.otherUserProfilePicture} alt="" className="w-full h-full object-cover" />
                      ) : (
                        activeConversation.otherUserName?.[0]?.toUpperCase()
                      )}
                    </div>
                    <span
                      className={`absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 border-white ${
                        isUserOnline(activeConversation.otherUserId) ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-gray-900 text-sm truncate">{activeConversation.otherUserName}</h3>
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

              <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-6 space-y-3 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
                {messages.map((m, idx) => {
                  const msgSender = m.senderId ?? m.sender ?? m.userId
                  const isMine = String(msgSender) === String(currentUserId)
                  const isRead = m.status === 'READ'

                  return (
                    <div key={m.id || idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[85%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl text-sm shadow-xs relative group ${
                          isMine
                            ? 'bg-[#4B2ECF] text-white rounded-br-xs'
                            : 'bg-white border border-gray-100 text-gray-900 rounded-bl-xs shadow-sm'
                        }`}
                      >
                        <p className="leading-relaxed font-medium text-[13.5px] whitespace-pre-wrap word-break">{m.content}</p>

                        <div
                          className={`flex items-center gap-1 text-[10px] mt-1 ${
                            isMine ? 'text-indigo-200 justify-end' : 'text-gray-400'
                          }`}
                        >
                          {m.createdAt && (
                            <span className="font-medium opacity-90">
                              {formatMessageTime(m.createdAt)}
                            </span>
                          )}

                          {isMine && (
                            <span className="ml-1 inline-flex items-center text-[12px] font-bold">
                              {isRead ? (
                                <span className="text-sky-300 font-black tracking-tighter" title="Read">✓✓</span>
                              ) : (
                                <span className="text-gray-300 opacity-80" title="Sent">✓</span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSend} className="p-2.5 sm:p-3.5 bg-white border-t border-gray-100 flex items-center gap-2 shrink-0 w-full">
                <input
                  value={draft}
                  onChange={(e) => handleTyping(e.target.value)}
                  placeholder={connected ? 'Type a message...' : 'Connecting...'}
                  disabled={!connected}
                  className="flex-1 w-full min-w-0 px-3 sm:px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-800 outline-none focus:border-[#4B2ECF] focus:bg-white disabled:bg-gray-100 transition-all"
                />
                <button
                  type="submit"
                  disabled={!connected || !draft.trim()}
                  className="shrink-0 px-3 sm:px-4 lg:px-6 py-2.5 rounded-xl bg-[#4B2ECF] hover:bg-[#3b22ab] text-white text-sm font-bold disabled:opacity-40 transition-all shadow-sm hover:shadow flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <span className="hidden lg:inline">Send</span>
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
