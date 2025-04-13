/**
 * Cookie Utilities
 *
 * This module provides constants and utilities for cookie management
 * throughout the application.
 */

/**
 * Cookie names used throughout the application
 * Centralizing these names helps prevent typos and makes it easier to update
 */
export const COOKIE_NAMES = {
  // Authentication
  AUTH_TOKEN: 'ivan-auth-token',
  REFRESH_TOKEN: 'ivan-refresh-token',

  // Session management
  SESSION: 'ivan-session',

  // Authentication status
  AUTH_STATUS: 'ivan-auth-status',

  // CSRF protection
  CSRF_TOKEN: 'ivan-csrf-token',

  // User preferences
  THEME: 'ivan-theme-preference',
  LANGUAGE: 'ivan-language-preference',

  // Feature flags
  PUBLIC_ACCESS: 'ivan-public-access'
};

/**
 * Get cookie expiration date
 *
 * @param days - Number of days until expiration
 * @returns Date object representing expiration time
 */
export function getCookieExpirationDate(days: number = 7): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

/**
 * Parse cookies from a cookie string
 *
 * @param cookieString - The cookie string to parse
 * @returns Object with cookie name-value pairs
 */
export function parseCookies(cookieString: string): Record<string, string> {
  const cookies: Record<string, string> = {};

  if (!cookieString) {
    return cookies;
  }

  cookieString.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    const name = parts[0].trim();
    const value = parts.length > 1 ? parts[1].trim() : '';
    if (name) {
      cookies[name] = value;
    }
  });

  return cookies;
}

/**
 * Set a cookie with the specified options
 *
 * @param name - Cookie name
 * @param value - Cookie value
 * @param days - Days until expiration
 * @param path - Cookie path
 * @param sameSite - SameSite attribute
 */
export function setCookie(
  name: string,
  value: string,
  days: number = 7,
  path: string = '/',
  sameSite: 'strict' | 'lax' | 'none' = 'lax'
): void {
  if (typeof window === 'undefined') {
    return;
  }

  const expires = getCookieExpirationDate(days).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=${path}; SameSite=${sameSite}`;
}