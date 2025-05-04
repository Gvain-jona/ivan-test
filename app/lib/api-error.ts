'use server';

/**
 * This file re-exports error handling functions from the api/error-handler module
 * for backward compatibility with existing code.
 */

import {
  handleApiError as _handleApiError,
  handleSupabaseError as _handleSupabaseError,
  handleUnexpectedError as _handleUnexpectedError
} from './api/error-handler';

// Define types here to avoid import issues
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
    details?: any;
  };
}

export const handleApiError = _handleApiError;
export const handleSupabaseError = _handleSupabaseError;
export const handleUnexpectedError = _handleUnexpectedError;
