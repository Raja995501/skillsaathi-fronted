import { useEffect, useState } from 'react'

export default function RatingModal({ isOpen, onClose, targetUser, onSubmit }) {
  const [rating, setRating] = useState(5)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Reset form when modal opens or target user changes
  useEffect(() => {
    if (isOpen) {
      setRating(5)
      setHover(0)
      setComment('')
    }
  }, [isOpen, targetUser])

  // Handle ESC key press to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit({
        receiverId: targetUser?.id,
        rating,
        comment: comment.trim(),
      })
      onClose()
      setComment('')
      setRating(5)
    } catch (err) {
      console.error('Failed to submit rating:', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()} // Prevent overlay click from closing when clicking inside
      >
        
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none p-1.5 rounded-full hover:bg-gray-100 transition cursor-pointer"
          aria-label="Close modal"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 bg-amber-50 border border-amber-100 text-amber-500 rounded-full flex items-center justify-center text-xl mx-auto mb-2 shadow-xs">
            ⭐
          </div>
          <h3 className="text-lg font-bold text-gray-900">
            Rate Your Experience
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            How was your skill exchange with <span className="font-semibold text-gray-800">{targetUser?.name || 'User'}</span>?
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Interactive Star Rating */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex justify-center items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  aria-label={`Rate ${star} out of 5 stars`}
                  className="text-3xl focus:outline-none transition-transform hover:scale-125 active:scale-95 cursor-pointer p-1"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                >
                  <span className={(hover || rating) >= star ? 'text-amber-400' : 'text-gray-200'}>
                    ★
                  </span>
                </button>
              ))}
            </div>
            <span className="text-[11px] font-semibold text-gray-400">
              {(hover || rating) === 5 && 'Outstanding! 🌟'}
              {(hover || rating) === 4 && 'Great job! 👍'}
              {(hover || rating) === 3 && 'Average 👌'}
              {(hover || rating) === 2 && 'Below Expectations 😕'}
              {(hover || rating) === 1 && 'Poor Experience 👎'}
            </span>
          </div>

          {/* Comment / Review Box */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Feedback / Review (Optional)
            </label>
            <textarea
              rows="3"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write a brief review about their communication and teaching..."
              className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4B2ECF]/20 focus:border-[#4B2ECF] resize-none text-gray-800 placeholder:text-gray-400"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#4B2ECF] hover:bg-[#3b22ab] transition shadow-md disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}