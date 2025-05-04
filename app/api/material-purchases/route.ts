import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { handleApiError, handleSupabaseError } from '@/lib/api/error-handler';
import { createApiResponse } from '@/lib/api/response-handler';

/**
 * GET /api/material-purchases
 * Retrieves a list of material purchases with optional filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const supplier = searchParams.get('supplier');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const paymentStatus = searchParams.get('payment_status');

    // Calculate offset
    const offset = (page - 1) * limit;

    // Create Supabase client
    const supabase = await createClient();

    // Start building the query
    let query = supabase
      .from('material_purchases')
      .select('*', { count: 'exact' });

    // Apply filters if provided
    if (supplier) {
      query = query.ilike('supplier_name', `%${supplier}%`);
    }
    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }
    if (paymentStatus) {
      query = query.eq('payment_status', paymentStatus);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1).order('date', { ascending: false });

    // Execute the query
    const { data, error, count } = await query;

    if (error) {
      return handleSupabaseError(error);
    }

    // Return the results
    return createApiResponse({
      purchases: data || [],
      total: count || 0,
      page,
      limit
    });
  } catch (error) {
    console.error('Error in GET /api/material-purchases:', error);
    return handleApiError(
      'SERVER_ERROR',
      'An unexpected error occurred while fetching material purchases'
    );
  }
}

/**
 * POST /api/material-purchases
 * Creates a new material purchase
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const {
      supplier_name,
      material_name,
      date,
      quantity,
      unit, // Add unit field
      unit_price,
      total_amount,
      amount_paid = 0,
      notes
    } = body;

    // Validate required fields
    if (!supplier_name) {
      return handleApiError(
        'VALIDATION_ERROR',
        'Supplier name is required',
        { param: 'supplier_name' }
      );
    }

    if (!material_name) {
      return handleApiError(
        'VALIDATION_ERROR',
        'Material name is required',
        { param: 'material_name' }
      );
    }

    if (!date) {
      return handleApiError(
        'VALIDATION_ERROR',
        'Date is required',
        { param: 'date' }
      );
    }

    if (!total_amount || isNaN(Number(total_amount)) || Number(total_amount) <= 0) {
      return handleApiError(
        'VALIDATION_ERROR',
        'Total amount must be a positive number',
        { param: 'total_amount' }
      );
    }

    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      return handleApiError(
        'VALIDATION_ERROR',
        'Quantity must be a positive number',
        { param: 'quantity' }
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return handleApiError(
        'AUTHENTICATION_ERROR',
        'Authentication required to create a material purchase'
      );
    }

    // Determine payment status
    const numericTotalAmount = Number(total_amount);
    const numericAmountPaid = Number(amount_paid || 0);
    let payment_status = 'unpaid';

    if (numericAmountPaid >= numericTotalAmount) {
      payment_status = 'paid';
    } else if (numericAmountPaid > 0) {
      payment_status = 'partially_paid';
    }

    // Create the material purchase
    const { data: newPurchase, error: purchaseError } = await supabase
      .from('material_purchases')
      .insert({
        supplier_name,
        material_name,
        date,
        quantity,
        unit, // Add unit field
        unit_price: unit_price || (quantity > 0 ? numericTotalAmount / Number(quantity) : 0),
        total_amount: numericTotalAmount,
        amount_paid: numericAmountPaid,
        payment_status,
        notes,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (purchaseError) {
      console.error('Error creating material purchase:', purchaseError);
      return handleSupabaseError(purchaseError);
    }

    return createApiResponse({
      purchase: newPurchase,
      message: 'Material purchase created successfully'
    });
  } catch (error) {
    console.error('Error in POST /api/material-purchases:', error);
    return handleApiError(
      'SERVER_ERROR',
      'An unexpected error occurred while creating the material purchase'
    );
  }
}
