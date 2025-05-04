import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';

// Schema for allocation rule creation
const allocationRuleSchema = z.object({
  source_type: z.enum(['profit', 'labor', 'order_payment', 'expense']),
  account_id: z.string().uuid(),
  percentage: z.number().min(0).max(100),
  is_active: z.boolean().optional().default(true),
});

/**
 * GET handler for fetching allocation rules
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
    const sourceType = searchParams.get('source_type');
    const accountId = searchParams.get('account_id');
    const isActive = searchParams.get('is_active');
    
    // Build query
    let query = supabase.from('account_allocation_rules').select('*, accounts(name)');
    
    // Apply filters if provided
    if (sourceType) {
      query = query.eq('source_type', sourceType);
    }
    
    if (accountId) {
      query = query.eq('account_id', accountId);
    }
    
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }
    
    // Order by source_type and percentage
    query = query.order('source_type').order('percentage', { ascending: false });
    
    // Execute query
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching allocation rules:', error);
      return NextResponse.json(
        { error: 'Failed to fetch allocation rules' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ rules: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * POST handler for creating a new allocation rule
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
        { error: 'Only admins and managers can create allocation rules' },
        { status: 403 }
      );
    }
    
    // Get the rule data from the request body
    const body = await request.json();
    
    // Validate the rule data
    const validationResult = allocationRuleSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid allocation rule data', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const ruleData = validationResult.data;
    
    // Check if the account exists
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('id')
      .eq('id', ruleData.account_id)
      .single();
    
    if (accountError || !account) {
      console.error('Error fetching account:', accountError);
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }
    
    // Check if the total percentage for this source_type would exceed 100%
    const { data: existingRules, error: rulesError } = await supabase
      .from('account_allocation_rules')
      .select('percentage')
      .eq('source_type', ruleData.source_type)
      .eq('is_active', true);
    
    if (rulesError) {
      console.error('Error fetching existing rules:', rulesError);
      return NextResponse.json(
        { error: 'Failed to check existing rules' },
        { status: 500 }
      );
    }
    
    const totalPercentage = existingRules.reduce((sum, rule) => sum + rule.percentage, 0);
    
    if (totalPercentage + ruleData.percentage > 100) {
      return NextResponse.json(
        { error: 'Total percentage for this source type would exceed 100%' },
        { status: 400 }
      );
    }
    
    // Create the rule
    const { data: newRule, error } = await supabase
      .from('account_allocation_rules')
      .insert({
        source_type: ruleData.source_type,
        account_id: ruleData.account_id,
        percentage: ruleData.percentage,
        is_active: ruleData.is_active,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating allocation rule:', error);
      return NextResponse.json(
        { error: 'Failed to create allocation rule' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ rule: newRule }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
