'use client'

import { useEffect, useState } from 'react'

/**
 * Hook to detect when the page visibility changes (tab switching, app minimizing, etc.)
 * @param onVisibilityChange Optional callback when visibility changes
 * @returns Current document visibility state ('visible' or 'hidden')
 */
export function useVisibilityChange(
  onVisibilityChange?: (isVisible: boolean) => void
) {
  const [isVisible, setIsVisible] = useState<boolean>(
    typeof document !== 'undefined' 
      ? document.visibilityState === 'visible'
      : true
  )

  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = document.visibilityState === 'visible'
      setIsVisible(visible)
      
      if (onVisibilityChange) {
        onVisibilityChange(visible)
      }
    }

    // Add event listener for visibility change
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Clean up
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [onVisibilityChange])

  return isVisible
}
