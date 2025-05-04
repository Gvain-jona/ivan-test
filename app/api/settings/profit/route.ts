import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { ProfitSettings } from '@/app/context/settings/types';

/**
 * GET handler for fetching profit calculation settings
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Use the get_profit_settings function to get the profit settings
    const { data, error } = await supabase
      .rpc('get_profit_settings');

    if (error) {
      console.error('Error fetching profit settings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch profit settings' },
        { status: 500 }
      );
    }

    // If no data is returned, use defaults
    const profitSettings = data || {
      enabled: false,
      calculationBasis: 'unit_price',
      defaultProfitPercentage: 30,
      includeLabor: false,
      laborPercentage: 10,
      overrides: [],
    };

    return NextResponse.json({ settings: profitSettings });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * PUT handler for updating profit calculation settings (admin only)
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

    // Check if the user is an admin or manager
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

    // Get the profit settings from the request body
    const body = await request.json();
    const { settings } = body as { settings: ProfitSettings };

    if (!settings) {
      return NextResponse.json(
        { error: 'Profit settings are required' },
        { status: 400 }
      );
    }

    // Check permissions based on role
    if (profile?.role === 'admin') {
      // Admins can update all profit settings

      // Update the global profit settings
      const { error: updateError } = await supabase
        .rpc('update_profit_settings', {
          p_enabled: settings.enabled,
          p_calculation_basis: settings.calculationBasis,
          p_default_profit_percentage: settings.defaultProfitPercentage,
          p_include_labor: settings.includeLabor,
          p_labor_percentage: settings.laborPercentage
        });

      if (updateError) {
        console.error('Error updating profit settings:', updateError);
        return NextResponse.json(
          { error: 'Failed to update profit settings' },
          { status: 500 }
        );
      }

      // Handle overrides - first get current overrides to compare
      const { data: currentSettings } = await supabase.rpc('get_profit_settings');
      const currentOverrides = currentSettings?.overrides || [];

      // Batch process overrides
      const processingPromises = [];

      // Prepare upsert operations
      for (const override of settings.overrides) {
        processingPromises.push(
          supabase.rpc('upsert_profit_override', {
            p_id: override.id || null,
            p_type: override.type,
            p_name: override.name,
            p_profit_percentage: override.profitPercentage,
            p_labor_percentage: override.laborPercentage
          })
        );
      }

      // Identify overrides to delete
      const currentOverrideIds = currentOverrides.map((o: any) => o.id);
      const newOverrideIds = settings.overrides.map(o => o.id).filter(Boolean);

      const overridesToDelete = currentOverrideIds.filter(
        (id: string) => !newOverrideIds.includes(id)
      );

      // Prepare delete operations
      for (const id of overridesToDelete) {
        processingPromises.push(
          supabase.rpc('delete_profit_override', { p_id: id })
        );
      }

      // Execute all operations in parallel
      const results = await Promise.all(processingPromises);

      // Check for errors
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        console.error('Errors processing overrides:', errors);
        return NextResponse.json(
          { error: 'Failed to process some overrides' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    } else if (profile?.role === 'manager') {
      // Managers can only update overrides, not global settings

      // Get current settings to ensure we only update overrides
      const { data: currentSettings } = await supabase.rpc('get_profit_settings');

      if (!currentSettings) {
        return NextResponse.json(
          { error: 'Failed to fetch current profit settings' },
          { status: 500 }
        );
      }

      // Batch process overrides
      const processingPromises = [];

      // Prepare upsert operations
      for (const override of settings.overrides) {
        processingPromises.push(
          supabase.rpc('upsert_profit_override', {
            p_id: override.id || null,
            p_type: override.type,
            p_name: override.name,
            p_profit_percentage: override.profitPercentage,
            p_labor_percentage: override.laborPercentage
          })
        );
      }

      // Identify overrides to delete
      const currentOverrideIds = currentSettings.overrides.map((o: any) => o.id);
      const newOverrideIds = settings.overrides.map(o => o.id).filter(Boolean);

      const overridesToDelete = currentOverrideIds.filter(
        (id: string) => !newOverrideIds.includes(id)
      );

      // Prepare delete operations
      for (const id of overridesToDelete) {
        processingPromises.push(
          supabase.rpc('delete_profit_override', { p_id: id })
        );
      }

      // Execute all operations in parallel
      const results = await Promise.all(processingPromises);

      // Check for errors
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        console.error('Errors processing overrides:', errors);
        return NextResponse.json(
          { error: 'Failed to process some overrides' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    } else {
      // Other roles cannot update profit settings
      return NextResponse.json(
        { error: 'Only admins and managers can update profit settings' },
        { status: 403 }
      );
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
