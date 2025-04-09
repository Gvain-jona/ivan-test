# Dynamic Content Loading Patterns

This document outlines the standardized approaches for loading and displaying dynamic content across the Ivan Prints Business Management System. Following these patterns ensures a consistent user experience and optimized performance.

## Default Row Display Rules

### Desktop View
- **Default Row Count**: 10 rows
- **Row Height**: 48px (standard), 64px (with expanded content preview)
- **Table Page Size**: 15 rows per page (when pagination is used)
- **Card Display**: 12 cards per view (3x4 grid)

### Mobile View
- **Default Row Count**: 3 rows
- **Row Height**: 72px (to accommodate touch targets)
- **Card Display**: 4 cards per view (2x2 grid)

## "Show More" Functionality

### Implementation Rules
- **Action Text**: "Show More" (not "Load More" or "See More")
- **Increment**: Always load +5 additional items when "Show More" is clicked
- **Maximum Before Pagination**: 25 items (after this, implement pagination)
- **Loading Indicator**: Show skeleton rows while fetching more items
- **Error Recovery**: On error, show retry button with toast notification

### Code Example
```typescript
const ItemsList = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [visibleCount, setVisibleCount] = useState(
    isMobile ? DEFAULT_MOBILE_COUNT : DEFAULT_DESKTOP_COUNT
  );
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  // Load more items
  const handleShowMore = async () => {
    setIsLoading(true);
    try {
      const newItems = await fetchItems(items.length, LOAD_MORE_INCREMENT);
      setItems([...items, ...newItems]);
      setHasMore(newItems.length === LOAD_MORE_INCREMENT);
    } catch (error) {
      toast.error("Failed to load more items. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="items-list">
      {items.slice(0, visibleCount).map(item => (
        <ItemCard key={item.id} item={item} />
      ))}
      
      {isLoading && (
        <div className="skeleton-container">
          {Array(5).fill(0).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}
      
      {hasMore && !isLoading && (
        <Button 
          variant="ghost" 
          onClick={handleShowMore} 
          className="show-more-button"
        >
          Show More
        </Button>
      )}
    </div>
  );
};
```

## Lazy Loading Images

### Implementation Rules
- **All Images**: Implement lazy loading for all images in lists and cards
- **Placeholders**: Show branded placeholder or blur-up preview while loading
- **Priority Images**: Set `priority` attribute for above-the-fold hero images only
- **Error Fallbacks**: Show generic icon or placeholder on image load failure

### Code Example
```typescript
import { useState } from 'react';
import Image from 'next/image';

const LazyLoadedImage = ({ src, alt, width, height }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  
  return (
    <div className="image-container">
      {!isLoaded && !error && (
        <div className="image-placeholder">
          <ImagePlaceholder />
        </div>
      )}
      
      {!error ? (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          onError={() => setError(true)}
          className={isLoaded ? 'opacity-100' : 'opacity-0'}
        />
      ) : (
        <div className="error-placeholder">
          <ImageErrorIcon />
          <span>Image not available</span>
        </div>
      )}
    </div>
  );
};
```

## Infinite Scroll vs. Pagination

### When to Use Infinite Scroll
- **Personal To-Do**: For task lists that benefit from continuous scrolling
- **Notifications**: For notification feeds where chronological flow is important
- **Search Results**: For initial search results exploration

### When to Use Pagination
- **Orders Table**: For structured data that may need to be referenced by page
- **Expenses Table**: For financial data where precision navigation is important
- **Analytics**: For report data that should be clearly segmented
- **Material Purchases**: For inventory-related data that may be referenced by page

### Hybrid Approach
For some views, implement a hybrid approach:
1. Start with "Show More" pattern for initial 25 items
2. Switch to pagination for navigating larger datasets

## Table Data Loading

### Implementation Rules
- **Initial Load**: Show skeleton rows during initial data fetch
- **Sorting**: Apply loading state only to table body, preserve headers
- **Filtering**: Show filtered skeleton state while applying filters
- **Empty State**: Show contextual empty state message when no results match filters

### Code Example
```typescript
const DataTable = ({ columns, fetchData, filters }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState([]);
  
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const result = await fetchData({
          filters,
          sorting,
          page,
          pageSize
        });
        setData(result.data);
      } catch (error) {
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [filters, sorting, page, pageSize]);
  
  return (
    <div className="table-container">
      <Table>
        <TableHeader columns={columns} sorting={sorting} onSortingChange={setSorting} />
        <TableBody>
          {loading ? (
            <TableSkeletonRows count={10} columnCount={columns.length} />
          ) : data.length > 0 ? (
            data.map(row => <TableRow key={row.id} row={row} columns={columns} />)
          ) : (
            <TableEmptyState message="No data matching your filters" />
          )}
        </TableBody>
      </Table>
    </div>
  );
};
```

## Optimistic Updates

For a more responsive feel, implement optimistic updates for common actions:

### Implementation Rules
- **Task Completion**: Update UI immediately, revert on error
- **Status Changes**: Show new status immediately, revert on error
- **Adding Items**: Show new item with temporary ID, replace with real ID on success
- **Deleting Items**: Fade out item immediately, restore on error

### Code Example
```typescript
const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  
  const markTaskComplete = async (taskId) => {
    // Save original tasks for rollback
    const originalTasks = [...tasks];
    
    // Optimistically update UI
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? { ...task, status: 'completed' } 
        : task
    ));
    
    try {
      // Perform actual API update
      await updateTaskStatus(taskId, 'completed');
    } catch (error) {
      // On error, revert to original state
      setTasks(originalTasks);
      toast.error("Failed to update task status");
    }
  };
  
  return (
    <div className="task-list">
      {tasks.map(task => (
        <TaskItem 
          key={task.id}
          task={task}
          onComplete={() => markTaskComplete(task.id)}
        />
      ))}
    </div>
  );
};
```

## Performance Considerations

### Data Fetching
- **Caching**: Implement React Query or SWR for smart caching
- **Partial Updates**: Use real-time subscriptions for small updates rather than full refetches
- **Batch Requests**: Combine related data requests where possible

### Rendering Optimization
- **Virtualization**: Use virtualized lists for datasets >100 items
- **Memoization**: Memoize expensive calculations and component renders
- **Code Splitting**: Lazy load complex table or chart components

### Mobile Optimization
- **Reduced Dataset**: Fetch fewer items initially on mobile
- **Simplified Views**: Show less columns in tables on mobile
- **Touch-Friendly**: Ensure loading more content works with touch gestures

## Implementation Checklist

- [ ] Default row counts respected (10 desktop, 3 mobile)
- [ ] "Show More" loads +5 items each time
- [ ] Skeleton state shown during all data loading operations
- [ ] Lazy loading implemented for all images
- [ ] Error states and recovery mechanisms in place
- [ ] Optimistic updates implemented for common actions
- [ ] Performance optimizations applied (caching, virtualization)
- [ ] Mobile-specific loading patterns implemented

## Related Documentation
- [Loading States and Error Handling](../ui/loading-error.md)
- [Performance Optimization](../performance/README.md)
- [Mobile Adaptations](../responsive/README.md) 