'use client';

import { memo, useCallback, useMemo } from 'react';

interface MemoizedComponentProps<T> {
  data: T;
  renderItem: (item: T) => React.ReactNode;
  dependencies?: any[];
  className?: string;
}

/**
 * MemoizedComponent
 * A component that memoizes expensive renders
 * Useful for rendering large lists or complex components
 */
export function MemoizedComponent<T>({
  data,
  renderItem,
  dependencies = [],
  className,
}: MemoizedComponentProps<T>) {
  // Memoize the render function
  const memoizedRenderItem = useCallback(renderItem, dependencies);
  
  // Memoize the rendered content
  const content = useMemo(() => {
    return memoizedRenderItem(data);
  }, [data, memoizedRenderItem]);
  
  return <div className={className}>{content}</div>;
}

/**
 * MemoizedList
 * A component that memoizes a list of items
 * Useful for rendering large lists
 */
export function MemoizedList<T>({
  items,
  renderItem,
  keyExtractor,
  dependencies = [],
  className,
}: {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
  dependencies?: any[];
  className?: string;
}) {
  // Memoize the render function
  const memoizedRenderItem = useCallback(renderItem, dependencies);
  
  // Create a memoized item component
  const ItemComponent = memo(({ item }: { item: T }) => {
    return <>{memoizedRenderItem(item)}</>;
  });
  
  return (
    <div className={className}>
      {items.map((item) => (
        <ItemComponent key={keyExtractor(item)} item={item} />
      ))}
    </div>
  );
}
