import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { handleApiError, handleSupabaseError, handleUnexpectedError } from '@/lib/api/error-handler';

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

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return handleApiError('UNAUTHORIZED', 'Authentication required');

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) return handleApiError('DATABASE_ERROR', 'Failed to fetch user profile');
    if (profile?.role !== 'admin') return handleApiError('FORBIDDEN', 'Only admins can update app settings');

    const body = await request.json();
    if (!body?.settings) return handleApiError('VALIDATION_ERROR', 'settings field is required');

    const { error } = await supabase
      .from('app_settings')
      .update({ settings: body.settings, updated_at: new Date().toISOString() })
      .eq('id', 1);

    if (error) return handleSupabaseError(error);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}
