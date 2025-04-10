/**
 * CSRF Protection Utilities
 * 
 * This file provides utilities for CSRF protection in forms.
 */

import crypto from 'crypto';

/**
 * Generate a CSRF token
 * 
 * @returns CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate a CSRF token
 * 
 * @param token - The token to validate
 * @param storedToken - The stored token to compare against
 * @returns Whether the token is valid
 */
export function validateCsrfToken(token: string, storedToken: string): boolean {
  if (!token || !storedToken) {
    return false;
  }
  
  // Use constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(storedToken)
  );
}

/**
 * Create a hidden input field for CSRF token
 * 
 * @param token - The CSRF token
 * @returns JSX element for the hidden input
 */
export function CsrfTokenInput({ token }: { token: string }) {
  return (
    <input type="hidden" name="csrf_token" value={token} />
  );
}

/**
 * Store a CSRF token in session storage
 * 
 * @param token - The CSRF token
 * @param key - The key to store the token under
 */
export function storeCsrfToken(token: string, key = 'csrf_token'): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(key, token);
  }
}

/**
 * Retrieve a CSRF token from session storage
 * 
 * @param key - The key the token is stored under
 * @returns The stored CSRF token
 */
export function retrieveCsrfToken(key = 'csrf_token'): string | null {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem(key);
  }
  
  return null;
}

/**
 * Generate and store a CSRF token
 * 
 * @param key - The key to store the token under
 * @returns The generated CSRF token
 */
export function generateAndStoreToken(key = 'csrf_token'): string {
  const token = generateCsrfToken();
  storeCsrfToken(token, key);
  return token;
}
