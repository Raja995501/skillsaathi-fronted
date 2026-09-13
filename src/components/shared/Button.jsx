import PropTypes from 'prop-types'

export default function Button({ variant = 'primary', loading, children, className = '', ...props }) {
  const base = 'w-full py-3 sm:py-3.5 px-5 rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2'
  
  const variants = {
    primary: 'bg-[#4B2ECF] text-white hover:bg-[#3b23ab] shadow-md shadow-[#4B2ECF]/20',
    secondary: 'bg-indigo-50 text-[#4B2ECF] hover:bg-indigo-100/80 border border-indigo-100',
    outline: 'border border-gray-200 text-gray-700 hover:bg-gray-50',
    orange: 'bg-[#FF7A00] text-white hover:bg-[#e66e00] shadow-md shadow-[#FF7A00]/20'
  }

  return (
    <button {...props} disabled={loading || props.disabled} className={`${base} ${variants[variant] || variants.primary} ${className}`}>
      {loading ? (
        <>
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>Please wait...</span>
        </>
      ) : children}
    </button>
  )
}

Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline', 'orange']),
  loading: PropTypes.bool,
  children: PropTypes.node,
  className: PropTypes.string,
  disabled: PropTypes.bool
}