/**
 * Gets a user-friendly device name from a user agent string
 * @param userAgent - Browser user agent string
 * @returns A user-friendly device name
 */
export function getDeviceName(userAgent: string): string {
  // Default device name if we can't determine specifics
  let device = 'Unknown Device';
  
  // Extract OS information
  let os = 'Unknown OS';
  if (userAgent.includes('Windows')) {
    os = 'Windows';
  } else if (userAgent.includes('Mac OS')) {
    os = 'Mac';
  } else if (userAgent.includes('iPhone')) {
    return 'iPhone';
  } else if (userAgent.includes('iPad')) {
    return 'iPad';
  } else if (userAgent.includes('Android')) {
    if (userAgent.includes('Mobile')) {
      return 'Android Phone';
    }
    return 'Android Tablet';
  } else if (userAgent.includes('Linux')) {
    os = 'Linux';
  }
  
  // Extract browser information
  let browser = 'Unknown Browser';
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    browser = 'Chrome';
  } else if (userAgent.includes('Firefox')) {
    browser = 'Firefox';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browser = 'Safari';
  } else if (userAgent.includes('Edg')) {
    browser = 'Edge';
  } else if (userAgent.includes('MSIE') || userAgent.includes('Trident/')) {
    browser = 'Internet Explorer';
  }
  
  // For desktop devices, return combined browser and OS
  if (os !== 'Unknown OS' && browser !== 'Unknown Browser') {
    device = `${browser} on ${os}`;
  } else if (os !== 'Unknown OS') {
    device = `Device on ${os}`;
  } else if (browser !== 'Unknown Browser') {
    device = `${browser} Browser`;
  }
  
  return device;
} 