import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';

// Schema for transaction creation
const transactionSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  transaction_type: z.enum(['credit', 'debit']),
  source_type: z.enum(['order', 'expense', 'manual', 'profit', 'labor', 'order_payment']),
  source_id: z.string().uuid().optional(),
  description: z.string().optional(),
});

/**
 * GET handler for fetching transactions for a specific account
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
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const sourceType = searchParams.get('source_type');
    const transactionType = searchParams.get('transaction_type');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('page_size') || '20');
    
    // Calculate offset
    const offset = (page - 1) * pageSize;
    
    // Build query
    let query = supabase
      .from('account_transactions')
      .select('*', { count: 'exact' })
      .eq('account_id', params.id);
    
    // Apply filters if provided
    if (sourceType) {
      query = query.eq('source_type', sourceType);
    }
    
    if (transactionType) {
      query = query.eq('transaction_type', transactionType);
    }
    
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    
    // Order by created_at descending and apply pagination
    query = query.order('created_at', { ascending: false }).range(offset, offset + pageSize - 1);
    
    // Execute query
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching transactions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch transactions' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      transactions: data,
      pagination: {
        page,
        pageSize,
        totalCount: count || 0,
        totalPages: count ? Math.ceil(count / pageSize) : 0,
      },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * POST handler for creating a new transaction for a specific account
 */
export async function POST(
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
        { error: 'Only admins and managers can create transactions' },
        { status: 403 }
      );
    }
    
    // Check if the account exists
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('id')
      .eq('id', params.id)
      .single();
    
    if (accountError || !account) {
      console.error('Error fetching account:', accountError);
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }
    
    // Get the transaction data from the request body
    const body = await request.json();
    
    // Validate the transaction data
    const validationResult = transactionSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid transaction data', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const transactionData = validationResult.data;
    
    // Create the transaction
    const { data: newTransaction, error } = await supabase
      .from('account_transactions')
      .insert({
        account_id: params.id,
        amount: transactionData.amount,
        transaction_type: transactionData.transaction_type,
        source_type: transactionData.source_type,
        source_id: transactionData.source_id || null,
        description: transactionData.description || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating transaction:', error);
      return NextResponse.json(
        { error: 'Failed to create transaction' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ transaction: newTransaction }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
