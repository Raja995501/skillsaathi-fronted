import PropTypes from 'prop-types'

export default function Alert({ type = 'error', children }) {
  if (!children) return null

  const styles = {
    error: 'bg-red-50 text-red-600 border-red-200',
    success: 'bg-green-50 text-[#22C55E] border-green-200',
    info: 'bg-indigo-50 text-[#4B2ECF] border-indigo-200',
    warning: 'bg-amber-50 text-amber-600 border-amber-200',
  }

  return (
    <div className={`mb-4 px-4 py-3 rounded-xl border text-xs sm:text-sm font-medium transition-all ${styles[type] || styles.error}`}>
      {children}
    </div>
  )
}

Alert.propTypes = {
  type: PropTypes.oneOf(['error', 'success', 'info', 'warning']),
  children: PropTypes.node,
}