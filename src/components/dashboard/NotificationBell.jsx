import { useEffect, useRef, useState } from 'react'
import { notificationApi } from '../../api/notificationApi'
import { useAuth } from '../../context/AuthContext.jsx'
import { useWebSocket } from '../../context/WebSocketContext.jsx'

export default function NotificationBell() {
  const { user } = useAuth()
  const { subscribe } = useWebSocket()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const dropdownRef = useRef(null)

  const loadNotifications = async () => {
    try {
      const [listRes, countRes] = await Promise.all([
        notificationApi.getNotifications(undefined, 0, 10),
        notificationApi.unreadCount(),
      ])
      setNotifications(listRes.data.data.content || [])
      setUnreadCount(countRes.data.data || 0)
    } catch (err) {
      console.error('Failed to load notifications:', err)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  // Live push: backend publishes new notifications to /topic/user.{id}.notifications
  useEffect(() => {
    if (!user?.id) return
    const unsubscribe = subscribe(`/topic/user.${user.id}.notifications`, (notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 10))
      setUnreadCount((c) => c + 1)
    })
    return unsubscribe
  }, [user?.id, subscribe])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      try {
        await notificationApi.markAsRead(notification.id)
        setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)))
        setUnreadCount((c) => Math.max(0, c - 1))
      } catch (err) {
        console.error('Failed to mark notification as read:', err)
      }
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full hover:bg-gray-100/80 active:bg-gray-200/80 flex items-center justify-center text-lg transition cursor-pointer"
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute -right-12 sm:right-0 mt-2 w-[calc(100vw-2rem)] max-w-xs sm:w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
            <span className="font-semibold text-sm text-gray-900">Notifications</span>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead} 
                className="text-xs text-[#4B2ECF] hover:underline font-semibold cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No notifications yet</p>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition ${
                  !n.read ? 'bg-[#f7faff]' : 'bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-xs sm:text-sm font-semibold ${!n.read ? 'text-[#4B2ECF]' : 'text-gray-800'}`}>
                    {n.title}
                  </p>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-[#FF7A00] shrink-0 mt-1" />}
                </div>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{n.body}</p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}