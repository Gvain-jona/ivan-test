import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * GET /api/announcements/active
 * Retrieves the currently active announcement
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get the active announcement using the function
    const { data, error } = await supabase
      .rpc('get_active_announcement');

    if (error) {
      console.error('Error fetching active announcement:', error);
      return NextResponse.json(
        { error: 'Failed to fetch active announcement' },
        { status: 500 }
      );
    }

    // If no active announcement, return null
    if (!data || data.length === 0) {
      return NextResponse.json(null);
    }

    // Add cache control headers for better performance - longer cache for static data
    const headers = new Headers();
    headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400'); // Cache for 1 hour, stale for 1 day

    return NextResponse.json(data[0], { headers });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
