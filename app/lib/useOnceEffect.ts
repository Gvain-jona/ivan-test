import { useEffect, useRef } from 'react';

/**
 * A utility hook that runs an effect only once when a condition becomes true
 * This helps prevent infinite update loops in React components
 */
export function useOnceEffect(
  callback: () => void | (() => void),
  condition: boolean,
  deps: React.DependencyList = []
) {
  const hasRun = useRef(false);
  
  useEffect(() => {
    if (condition && !hasRun.current) {
      hasRun.current = true;
      return callback();
    }
    
    // Reset the ref when the condition becomes false again
    if (!condition) {
      hasRun.current = false;
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [condition, ...deps]);
}
