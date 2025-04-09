/**
 * Device Utility Functions
 * 
 * This file contains utility functions for device management,
 * including device fingerprinting and identification.
 */

import { createHash } from 'crypto';

/**
 * Generate a unique device ID based on email and user agent
 * 
 * @param email - User email
 * @param userAgent - Browser/device user agent string
 * @returns A unique device identifier
 */
export function generateDeviceId(email: string, userAgent: string): string {
  // Combine email and user agent to create a unique identifier
  const rawId = `${email}|${userAgent}`;
  
  // Hash the combined string to create a consistent ID
  const hash = createHash('sha256')
    .update(rawId)
    .digest('hex');
  
  return hash;
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

/**
 * Get the last used date in a human-readable format
 * 
 * @param lastUsed - ISO date string of when the device was last used
 * @returns A human-readable format of how long ago the device was used
 */
export function getLastUsedText(lastUsed: string): string {
  try {
    const lastDate = new Date(lastUsed);
    const now = new Date();
    const diffInMs = now.getTime() - lastDate.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      
      if (diffInHours === 0) {
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        
        if (diffInMinutes === 0) {
          return 'Just now';
        }
        
        return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
      }
      
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    }
    
    if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    }
    
    if (diffInDays < 30) {
      const diffInWeeks = Math.floor(diffInDays / 7);
      return `${diffInWeeks} week${diffInWeeks !== 1 ? 's' : ''} ago`;
    }
    
    if (diffInDays < 365) {
      const diffInMonths = Math.floor(diffInDays / 30);
      return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''} ago`;
    }
    
    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears} year${diffInYears !== 1 ? 's' : ''} ago`;
  } catch (error) {
    // If there's an error parsing the date, return 'Unknown'
    return 'Unknown';
  }
} 