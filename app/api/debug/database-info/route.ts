import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/debug/database-info
 * Returns information about database constraints, triggers, and functions
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get table constraints
    const { data: constraints, error: constraintsError } = await supabase.rpc('get_table_constraints');
    
    if (constraintsError) {
      console.error('Error fetching constraints:', constraintsError);
      return NextResponse.json(
        { error: 'Failed to fetch constraints' },
        { status: 500 }
      );
    }

    // Get triggers
    const { data: triggers, error: triggersError } = await supabase.rpc('get_triggers');
    
    if (triggersError) {
      console.error('Error fetching triggers:', triggersError);
      return NextResponse.json(
        { error: 'Failed to fetch triggers' },
        { status: 500 }
      );
    }

    // Get functions
    const { data: functions, error: functionsError } = await supabase.rpc('get_functions');
    
    if (functionsError) {
      console.error('Error fetching functions:', functionsError);
      return NextResponse.json(
        { error: 'Failed to fetch functions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      constraints,
      triggers,
      functions
    });
  } catch (error) {
    console.error('Error in database-info API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
