/**
 * Error handling utilities for API routes
 */

import { NextResponse } from 'next/server';

/**
 * API error types
 */
export type ApiErrorType =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'DATABASE_ERROR'
  | 'SUPABASE_ERROR'
  | 'INTERNAL_SERVER_ERROR';

/**
 * API error response structure
 */
export interface ApiErrorResponse {
  error: {
    type: ApiErrorType;
    message: string;
    details?: any;
  };
}

/**
 * Map of error types to HTTP status codes
 */
const errorStatusCodes: Record<ApiErrorType, number> = {
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  DATABASE_ERROR: 500,
  SUPABASE_ERROR: 500,
  INTERNAL_SERVER_ERROR: 500
};

/**
 * Handle API errors in a standardized way
 *
 * @param type Error type
 * @param message Error message
 * @param details Additional error details
 * @returns NextResponse with appropriate status code and error details
 */
export function handleApiError(
  type: ApiErrorType,
  message: string,
  details?: any
): NextResponse<ApiErrorResponse> {
  // Log the error (except for validation errors which are expected)
  if (type !== 'VALIDATION_ERROR') {
    console.error(`API Error [${type}]:`, message, details || '');
  }

  // Create the error response
  const errorResponse: ApiErrorResponse = {
    error: {
      type,
      message,
      ...(details && { details })
    }
  };

  // Return the response with the appropriate status code
  return NextResponse.json(
    errorResponse,
    { status: errorStatusCodes[type] }
  );
}

/**
 * Handle unexpected errors in API routes
 *
 * @param error The caught error
 * @returns NextResponse with error details
 */
export function handleUnexpectedError(error: unknown): NextResponse<ApiErrorResponse> {
  const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

  console.error('Unexpected API error:', error);

  return handleApiError(
    'INTERNAL_SERVER_ERROR',
    errorMessage,
    process.env.NODE_ENV === 'development' ? { stack: error instanceof Error ? error.stack : undefined } : undefined
  );
}

/**
 * Handle Supabase errors in API routes
 *
 * @param error The Supabase error
 * @returns NextResponse with error details
 */
export function handleSupabaseError(error: any): NextResponse<ApiErrorResponse> {
  // Check for specific error types and provide better error messages
  if (error.message?.includes('foreign key constraint')) {
    return handleApiError(
      'VALIDATION_ERROR',
      'Foreign key constraint violation',
      'One or more referenced items do not exist in the database. Check client_id, item_id, or category_id values.'
    );
  }

  if (error.message?.includes('check constraint')) {
    return handleApiError(
      'VALIDATION_ERROR',
      'Check constraint violation',
      'One or more values failed validation checks. Check status, payment_status, or client_type values.'
    );
  }

  if (error.code === 'PGRST116') {
    return handleApiError(
      'NOT_FOUND',
      'Resource not found',
      error.message
    );
  }

  if (error.code === '42501') {
    // RLS policy violation
    return handleApiError(
      'FORBIDDEN',
      'Permission denied',
      {
        message: error.message,
        details: 'This operation violates a row-level security policy. Make sure you are authenticated and have the necessary permissions.',
        code: error.code
      }
    );
  }

  if (error.code === '23505') {
    return handleApiError(
      'VALIDATION_ERROR',
      'Unique constraint violation',
      error.message
    );
  }

  // Check for "record has no field" errors
  if (error.code === '42703' && error.message?.includes('has no field')) {
    return handleApiError(
      'DATABASE_ERROR',
      'Database schema mismatch',
      {
        message: error.message,
        details: 'There is a mismatch between the database schema and the expected fields. This might be due to a trigger or constraint trying to access a field that doesn\'t exist.',
        code: error.code
      }
    );
  }

  // Check for ambiguous column reference errors
  if (error.code === '42702' && error.message?.includes('ambiguous')) {
    return handleApiError(
      'DATABASE_ERROR',
      'Ambiguous column reference',
      {
        message: error.message,
        details: 'A column name is used in multiple tables without proper qualification. This is likely due to a database trigger or function that needs to be updated.',
        code: error.code
      }
    );
  }

  // Generic Supabase error
  return handleApiError(
    'SUPABASE_ERROR',
    error.message || 'Database operation failed',
    process.env.NODE_ENV === 'development' ? { code: error.code, details: error.details } : undefined
  );
}
