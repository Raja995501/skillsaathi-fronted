import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toast, setToast] = useState({ message: '', type: 'info', visible: false })
  const timeoutRef = useRef(null)

  // Clear timeout on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const showToast = useCallback((msg, type = 'info') => {
    setToast({ message: msg, type, visible: true })

    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    timeoutRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }))
    }, 2500)
  }, [])

  // Variant styles based on toast type
  const getTypeStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-emerald-800 text-emerald-100 border-emerald-700'
      case 'error':
        return 'bg-rose-800 text-rose-100 border-rose-700'
      case 'warning':
        return 'bg-amber-800 text-amber-100 border-amber-700'
      default:
        return 'bg-gray-900 text-white border-gray-800'
    }
  }

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      
      {/* Toast Notification Container */}
      <div 
        role="status"
        aria-live="polite"
        className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl border shadow-xl text-sm font-medium transition-all duration-300 transform pointer-events-none flex items-center gap-2 ${getTypeStyles()} ${
          toast.visible 
            ? 'opacity-100 translate-y-0 scale-100' 
            : 'opacity-0 translate-y-4 scale-95'
        }`}
      >
        <span>{toast.message}</span>
      </div>
    </ToastContext.Provider>
  )
}

ToastProvider.propTypes = {
  children: PropTypes.node.isRequired
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}