// Cookie utility functions for client-side use

/**
 * Cookie name constants used throughout the application
 */
export const COOKIE_NAMES = {
  AUTH_TOKEN: 'ivan-auth-token',
  SESSION: 'supabase.auth.token',
  PIN_VERIFIED: 'ivan-pin-verified',
  INACTIVITY_TIMER: 'ivan-inactivity-timer',
  CSRF_TOKEN: 'ivan-csrf-token',
  PUBLIC_ACCESS: 'ivan-public-access'
};

/**
 * Get a cookie value by name
 * @param name The name of the cookie to retrieve
 * @returns The cookie value or null if not found
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith(name + '=')) {
      return cookie.substring(name.length + 1);
    }
  }
  return null;
}

/**
 * Set a cookie with the given name and value
 * @param name The name of the cookie
 * @param value The value to store
 * @param days Number of days until the cookie expires (optional)
 * @param path The cookie path (defaults to '/')
 */
export function setCookie(name: string, value: string, days?: number, path: string = '/'): void {
  if (typeof document === 'undefined') return;
  
  let expires = '';
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = `; expires=${date.toUTCString()}`;
  }
  
  document.cookie = `${name}=${value}${expires}; path=${path}; SameSite=Lax`;
}

/**
 * Delete a cookie by setting its expiration date to the past
 * @param name The name of the cookie to delete
 * @param path The cookie path (defaults to '/')
 */
export function deleteCookie(name: string, path: string = '/'): void {
  if (typeof document === 'undefined') return;
  
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; SameSite=Lax`;
}

/**
 * Check if a cookie exists
 * @param name The name of the cookie to check
 * @returns True if the cookie exists, false otherwise
 */
export function hasCookie(name: string): boolean {
  return getCookie(name) !== null;
}

/**
 * Parse a JWT token and return its payload
 * @param token The JWT token to parse
 * @returns The decoded payload or null if invalid
 */
export function parseJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error parsing JWT:', error);
    return null;
  }
}

/**
 * Get the authentication token from cookies
 * @returns The auth token or null if not found
 */
export function getAuthToken(): string | null {
  return getCookie(COOKIE_NAMES.AUTH_TOKEN);
}

/**
 * Set the authentication token in cookies
 * @param token The auth token to set
 * @param rememberMe Whether to set a long-lived cookie (30 days) or session cookie
 */
export function setAuthToken(token: string, rememberMe: boolean = false): void {
  setCookie(COOKIE_NAMES.AUTH_TOKEN, token, rememberMe ? 30 : undefined);
}

/**
 * Clear the authentication token from cookies
 */
export function clearAuthToken(): void {
  deleteCookie(COOKIE_NAMES.AUTH_TOKEN);
}
