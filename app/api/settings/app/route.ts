import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { handleApiError, handleUnexpectedError } from '@/lib/api/error-handler';

/**
 * GET handler for fetching application settings
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return handleApiError('UNAUTHORIZED', 'Authentication required');

    const { data, error } = await supabase
      .from('app_settings')
      .select('settings')
      .single();

    if (error) return handleApiError('DATABASE_ERROR', 'Failed to fetch app settings');

    return NextResponse.json({ settings: data?.settings || {} });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}

/**
 * PUT handler for updating application settings (admin only)
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check if the user is an admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      );
    }
    
    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can update app settings' },
        { status: 403 }
      );
    }
    
    // Get the settings from the request body
    const body = await request.json();
    const { settings } = body;
    
    if (!settings) {
      return NextResponse.json(
        { error: 'Settings are required' },
        { status: 400 }
      );
    }
    
    // Update the application settings
    const { error } = await supabase
      .from('app_settings')
      .update({
        settings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1); // Assuming a single row for app settings
    
    if (error) {
      console.error('Error updating app settings:', error);
      return NextResponse.json(
        { error: 'Failed to update app settings' },
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
