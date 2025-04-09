/**
 * Global error handler utility
 * 
 * This file provides functions for handling and logging errors globally.
 */

// Log an error with detailed information
export function logError(error: Error | unknown, context?: Record<string, any>) {
  console.error('===== GLOBAL ERROR HANDLER =====');
  console.error('Error:', error);
  
  if (error instanceof Error) {
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
  }
  
  if (context) {
    console.error('Error context:', context);
  }
  
  console.error('Timestamp:', new Date().toISOString());
  console.error('URL:', typeof window !== 'undefined' ? window.location.href : 'Server-side rendering');
  console.error('User Agent:', typeof window !== 'undefined' ? navigator.userAgent : 'Server-side rendering');
  console.error('================================');
}

// Initialize global error handlers
export function initGlobalErrorHandlers() {
  if (typeof window !== 'undefined') {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      logError(event.reason, { type: 'unhandledrejection' });
    });
    
    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      logError(event.error || new Error(event.message), { 
        type: 'uncaughterror',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });
    
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
