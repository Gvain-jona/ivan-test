'use client'

import {
  setPinVerifiedCookie,
  clearPinVerifiedCookie,
  isPinVerified,
  isSessionExpired,
  COOKIE_NAMES,
  debugCookies
} from '@/app/lib/utils/cookies'
import { logAuthDebug } from '@/app/lib/utils/auth-debug'

/**
 * Service for handling session-related operations
 */
export class SessionService {
  /**
   * Set the PIN verification cookie
   * @param expiryMinutes - Expiry time in minutes (default: 30)
   */
  setPinVerified(expiryMinutes: number = 30): void {
    setPinVerifiedCookie(expiryMinutes)

    // Log in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('SessionService - PIN verified cookie set, expires in', expiryMinutes, 'minutes')
      debugCookies()
    }
  }

  /**
   * Clear the PIN verification cookie
   */
  clearPinVerification(): void {
    if (process.env.NODE_ENV === 'development') {
      console.log('SessionService - Clearing PIN verification')
      debugCookies()
    }
    clearPinVerifiedCookie()
  }

  /**
   * Reset the inactivity timer
   * @param expiryMinutes - Expiry time in minutes (default: 30)
   */
  resetInactivityTimer(expiryMinutes: number = 30): void {
    if (typeof window === 'undefined') return

    if (isPinVerified()) {
      // Reset the cookie with a fresh expiry time
      setPinVerifiedCookie(expiryMinutes)

      // Log in development mode
      if (process.env.NODE_ENV === 'development') {
        console.log('SessionService - Inactivity timer reset, expires in', expiryMinutes, 'minutes')
      }
    }
  }

  /**
   * Check if session is expired due to inactivity
   */
  checkSessionExpiry(): boolean {
    const expired = isSessionExpired()

    // Log in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('SessionService - Session expired check:', expired)
    }

    return expired
  }

  /**
   * Check if PIN is verified
   */
  isPinVerified(): boolean {
    return isPinVerified()
  }

  /**
   * Get session debug information
   */
  getSessionDebugInfo(): Record<string, any> {
    if (typeof window === 'undefined') {
      return { error: 'Not available on server side' }
    }

    const pinVerified = isPinVerified()
    const expired = this.checkSessionExpiry()

    return {
      pinVerified,
      expired,
      now: new Date()
    }
  }

  /**
   * Log session debug information
   */
  logSessionDebug(): void {
    if (process.env.NODE_ENV !== 'development') return

    console.group('Session Debug')
    console.log(this.getSessionDebugInfo())
    logAuthDebug('Auth State')
    console.groupEnd()
  }
}
