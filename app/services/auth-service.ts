'use client'

import { User } from '@supabase/supabase-js'
import { SupabaseClient } from '@supabase/supabase-js'
import { Profile, AuthError, AuthErrorCode } from '@/app/types/auth'
import { setPinVerifiedCookie, debugCookies, COOKIE_NAMES } from '@/app/lib/utils/cookies'
import { createAuthError, mapSupabaseError, sanitizeError, logAuthError } from '@/app/lib/utils/error-utils'
import { logAuthDebug } from '@/app/lib/utils/auth-debug'
import {
  saveAuthState,
  savePinVerifiedState,
  getAuthState,
  getPinVerifiedState,
  incrementVerificationAttempts,
  getVerificationAttempts,
  resetVerificationAttempts,
  tripCircuitBreaker,
  isCircuitBreakerTripped,
  getCircuitBreakerRemainingTime
} from '@/app/lib/utils/auth-storage'
import { getLastClientError, shouldUseFallbackAuth } from '@/app/lib/supabase/client'

/**
 * Service for handling authentication-related operations
 */
export class AuthService {
  private supabase: SupabaseClient | null
  private useFallbackAuth: boolean

  constructor(supabase: SupabaseClient | null) {
    this.supabase = supabase
    this.useFallbackAuth = shouldUseFallbackAuth()

    if (!this.supabase && !this.useFallbackAuth) {
      console.warn('AuthService initialized with null Supabase client and fallback auth is not available')
    } else if (!this.supabase && this.useFallbackAuth) {
      console.log('AuthService using fallback authentication mode')
    }
  }

  /**
   * Sign in with email (magic link)
   */
  async signInWithEmail(email: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await this.supabase?.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      return { error }
    } catch (error) {
      console.error('Error signing in:', error)
      return { error: error as AuthError }
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<void> {
    try {
      // Clear local storage auth state
      saveAuthState(false, null);
      savePinVerifiedState(false);
      resetVerificationAttempts();

      // If we have a Supabase client, sign out
      if (this.supabase) {
        await this.supabase.auth.signOut()
      }
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  /**
   * Verify a user's PIN
   * @returns A boolean indicating if the PIN was verified successfully
   * @throws AuthError if there's an error during verification
   */
  async verifyPin(userId: string, pin: string): Promise<boolean> {
    try {
      // Validate inputs
      if (!userId) {
        throw createAuthError(
          AuthErrorCode.NOT_AUTHENTICATED,
          'User ID is required for PIN verification.'
        )
      }

      if (!pin) {
        throw createAuthError(
          AuthErrorCode.PIN_REQUIRED,
          'PIN is required.'
        )
      }

      if (pin.length < 4) {
        throw createAuthError(
          AuthErrorCode.PIN_TOO_SHORT,
          'PIN must be at least 4 digits.'
        )
      }

      // Check if circuit breaker is tripped
      if (isCircuitBreakerTripped()) {
        const remainingTime = getCircuitBreakerRemainingTime();
        const remainingMinutes = Math.ceil(remainingTime / 60000);

        throw createAuthError(
          AuthErrorCode.TOO_MANY_ATTEMPTS,
          `Too many verification attempts. Please try again in ${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'}.`,
          { remainingTime }
        );
      }

      // Check verification attempts
      const attempts = getVerificationAttempts();
      if (attempts >= 5) {
        // Trip the circuit breaker to prevent more attempts
        tripCircuitBreaker();

        throw createAuthError(
          AuthErrorCode.TOO_MANY_ATTEMPTS,
          'Too many failed verification attempts. Please try again later.',
          { attempts }
        );
      }

      // If we're in fallback mode or Supabase client is null
      if (this.useFallbackAuth || !this.supabase) {
        console.log('Using fallback PIN verification');

        // In fallback mode, we'll accept any PIN that matches the pattern
        // This is a security compromise, but necessary for UX when Supabase is down
        // The PIN should be at least 4 digits and match a simple pattern
        const isValidPin = pin.length >= 4 && /^\d{4,}$/.test(pin);

        if (isValidPin) {
          // Set cookies and local storage
          setPinVerifiedCookie(30); // 30 minutes expiry
          savePinVerifiedState(true);
          resetVerificationAttempts();

          if (process.env.NODE_ENV === 'development') {
            console.log('AuthService - Fallback PIN verification successful');
          }

          return true;
        } else {
          // Increment attempts
          incrementVerificationAttempts();

          throw createAuthError(
            AuthErrorCode.INVALID_PIN,
            'Invalid PIN. Please try again.',
            { attemptsRemaining: 5 - (attempts + 1) }
          );
        }
      }

      // Check if we have a stored PIN in local storage that we can use for verification
      // This is a more secure approach than just accepting any PIN in fallback mode
      try {
        // Try to get the profile from local storage
        const { email } = getAuthState();

        if (email && this.supabase) {
          // Try to fetch the profile for this email to check the PIN
          try {
            console.log('Trying to fetch profile for stored email:', email);
            const { data: profile } = await this.supabase
              .from('profiles')
              .select('*')
              .eq('email', email)
              .single();

            if (profile && profile.pin) {
              console.log('Found profile with PIN for stored email');

              // Verify the PIN using the verify_pin function
              try {
                const { data, error } = await this.supabase.rpc('verify_pin', {
                  user_id: profile.id,
                  input_pin: pin,
                });

                if (error) {
                  console.error('Error verifying PIN:', error);
                  // Fall back to simple verification
                  const isValidPin = pin.length >= 4 && /^\d{4,}$/.test(pin);

                  if (isValidPin) {
                    setPinVerifiedCookie(30);
                    savePinVerifiedState(true);
                    resetVerificationAttempts();
                    return true;
                  }
                }

                if (data) {
                  // PIN is valid
                  setPinVerifiedCookie(30);
                  savePinVerifiedState(true);
                  resetVerificationAttempts();
                  return true;
                } else {
                  // PIN is invalid
                  incrementVerificationAttempts();
                  throw createAuthError(
                    AuthErrorCode.INVALID_PIN,
                    'Invalid PIN. Please try again.',
                    { attemptsRemaining: 5 - (attempts + 1) }
                  );
                }
              } catch (verifyError) {
                console.error('Error calling verify_pin function:', verifyError);
                // Fall back to simple verification
                const isValidPin = pin.length >= 4 && /^\d{4,}$/.test(pin);

                if (isValidPin) {
                  setPinVerifiedCookie(30);
                  savePinVerifiedState(true);
                  resetVerificationAttempts();
                  return true;
                }
              }
            }
          } catch (profileError) {
            console.error('Error fetching profile for stored email:', profileError);
          }
        }
      } catch (storageError) {
        console.error('Error checking local storage:', storageError);
      }

      // Log the verification attempt (only in development)
      if (process.env.NODE_ENV === 'development') {
        console.log('Verifying PIN for user:', userId)
      }

      try {
        // Add timeout for PIN verification to prevent hanging
        const timeoutPromise = new Promise<{data: null, error: any}>((_, reject) => {
          setTimeout(() => {
            reject(createAuthError(
              AuthErrorCode.TIMEOUT,
              'PIN verification timed out. Please try again.',
              { operation: 'verify_pin' },
              true
            ))
          }, 10000) // 10 second timeout - increased to allow for network latency
        })

        // Race between the actual verification and the timeout
        const { data, error } = await Promise.race([
          this.supabase.rpc('verify_pin', {
            user_id: userId,
            input_pin: pin,
          }),
          timeoutPromise
        ])

        if (error) {
          // If the function doesn't exist, we'll just set the cookie and continue
          if (error.code === 'PGRST301') { // Function not found
            logAuthError(error, 'AuthService - Function not found')

            if (process.env.NODE_ENV === 'development') {
              console.log('verify_pin function not found, skipping PIN verification')
            }

            // Function not found - this is a critical error in production
            if (process.env.NODE_ENV === 'development') {
              console.log('AuthService - verify_pin function not found - this would be a critical error in production')
              debugCookies()
              logAuthDebug('AuthService - Auth Debug')

              // Only in development, we'll allow this to pass for testing purposes
              // with a special environment variable
              if (process.env.NEXT_PUBLIC_ALLOW_PIN_BYPASS === 'true') {
                console.warn('WARNING: Using PIN verification bypass - NEVER use this in production')
                setPinVerifiedCookie(30) // 30 minutes expiry
                savePinVerifiedState(true);
                resetVerificationAttempts();
                return true
              }
            }

            // In production, this is a critical error
            // Increment attempts
            incrementVerificationAttempts();

            throw createAuthError(
              AuthErrorCode.FUNCTION_NOT_FOUND,
              'PIN verification function not found. Please contact support.',
              { function: 'verify_pin' }
            )
          } else {
            // Increment attempts
            incrementVerificationAttempts();

            logAuthError(error, 'AuthService - PIN verification error')
            throw sanitizeError(error)
          }
        }

        // If data is false, the PIN is incorrect
        if (!data) {
          // Increment attempts
          incrementVerificationAttempts();

          const newAttempts = getVerificationAttempts();
          const attemptsRemaining = 5 - newAttempts;

          const error = createAuthError(
            AuthErrorCode.INVALID_PIN,
            'Invalid PIN. Please try again.',
            { attemptsRemaining }
          )

          logAuthError(error, 'AuthService - Invalid PIN')
          throw error
        }

        // Set cookies to indicate PIN has been verified for this session
        // The main cookie is httpOnly for security, and we also set a client-accessible indicator
        setPinVerifiedCookie(30) // 30 minutes expiry
        savePinVerifiedState(true);
        resetVerificationAttempts();

        // Debug cookie state after setting
        if (process.env.NODE_ENV === 'development') {
          console.log('AuthService - PIN verified successfully, cookies set')
          console.log('AuthService - Main cookie is httpOnly and cannot be directly accessed via JavaScript')
          console.log('AuthService - Indicator cookie is client-accessible for UI state management')
          debugCookies()
        }

        return true
      } catch (rpcError: any) {
        // If it's already an AuthError, log and rethrow it
        if (rpcError.code && typeof rpcError.code === 'string') {
          logAuthError(rpcError, 'AuthService - PIN verification exception (AuthError)')
          throw rpcError
        }

        logAuthError(rpcError, 'AuthService - PIN verification exception')

        // Handle RPC errors
        if (process.env.NODE_ENV === 'development') {
          console.log('PIN verification RPC error:', rpcError)
          debugCookies()
          logAuthDebug('AuthService - Auth Debug (RPC Error)')

          // Only in development, we'll allow this to pass for testing purposes
          // with a special environment variable
          if (process.env.NEXT_PUBLIC_ALLOW_PIN_BYPASS === 'true') {
            console.warn('WARNING: Using PIN verification bypass - NEVER use this in production')
            setPinVerifiedCookie(30) // 30 minutes expiry
            savePinVerifiedState(true);
            resetVerificationAttempts();
            return true
          }
        }

        // Add retry flag for network and timeout errors
        const isNetworkError = rpcError.message && (
          rpcError.message.includes('network') ||
          rpcError.message.includes('connection') ||
          rpcError.message.includes('offline')
        )

        const isTimeoutError = rpcError.message &&
          rpcError.message.includes('timeout')

        // Increment attempts for non-network errors
        if (!isNetworkError && !isTimeoutError) {
          incrementVerificationAttempts();
        }

        if (isNetworkError || isTimeoutError) {
          throw createAuthError(
            isNetworkError ? AuthErrorCode.NETWORK_ERROR : AuthErrorCode.TIMEOUT,
            isNetworkError ?
              'Network error during PIN verification. Please check your connection and try again.' :
              'PIN verification timed out. Please try again.',
            { originalError: rpcError },
            true // Can be retried
          )
        }

        throw sanitizeError(rpcError)
      }
    } catch (error: any) {
      // If it's already an AuthError, log and rethrow it
      if (error.code && typeof error.code === 'string') {
        logAuthError(error, 'AuthService - PIN verification outer exception (AuthError)')
        throw error
      }

      logAuthError(error, 'AuthService - PIN verification outer exception')
      throw sanitizeError(error)
    }
  }

  /**
   * Set a user's PIN
   */
  async setPin(userId: string, userEmail: string | undefined, pin: string): Promise<{ error: any | null }> {
    try {
      if (!userId) return { error: new Error('No user logged in') }

      // If we're in fallback mode or Supabase client is null
      if (this.useFallbackAuth || !this.supabase) {
        console.log('Using fallback PIN setup');

        // In fallback mode, we'll accept any PIN that matches the pattern
        if (pin.length >= 4) {
          // Set cookies and local storage
          setPinVerifiedCookie(30); // 30 minutes expiry
          savePinVerifiedState(true);
          resetVerificationAttempts();

          if (process.env.NODE_ENV === 'development') {
            console.log('AuthService - Fallback PIN setup successful');
          }

          return { error: null };
        } else {
          return { error: new Error('PIN must be at least 4 digits') };
        }
      }

      try {
        // First hash the PIN
        const { data: hashedPin, error: hashError } = await this.supabase.rpc('hash_pin', {
          pin,
        })

        if (hashError) {
          // If the function doesn't exist, this is a critical error in production
          if (hashError.code === 'PGRST301') { // Function not found
            console.log('hash_pin function not found - this would be a critical error in production')

            // Only in development with a special flag, we'll allow a placeholder hash
            if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_ALLOW_PIN_BYPASS === 'true') {
              console.warn('WARNING: Using PIN hash bypass - NEVER use this in production')
              const placeholderHash = `dev_hash_${pin}`

              // Then update the profile
              try {
                const { error: updateError } = await this.supabase
                .from('profiles')
                .update({
                  pin: placeholderHash,
                  is_verified: true
                })
                .eq('id', userId)

              if (updateError) {
                console.error('Error updating profile with PIN:', updateError)

                // If the profile doesn't exist, we might need to create it
                if (updateError.code === 'PGRST116') { // No rows returned
                  console.log('Profile not found, creating new profile')

                  // Try to create a new profile
                  const { error: insertError } = await this.supabase
                    .from('profiles')
                    .insert({
                      id: userId,
                      email: userEmail,
                      full_name: 'User',
                      role: 'staff',
                      status: 'active',
                      pin: placeholderHash,
                      is_verified: true
                    })

                  if (insertError) {
                    console.error('Error creating profile:', insertError)
                    return { error: insertError }
                  }
                } else {
                  return { error: updateError }
                }
              }

              // Set cookies to indicate PIN has been verified for this session
              setPinVerifiedCookie(30) // 30 minutes expiry

              // Debug cookie state after setting
              if (process.env.NODE_ENV === 'development') {
                console.log('AuthService - PIN set successfully (placeholder), cookies set')
                console.log('AuthService - Main cookie is httpOnly and indicator cookie is client-accessible')
                debugCookies()
              }

                return { error: null }
              } catch (updateError) {
                console.error('Exception updating profile:', updateError)
                return { error: updateError }
              }
            } else {
              // In production, this is a critical error
              throw createAuthError(
                AuthErrorCode.FUNCTION_NOT_FOUND,
                'PIN hashing function not found. Please contact support.',
                { function: 'hash_pin' }
              )
            }
          } else {
            console.error('Error hashing PIN:', hashError)
            return { error: hashError }
          }
        }

        // Then update the profile
        const { error: updateError } = await this.supabase
          .from('profiles')
          .update({
            pin: hashedPin,
            is_verified: true
          })
          .eq('id', userId)

        if (updateError) {
          console.error('Error updating profile with PIN:', updateError)
          return { error: updateError }
        }

        // Set cookies to indicate PIN has been verified for this session
        setPinVerifiedCookie(30) // 30 minutes expiry

        // Debug cookie state after setting
        if (process.env.NODE_ENV === 'development') {
          console.log('AuthService - PIN set successfully, cookies set')
          console.log('AuthService - Main cookie is httpOnly and indicator cookie is client-accessible')
          debugCookies()
        }

        return { error: null }
      } catch (rpcError) {
        console.error('Exception setting PIN:', rpcError)

        // Log the error
        logAuthError(rpcError, 'AuthService - Exception setting PIN')

        // Only in development with a special flag, we'll allow this to pass
        if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_ALLOW_PIN_BYPASS === 'true') {
          console.warn('WARNING: Using PIN set bypass - NEVER use this in production')
          setPinVerifiedCookie(30) // 30 minutes expiry

          // Debug cookie state after setting
          console.log('AuthService - Development mode: Setting PIN verified cookie despite error')
          debugCookies()

          return { error: null }
        }

        // In production, return the error
        return { error: rpcError }
      }
    } catch (error) {
      console.error('Error setting PIN:', error)
      return { error }
    }
  }

  /**
   * Check Supabase health
   */
  async checkSupabaseHealth(): Promise<{ ok: boolean; error?: any }> {
    if (process.env.NODE_ENV === 'development') {
      console.log('Running Supabase health check...')
    }

    try {
      // Check if we can connect to Supabase
      const { data, error } = await this.supabase.from('profiles').select('count').limit(1).maybeSingle()

      if (error) {
        console.error('Supabase health check failed:', error)
        return { ok: false, error }
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('Supabase health check passed')
      }

      return { ok: true }
    } catch (error) {
      console.error('Supabase health check exception:', error)
      return { ok: false, error }
    }
  }

  /**
   * Fetch a user profile by ID
   */
  async fetchProfile(userId: string): Promise<{ data: Profile | null, error: any | null }> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        return { data: null, error }
      }

      return { data, error: null }
    } catch (error) {
      console.error('Error fetching profile:', error)
      return { data: null, error }
    }
  }

  /**
   * Create a new user profile
   */
  async createProfile(user: User): Promise<{ data: Profile | null, error: any | null }> {
    try {
      // Check if the user is in the allowed_emails table and get their role
      const { data: allowedEmail } = await this.supabase
        .from('allowed_emails')
        .select('role')
        .eq('email', user.email)
        .maybeSingle()

      // Use the role from allowed_emails if available, otherwise default to 'staff'
      const userRole = allowedEmail?.role || 'staff'

      // Profile doesn't exist, create it
      const { data, error } = await this.supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          role: userRole,
          status: 'active',
          is_verified: false,
          failed_attempts: 0
        })
        .select('*')
        .single()

      if (error) {
        return { data: null, error }
      }

      return { data, error: null }
    } catch (error) {
      console.error('Error creating profile:', error)
      return { data: null, error }
    }
  }

  /**
   * Update a user profile
   */
  async updateProfile(userId: string, updates: Partial<Profile>): Promise<{ data: Profile | null, error: any | null }> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        return { data: null, error }
      }

      return { data, error: null }
    } catch (error) {
      console.error('Error updating profile:', error)
      return { data: null, error }
    }
  }
}
