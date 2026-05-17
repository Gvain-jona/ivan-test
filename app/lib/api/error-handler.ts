'use server';

import { NextResponse } from 'next/server';

/**
 * Standard error types for API responses
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
 * Standard error response structure
 */
export interface ApiErrorResponse {
  error: {
    type: ApiErrorType;
    message: string;
    details?: any;
  };
}

/**
 * Map error types to HTTP status codes
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
 * @param details Additional error details (logged server-side, never sent to client in production)
 * @returns NextResponse with appropriate status code and error details
 */
export async function handleApiError(
  type: ApiErrorType,
  message: string,
  details?: any
): Promise<NextResponse<ApiErrorResponse>> {
  // Always log full details server-side (except validation errors which are expected)
  if (type !== 'VALIDATION_ERROR') {
    console.error(`API Error [${type}]:`, message, details || '');
  }

  // Never include technical details in client responses — only expose in development
  const errorResponse: ApiErrorResponse = {
    error: {
      type,
      message,
      ...(process.env.NODE_ENV === 'development' && details && { details })
    }
  };

  return NextResponse.json(errorResponse, { status: errorStatusCodes[type] });
}

/**
 * Handle unexpected errors in API routes
 *
 * @param error The caught error
 * @returns NextResponse with error details
 */
export async function handleUnexpectedError(error: unknown): Promise<NextResponse<ApiErrorResponse>> {
  console.error('Unexpected API error:', error);

  return handleApiError(
    'INTERNAL_SERVER_ERROR',
    'An unexpected error occurred',
    error instanceof Error
      ? { message: error.message, stack: error.stack }
      : { error: String(error) }
  );
}

/**
 * Handle Supabase errors in API routes
 *
 * @param error The Supabase error
 * @returns NextResponse with error details
 */
export async function handleSupabaseError(error: any): Promise<NextResponse<ApiErrorResponse>> {
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
      { message: error.message }
    );
  }

  if (error.code === '42501') {
    return handleApiError(
      'FORBIDDEN',
      'Permission denied',
      { message: error.message, code: error.code }
    );
  }

  if (error.code === '23505') {
    return handleApiError(
      'VALIDATION_ERROR',
      'A record with these details already exists',
      { message: error.message }
    );
  }

  if (error.code === '42703' && error.message?.includes('has no field')) {
    return handleApiError(
      'DATABASE_ERROR',
      'A database error occurred',
      { message: error.message, code: error.code }
    );
  }

  if (error.code === '42702' && error.message?.includes('ambiguous')) {
    return handleApiError(
      'DATABASE_ERROR',
      'A database error occurred',
      { message: error.message, code: error.code }
    );
  }

  // Generic Supabase error — log full details, return generic message
  return handleApiError(
    'SUPABASE_ERROR',
    'A database error occurred',
    { message: error.message, code: error.code, details: error.details }
  );
}
