'use server';

/**
 * This file re-exports error and response handling functions from the api modules
 * for use in API routes.
 */

import type {
  ApiErrorType,
  ApiErrorResponse
} from './api/error-handler';
import { 
  handleApiError as _handleApiError,
  handleSupabaseError as _handleSupabaseError,
  handleUnexpectedError as _handleUnexpectedError
} from './api/error-handler';

import type {
  ApiSuccessResponse
} from './api/response-handler';
import {
  createApiResponse as _createApiResponse,
  createCreatedResponse as _createCreatedResponse,
  createNoContentResponse as _createNoContentResponse
} from './api/response-handler';

// Re-export the error handling functions and types
export type { ApiErrorType, ApiErrorResponse };

export const handleApiError = _handleApiError;
export const handleSupabaseError = _handleSupabaseError;
export const handleUnexpectedError = _handleUnexpectedError;

// Re-export the response handling functions and types
export type { ApiSuccessResponse };

export const createApiResponse = _createApiResponse;
export const createCreatedResponse = _createCreatedResponse;
export const createNoContentResponse = _createNoContentResponse;
