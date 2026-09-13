import PropTypes from 'prop-types'

export default function Logo({ size = 'md', variant = 'dark', onClick }) {
  // Size mapping
  const sizeClasses = {
    sm: { box: 'w-8 h-8', title: 'text-lg', subtitle: 'text-[8px]' },
    md: { box: 'w-10 h-10', title: 'text-xl', subtitle: 'text-[9px]' },
    lg: { box: 'w-12 h-12', title: 'text-2xl', subtitle: 'text-[10px]' }
  }

  const currentSize = sizeClasses[size] || sizeClasses.md
  const isLight = variant === 'light'

  return (
    <div 
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 ${onClick ? 'cursor-pointer select-none group' : ''}`}
    >
      {/* SVG Container */}
      <div className={`${currentSize.box} relative flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200`}>
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xs">
          <defs>
            <linearGradient id="mainLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={isLight ? '#818CF8' : '#4B2ECF'} />
              <stop offset="100%" stopColor="#FF7A00" />
            </linearGradient>
          </defs>
          
          {/* S-shaped body */}
          <path
            d="M 65,25 C 40,25 30,40 50,55 C 70,70 60,85 35,85"
            fill="none"
            stroke="url(#mainLogoGrad)"
            strokeWidth="16"
            strokeLinecap="round"
          />
          {/* Graduation Cap Top */}
          <path 
            d="M 50,10 L 75,22 L 50,34 L 25,22 Z" 
            fill={isLight ? '#818CF8' : '#4B2ECF'} 
          />
        </svg>
      </div>

      {/* Brand Text */}
      <div className="flex flex-col">
        <span className={`${currentSize.title} font-extrabold tracking-tight leading-none ${isLight ? 'text-white' : 'text-gray-900'}`}>
          Skill <span className="text-[#FF7A00]">Equator</span>
        </span>
        <span className={`${currentSize.subtitle} font-semibold tracking-wider uppercase mt-0.5 ${isLight ? 'text-gray-400' : 'text-gray-500'}`}>
          Seekho • Sikhao • Saath Badho
        </span>
      </div>
    </div>
  )
}

Logo.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  variant: PropTypes.oneOf(['dark', 'light']),
  onClick: PropTypes.func
}