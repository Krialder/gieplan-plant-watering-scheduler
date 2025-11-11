/**
 * use-mobile.ts - Mobile Device Detection Hook
 * 
 * This custom React hook detects whether the user is on a mobile device.
 * Functions:
 * - useIsMobile: Returns boolean indicating if viewport width is below mobile breakpoint
 * - Listens to window resize events for responsive behavior
 * - Uses CSS media query matching for consistent breakpoint detection
 * - Handles server-side rendering with undefined initial state
 * - Updates in real-time when viewport size changes
 */

import { useEffect, useState } from "react"

// Mobile breakpoint in pixels (768px = md breakpoint in Tailwind CSS)
const MOBILE_BREAKPOINT = 768

// Hook to detect if the current viewport is mobile-sized
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    // Create media query list for mobile detection
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    // Handler for media query changes
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    // Listen for viewport size changes
    mql.addEventListener("change", onChange)
    
    // Set initial value
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    
    // Cleanup listener on unmount
    return () => mql.removeEventListener("change", onChange)
  }, [])

  // Return boolean, converting undefined to false for consistent behavior
  return !!isMobile
}
