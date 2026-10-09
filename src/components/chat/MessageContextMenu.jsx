import { useEffect, useRef } from 'react'

export default function MessageContextMenu({
  message,
  isMine,
  position,
  onClose,
  onCopy,
  onEdit,
  onReply,
  onDelete,
  onView,
  onDownload,
}) {
  const menuRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose()
      }
    }
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [onClose])

  // Adjust position so menu stays in viewport
  useEffect(() => {
    if (!menuRef.current || !position) return
    const menu = menuRef.current
    const rect = menu.getBoundingClientRect()
    const viewportW = window.innerWidth
    const viewportH = window.innerHeight

    let { x, y } = position
    if (x + rect.width > viewportW) x = viewportW - rect.width - 8
    if (y + rect.height > viewportH) y = viewportH - rect.height - 8
    if (x < 8) x = 8
    if (y < 8) y = 8

    menu.style.left = `${x}px`
    menu.style.top = `${y}px`
  }, [position])

  if (!message || !position) return null

  const isText = message.type === 'TEXT'
  const isImage = message.type === 'IMAGE'
  const isVideo = message.type === 'VIDEO'

  const MenuButton = ({ icon, label, onClick, danger }) => (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick?.()
        onClose()
      }}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors text-left cursor-pointer ${
        danger
          ? 'text-red-600 hover:bg-red-50'
          : 'text-gray-700 hover:bg-purple-50 hover:text-[#4B2ECF]'
      }`}
    >
      <span className="w-5 flex items-center justify-center text-base">{icon}</span>
      <span>{label}</span>
    </button>
  )

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 9999,
      }}
      className="bg-white rounded-xl shadow-2xl border border-gray-100 py-1.5 min-w-[180px] max-w-[220px]"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Text message options */}
      {isText && (
        <>
          {message.content && (
            <MenuButton
              icon="📋"
              label="Copy"
              onClick={() => onCopy?.(message.content)}
            />
          )}
          {isMine && (
            <MenuButton
              icon="✏️"
              label="Edit"
              onClick={() => onEdit?.(message)}
            />
          )}
          <MenuButton
            icon="↩️"
            label="Reply"
            onClick={() => onReply?.(message)}
          />
          {isMine && (
            <>
              <div className="h-px bg-gray-100 my-1" />
              <MenuButton
                icon="🗑️"
                label="Delete"
                danger
                onClick={() => onDelete?.(message)}
              />
            </>
          )}
        </>
      )}

      {/* Image message options */}
      {isImage && (
        <>
          <MenuButton
            icon="👁️"
            label="View"
            onClick={() => onView?.(message)}
          />
          <MenuButton
            icon="⬇️"
            label="Download"
            onClick={() => onDownload?.(message)}
          />
          <MenuButton
            icon="↩️"
            label="Reply"
            onClick={() => onReply?.(message)}
          />
          {isMine && (
            <>
              <div className="h-px bg-gray-100 my-1" />
              <MenuButton
                icon="🗑️"
                label="Delete"
                danger
                onClick={() => onDelete?.(message)}
              />
            </>
          )}
        </>
      )}

      {/* Video message options */}
      {isVideo && (
        <>
          <MenuButton
            icon="▶️"
            label="Play"
            onClick={() => onView?.(message)}
          />
          <MenuButton
            icon="⬇️"
            label="Download"
            onClick={() => onDownload?.(message)}
          />
          <MenuButton
            icon="↩️"
            label="Reply"
            onClick={() => onReply?.(message)}
          />
          {isMine && (
            <>
              <div className="h-px bg-gray-100 my-1" />
              <MenuButton
                icon="🗑️"
                label="Delete"
                danger
                onClick={() => onDelete?.(message)}
              />
            </>
          )}
        </>
      )}
    </div>
  )
}