import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import DashboardLayout from '../../components/dashboard/DashboardLayout.jsx'
import { connectionApi } from '../../api/connectionApi'
import { chatApi } from '../../api/chatApi'
import { useAuth } from '../../context/AuthContext.jsx'
import { useWebSocket } from '../../context/WebSocketContext.jsx'
import MediaPreviewModal from '../../components/chat/MediaPreviewModal.jsx'
import MessageContextMenu from '../../components/chat/MessageContextMenu.jsx'
import DeleteConfirmDialog from '../../components/chat/DeleteConfirmDialog.jsx'

const isMobileDevice = () => {
  if (typeof navigator === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

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
  const [isUploading, setIsUploading] = useState(false)
  const [pendingFile, setPendingFile] = useState(null)
  const [contextMenu, setContextMenu] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState(null)

  const [editingMessage, setEditingMessage] = useState(null)
  const [replyingTo, setReplyingTo] = useState(null)

  // Last message + unread count
  const [lastMessages, setLastMessages] = useState({})
  const [unreadCounts, setUnreadCounts] = useState({})

  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)
  const longPressTimerRef = useRef(null)
  const inputRef = useRef(null)

  const currentUserId = user?.id || user?.userId || user?._id
  const isMobile = useMemo(() => isMobileDevice(), [])

  // Load conversations
  useEffect(() => {
    let isMounted = true
    connectionApi.list('ACCEPTED').then((res) => {
      if (!isMounted) return
      const list = res.data?.data || res.data || []
      setConversations(list)
      if (!activeId && list.length > 0) setActiveId(list[0].id)
    }).catch((err) => console.error("Conversations fetch error:", err))
    return () => { isMounted = false }
  }, [])

  // Update URL
  useEffect(() => {
    if (activeId) setSearchParams({ connectionId: activeId }, { replace: true })
  }, [activeId, setSearchParams])

  // Clear unread count when opening chat
  useEffect(() => {
    if (activeId) {
      setUnreadCounts((prev) => ({ ...prev, [String(activeId)]: 0 }))
    }
  }, [activeId])

  // Load chat history
  useEffect(() => {
    if (!activeId) return
    let isMounted = true
    chatApi.getHistory(activeId).then((res) => {
      if (!isMounted) return
      const rawData = res.data?.data?.content || res.data?.data || []
      const historyData = Array.isArray(rawData) ? rawData.filter((m) => m != null) : []
      const ordered = [...historyData].reverse()
      setMessages(ordered)
      const last = ordered.length > 0 ? ordered[ordered.length - 1] : null
      if (last) {
        setLastMessages((prev) => ({ ...prev, [String(activeId)]: last }))
      }
    }).catch((err) => console.error("Chat history error:", err))
    chatApi.markAsRead(activeId).catch(() => {})
    setOtherTyping(false)
    return () => { isMounted = false }
  }, [activeId])

  // Presence
  useEffect(() => {
    if (!connected) return
    const unsubPresence = subscribe('/topic/presence', (event) => {
      if (!event) return
      const targetUser = event.userId
      if (targetUser != null) {
        setOnlineUsers((prev) => ({ ...prev, [String(targetUser)]: Boolean(event.online) }))
      }
    })
    if (currentUserId) publish('/app/user.presence', { userId: currentUserId, online: true })
    return () => { if (unsubPresence) unsubPresence() }
  }, [connected, subscribe, publish, currentUserId])

  // Messages / Typing / Read / Delete / Edit subscriptions (for active connection)
  useEffect(() => {
    if (!connected || !activeId) return

    const unsubMessages = subscribe(`/topic/connection.${activeId}`, (msg) => {
      if (!msg) return
      setMessages((prev) => {
        const currentList = (Array.isArray(prev) ? prev : []).filter((m) => m != null)
        if (msg.id && currentList.some((m) => m && String(m.id) === String(msg.id))) return currentList
        const msgSender = msg.senderId ?? msg.sender ?? msg.userId
        if (String(msgSender) === String(currentUserId)) {
          const optIdx = currentList.findIndex(
            (m) => m && typeof m.id === 'string' && m.id.startsWith('temp-') && m.type === msg.type
          )
          if (optIdx !== -1) {
            const updated = [...currentList]
            updated[optIdx] = msg
            return updated
          }
        }
        return [...currentList, msg]
      })
      setLastMessages((prev) => ({ ...prev, [String(activeId)]: msg }))
      const msgSender = msg.senderId ?? msg.sender ?? msg.userId
      if (String(msgSender) !== String(currentUserId)) chatApi.markAsRead(activeId).catch(() => {})
    })

    const unsubTyping = subscribe(`/topic/connection.${activeId}.typing`, (event) => {
      if (!event) return
      const eventSender = event.userId ?? event.senderId ?? event.sender ?? event.id
      const isTypingState = event.typing ?? event.isTyping
      if (eventSender != null && String(eventSender) !== String(currentUserId)) {
        setOtherTyping(Boolean(isTypingState))
      }
    })

    const unsubRead = subscribe(`/topic/connection.${activeId}.read`, (event) => {
      const readByUserId = event?.readByUserId ?? event?.userId
      if (readByUserId && String(readByUserId) !== String(currentUserId)) {
        setMessages((prev) => {
          const currentList = Array.isArray(prev) ? prev : []
          return currentList.map((m) => {
            if (!m) return m
            const msgSender = m.senderId ?? m.sender ?? m.userId
            return String(msgSender) === String(currentUserId) ? { ...m, status: 'READ' } : m
          })
        })
      }
    })

    const unsubDelete = subscribe(`/topic/connection.${activeId}.delete`, (event) => {
      if (!event) return
      const deletedId = event.messageId
      const forEveryone = Boolean(event.forEveryone)
      const deletedByUserId = event.deletedByUserId
      setMessages((prev) => {
        const currentList = Array.isArray(prev) ? prev : []
        if (forEveryone) {
          return currentList.map((m) =>
            m && String(m.id) === String(deletedId)
              ? { ...m, deleted: true, deletedForEveryone: true, content: 'This message was deleted', fileUrl: null }
              : m
          )
        } else {
          if (String(deletedByUserId) === String(currentUserId)) {
            return currentList.filter((m) => m && String(m.id) !== String(deletedId))
          }
          return currentList
        }
      })
    })

    const unsubEdit = subscribe(`/topic/connection.${activeId}.edit`, (event) => {
      if (!event || !event.id) return
      setMessages((prev) => {
        const currentList = Array.isArray(prev) ? prev : []
        return currentList.map((m) =>
          m && String(m.id) === String(event.id) ? { ...m, ...event } : m
        )
      })
      setLastMessages((prev) => ({ ...prev, [String(activeId)]: event }))
    })

    return () => {
      if (unsubMessages) unsubMessages()
      if (unsubTyping) unsubTyping()
      if (unsubRead) unsubRead()
      if (unsubDelete) unsubDelete()
      if (unsubEdit) unsubEdit()
    }
  }, [activeId, connected, subscribe, currentUserId])

  // ✅ NEW: Personal topic subscription — for unread badges (any conversation)
  useEffect(() => {
    if (!connected || !currentUserId) return

    const unsubPersonal = subscribe(`/topic/user.${currentUserId}.new-message`, (msg) => {
      if (!msg) return
      const msgConnectionId = msg.connectionId
      if (!msgConnectionId) return

      // Update last message for that conversation
      setLastMessages((prev) => ({ ...prev, [String(msgConnectionId)]: msg }))

      // If not the currently open chat → increment unread count
      if (String(msgConnectionId) !== String(activeId)) {
        setUnreadCounts((prev) => {
          const key = String(msgConnectionId)
          return { ...prev, [key]: (prev[key] || 0) + 1 }
        })
      }
    })

    return () => {
      if (unsubPersonal) unsubPersonal()
    }
  }, [connected, currentUserId, activeId, subscribe])

  // Beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentUserId) publish('/app/user.presence', { userId: currentUserId, online: false })

    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      if (currentUserId) publish('/app/user.presence', { userId: currentUserId, online: false })
    }
  }, [currentUserId, publish])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    return () => clearTimeout(typingTimeoutRef.current)
  }, [])

  useEffect(() => {
    if (!contextMenu) return
    const handleScroll = () => setContextMenu(null)
    window.addEventListener('scroll', handleScroll, true)
    return () => window.removeEventListener('scroll', handleScroll, true)
  }, [contextMenu])

  // Context menu handlers
  const openContextMenu = (message, x, y) => setContextMenu({ message, position: { x, y } })
  const closeContextMenu = () => setContextMenu(null)

  const handleContextMenu = (e, message) => {
    e.preventDefault()
    e.stopPropagation()
    openContextMenu(message, e.clientX, e.clientY)
  }

  const handleTouchStart = (e, message) => {
    const touch = e.touches[0]
    const x = touch.clientX
    const y = touch.clientY
    longPressTimerRef.current = setTimeout(() => { openContextMenu(message, x, y) }, 500)
  }
  const handleTouchEnd = () => {
    if (longPressTimerRef.current) { clearTimeout(longPressTimerRef.current); longPressTimerRef.current = null }
  }
  const handleTouchMove = () => {
    if (longPressTimerRef.current) { clearTimeout(longPressTimerRef.current); longPressTimerRef.current = null }
  }

  const handleCopyMessage = async (content) => {
    try { await navigator.clipboard.writeText(content) } catch (err) { console.error('Copy failed:', err) }
  }

  const handleEditMessage = (message) => {
    if (!message || !message.id) return
    if (message.type !== 'TEXT') { alert('Only text messages can be edited'); return }
    setEditingMessage(message)
    setDraft(message.content || '')
    setReplyingTo(null)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const handleReplyMessage = (message) => {
    if (!message || !message.id) return
    setReplyingTo(message)
    setEditingMessage(null)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const cancelEdit = () => { setEditingMessage(null); setDraft('') }
  const cancelReply = () => setReplyingTo(null)

  const handleDeleteMessage = (message) => {
    if (!message || !message.id) { console.warn('Cannot delete: invalid message'); return }
    setDeleteDialog(message)
  }

  const handleViewMessage = (message) => {
    if (message?.fileUrl) window.open(message.fileUrl, '_blank')
  }

  const handleDownloadMessage = async (message) => {
    if (!message?.fileUrl) return
    try {
      const response = await fetch(message.fileUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = message.content || (message.type === 'VIDEO' ? 'video.mp4' : 'image.jpg')
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download failed:', err)
      alert('Download failed. Please try again.')
    }
  }

  const confirmDelete = async (forEveryone) => {
    if (!deleteDialog || !deleteDialog.id || !activeId) return
    const msg = deleteDialog
    setDeleteDialog(null)
    try {
      await chatApi.deleteMessage(activeId, msg.id, forEveryone)
      setMessages((prev) => {
        const currentList = Array.isArray(prev) ? prev : []
        if (forEveryone) {
          return currentList.map((m) =>
            m && String(m.id) === String(msg.id)
              ? { ...m, deleted: true, deletedForEveryone: true, content: 'This message was deleted', fileUrl: null }
              : m
          )
        } else {
          return currentList.filter((m) => m && String(m.id) !== String(msg.id))
        }
      })
    } catch (err) {
      console.error('Delete failed:', err)
      alert('Delete failed. Please try again.')
    }
  }

  const cancelDelete = () => setDeleteDialog(null)

  const handleSend = async (e) => {
    e.preventDefault()
    if (!draft.trim() || !activeId) return
    const messageContent = draft.trim()

    if (editingMessage) {
      try {
        const res = await chatApi.editMessage(activeId, editingMessage.id, messageContent)
        const updated = res.data?.data || res.data
        setMessages((prev) => {
          const currentList = Array.isArray(prev) ? prev : []
          return currentList.map((m) => m && String(m.id) === String(updated.id) ? { ...m, ...updated } : m)
        })
        setLastMessages((prev) => ({ ...prev, [String(activeId)]: updated }))
      } catch (err) {
        console.error('Edit failed:', err)
        alert('Edit failed. Only messages within 15 minutes can be edited.')
      } finally {
        setEditingMessage(null)
        setDraft('')
      }
      return
    }

    setDraft('')
    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      connectionId: activeId,
      senderId: currentUserId,
      content: messageContent,
      type: 'TEXT',
      fileUrl: null,
      status: 'SENT',
      createdAt: new Date().toISOString(),
      _optimistic: true,
      replyToId: replyingTo?.id || null,
      replyToContent: replyingTo?.content || null,
      replyToSenderName: replyingTo?.senderName || null,
      replyToType: replyingTo?.type || null,
    }
    setMessages((prev) => [...prev, optimisticMsg])
    setLastMessages((prev) => ({ ...prev, [String(activeId)]: optimisticMsg }))
    publish('/app/chat.send', {
      connectionId: activeId,
      content: messageContent,
      senderId: currentUserId,
      type: 'TEXT',
      replyToId: replyingTo?.id || null,
    })
    publish('/app/chat.typing', { connectionId: activeId, typing: false, userId: currentUserId })
    setReplyingTo(null)
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file || !activeId) return
    setPendingFile(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }

  const handlePreviewSend = async (caption) => {
    if (!pendingFile || !activeId) return
    try {
      setIsUploading(true)
      const res = await chatApi.uploadMedia(pendingFile)
      const responseData = res.data?.data || res.data
      const { fileUrl, type } = responseData
      const mediaType = type || (pendingFile.type.startsWith('video') ? 'VIDEO' : 'IMAGE')
      const messageContent = caption || pendingFile.name

      const optimisticMsg = {
        id: `temp-${Date.now()}`,
        connectionId: activeId,
        senderId: currentUserId,
        content: messageContent,
        fileUrl: fileUrl,
        type: mediaType,
        status: 'SENT',
        createdAt: new Date().toISOString(),
        _optimistic: true,
        replyToId: replyingTo?.id || null,
        replyToContent: replyingTo?.content || null,
        replyToSenderName: replyingTo?.senderName || null,
        replyToType: replyingTo?.type || null,
      }
      setMessages((prev) => [...prev, optimisticMsg])
      setLastMessages((prev) => ({ ...prev, [String(activeId)]: optimisticMsg }))
      publish('/app/chat.send', {
        connectionId: activeId,
        content: messageContent,
        fileUrl: fileUrl,
        type: mediaType,
        senderId: currentUserId,
        replyToId: replyingTo?.id || null,
      })
      setPendingFile(null)
      setReplyingTo(null)
    } catch (err) {
      console.error("Media upload failed:", err)
      alert("File upload failed. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  // 👇 PART 2 CONTINUES FROM HERE — ISKE BAAD KA CODE NEXT MESSAGE MEIN HAI
    const handlePreviewCancel = () => setPendingFile(null)

  const handleTyping = useCallback(
    (value) => {
      setDraft(value)
      if (!activeId || editingMessage) return
      publish('/app/chat.typing', { connectionId: activeId, typing: true, userId: currentUserId })
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = setTimeout(() => {
        publish('/app/chat.typing', { connectionId: activeId, typing: false, userId: currentUserId })
      }, 2000)
    },
    [activeId, publish, currentUserId, editingMessage]
  )

  const activeConversation = useMemo(
    () => (Array.isArray(conversations) ? conversations.find((c) => String(c?.id) === String(activeId)) : null),
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

  // Short time formatter (WhatsApp-style)
  const formatShortTime = (dateString) => {
    if (!dateString) return ''
    let fixed = dateString
    if (typeof fixed === 'string' && !fixed.endsWith('Z') && !fixed.includes('+')) {
      fixed = fixed + 'Z'
    }
    const d = new Date(fixed)
    if (isNaN(d.getTime())) return ''
    const now = new Date()
    const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return d.toLocaleDateString([], { weekday: 'short' })
    } else {
      return d.toLocaleDateString([], { day: '2-digit', month: '2-digit' })
    }
  }

  // Preview text for last message
  const getLastMessagePreview = (connectionId) => {
    const msg = lastMessages[String(connectionId)]
    if (!msg) return null
    if (msg.deletedForEveryone || msg.deleted) {
      return { text: '🚫 This message was deleted', italic: true }
    }
    if (msg.type === 'IMAGE') return { text: '📷 Photo', italic: false }
    if (msg.type === 'VIDEO') return { text: '🎥 Video', italic: false }
    const senderLabel = String(msg.senderId ?? msg.sender ?? msg.userId) === String(currentUserId)
      ? 'You: '
      : ''
    return { text: senderLabel + (msg.content || ''), italic: false }
  }

  const safeConversations = Array.isArray(conversations) ? conversations : []

  // Sort by latest message time (WhatsApp-style)
  const sortedConversations = useMemo(() => {
    return [...safeConversations].sort((a, b) => {
      const aMsg = lastMessages[String(a.id)]
      const bMsg = lastMessages[String(b.id)]
      const aTime = aMsg?.createdAt ? new Date(aMsg.createdAt).getTime() : 0
      const bTime = bMsg?.createdAt ? new Date(bMsg.createdAt).getTime() : 0
      return bTime - aTime
    })
  }, [safeConversations, lastMessages])

  return (
    <DashboardLayout>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm h-[calc(100vh-140px)] sm:h-[calc(100vh-150px)] lg:h-[calc(100vh-160px)] flex overflow-hidden font-sans">

        {/* Sidebar */}
        <div className={`w-full lg:w-56 border-r border-gray-100 flex-col shrink-0 bg-slate-50/40 ${activeId ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-4 border-b border-gray-100 bg-white flex items-center justify-between shrink-0">
            <div>
              <h2 className="font-extrabold text-gray-900 text-lg tracking-tight">Messages</h2>
              <p className="text-xs text-gray-400 font-medium">Active conversations</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {sortedConversations.length === 0 && (
              <div className="text-center py-12 px-4 space-y-2">
                <div className="w-12 h-12 rounded-full bg-purple-50 text-[#4B2ECF] flex items-center justify-center text-xl mx-auto">💬</div>
                <p className="text-xs text-gray-500 font-medium">No conversations yet. Accept a connection request to start chatting.</p>
              </div>
            )}

            {sortedConversations.map((c) => {
              if (!c) return null
              const isSelected = String(activeId) === String(c.id)
              const otherUserId = c.otherUserId || c.userId || c.id
              const online = isUserOnline(otherUserId)
              const preview = getLastMessagePreview(c.id)
              const lastMsg = lastMessages[String(c.id)]
              const unread = unreadCounts[String(c.id)] || 0

              return (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all duration-150 cursor-pointer ${
                    isSelected ? 'bg-[#4B2ECF] text-white shadow-md shadow-indigo-100' : 'hover:bg-white text-gray-700 hover:shadow-sm'
                  }`}
                >
                  {/* Avatar + badge */}
                  <div className="relative shrink-0">
                    <div className={`w-11 h-11 rounded-full overflow-hidden flex items-center justify-center font-bold text-sm ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-gradient-to-br from-[#4B2ECF] to-orange-400 text-white shadow-sm'
                    }`}>
                      {c.otherUserProfilePicture ? (
                        <img src={c.otherUserProfilePicture} alt="" className="w-full h-full object-cover" />
                      ) : (
                        c.otherUserName?.[0]?.toUpperCase() || 'U'
                      )}
                    </div>
                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 ${
                      isSelected ? 'border-[#4B2ECF]' : 'border-white'
                    } ${online ? 'bg-green-500' : 'bg-gray-300'}`} />

                    {/* Unread badge */}
                    {unread > 0 && (
                      <span className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${
                        isSelected
                          ? 'bg-white text-[#4B2ECF] border-[#4B2ECF]'
                          : 'bg-green-500 text-white border-white'
                      }`}>
                        {unread > 99 ? '99+' : unread}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                        {c.otherUserName || 'User'}
                      </p>
                      {lastMsg?.createdAt && (
                        <span className={`text-[10px] font-medium shrink-0 ${
                          isSelected ? 'text-purple-100' : unread > 0 ? 'text-green-600 font-bold' : 'text-gray-400'
                        }`}>
                          {formatShortTime(lastMsg.createdAt)}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs truncate font-medium ${
                      preview?.italic ? 'italic' : ''
                    } ${isSelected ? 'text-purple-100' : unread > 0 ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
                      {preview?.text || (online ? 'Online' : 'Offline')}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Chat area */}
        <div className={`flex-1 flex flex-col min-w-0 bg-slate-50/25 ${!activeId ? 'hidden lg:flex' : 'flex'}`}>
          {!activeConversation ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 space-y-3 px-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-purple-50 text-[#4B2ECF] flex items-center justify-center text-2xl shadow-inner">✉️</div>
              <p className="text-sm font-semibold text-gray-500">Select a conversation from the sidebar to start messaging</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="px-3 sm:px-5 py-3 border-b border-gray-100 bg-white flex items-center justify-between shadow-xs shrink-0">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <button type="button" onClick={() => setActiveId(null)}
                    className="lg:hidden shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer">
                    ←
                  </button>
                  <div className="relative shrink-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-gradient-to-br from-[#4B2ECF] to-orange-400 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                      {activeConversation?.otherUserProfilePicture ? (
                        <img src={activeConversation.otherUserProfilePicture} alt="" className="w-full h-full object-cover" />
                      ) : (
                        activeConversation?.otherUserName?.[0]?.toUpperCase() || 'U'
                      )}
                    </div>
                    <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 border-white ${
                      isUserOnline(activeConversation?.otherUserId) ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-gray-900 text-sm truncate">{activeConversation?.otherUserName || 'Chat'}</h3>
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
                        <span className={`w-1.5 h-1.5 rounded-full ${isUserOnline(activeConversation?.otherUserId) ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <span className={isUserOnline(activeConversation?.otherUserId) ? 'text-green-600 font-semibold' : 'text-gray-400'}>
                          {isUserOnline(activeConversation?.otherUserId) ? 'Online' : 'Offline'}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-6 space-y-3 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
                {(Array.isArray(messages) ? messages : []).map((m, idx) => {
                  if (!m) return null
                  const msgSender = m.senderId ?? m.sender ?? m.userId
                  const isMine = String(msgSender) === String(currentUserId)
                  const isRead = m.status === 'READ'
                  const isDeleted = m.deletedForEveryone || m.deleted

                  return (
                    <div key={m.id || idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        onContextMenu={(e) => !isDeleted && handleContextMenu(e, m)}
                        onTouchStart={(e) => !isDeleted && handleTouchStart(e, m)}
                        onTouchEnd={handleTouchEnd}
                        onTouchMove={handleTouchMove}
                        className={`max-w-[85%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl text-sm shadow-xs relative ${
                          isDeleted
                            ? 'bg-gray-100 text-gray-400 italic border border-gray-200'
                            : isMine
                              ? 'bg-[#4B2ECF] text-white rounded-br-xs cursor-pointer select-none'
                              : 'bg-white border border-gray-100 text-gray-900 rounded-bl-xs shadow-sm cursor-pointer select-none'
                        } ${m._optimistic ? 'opacity-70' : ''}`}
                      >
                        {m.replyToId && m.replyToContent && !isDeleted && (
                          <div className={`mb-1.5 pl-2 border-l-2 ${isMine ? 'border-indigo-300/60 bg-white/10' : 'border-[#4B2ECF]/40 bg-purple-50/50'} rounded-sm py-1 px-2`}>
                            <p className={`text-[10px] font-bold ${isMine ? 'text-indigo-100' : 'text-[#4B2ECF]'}`}>
                              {m.replyToSenderName || 'User'}
                            </p>
                            <p className={`text-[11px] truncate ${isMine ? 'text-indigo-100/90' : 'text-gray-600'}`}>
                              {m.replyToType === 'IMAGE' ? '📷 Image' : m.replyToType === 'VIDEO' ? '🎥 Video' : m.replyToContent}
                            </p>
                          </div>
                        )}

                        {!isDeleted && m.type === 'IMAGE' && m.fileUrl && (
                          <div className="mb-1">
                            <img src={m.fileUrl} alt="Shared media" className="rounded-lg max-w-full max-h-60 object-cover" />
                          </div>
                        )}
                        {!isDeleted && m.type === 'VIDEO' && m.fileUrl && (
                          <div className="mb-1">
                            <video controls className="rounded-lg max-w-full max-h-60">
                              <source src={m.fileUrl} type="video/mp4" />
                              Your browser does not support the video tag.
                            </video>
                          </div>
                        )}

                        {isDeleted ? (
                          <p className="text-[13px]">🚫 This message was deleted</p>
                        ) : (
                          <>
                            {m.type === 'TEXT' && m.content && (
                              <p className="leading-relaxed font-medium text-[13.5px] whitespace-pre-wrap word-break">{m.content}</p>
                            )}
                            {m.type !== 'TEXT' && m.content && m.content !== m.fileUrl && (
                              <p className="text-[13px] font-medium leading-relaxed mb-1">{m.content}</p>
                            )}
                          </>
                        )}

                        {!isDeleted && (
                          <div className={`flex items-center gap-1 text-[10px] mt-1 ${isMine ? 'text-indigo-200 justify-end' : 'text-gray-400'}`}>
                            {m.edited && <span className="italic opacity-80">edited</span>}
                            {m.createdAt && (
                              <span className="font-medium opacity-90">{formatMessageTime(m.createdAt)}</span>
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
                        )}
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* EDIT / REPLY PREVIEW BAR */}
              {(editingMessage || replyingTo) && (
                <div className="px-3 sm:px-4 py-2 bg-purple-50 border-t border-purple-100 flex items-center justify-between gap-2 shrink-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-[#4B2ECF]">
                      {editingMessage ? '✏️ Editing message' : `↩️ Replying to ${replyingTo?.senderName || 'User'}`}
                    </p>
                    <p className="text-[11px] text-gray-600 truncate">
                      {editingMessage?.content || replyingTo?.content || ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={editingMessage ? cancelEdit : cancelReply}
                    className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full hover:bg-purple-100 text-gray-500 cursor-pointer text-lg"
                  >
                    ×
                  </button>
                </div>
              )}

              {/* Input form */}
              <form onSubmit={handleSend} className="p-2 sm:p-3 bg-white border-t border-gray-100 flex items-center gap-1.5 sm:gap-2 shrink-0 w-full">
                <input type="file" ref={cameraInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*,video/*" className="hidden" />

                {isMobile && !editingMessage && (
                  <button type="button" onClick={() => cameraInputRef.current?.click()} disabled={!connected || isUploading}
                    className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 hover:text-[#4B2ECF] hover:bg-purple-50 transition-colors disabled:opacity-40 cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                      <circle cx="12" cy="13" r="3"/>
                    </svg>
                  </button>
                )}

                {!editingMessage && (
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={!connected || isUploading}
                    className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 hover:text-[#4B2ECF] hover:bg-purple-50 transition-colors disabled:opacity-40 cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                    </svg>
                  </button>
                )}

                <input
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => handleTyping(e.target.value)}
                  placeholder={connected ? (isUploading ? 'Uploading...' : editingMessage ? 'Edit message...' : 'Type a message...') : 'Connecting...'}
                  disabled={!connected || isUploading}
                  className="flex-1 min-w-0 w-full px-3 sm:px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-800 outline-none focus:border-[#4B2ECF] focus:bg-white disabled:bg-gray-100 transition-all"
                />

                <button type="submit" disabled={!connected || !draft.trim() || isUploading}
                  className="shrink-0 h-10 px-3 sm:px-4 lg:px-5 rounded-xl bg-[#4B2ECF] hover:bg-[#3b22ab] text-white text-sm font-bold disabled:opacity-40 transition-all shadow-sm hover:shadow flex items-center justify-center gap-1.5 cursor-pointer active:scale-95">
                  <span className="hidden sm:inline">{editingMessage ? 'Save' : 'Send'}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m22 2-7 20-4-9-9-4Z"/>
                    <path d="M22 2 11 13"/>
                  </svg>
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Preview modal */}
      {pendingFile && (
        <MediaPreviewModal
          file={pendingFile}
          onCancel={handlePreviewCancel}
          onSend={handlePreviewSend}
          isUploading={isUploading}
        />
      )}

      {/* Context menu */}
      {contextMenu && contextMenu.message && (
        <MessageContextMenu
          message={contextMenu.message}
          isMine={String(contextMenu.message.senderId ?? contextMenu.message.sender ?? contextMenu.message.userId) === String(currentUserId)}
          position={contextMenu.position}
          onClose={closeContextMenu}
          onCopy={handleCopyMessage}
          onEdit={handleEditMessage}
          onReply={handleReplyMessage}
          onDelete={handleDeleteMessage}
          onView={handleViewMessage}
          onDownload={handleDownloadMessage}
        />
      )}

      {/* Delete confirm dialog */}
      {deleteDialog && deleteDialog.id && (
        <DeleteConfirmDialog
          message={deleteDialog}
          isMine={String(deleteDialog.senderId ?? deleteDialog.sender ?? deleteDialog.userId) === String(currentUserId)}
          onCancel={cancelDelete}
          onDeleteForMe={() => confirmDelete(false)}
          onDeleteForEveryone={() => confirmDelete(true)}
        />
      )}
    </DashboardLayout>
  )
}