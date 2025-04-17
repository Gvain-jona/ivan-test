'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';

interface LazyDataLoaderProps {
  onLoad: () => Promise<void>;
  threshold?: number;
  rootMargin?: string;
  children?: React.ReactNode;
  loadingComponent?: React.ReactNode;
  className?: string;
}

/**
 * LazyDataLoader Component
 * Loads data when the component comes into view
 * Useful for loading data only when needed
 */
export function LazyDataLoader({
  onLoad,
  threshold = 0.1,
  rootMargin = '200px',
  children,
  loadingComponent,
  className,
}: LazyDataLoaderProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const hasLoaded = useRef(false);
  
  // Set up intersection observer
  const { ref, inView } = useInView({
    threshold,
    rootMargin,
    triggerOnce: true,
  });
  
  useEffect(() => {
    // Only load data once when the component comes into view
    if (inView && !hasLoaded.current && !isLoading) {
      const loadData = async () => {
        setIsLoading(true);
        try {
          await onLoad();
          setIsLoaded(true);
          hasLoaded.current = true;
        } catch (error) {
          console.error('Error loading data:', error);
        } finally {
          setIsLoading(false);
        }
      };
      
      loadData();
    }
  }, [inView, onLoad, isLoading]);
  
  return (
    <div ref={ref} className={className}>
      {isLoading && loadingComponent}
      {isLoaded && children}
    </div>
  );
}
