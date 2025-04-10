/**
 * CSRF Protection Utilities
 * 
 * This module provides utilities for CSRF token generation and validation
 * to protect against Cross-Site Request Forgery attacks.
 */

import { randomBytes } from 'crypto';

/**
 * Generate a random CSRF token
 * @returns A random string to use as a CSRF token
 */
export function generateCSRFToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Validate a CSRF token
 * @param token The token to validate
 * @param storedToken The stored token to compare against
 * @returns boolean indicating if the token is valid
 */
export function validateCSRFToken(token: string, storedToken: string): boolean {
  if (!token || !storedToken) {
    return false;
  }
  
  // Use timing-safe comparison
  return timingSafeEqual(token, storedToken);
}

/**
 * Timing-safe string comparison to prevent timing attacks
 * @param a First string to compare
 * @param b Second string to compare
 * @returns boolean indicating if the strings are equal
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
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
  const token = generateCSRFToken();
  storeCsrfToken(token, key);
  return token;
}
