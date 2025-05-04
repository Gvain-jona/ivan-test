/**
 * This file re-exports error and response handling functions from the api modules
 * for use in API routes.
 */

import { NextResponse } from 'next/server';
import {
  handleApiError as _handleApiError,
  handleSupabaseError as _handleSupabaseError,
  handleUnexpectedError as _handleUnexpectedError
} from './api/error-handler';

import {
  createApiResponse as _createApiResponse,
  createCreatedResponse as _createCreatedResponse,
  createNoContentResponse as _createNoContentResponse
} from './api/response-handler';

// Define types directly to avoid import issues
export type ApiErrorType =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'DATABASE_ERROR'
  | 'SUPABASE_ERROR'
  | 'INTERNAL_SERVER_ERROR'
  | 'SERVER_ERROR';  // Added for backward compatibility

export interface ApiErrorResponse {
  error: {
    type: ApiErrorType;
    message: string;
    details?: any;
  };
}

export interface ApiSuccessResponse<T> {
  data: T;
  meta?: {
    totalCount?: number;
    pageCount?: number;
    currentPage?: number;
    [key: string]: any;
  };
}

// Map error types to HTTP status codes
const errorStatusCodes: Record<ApiErrorType, number> = {
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  DATABASE_ERROR: 500,
  SUPABASE_ERROR: 500,
  INTERNAL_SERVER_ERROR: 500,
  SERVER_ERROR: 500  // Added for backward compatibility
};

// Custom implementation for handleApiError that supports SERVER_ERROR
export function handleApiError(
  type: ApiErrorType,
  message: string,
  details?: any
): NextResponse<ApiErrorResponse> {
  // Map SERVER_ERROR to INTERNAL_SERVER_ERROR for compatibility
  const mappedType = type === 'SERVER_ERROR' ? 'INTERNAL_SERVER_ERROR' : type;

  // Log the error (except for validation errors which are expected)
  if (type !== 'VALIDATION_ERROR') {
    console.error(`API Error [${type}]:`, message, details || '');
  }

  // Create the error response
  const errorResponse: ApiErrorResponse = {
    error: {
      type: mappedType,
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

// Re-export other functions
export const handleSupabaseError = _handleSupabaseError;
export const handleUnexpectedError = _handleUnexpectedError;
export const createApiResponse = _createApiResponse;
export const createCreatedResponse = _createCreatedResponse;
export const createNoContentResponse = _createNoContentResponse;
