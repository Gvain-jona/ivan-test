import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';

// Schema for allocation rule update
const allocationRuleUpdateSchema = z.object({
  source_type: z.enum(['profit', 'labor', 'order_payment', 'expense']).optional(),
  account_id: z.string().uuid().optional(),
  percentage: z.number().min(0).max(100).optional(),
  is_active: z.boolean().optional(),
});

/**
 * GET handler for fetching a specific allocation rule
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
    
    // Get the rule
    const { data: rule, error } = await supabase
      .from('account_allocation_rules')
      .select('*, accounts(name)')
      .eq('id', params.id)
      .single();
    
    if (error) {
      console.error('Error fetching allocation rule:', error);
      return NextResponse.json(
        { error: 'Failed to fetch allocation rule' },
        { status: 500 }
      );
    }
    
    if (!rule) {
      return NextResponse.json(
        { error: 'Allocation rule not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ rule });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * PUT handler for updating a specific allocation rule
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
        { error: 'Only admins and managers can update allocation rules' },
        { status: 403 }
      );
    }
    
    // Get the current rule
    const { data: currentRule, error: ruleError } = await supabase
      .from('account_allocation_rules')
      .select('*')
      .eq('id', params.id)
      .single();
    
    if (ruleError || !currentRule) {
      console.error('Error fetching allocation rule:', ruleError);
      return NextResponse.json(
        { error: 'Allocation rule not found' },
        { status: 404 }
      );
    }
    
    // Get the rule data from the request body
    const body = await request.json();
    
    // Validate the rule data
    const validationResult = allocationRuleUpdateSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid allocation rule data', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const ruleData = validationResult.data;
    
    // Check if account_id is being updated and if the account exists
    if (ruleData.account_id) {
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
    }
    
    // Check if source_type or percentage is being updated
    if (ruleData.source_type || ruleData.percentage !== undefined) {
      const sourceType = ruleData.source_type || currentRule.source_type;
      const newPercentage = ruleData.percentage !== undefined ? ruleData.percentage : currentRule.percentage;
      
      // Check if the total percentage for this source_type would exceed 100%
      const { data: existingRules, error: rulesError } = await supabase
        .from('account_allocation_rules')
        .select('percentage')
        .eq('source_type', sourceType)
        .eq('is_active', true)
        .neq('id', params.id);
      
      if (rulesError) {
        console.error('Error fetching existing rules:', rulesError);
        return NextResponse.json(
          { error: 'Failed to check existing rules' },
          { status: 500 }
        );
      }
      
      const totalPercentage = existingRules.reduce((sum, rule) => sum + rule.percentage, 0);
      
      if (totalPercentage + newPercentage > 100) {
        return NextResponse.json(
          { error: 'Total percentage for this source type would exceed 100%' },
          { status: 400 }
        );
      }
    }
    
    // Update the rule
    const { data: updatedRule, error } = await supabase
      .from('account_allocation_rules')
      .update({
        ...ruleData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating allocation rule:', error);
      return NextResponse.json(
        { error: 'Failed to update allocation rule' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ rule: updatedRule });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for deleting a specific allocation rule
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
        { error: 'Only admins can delete allocation rules' },
        { status: 403 }
      );
    }
    
    // Delete the rule
    const { error: deleteError } = await supabase
      .from('account_allocation_rules')
      .delete()
      .eq('id', params.id);
    
    if (deleteError) {
      console.error('Error deleting allocation rule:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete allocation rule' },
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
