# Mock Data Cleanup Plan

This document details all the mock data found in the orders page and related components, and outlines our plan to replace them with proper error states and real data fetching.

## Identified Mock Data

### Sample Data Files

1. **`app/dashboard/orders/_data/sample-orders.ts`**
   - Contains `SAMPLE_ORDERS` array with fake order data
   - Used as fallback in multiple components

2. **`app/dashboard/orders/_data/sample-tasks.ts`**
   - Contains `SAMPLE_TASKS` array with fake task data
   - Used in the TasksTab component

3. **`app/dashboard/orders/_data/metrics-data.ts`**
   - Contains `METRICS_DATA` object with fake metrics
   - Used in the OrdersPageContext

### Hardcoded Mock Data in Components

4. **`app/dashboard/orders/_components/InsightsTab.tsx`**
   - Hardcoded weekly data: `values: [30, 45, 60, 75, 90, 40, 35]`
   - Hardcoded metrics: `responseTime: '15m'`, `avgResolutionTime: '48m'`, etc.
   - Mock pending invoices data: `pendingInvoicesData` array

5. **`app/dashboard/orders/_components/TasksTab.tsx`**
   - Mock function `getOrderItems` returning fake order items
   - Hardcoded task data

6. **`app/lib/supabase.ts`**
   - Mock orders data: `mockOrders` array
   - Mock expenses data: `mockExpenses` array

7. **`app/api/orders/route.ts`**
   - Sample order fallback when no orders are found

### Mock Data in Context Providers

8. **`app/dashboard/orders/_context/OrdersPageContext.tsx`**
   - Imports and uses `SAMPLE_TASKS` and `METRICS_DATA`
   - Sets initial state with mock data: `useState<Task[]>(SAMPLE_TASKS)`

### Mock Data in Hooks

9. **`app/hooks/useRealOrders.ts`**
   - Imports `SAMPLE_ORDERS` from sample data file

### Database Seed Data

10. **`supabase/orders_mock_data.sql`**
    - SQL script to generate test data in the database
    - This is acceptable for development but should be clearly marked as such

## Cleanup Strategy

### 1. Remove Sample Data Files

- [ ] Delete or archive the following files:
  - `app/dashboard/orders/_data/sample-orders.ts`
  - `app/dashboard/orders/_data/sample-tasks.ts`
  - `app/dashboard/orders/_data/metrics-data.ts`

### 2. Replace Mock Data with Real Data Fetching

#### InsightsTab Component

- [ ] Replace hardcoded weekly data with real analytics data:

```typescript
// Before
const weeklyData = {
  days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  values: [30, 45, 60, 75, 90, 40, 35],
  target: 30,
  activeDay: 'Fri'
};

// After
const { data: weeklyData, isLoading: weeklyDataLoading } = useOrderAnalytics({
  period: 'weekly',
  metric: 'orders'
});

// With proper loading state
{weeklyDataLoading ? (
  <WeeklyDataSkeleton />
) : (
  <WeeklyChart data={weeklyData} />
)}
```

- [ ] Replace mock pending invoices with real data:

```typescript
// Before
const pendingInvoicesData = [
  { id: '1', clientName: 'John Doe', amount: 450000, dueDate: '2023-12-15', status: 'pending' },
  // ...more mock data
];

// After
const { data: pendingInvoices, isLoading: invoicesLoading } = usePendingInvoices();

// With proper loading and empty states
{invoicesLoading ? (
  <InvoicesSkeleton />
) : pendingInvoices.length === 0 ? (
  <EmptyInvoicesState />
) : (
  <InvoicesList invoices={pendingInvoices} />
)}
```

#### TasksTab Component

- [ ] Replace mock `getOrderItems` function with real data fetching:

```typescript
// Before
const getOrderItems = (taskId: string) => {
  // In a real app, you would fetch this data from your API
  return [
    { id: 1, type: 'Business Cards', category: 'Premium', size: 'A5', quantity: 500, price: 75.99 },
    // ...more mock data
  ];
};

// After
const getOrderItems = async (taskId: string) => {
  const { data, error } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', taskId);
    
  if (error) {
    console.error('Error fetching order items:', error);
    return [];
  }
  
  return data;
};

// With React Query
const { data: orderItems, isLoading } = useQuery(
  ['orderItems', taskId],
  () => getOrderItems(taskId),
  { enabled: !!taskId }
);
```

#### OrdersPageContext

- [ ] Replace mock tasks with real data fetching:

```typescript
// Before
const [filteredTasks, setFilteredTasks] = useState<Task[]>(SAMPLE_TASKS);

// After
const { data: tasks, isLoading: tasksLoading } = useTasks(taskFilters);
const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);

useEffect(() => {
  if (tasks) {
    setFilteredTasks(tasks);
  }
}, [tasks]);
```

- [ ] Replace mock metrics with real data:

```typescript
// Before
const [stats, setStats] = useState(METRICS_DATA);

// After
const { data: stats, isLoading: statsLoading } = useOrderStats();
```

### 3. Implement Proper Error States

#### Empty State Components

- [ ] Create reusable empty state components:

```typescript
// app/components/ui/empty-states.tsx
export function OrdersEmptyState({ onCreateNew }: { onCreateNew?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="rounded-full bg-muted p-3 mb-4">
        <ShoppingBag className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">No orders found</h3>
      <p className="text-sm text-muted-foreground mb-4">
        There are no orders matching your current filters.
      </p>
      {onCreateNew && (
        <Button onClick={onCreateNew}>Create New Order</Button>
      )}
    </div>
  );
}

export function TasksEmptyState({ onCreateNew }: { onCreateNew?: () => void }) {
  // Similar implementation for tasks
}

export function InsightsEmptyState() {
  // Implementation for insights with no data
}
```

#### Loading State Components

- [ ] Create reusable skeleton loaders:

```typescript
// app/components/ui/skeletons.tsx
export function OrderRowSkeleton() {
  return (
    <div className="flex items-center space-x-4 p-4 animate-pulse">
      <div className="h-10 w-10 rounded-full bg-muted" />
      <div className="space-y-2 flex-1">
        <div className="h-4 w-3/4 bg-muted rounded" />
        <div className="h-4 w-1/2 bg-muted rounded" />
      </div>
      <div className="h-8 w-24 bg-muted rounded" />
    </div>
  );
}

export function OrdersTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array(rows).fill(0).map((_, i) => (
        <OrderRowSkeleton key={i} />
      ))}
    </div>
  );
}

export function InsightsCardSkeleton() {
  // Implementation for insights card skeleton
}

export function TaskCardSkeleton() {
  // Implementation for task card skeleton
}
```

#### Error State Components

- [ ] Create reusable error state components:

```typescript
// app/components/ui/error-states.tsx
export function DataFetchError({ 
  message = "Failed to load data", 
  onRetry 
}: { 
  message?: string, 
  onRetry?: () => void 
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="rounded-full bg-red-100 p-3 mb-4">
        <AlertTriangle className="h-6 w-6 text-red-600" />
      </div>
      <h3 className="text-lg font-medium mb-2">Something went wrong</h3>
      <p className="text-sm text-muted-foreground mb-4">
        {message}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          Try Again
        </Button>
      )}
    </div>
  );
}
```

### 4. Remove API Route Fallbacks

- [ ] Update API routes to return proper error responses instead of mock data:

```typescript
// Before (in api/orders/route.ts)
if (transformedOrders.length === 0) {
  console.log('No orders found in database, adding a sample order for testing');
  transformedOrders.push({
    id: 'sample-order-1',
    // ...more mock data
  });
}

// After
if (transformedOrders.length === 0) {
  console.log('No orders found in database');
  // Return empty array, let the UI handle empty state
  return NextResponse.json({
    orders: [],
    totalCount: 0,
    pageCount: 0
  });
}
```

### 5. Update Hooks to Handle Empty Data

- [ ] Update hooks to handle empty data properly:

```typescript
// Before
return {
  orders: data?.orders || SAMPLE_ORDERS,
  // ...
};

// After
return {
  orders: data?.orders || [],
  isLoading,
  isError: error,
  isEmpty: data?.orders?.length === 0,
  // ...
};
```

## Testing Strategy

To ensure our mock data cleanup doesn't break functionality, we'll implement the following testing strategy:

1. **Create Test Database**: Ensure a test database with sufficient data for testing all scenarios

2. **Test Empty States**: Verify all empty state components render correctly

3. **Test Loading States**: Verify all loading state components render correctly

4. **Test Error States**: Simulate API errors and verify error state components render correctly

5. **End-to-End Testing**: Perform end-to-end testing of the entire orders flow

## Implementation Timeline

### Phase 1: Preparation (Day 1-2)

- Create empty state components
- Create loading state components
- Create error state components

### Phase 2: Component Updates (Day 3-5)

- Update InsightsTab component
- Update TasksTab component
- Update OrdersPageContext

### Phase 3: API and Hook Updates (Day 6-7)

- Update API routes
- Update hooks
- Remove sample data files

### Phase 4: Testing and Refinement (Day 8-10)

- Test all scenarios
- Fix any issues
- Final cleanup
