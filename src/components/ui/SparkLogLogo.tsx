import React from 'react'

interface SparkLogLogoProps {
  size?: number
  className?: string
}

const SparkLogLogo: React.FC<SparkLogLogoProps> = ({ size = 32, className = '' }) => {
  return (
    <svg
      data-testid="sparklog-logo"
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      fill="currentColor"
    >
      <circle cx="50" cy="20" r="8" opacity="0.8" />
      <circle cx="25" cy="40" r="6" opacity="0.6" />
      <circle cx="75" cy="35" r="5" opacity="0.7" />
      <circle cx="40" cy="60" r="7" opacity="0.9" />
      <circle cx="65" cy="65" r="4" opacity="0.5" />
      <circle cx="30" cy="80" r="6" opacity="0.8" />
      <circle cx="70" cy="85" r="5" opacity="0.6" />
      
      <path 
        d="M50 20 L25 40 L40 60 L30 80" 
        stroke="currentColor" 
        strokeWidth="2" 
        fill="none" 
        opacity="0.4"
      />
      <path 
        d="M50 20 L75 35 L65 65 L70 85" 
        stroke="currentColor" 
        strokeWidth="2" 
        fill="none" 
        opacity="0.4"
      />
    </svg>
  )
}

export default SparkLogLogo