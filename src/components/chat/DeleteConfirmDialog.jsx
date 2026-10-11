import { useEffect, useRef } from 'react'

export default function DeleteConfirmDialog({ message, isMine, onCancel, onDeleteForMe, onDeleteForEveryone }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [onCancel])

  if (!message) return null

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        ref={dialogRef}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-2xl mx-auto mb-3">
            🗑️
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Delete message?</h3>
          <p className="text-sm text-gray-500">
            {isMine
              ? 'You can delete this message for yourself or for everyone.'
              : 'This message will be removed from your chat only.'}
          </p>
        </div>

        <div className="px-3 pb-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={onDeleteForMe}
            className="w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-bold transition-colors cursor-pointer"
          >
            Delete for me
          </button>

          {isMine && (
            <button
              type="button"
              onClick={onDeleteForEveryone}
              className="w-full py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors cursor-pointer"
            >
              Delete for everyone
            </button>
          )}

          <button
            type="button"
            onClick={onCancel}
            className="w-full py-2.5 rounded-xl text-gray-500 hover:bg-gray-50 text-sm font-bold transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}