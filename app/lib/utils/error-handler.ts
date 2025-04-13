/**
 * Global error handler utility
 *
 * This file provides functions for handling and logging errors globally.
 */

// Log an error with detailed information
export function logError(error: Error | unknown, context?: Record<string, any>) {
  console.error('===== GLOBAL ERROR HANDLER =====');

  // Check if error is empty or undefined
  if (!error) {
    console.error('Error: <empty or undefined error object>');
    console.error('Stack trace:', new Error('Empty error').stack);
  } else {
    console.error('Error:', error);

    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    } else if (typeof error === 'string') {
      console.error('Error message:', error);
      console.error('Stack trace:', new Error(error).stack);
    } else {
      console.error('Error type:', typeof error);
      try {
        console.error('Error stringified:', JSON.stringify(error));
      } catch (e) {
        console.error('Error cannot be stringified');
      }
    }
  }

  if (context) {
    console.error('Error context:', context);
  }

  // Always log these details
  console.error('Timestamp:', new Date().toISOString());
  console.error('URL:', typeof window !== 'undefined' ? window.location.href : 'Server-side rendering');
  console.error('User Agent:', typeof window !== 'undefined' ? navigator.userAgent : 'Server-side rendering');

  // Add React component stack if available
  try {
    if (typeof window !== 'undefined') {
      const w = window as any;
      if (w.__REACT_ERROR_OVERLAY_GLOBAL_HOOK__) {
        console.error('React component stack may be available in the browser console');
      }
    }
  } catch (e) {
    // Ignore errors when checking for React error overlay hook
  }

  console.error('================================');
}

// Initialize global error handlers
export function initGlobalErrorHandlers() {
  if (typeof window !== 'undefined') {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      // Create a more detailed context object
      const context = {
        type: 'unhandledrejection',
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      };

      // Log the error with context
      logError(event.reason || new Error('Unknown promise rejection'), context);
    });

    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      // Create a more detailed context object
      const context = {
        type: 'uncaughterror',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        message: event.message
      };

      // Log the error with context
      logError(event.error || new Error(event.message || 'Unknown error'), context);
    });

    // Add React error handler if available
    try {
      const w = window as any;
      if (w.__REACT_ERROR_OVERLAY_GLOBAL_HOOK__) {
        const originalOnError = w.__REACT_ERROR_OVERLAY_GLOBAL_HOOK__.onError;
        w.__REACT_ERROR_OVERLAY_GLOBAL_HOOK__.onError = (error: Error) => {
          logError(error, { type: 'react_error_overlay' });
          if (originalOnError) {
            originalOnError(error);
          }
        };
      }
    } catch (e) {
      console.error('Failed to set up React error overlay hook:', e);
    }

    console.log('Global error handlers initialized');
  }
}

// Format an error for display
export function formatErrorForDisplay(error: Error | unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }

  return String(error);
}
