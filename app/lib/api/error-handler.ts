import { NextResponse } from 'next/server';

export type ApiErrorType =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'DATABASE_ERROR'
  | 'SUPABASE_ERROR'
  | 'INTERNAL_SERVER_ERROR';

export interface ApiErrorResponse {
  error: {
    type: ApiErrorType;
    message: string;
    details?: unknown;
  };
}

const errorStatusCodes: Record<ApiErrorType, number> = {
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  DATABASE_ERROR: 500,
  SUPABASE_ERROR: 500,
  INTERNAL_SERVER_ERROR: 500,
};

export function handleApiError(
  type: ApiErrorType,
  message: string,
  details?: unknown,
): NextResponse<ApiErrorResponse> {
  if (type !== 'VALIDATION_ERROR') {
    console.error(`API Error [${type}]:`, message, details ?? '');
  }
  return NextResponse.json(
    { error: { type, message, ...(details != null && { details }) } },
    { status: errorStatusCodes[type] },
  );
}

export function handleUnexpectedError(error: unknown): NextResponse<ApiErrorResponse> {
  const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
  console.error('Unexpected API error:', error);
  return handleApiError(
    'INTERNAL_SERVER_ERROR',
    errorMessage,
    process.env.NODE_ENV === 'development'
      ? { stack: error instanceof Error ? error.stack : undefined }
      : undefined,
  );
}

export function handleSupabaseError(error: {
  message?: string;
  code?: string;
  details?: unknown;
}): NextResponse<ApiErrorResponse> {
  if (error.message?.includes('foreign key constraint')) {
    return handleApiError(
      'VALIDATION_ERROR',
      'Foreign key constraint violation',
      'One or more referenced items do not exist. Check client_id, item_id, or category_id values.',
    );
  }

  if (error.message?.includes('check constraint')) {
    return handleApiError(
      'VALIDATION_ERROR',
      'Check constraint violation',
      'One or more values failed validation. Check status, payment_status, or client_type values.',
    );
  }

  if (error.code === 'PGRST116') {
    return handleApiError('NOT_FOUND', 'Resource not found');
  }

  if (error.code === '42501') {
    return handleApiError('FORBIDDEN', 'Permission denied');
  }

  if (error.code === '23505') {
    return handleApiError('VALIDATION_ERROR', 'Unique constraint violation');
  }

  if (error.code === '42703') {
    return handleApiError('DATABASE_ERROR', 'Database schema mismatch');
  }

  if (error.code === '42702') {
    return handleApiError('DATABASE_ERROR', 'Ambiguous column reference');
  }

  return handleApiError(
    'SUPABASE_ERROR',
    error.message || 'Database operation failed',
    process.env.NODE_ENV === 'development'
      ? { code: error.code, details: error.details }
      : undefined,
  );
}
