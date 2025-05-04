'use server';

/**
 * This file re-exports error handling functions from the api/error-handler module
 * for use in API routes.
 */

import {
  handleApiError as _handleApiError,
  handleSupabaseError as _handleSupabaseError,
  handleUnexpectedError as _handleUnexpectedError,
  ApiErrorType,
  ApiErrorResponse
} from './api/error-handler';

// Re-export the error handling functions and types
export { 
  ApiErrorType,
  ApiErrorResponse
};

export const handleApiError = _handleApiError;
export const handleSupabaseError = _handleSupabaseError;
export const handleUnexpectedError = _handleUnexpectedError;
