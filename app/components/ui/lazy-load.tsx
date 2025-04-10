'use client';

import React, { Suspense, lazy, ComponentType, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import ErrorBoundary from '@/components/error/ErrorBoundary';

interface LazyLoadProps {
  component: () => Promise<{ default: ComponentType<any> }>;
  props?: Record<string, any>;
  fallback?: ReactNode;
  errorFallback?: ReactNode;
}

/**
 * LazyLoad component for dynamically loading components with Suspense and ErrorBoundary
 */
export function LazyLoad({ 
  component, 
  props = {}, 
  fallback, 
  errorFallback 
}: LazyLoadProps) {
  // Use React.lazy to dynamically import the component
  const LazyComponent = lazy(component);
  
  // Default loading fallback
  const defaultFallback = (
    <div className="flex items-center justify-center p-8 min-h-[200px]">
      <Loader2 className="h-8 w-8 text-primary animate-spin" />
    </div>
  );

  return (
    <ErrorBoundary fallback={errorFallback}>
      <Suspense fallback={fallback || defaultFallback}>
        <LazyComponent {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}

/**
 * Higher-order function to create a lazy-loaded component
 */
export function createLazyComponent<T extends Record<string, any>>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  defaultProps?: Partial<T>
) {
  return (props: T) => (
    <LazyLoad 
      component={importFn} 
      props={{ ...defaultProps, ...props }} 
    />
  );
}
