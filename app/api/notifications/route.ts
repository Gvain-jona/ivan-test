// Next.js API Route Handler for notifications
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/unified-server';
import { cookies } from 'next/headers';

/**
 * GET /api/notifications
 * Retrieves notifications for the current user
 */
export async function GET(request: NextRequest) {
  try {
    // Create Supabase client
    const supabase = await createClient();

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    // For public access, return empty notifications array if no user is found
    if (userError || !user) {
      console.log('No authenticated user found, returning empty notifications for public access');
      
      // Add Cache-Control header for better performance
      const headers = new Headers();
      headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300'); // Cache for 60 seconds, stale for 5 minutes
      
      // Return empty notifications array for public access
      return NextResponse.json(
        { notifications: [] },
        { 
          status: 200,
          headers 
        }
      );
    }

    // Get notifications for the user
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json(
        { error: `Failed to fetch notifications: ${error.message}` },
        { status: 500 }
      );
    }

    // Transform the data to ensure timestamp field exists
    const transformedData = data.map((notification: { 
      id: string; 
      timestamp?: string; 
      created_at: string;
      [key: string]: any;
    }) => ({
      ...notification,
      timestamp: notification.timestamp || notification.created_at
    }));

    // Add Cache-Control header for better performance
    const headers = new Headers();
    headers.set('Cache-Control', 'private, max-age=10, stale-while-revalidate=30'); // Cache for 10 seconds, stale for 30

    // Generate ETag for conditional requests
    const etag = `W/"${Buffer.from(JSON.stringify(transformedData)).toString('base64')}"`;
    headers.set('ETag', etag);

    // Check if the client sent an If-None-Match header
    const ifNoneMatch = request.headers.get('If-None-Match');
    if (ifNoneMatch === etag) {
      // Return 304 Not Modified if the data hasn't changed
      return new NextResponse(null, { status: 304, headers });
    }

    return NextResponse.json({ notifications: transformedData }, { headers });
  } catch (error) {
    console.error('Unexpected error in GET /api/notifications:', error);
    let errorMessage = 'An unexpected error occurred';

    if (error instanceof Error) {
      errorMessage = `Error: ${error.message}`;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications/[id]
 * Updates a notification status
 */
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();
    const { status } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    if (!status || !['read', 'unread', 'archived'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid status is required (read, unread, or archived)' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      // For public access, return a friendly message instead of an error
      return NextResponse.json(
        { 
          success: false,
          message: 'Authentication required to update notifications',
          requiresAuth: true 
        },
        { status: 403 }
      );
    }

    // Update notification status
    const { data, error } = await supabase
      .from('notifications')
      .update({ status })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating notification:', error);
      return NextResponse.json(
        { error: 'Failed to update notification' },
        { status: 500 }
      );
    }

    return NextResponse.json({ notification: data });
  } catch (error) {
    console.error('Unexpected error in PATCH /api/notifications:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications
 * Deletes a notification or all archived notifications
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const deleteAll = searchParams.get('deleteAll') === 'true';

    // Create Supabase client
    const supabase = await createClient();

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      // For public access, return a friendly message instead of an error
      return NextResponse.json(
        { 
          success: false,
          message: 'Authentication required to delete notifications',
          requiresAuth: true 
        },
        { status: 403 }
      );
    }

    let error;

    if (deleteAll) {
      // Delete all archived notifications for the user
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)
        .eq('status', 'archived');

      error = deleteError;
    } else if (id) {
      // Delete a specific notification
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      error = deleteError;
    } else {
      return NextResponse.json(
        { error: 'Either notification ID or deleteAll parameter is required' },
        { status: 400 }
      );
    }

    if (error) {
      console.error('Error deleting notification(s):', error);
      return NextResponse.json(
        { error: 'Failed to delete notification(s)' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: deleteAll ? 'All archived notifications deleted' : 'Notification deleted'
    });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/notifications:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
