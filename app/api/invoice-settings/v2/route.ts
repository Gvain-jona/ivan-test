import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';

/**
 * GET /api/invoice-settings/v2
 * Retrieves invoice settings - no fallbacks, returns actual data or null
 */
export async function GET(request: NextRequest) {
  try {
    // Create Supabase client
    const supabase = await createClient();
    
    // Get the default parameter from the URL
    const { searchParams } = new URL(request.url);
    const getDefault = searchParams.get('default') === 'true';
    const settingId = searchParams.get('id');
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check if the table exists
    const { error: tableCheckError } = await supabase
      .from('invoice_settings')
      .select('id')
      .limit(1);
    
    if (tableCheckError) {
      return NextResponse.json(
        { error: 'Database table not available', details: tableCheckError.message },
        { status: 503 }
      );
    }
    
    let query = supabase
      .from('invoice_settings')
      .select('*');
    
    // If a specific setting ID is requested
    if (settingId) {
      query = query.eq('id', settingId);
    }
    // Otherwise, if default is requested, get all default settings (company-wide)
    else if (getDefault) {
      query = query.eq('is_default', true);
    }
    
    // Execute the query
    const { data: settings, error } = await query;
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch settings', details: error.message },
        { status: 500 }
      );
    }
    
    // Return actual data - could be null/empty
    // For default requests, return the first default if exists, otherwise null
    // For all requests, return the full array
    if (getDefault) {
      return NextResponse.json({ 
        data: settings && settings.length > 0 ? settings[0] : null
      });
    } else {
      return NextResponse.json({ 
        data: settings || []
      });
    }
    
  } catch (error: any) {
    console.error('Error in invoice settings API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/invoice-settings/v2
 * Creates or updates invoice settings - requires valid database
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { settings, name, isDefault, id } = body;
    
    if (!settings) {
      return NextResponse.json(
        { error: 'Settings are required' },
        { status: 400 }
      );
    }
    
    // Create Supabase client
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check if the table exists
    const { error: tableCheckError } = await supabase
      .from('invoice_settings')
      .select('id')
      .limit(1);
    
    if (tableCheckError) {
      return NextResponse.json(
        { error: 'Database table not available', details: tableCheckError.message },
        { status: 503 }
      );
    }
    
    // Allow multiple default settings - don't clear existing defaults
    // Users can have multiple settings marked as default for different use cases
    
    // If an ID is provided, update the existing settings
    if (id && id !== 'default-fallback' && !id.startsWith('mock-id-')) {
      // If only updating the default flag, fetch existing settings first
      if (!settings && isDefault !== undefined) {
        const { data: existingSettings, error: fetchError } = await supabase
          .from('invoice_settings')
          .select('*')
          .eq('id', id)
          .single();
        
        if (fetchError || !existingSettings) {
          return NextResponse.json(
            { error: 'Settings not found' },
            { status: 404 }
          );
        }
        
        // Update only the is_default flag and track who made the change
        const { data: updateData, error: updateError } = await supabase
          .from('invoice_settings')
          .update({
            is_default: isDefault,
            updated_at: new Date().toISOString(),
            user_id: user.id, // Track who made the change
          })
          .eq('id', id)
          .select()
          .single();
        
        if (updateError) {
          return NextResponse.json(
            { error: 'Failed to update default settings', details: updateError.message },
            { status: 500 }
          );
        }
        
        return NextResponse.json({ data: updateData });
      }
      
      // Otherwise update all fields and track who made the change
      const { data: updateData, error: updateError } = await supabase
        .from('invoice_settings')
        .update({
          name: name || 'Default Settings',
          is_default: isDefault === true,
          settings: settings,
          updated_at: new Date().toISOString(),
          user_id: user.id, // Track who made the change
        })
        .eq('id', id)
        .select()
        .single();
      
      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to update settings', details: updateError.message },
          { status: 500 }
        );
      }
      
      return NextResponse.json({ data: updateData });
    } else {
      // Create new settings
      const { data: insertData, error: insertError } = await supabase
        .from('invoice_settings')
        .insert({
          name: name || 'Default Settings',
          is_default: isDefault === true,
          settings: settings,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (insertError) {
        return NextResponse.json(
          { error: 'Failed to create settings', details: insertError.message },
          { status: 500 }
        );
      }
      
      return NextResponse.json({ data: insertData });
    }
  } catch (error: any) {
    console.error('Error in invoice settings API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/invoice-settings/v2
 * Deletes invoice settings - requires valid database
 */
export async function DELETE(request: NextRequest) {
  try {
    // Get the ID from the URL
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }
    
    // Create Supabase client
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check if the table exists
    const { error: tableCheckError } = await supabase
      .from('invoice_settings')
      .select('id')
      .limit(1);
    
    if (tableCheckError) {
      return NextResponse.json(
        { error: 'Database table not available', details: tableCheckError.message },
        { status: 503 }
      );
    }
    
    // Delete the settings (any authenticated user can delete)
    const { error: deleteError } = await supabase
      .from('invoice_settings')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to delete settings', details: deleteError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in invoice settings API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}