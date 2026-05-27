import { FiLoader } from 'react-icons/fi'

export function Spinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  }

  return (
    <FiLoader
      className={`animate-spin ${sizeClasses[size]} ${className}`.trim()}
      aria-label="Loading..."
      role="status"
    />
  )
}
