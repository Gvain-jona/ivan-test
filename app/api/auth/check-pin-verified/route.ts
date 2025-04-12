import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { COOKIE_NAMES } from '@/app/lib/utils/cookies'

/**
 * API endpoint to check if the PIN is verified
 * This is needed because we can't check httpOnly cookies on the client side
 */
export async function GET(request: NextRequest) {
  try {
    // Get the PIN verified cookie
    let cookieStore;
    let pinVerified = false;
    let pinVerifiedCookie = null;

    try {
      console.log('Checking PIN verification status...')
      cookieStore = cookies()

      if (!cookieStore) {
        console.error('Cookie store is null or undefined')
        return NextResponse.json({
          verified: false,
          error: 'Cookie store is unavailable',
          timestamp: new Date().toISOString()
        }, { status: 500 })
      }

      // Check both the secure cookie and the indicator cookie
      pinVerifiedCookie = cookieStore.get(COOKIE_NAMES.PIN_VERIFIED)
      const pinIndicatorCookie = cookieStore.get(COOKIE_NAMES.PIN_VERIFIED + '_indicator')
      pinVerified = pinVerifiedCookie?.value === 'true' || pinIndicatorCookie?.value === 'true'

      console.log('PIN verification status:', {
        mainCookieExists: !!pinVerifiedCookie,
        mainCookieValue: pinVerifiedCookie?.value,
        indicatorCookieExists: !!pinIndicatorCookie,
        indicatorCookieValue: pinIndicatorCookie?.value,
        verified: pinVerified
      })
    } catch (cookieError) {
      console.error('Error accessing cookies:', cookieError)
      return NextResponse.json({
        verified: false,
        error: `Failed to access cookies: ${cookieError.message || 'Unknown error'}`,
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

    // Prepare the response
    const responseData = {
      verified: pinVerified,
      mainCookie: !!pinVerifiedCookie,
      indicatorCookie: !!cookieStore.get(COOKIE_NAMES.PIN_VERIFIED + '_indicator'),
      timestamp: new Date().toISOString()
    };

    console.log('Returning PIN verification status:', responseData);

    // Return the result
    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Error checking PIN verification:', error)
    return NextResponse.json({
      verified: false,
      error: `Failed to check PIN verification: ${error.message || 'Unknown error'}`,
      timestamp: new Date().toISOString(),
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}
