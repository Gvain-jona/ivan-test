import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';

// Schema for account update
const accountUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  account_type: z.enum(['profit', 'labor', 'expense', 'revenue', 'custom']).optional(),
  is_active: z.boolean().optional(),
});

/**
 * GET handler for fetching a specific account
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    // Get the account
    const { data: account, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', params.id)
      .single();
    
    if (error) {
      console.error('Error fetching account:', error);
      return NextResponse.json(
        { error: 'Failed to fetch account' },
        { status: 500 }
      );
    }
    
    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ account });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * PUT handler for updating a specific account
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { error: 'Only admins and managers can update accounts' },
        { status: 403 }
      );
    }
    
    // Get the account data from the request body
    const body = await request.json();
    
    // Validate the account data
    const validationResult = accountUpdateSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid account data', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const accountData = validationResult.data;
    
    // Update the account
    const { data: updatedAccount, error } = await supabase
      .from('accounts')
      .update({
        ...accountData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating account:', error);
      return NextResponse.json(
        { error: 'Failed to update account' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ account: updatedAccount });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for deleting a specific account
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { error: 'Only admins can delete accounts' },
        { status: 403 }
      );
    }
    
    // Check if the account has any transactions
    const { count, error: countError } = await supabase
      .from('account_transactions')
      .select('id', { count: 'exact', head: true })
      .eq('account_id', params.id);
    
    if (countError) {
      console.error('Error checking account transactions:', countError);
      return NextResponse.json(
        { error: 'Failed to check account transactions' },
        { status: 500 }
      );
    }
    
    if (count && count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete account with transactions' },
        { status: 400 }
      );
    }
    
    // Delete the account
    const { error: deleteError } = await supabase
      .from('accounts')
      .delete()
      .eq('id', params.id);
    
    if (deleteError) {
      console.error('Error deleting account:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete account' },
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
