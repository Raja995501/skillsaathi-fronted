import PropTypes from 'prop-types'

export default function FormField({ label, error, className = '', ...inputProps }) {
  return (
    <div className="mb-4 text-left">
      {label && (
        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
          {label}
        </label>
      )}
      <input
        {...inputProps}
        className={`w-full px-4 py-3 rounded-xl border text-xs sm:text-sm outline-none transition-all placeholder:text-gray-400 bg-white
          ${error 
            ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' 
            : 'border-gray-200 focus:border-[#4B2ECF] focus:ring-2 focus:ring-[#4B2ECF]/10'
          } ${className}`}
      />
      {error && <p className="text-red-500 text-[11px] sm:text-xs mt-1 font-medium">{error}</p>}
    </div>
  )
}

FormField.propTypes = {
  label: PropTypes.string,
  error: PropTypes.string,
  className: PropTypes.string
}