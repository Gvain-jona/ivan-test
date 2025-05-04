import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * GET /api/announcements
 * Retrieves all announcements
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Check if we're requesting a specific announcement
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      // Get a specific announcement
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching announcement:', error);
        return NextResponse.json(
          { error: 'Failed to fetch announcement' },
          { status: 500 }
        );
      }

      return NextResponse.json(data);
    } else {
      // Get all announcements
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching announcements:', error);
        return NextResponse.json(
          { error: 'Failed to fetch announcements' },
          { status: 500 }
        );
      }

      return NextResponse.json(data);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/announcements
 * Creates a new announcement
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get the user's profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Check if user is admin
    if (profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can create announcements' },
        { status: 403 }
      );
    }

    // Get the announcement data from the request
    const announcementData = await request.json();

    // Add created_by field
    announcementData.created_by = user.id;

    // Handle 'none' value for link
    if (announcementData.link === 'none') {
      announcementData.link = null;
    }

    // Log the data being sent to the database
    console.log('Creating announcement with data:', announcementData);

    // Insert the announcement
    const { data, error } = await supabase
      .from('announcements')
      .insert(announcementData)
      .select()
      .single();

    if (error) {
      console.error('Error creating announcement:', error);
      return NextResponse.json(
        {
          error: 'Failed to create announcement',
          details: error.message,
          code: error.code
        },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/announcements
 * Updates an existing announcement
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get the user's profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Check if user is admin
    if (profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can update announcements' },
        { status: 403 }
      );
    }

    // Get the announcement data from the request
    const announcementData = await request.json();

    // Check if ID is provided
    if (!announcementData.id) {
      return NextResponse.json(
        { error: 'Announcement ID is required' },
        { status: 400 }
      );
    }

    // Log the data being sent to the database
    console.log('Updating announcement with data:', {
      tag: announcementData.tag,
      message: announcementData.message,
      link: announcementData.link,
      variant: announcementData.variant,
      is_active: announcementData.is_active,
      start_date: announcementData.start_date,
      end_date: announcementData.end_date,
    });

    // Update the announcement
    const { data, error } = await supabase
      .from('announcements')
      .update({
        tag: announcementData.tag,
        message: announcementData.message,
        link: announcementData.link === 'none' ? null : announcementData.link, // Handle 'none' value
        variant: announcementData.variant,
        is_active: announcementData.is_active,
        start_date: announcementData.start_date,
        end_date: announcementData.end_date,
        updated_at: new Date().toISOString()
      })
      .eq('id', announcementData.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating announcement:', error);
      return NextResponse.json(
        {
          error: 'Failed to update announcement',
          details: error.message,
          code: error.code
        },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/announcements
 * Deletes an announcement
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get the user's profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Check if user is admin
    if (profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can delete announcements' },
        { status: 403 }
      );
    }

    // Get the announcement ID from the query parameters
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Announcement ID is required' },
        { status: 400 }
      );
    }

    // Delete the announcement
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting announcement:', error);
      return NextResponse.json(
        { error: 'Failed to delete announcement' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
