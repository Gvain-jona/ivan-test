import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';

// Schema for account creation/update
const accountSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  account_type: z.enum(['profit', 'labor', 'expense', 'revenue', 'custom']),
  is_active: z.boolean().optional().default(true),
});

/**
 * GET handler for fetching accounts
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const accountType = searchParams.get('account_type');
    const isActive = searchParams.get('is_active');
    
    // Build query
    let query = supabase.from('accounts').select('*');
    
    // Apply filters if provided
    if (accountType) {
      query = query.eq('account_type', accountType);
    }
    
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }
    
    // Order by name
    query = query.order('name');
    
    // Execute query
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching accounts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch accounts' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ accounts: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * POST handler for creating a new account
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
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
    
    if (profile?.role !== 'admin' && profile?.role !== 'manager') {
      return NextResponse.json(
        { error: 'Only admins and managers can create accounts' },
        { status: 403 }
      );
    }
    
    // Get the account data from the request body
    const body = await request.json();
    
    // Validate the account data
    const validationResult = accountSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid account data', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const accountData = validationResult.data;
    
    // Create the account
    const { data: newAccount, error } = await supabase
      .from('accounts')
      .insert({
        name: accountData.name,
        description: accountData.description || null,
        account_type: accountData.account_type,
        is_active: accountData.is_active,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating account:', error);
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ account: newAccount }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
