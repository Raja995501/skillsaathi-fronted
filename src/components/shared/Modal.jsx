import { useState } from 'react'
import PropTypes from 'prop-types'
import { useToast } from '../../hooks/useToast.jsx'

export default function Modal({ open, type, onClose }) {
  const showToast = useToast()
  const [form, setForm] = useState({ name: '', email: '', location: '', teach: '', learn: '' })

  if (!open) return null

  const title = type === 'teach' ? 'Share your skill' : 'Create your Skill Equator account'

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onClose()
    showToast('Prototype signup submitted!')
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl relative my-auto border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center text-lg font-bold transition cursor-pointer"
          onClick={onClose} 
          aria-label="Close"
        >
          ✕
        </button>

        <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-6 pr-8">
          {title}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Name</label>
            <input 
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#4B2ECF] focus:ring-2 focus:ring-[#4B2ECF]/10 text-xs sm:text-sm outline-none transition"
              placeholder="Your name" 
              value={form.name} 
              onChange={handleChange('name')} 
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
            <input 
              type="email"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#4B2ECF] focus:ring-2 focus:ring-[#4B2ECF]/10 text-xs sm:text-sm outline-none transition"
              placeholder="you@example.com" 
              value={form.email} 
              onChange={handleChange('email')} 
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">City / State</label>
            <input 
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#4B2ECF] focus:ring-2 focus:ring-[#4B2ECF]/10 text-xs sm:text-sm outline-none transition"
              placeholder="e.g. Patna, Bihar" 
              value={form.location} 
              onChange={handleChange('location')} 
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">I can teach</label>
              <input 
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#4B2ECF] focus:ring-2 focus:ring-[#4B2ECF]/10 text-xs sm:text-sm outline-none transition"
                placeholder="e.g. Excel" 
                value={form.teach} 
                onChange={handleChange('teach')} 
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">I want to learn</label>
              <input 
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#4B2ECF] focus:ring-2 focus:ring-[#4B2ECF]/10 text-xs sm:text-sm outline-none transition"
                placeholder="e.g. Spoken English" 
                value={form.learn} 
                onChange={handleChange('learn')} 
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full mt-4 py-3 rounded-xl bg-[#4B2ECF] hover:bg-[#3b23ab] active:scale-[0.98] text-white text-xs sm:text-sm font-bold shadow-md shadow-[#4B2ECF]/20 transition cursor-pointer"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  )
}

Modal.propTypes = {
  open: PropTypes.bool,
  type: PropTypes.string,
  onClose: PropTypes.func
}