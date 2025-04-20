import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { handleApiError, handleUnexpectedError } from '@/lib/api/error-handler';

/**
 * POST /api/items/create
 * Creates a new item in the items table
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { name, description, category_id, price, cost } = await request.json();

    // Validate required fields
    if (!name) {
      return handleApiError(
        'VALIDATION_ERROR',
        'Item name is required',
        { param: 'name' }
      );
    }

    if (!category_id) {
      return handleApiError(
        'VALIDATION_ERROR',
        'Category ID is required',
        { param: 'category_id' }
      );
    }

    // Check if the category exists
    const { data: categoryExists, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('id', category_id)
      .single();

    if (categoryError || !categoryExists) {
      return handleApiError(
        'VALIDATION_ERROR',
        'Category does not exist',
        { param: 'category_id' }
      );
    }

    // Check if the item already exists with the same name and category
    const { data: existingItem, error: existingItemError } = await supabase
      .from('items')
      .select('id, name')
      .eq('name', name)
      .eq('category_id', category_id);

    if (existingItemError) {
      console.error('Error checking for existing item:', existingItemError);
    }

    // If the item already exists, return it
    if (existingItem && existingItem.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Item already exists',
        item: existingItem[0],
        isNew: false
      });
    }

    // Create the new item
    const { data: newItem, error: createError } = await supabase
      .from('items')
      .insert({
        name,
        description: description || '',
        category_id,
        price: price || 0,
        cost: cost || 0,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating item:', createError);
      return handleApiError(
        'DATABASE_ERROR',
        'Failed to create item',
        { details: createError }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Item created successfully',
      item: newItem,
      isNew: true
    });
  } catch (error) {
    console.error('Error in create item API:', error);
    return handleUnexpectedError(error);
  }
}
