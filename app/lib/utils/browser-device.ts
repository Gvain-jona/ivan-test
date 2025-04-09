/**
 * Browser-compatible Device Utility Functions
 *
 * This file contains utility functions for device management that work in browser environments,
 * including device fingerprinting and identification.
 */

/**
 * Generate a simple hash code from a string
 * This is a simple implementation that works in browsers
 *
 * @param str - String to hash
 * @returns A numeric hash code
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Generate a unique device ID based on email and user agent
 * This is a browser-compatible version that doesn't use Node.js crypto
 *
 * @param email - User email
 * @param userAgent - Browser/device user agent string
 * @returns A unique device identifier
 */
export function generateDeviceId(email: string, userAgent: string): string {
  if (!email || !userAgent) {
    console.error('Missing email or userAgent for device ID generation');
    return 'default-device-id';
  }

  // Extract only the essential parts of the user agent to reduce variability
  // This helps ensure the same device gets the same ID across sessions
  const simplifiedUA = simplifyUserAgent(userAgent);

  // Combine email and simplified user agent to create a unique identifier
  const rawId = `${email.toLowerCase()}|${simplifiedUA}`;
  console.log('Raw device ID input:', rawId);

  // Create a hash of the combined string
  const hash = simpleHash(rawId);

  // Convert to hexadecimal string and pad to ensure consistent length
  return hash.toString(16).padStart(8, '0');
}

/**
 * Simplify a user agent string to extract only the essential parts
 * This helps ensure consistent device IDs across sessions
 *
 * @param userAgent - Full user agent string
 * @returns Simplified user agent string with only essential parts
 */
function simplifyUserAgent(userAgent: string): string {
  const ua = userAgent.toLowerCase();

  // Extract device type
  let deviceType = 'unknown';
  if (ua.includes('iphone')) deviceType = 'iphone';
  else if (ua.includes('ipad')) deviceType = 'ipad';
  else if (ua.includes('android') && ua.includes('mobile')) deviceType = 'android-mobile';
  else if (ua.includes('android')) deviceType = 'android-tablet';
  else if (ua.includes('macintosh') || ua.includes('mac os x')) deviceType = 'mac';
  else if (ua.includes('windows')) deviceType = 'windows';
  else if (ua.includes('linux')) deviceType = 'linux';

  // Extract browser type
  let browser = 'unknown';
  if (ua.includes('chrome') && !ua.includes('edg')) browser = 'chrome';
  else if (ua.includes('firefox')) browser = 'firefox';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'safari';
  else if (ua.includes('edg')) browser = 'edge';
  else if (ua.includes('opr') || ua.includes('opera')) browser = 'opera';

  return `${deviceType}-${browser}`;
}

/**
 * Get a friendly name for the device based on user agent
 *
 * @param userAgent - Browser/device user agent string
 * @returns A human-readable device name
 */
export function getDeviceName(userAgent: string): string {
  const ua = userAgent.toLowerCase();

  // Check for mobile devices
  const isMobile = /mobile|android|iphone|ipad|ipod|windows phone/i.test(ua);

  // Device type
  let deviceType = 'Unknown Device';

  if (ua.includes('iphone')) {
    deviceType = 'iPhone';
  } else if (ua.includes('ipad')) {
    deviceType = 'iPad';
  } else if (ua.includes('android') && isMobile) {
    deviceType = 'Android Phone';
  } else if (ua.includes('android')) {
    deviceType = 'Android Tablet';
  } else if (ua.includes('macintosh') || ua.includes('mac os x')) {
    deviceType = 'Mac';
  } else if (ua.includes('windows')) {
    deviceType = 'Windows PC';
  } else if (ua.includes('linux')) {
    deviceType = 'Linux';
  }

  // Browser
  let browser = '';

  if (ua.includes('chrome') && !ua.includes('edg')) {
    browser = 'Chrome';
  } else if (ua.includes('firefox')) {
    browser = 'Firefox';
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    browser = 'Safari';
  } else if (ua.includes('edg')) {
    browser = 'Edge';
  } else if (ua.includes('opr') || ua.includes('opera')) {
    browser = 'Opera';
  }

  // Combine device and browser
  return browser ? `${deviceType} - ${browser}` : deviceType;
}
