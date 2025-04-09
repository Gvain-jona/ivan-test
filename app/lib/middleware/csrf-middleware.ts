/**
 * CSRF Protection Middleware
 * 
 * This middleware validates CSRF tokens for POST, PUT, DELETE, and PATCH requests.
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateCsrfToken } from '../utils/csrf';

/**
 * Validate CSRF token in request
 * 
 * @param request - Next.js request
 * @returns Next.js response if validation fails, otherwise null
 */
export async function csrfMiddleware(request: NextRequest): Promise<NextResponse | null> {
  // Only validate non-GET requests
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    try {
      // Get CSRF token from request
      const body = await request.json();
      const csrfToken = body.csrf_token;
      
      // Get stored CSRF token from cookie
      const storedToken = request.cookies.get('csrf_token')?.value;
      
      // Validate token
      if (!csrfToken || !storedToken || !validateCsrfToken(csrfToken, storedToken)) {
        // Return CSRF validation error
        return new NextResponse(
          JSON.stringify({
            success: false,
            error: {
              message: 'Invalid CSRF token',
              code: 'CSRF_VALIDATION_FAILED'
            }
          }),
          {
            status: 403,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      }
    } catch (error) {
      // If we can't parse the body, it's not a JSON request
      // This is fine for multipart/form-data requests
      console.warn('CSRF validation skipped for non-JSON request');
    }
  }
  
  // Not CSRF validation error
  return null;
}
