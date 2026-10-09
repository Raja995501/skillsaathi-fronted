import { useEffect, useRef, useState } from 'react'

export default function MediaPreviewModal({ file, onCancel, onSend, isUploading }) {
  const [caption, setCaption] = useState('')
  const previewUrlRef = useRef(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    previewUrlRef.current = url
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    }
  }, [file])

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus()
  }, [])

  if (!file || !previewUrl) return null

  const isVideo = file.type.startsWith('video')
  const isImage = file.type.startsWith('image')

  const handleSend = () => {
    onSend(caption.trim())
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-sm">
            {isVideo ? '📹 Video Preview' : '🖼️ Image Preview'}
          </h3>
          <button
            onClick={onCancel}
            disabled={isUploading}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 disabled:opacity-40 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Preview area */}
        <div className="bg-black/5 flex items-center justify-center max-h-[50vh] overflow-hidden">
          {isImage && (
            <img
              src={previewUrl}
              alt="Preview"
              className="max-w-full max-h-[50vh] object-contain"
            />
          )}
          {isVideo && (
            <video
              src={previewUrl}
              controls
              className="max-w-full max-h-[50vh]"
            />
          )}
        </div>

        {/* Caption input */}
        <div className="p-3 sm:p-4">
          <label className="text-xs font-semibold text-gray-500 mb-1.5 block">
            Add a caption (optional)
          </label>
          <textarea
            ref={inputRef}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={2}
            maxLength={500}
            disabled={isUploading}
            className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-800 outline-none focus:border-[#4B2ECF] focus:bg-white disabled:opacity-60 transition-all resize-none"
          />
          <p className="text-[10px] text-gray-400 mt-1 text-right">
            {caption.length}/500
          </p>
        </div>

        {/* Action buttons */}
        <div className="px-3 sm:px-4 pb-3 sm:pb-4 flex items-center gap-2 justify-end border-t border-gray-100 pt-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isUploading}
            className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold transition-colors disabled:opacity-40 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={isUploading}
            className="px-4 py-2 rounded-xl bg-[#4B2ECF] hover:bg-[#3b22ab] text-white text-sm font-bold transition-colors disabled:opacity-40 cursor-pointer flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <span className="inline-block w-3 h-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <span>Send</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m22 2-7 20-4-9-9-4Z"/>
                  <path d="M22 2 11 13"/>
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}