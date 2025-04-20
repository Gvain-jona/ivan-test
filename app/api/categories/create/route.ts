import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { handleApiError, handleUnexpectedError } from '@/lib/api/error-handler';

/**
 * POST /api/categories/create
 * Creates a new category in the categories table
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { name, description } = await request.json();

    // Validate required fields
    if (!name) {
      return handleApiError(
        'VALIDATION_ERROR',
        'Category name is required',
        { param: 'name' }
      );
    }

    // Check if the category already exists with the same name
    const { data: existingCategory, error: existingCategoryError } = await supabase
      .from('categories')
      .select('id, name')
      .eq('name', name);

    if (existingCategoryError) {
      console.error('Error checking for existing category:', existingCategoryError);
    }

    // If the category already exists, return it
    if (existingCategory && existingCategory.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Category already exists',
        category: existingCategory[0],
        isNew: false
      });
    }

    // Create the new category
    const { data: newCategory, error: createError } = await supabase
      .from('categories')
      .insert({
        name,
        description: description || '',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating category:', createError);
      return handleApiError(
        'DATABASE_ERROR',
        'Failed to create category',
        { details: createError }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Category created successfully',
      category: newCategory,
      isNew: true
    });
  } catch (error) {
    console.error('Error in create category API:', error);
    return handleUnexpectedError(error);
  }
}
