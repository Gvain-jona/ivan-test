/**
 * Standardized error handling utilities
 * These functions provide consistent error handling across the application
 */

import { toast } from 'sonner';

/**
 * Error types for consistent error handling
 */
export type ErrorType = 
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'DATABASE_ERROR'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * Error details interface
 */
export interface ErrorDetails {
  field?: string;
  code?: string;
  message?: string;
  [key: string]: any;
}

/**
 * Standardized error handling utility
 * @param error The error object
 * @param context Context where the error occurred (for logging)
 * @param showToast Whether to show a toast notification
 * @returns Standardized error object
 */
export const handleError = (
  error: any, 
  context: string,
  showToast: boolean = true
): { type: ErrorType; message: string; details?: ErrorDetails } => {
  // Log the error
  console.error(`Error in ${context}:`, error);
  
  // Default error information
  let type: ErrorType = 'UNKNOWN_ERROR';
  let message = 'An unexpected error occurred';
  let details: ErrorDetails | undefined = undefined;
  
  // Extract error information
  if (error.code) {
    // Handle specific error codes
    switch (error.code) {
      case '23502':
        type = 'VALIDATION_ERROR';
        message = 'Missing required field';
        details = { field: error.column };
        break;
      case '23503':
        type = 'VALIDATION_ERROR';
        message = 'Referenced record does not exist';
        details = { field: error.column };
        break;
      case '23505':
        type = 'VALIDATION_ERROR';
        message = 'Record already exists';
        details = { field: error.column };
        break;
      case '428C9':
        type = 'VALIDATION_ERROR';
        message = 'Cannot update a generated column';
        details = { field: error.column };
        break;
      default:
        type = 'DATABASE_ERROR';
        message = error.message || 'Database error';
        details = { code: error.code };
    }
  } else if (error.status) {
    // Handle HTTP status codes
    switch (error.status) {
      case 401:
        type = 'AUTHENTICATION_ERROR';
        message = 'Authentication required';
        break;
      case 403:
        type = 'AUTHORIZATION_ERROR';
        message = 'You do not have permission to perform this action';
        break;
      case 404:
        type = 'VALIDATION_ERROR';
        message = 'Resource not found';
        break;
      case 422:
        type = 'VALIDATION_ERROR';
        message = 'Validation error';
        details = error.details;
        break;
      default:
        type = 'SERVER_ERROR';
        message = error.message || 'Server error';
    }
  } else if (error instanceof Error) {
    message = error.message;
    if (error.name === 'NetworkError') {
      type = 'NETWORK_ERROR';
    }
  }
  
  // Show a toast notification for user feedback if requested
  if (showToast) {
    toast.error(message, {
      description: details ? JSON.stringify(details) : undefined,
      duration: 5000,
    });
  }
  
  return { type, message, details };
};

/**
 * Conditional logging utility that only logs in development
 * @param message Message to log
 * @param data Optional data to log
 */
export const logDebug = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    if (data) {
      console.log(`[DEBUG] ${message}`, data);
    } else {
      console.log(`[DEBUG] ${message}`);
    }
  }
};
