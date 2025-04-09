/**
 * Rate Limiting Middleware
 * 
 * This middleware provides rate limiting for API routes to prevent abuse.
 * It implements both IP-based and account-based rate limiting.
 */

import { NextRequest, NextResponse } from 'next/server';

// In-memory store for rate limiting
// In a production environment, you would use Redis or another distributed cache
const ipRequestStore: Record<string, { count: number, resetTime: number }> = {};
const accountRequestStore: Record<string, { count: number, resetTime: number }> = {};

// Rate limit configuration
const RATE_LIMIT_CONFIG = {
  // General API rate limits
  api: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
  },
  // Authentication-specific rate limits
  auth: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
  },
  // Verification code rate limits
  verification: {
    maxRequests: 5,
    windowMs: 60 * 1000, // 1 minute
  },
  // PIN entry rate limits
  pin: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
  }
};

/**
 * Check if a request exceeds the rate limit
 * 
 * @param key - The key to check (IP address or account ID)
 * @param store - The store to use (IP or account)
 * @param maxRequests - Maximum number of requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns Whether the request exceeds the rate limit
 */
function isRateLimited(
  key: string,
  store: Record<string, { count: number, resetTime: number }>,
  maxRequests: number,
  windowMs: number
): boolean {
  const now = Date.now();
  
  // Initialize or reset if window has passed
  if (!store[key] || now > store[key].resetTime) {
    store[key] = {
      count: 0,
      resetTime: now + windowMs
    };
  }
  
  // Increment request count
  store[key].count++;
  
  // Check if rate limit is exceeded
  return store[key].count > maxRequests;
}

/**
 * Rate limiting middleware for API routes
 * 
 * @param req - Next.js request
 * @param type - Rate limit type (api, auth, verification, pin)
 * @returns Next.js response if rate limited, otherwise null
 */
export function rateLimitMiddleware(
  req: NextRequest,
  type: keyof typeof RATE_LIMIT_CONFIG = 'api'
): NextResponse | null {
  // Get IP address
  const ip = req.ip || 'unknown';
  
  // Get rate limit configuration
  const config = RATE_LIMIT_CONFIG[type];
  
  // Check IP-based rate limit
  if (isRateLimited(ip, ipRequestStore, config.maxRequests, config.windowMs)) {
    // Return rate limit exceeded response
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: {
          message: 'Too many requests, please try again later',
          code: 'RATE_LIMIT_EXCEEDED'
        }
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil((ipRequestStore[ip].resetTime - Date.now()) / 1000).toString()
        }
      }
    );
  }
  
  // Check account-based rate limit if user ID is available
  const userId = req.headers.get('x-user-id');
  
  if (userId && isRateLimited(userId, accountRequestStore, config.maxRequests, config.windowMs)) {
    // Return rate limit exceeded response
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: {
          message: 'Too many requests for this account, please try again later',
          code: 'ACCOUNT_RATE_LIMIT_EXCEEDED'
        }
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil((accountRequestStore[userId].resetTime - Date.now()) / 1000).toString()
        }
      }
    );
  }
  
  // Not rate limited
  return null;
}

/**
 * Apply rate limiting to authentication routes
 * 
 * @param req - Next.js request
 * @returns Next.js response if rate limited, otherwise null
 */
export function authRateLimitMiddleware(req: NextRequest): NextResponse | null {
  return rateLimitMiddleware(req, 'auth');
}

/**
 * Apply rate limiting to verification code routes
 * 
 * @param req - Next.js request
 * @returns Next.js response if rate limited, otherwise null
 */
export function verificationRateLimitMiddleware(req: NextRequest): NextResponse | null {
  return rateLimitMiddleware(req, 'verification');
}

/**
 * Apply rate limiting to PIN entry routes
 * 
 * @param req - Next.js request
 * @returns Next.js response if rate limited, otherwise null
 */
export function pinRateLimitMiddleware(req: NextRequest): NextResponse | null {
  return rateLimitMiddleware(req, 'pin');
}
