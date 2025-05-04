'use server';

/**
 * This file re-exports error and response handling functions from the api modules
 * for use in API routes.
 */

import { 
  handleApiError as _handleApiError,
  handleSupabaseError as _handleSupabaseError,
  handleUnexpectedError as _handleUnexpectedError,
  ApiErrorType,
  ApiErrorResponse
} from './api/error-handler';

import {
  createApiResponse as _createApiResponse,
  createCreatedResponse as _createCreatedResponse,
  createNoContentResponse as _createNoContentResponse,
  ApiSuccessResponse
} from './api/response-handler';

// Re-export the error handling functions and types
export { 
  ApiErrorType,
  ApiErrorResponse
};

export const handleApiError = _handleApiError;
export const handleSupabaseError = _handleSupabaseError;
export const handleUnexpectedError = _handleUnexpectedError;

// Re-export the response handling functions and types
export {
  ApiSuccessResponse
};

export const createApiResponse = _createApiResponse;
export const createCreatedResponse = _createCreatedResponse;
export const createNoContentResponse = _createNoContentResponse;
