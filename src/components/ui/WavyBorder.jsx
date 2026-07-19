export function WavyBorder({ fill = '#7C3AED', className = '' }) {
  return (
    <svg viewBox="0 0 1440 80" className={`w-full -mt-px block ${className}`} preserveAspectRatio="none">
      <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill={fill} />
    </svg>
  )
}

export function WavyBorderTop({ fill = '#FFF8F0', className = '' }) {
  return (
    <svg viewBox="0 0 1440 80" className={`w-full block ${className}`} preserveAspectRatio="none">
      <path d="M0,40 C360,0 1080,80 1440,40 L1440,0 L0,0 Z" fill={fill} />
    </svg>
  )
}
