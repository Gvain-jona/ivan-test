/**
 * Error Handling Service
 *
 * This service provides standardized error handling for the application,
 * including error logging, formatting, and response generation.
 */

import { NextResponse } from 'next/server';
import { AuthError } from './auth-service';

// Error codes
export const ErrorCodes = {
  // Authentication errors
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_ACCOUNT_LOCKED: 'AUTH_ACCOUNT_LOCKED',
  AUTH_EMAIL_NOT_VERIFIED: 'AUTH_EMAIL_NOT_VERIFIED',
  AUTH_INVALID_PIN: 'AUTH_INVALID_PIN',
  AUTH_INVALID_VERIFICATION_CODE: 'AUTH_INVALID_VERIFICATION_CODE',
  AUTH_SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',
  AUTH_SESSION_NOT_FOUND: 'AUTH_SESSION_NOT_FOUND',
  AUTH_PIN_REENTRY_REQUIRED: 'AUTH_PIN_REENTRY_REQUIRED',
  AUTH_DEVICE_LIMIT_REACHED: 'AUTH_DEVICE_LIMIT_REACHED',

  // Validation errors
  VALIDATION_INVALID_EMAIL: 'VALIDATION_INVALID_EMAIL',
  VALIDATION_INVALID_PIN: 'VALIDATION_INVALID_PIN',
  VALIDATION_MISSING_FIELDS: 'VALIDATION_MISSING_FIELDS',

  // Database errors
  DB_ERROR: 'DB_ERROR',
  DB_NOT_FOUND: 'DB_NOT_FOUND',

  // General errors
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN'
};

// User-friendly error messages
export const ErrorMessages = {
  [ErrorCodes.AUTH_INVALID_CREDENTIALS]: 'Invalid credentials. Please check your email and try again.',
  [ErrorCodes.AUTH_ACCOUNT_LOCKED]: 'Your account has been locked due to too many failed attempts. Please contact an administrator.',
  [ErrorCodes.AUTH_EMAIL_NOT_VERIFIED]: 'Your email has not been verified. Please check your email for a verification code.',
  [ErrorCodes.AUTH_INVALID_PIN]: 'Invalid PIN. Please try again.',
  [ErrorCodes.AUTH_INVALID_VERIFICATION_CODE]: 'Invalid verification code. Please try again.',
  [ErrorCodes.AUTH_SESSION_EXPIRED]: 'Your session has expired. Please sign in again.',
  [ErrorCodes.AUTH_SESSION_NOT_FOUND]: 'Session not found. Please sign in again.',
  [ErrorCodes.AUTH_PIN_REENTRY_REQUIRED]: 'For security reasons, please enter your PIN again.',
  [ErrorCodes.AUTH_DEVICE_LIMIT_REACHED]: 'You have reached the maximum number of devices. Please remove a device or contact an administrator.',

  [ErrorCodes.VALIDATION_INVALID_EMAIL]: 'Please enter a valid email address.',
  [ErrorCodes.VALIDATION_INVALID_PIN]: 'PIN must be 4 digits.',
  [ErrorCodes.VALIDATION_MISSING_FIELDS]: 'Please fill in all required fields.',

  [ErrorCodes.DB_ERROR]: 'A database error occurred. Please try again later.',
  [ErrorCodes.DB_NOT_FOUND]: 'The requested resource was not found.',

  [ErrorCodes.INTERNAL_SERVER_ERROR]: 'An internal server error occurred. Please try again later.',
  [ErrorCodes.NOT_FOUND]: 'The requested resource was not found.',
  [ErrorCodes.BAD_REQUEST]: 'Invalid request. Please check your input and try again.',
  [ErrorCodes.UNAUTHORIZED]: 'You are not authorized to perform this action.',
  [ErrorCodes.FORBIDDEN]: 'You do not have permission to access this resource.'
};

// HTTP status codes
export const StatusCodes = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
};

// Error service
export const errorService = {
  /**
   * Log an error to the console
   *
   * @param error - The error to log
   * @param context - Additional context information
   */
  logError(error: Error | unknown, context?: Record<string, any>) {
    // In a production environment, you would log to a proper logging service
    console.error('Error:', error);

    if (context) {
      console.error('Context:', context);
    }

    // Log stack trace if available
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
  },

  /**
   * Create a standardized error response
   *
   * @param message - Error message
   * @param code - Error code
   * @param status - HTTP status code
   * @param details - Additional error details
   * @returns NextResponse with error information
   */
  createErrorResponse(
    message: string,
    code: string = ErrorCodes.INTERNAL_SERVER_ERROR,
    status: number = StatusCodes.INTERNAL_SERVER_ERROR,
    details?: Record<string, any>
  ) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message,
          code,
          ...(details && { details })
        }
      },
      {
        status,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  },

  /**
   * Handle an authentication error
   *
   * @param error - The authentication error
   * @returns NextResponse with error information
   */
  handleAuthError(error: AuthError | Error | unknown) {
    if (error instanceof AuthError) {
      return this.createErrorResponse(
        error.message,
        error.code || ErrorCodes.UNAUTHORIZED,
        error.status || StatusCodes.UNAUTHORIZED
      );
    }

    // Handle generic errors
    const message = error instanceof Error ? error.message : 'Authentication error';
    this.logError(error, { type: 'auth' });

    return this.createErrorResponse(
      message,
      ErrorCodes.UNAUTHORIZED,
      StatusCodes.UNAUTHORIZED
    );
  },

  /**
   * Handle a validation error
   *
   * @param message - Validation error message
   * @param code - Validation error code
   * @param details - Validation error details
   * @returns NextResponse with error information
   */
  handleValidationError(
    message: string,
    code: string = ErrorCodes.VALIDATION_MISSING_FIELDS,
    details?: Record<string, any>
  ) {
    return this.createErrorResponse(
      message,
      code,
      StatusCodes.BAD_REQUEST,
      details
    );
  },

  /**
   * Handle a database error
   *
   * @param error - The database error
   * @returns NextResponse with error information
   */
  handleDatabaseError(error: Error | unknown) {
    this.logError(error, { type: 'database' });

    const message = error instanceof Error
      ? error.message
      : 'A database error occurred';

    return this.createErrorResponse(
      message,
      ErrorCodes.DB_ERROR,
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  },

  /**
   * Handle a general server error
   *
   * @param error - The server error
   * @returns NextResponse with error information
   */
  handleServerError(error: Error | unknown) {
    this.logError(error, { type: 'server' });

    const message = error instanceof Error
      ? error.message
      : 'An internal server error occurred';

    return this.createErrorResponse(
      message,
      ErrorCodes.INTERNAL_SERVER_ERROR,
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};
