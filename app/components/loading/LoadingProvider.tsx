'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { InlineLoading } from '@/components/ui/loading';

// Define the context type
type LoadingContextType = {
  isLoading: boolean;
  startLoading: (id?: string) => void;
  stopLoading: (id?: string) => void;
  loadingIds: Set<string>;
};

// Create the context with default values
const LoadingContext = createContext<LoadingContextType>({
  isLoading: false,
  startLoading: () => {},
  stopLoading: () => {},
  loadingIds: new Set(),
});

// Hook to use the loading context
export const useLoading = () => useContext(LoadingContext);

// Loading provider component
export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  
  // Start loading with an optional ID
  const startLoading = useCallback((id: string = 'global') => {
    setLoadingIds(prev => {
      const newSet = new Set(prev);
      newSet.add(id);
      return newSet;
    });
  }, []);
  
  // Stop loading with an optional ID
  const stopLoading = useCallback((id: string = 'global') => {
    setLoadingIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  }, []);
  
  // Check if any loading is happening
  const isLoading = loadingIds.size > 0;
  
  // Create the context value
  const contextValue = {
    isLoading,
    startLoading,
    stopLoading,
    loadingIds,
  };
  
  return (
    <LoadingContext.Provider value={contextValue}>
      {children}
    </LoadingContext.Provider>
  );
}

// Loading indicator component that uses the loading context
export function LoadingIndicator({ 
  id = 'global',
  text = 'Loading...',
  className = '',
}: { 
  id?: string;
  text?: string;
  className?: string;
}) {
  const { loadingIds } = useLoading();
  
  // Only show if this specific ID is loading
  if (!loadingIds.has(id)) {
    return null;
  }
  
  return <InlineLoading text={text} className={className} />;
}

// Higher-order component to add loading state to a component
export function withLoading<P extends object>(
  Component: React.ComponentType<P>,
  loadingId: string = 'global'
): React.FC<P> {
  return (props: P) => {
    const { isLoading, loadingIds } = useLoading();
    const isComponentLoading = loadingIds.has(loadingId);
    
    return (
      <div className="relative">
        {isComponentLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <InlineLoading />
          </div>
        )}
        <div className={isComponentLoading ? 'opacity-50' : ''}>
          <Component {...props} />
        </div>
      </div>
    );
  };
}
