# OrdersTable Refactoring Plan

This document outlines a focused, step-by-step plan for refactoring the OrdersTable component to address technical debt and implement UI improvements.

## Current Issues

1. **UI Issues:**
   - Pagination not displaying properly
   - Client ID subtext is unnecessary (Client #client1)
   - Status change UX is poor (too many options in dropdown)
   - Table styling needs improvement

2. **Technical Debt:**
   - Component has too many responsibilities
   - Performance issues with large datasets
   - Prop drilling through multiple components
   - Accessibility limitations

## Refactoring Approach

We'll take a phased approach, focusing on one improvement at a time to minimize risk:

1. Fix pagination display
2. Improve client column display
3. Enhance status change UX
4. Improve table styling
5. Address technical debt

## Phase 1: Fix Pagination Display

### Step 1: Investigate Pagination Issue
- Examine TablePagination component
- Check how it's integrated in OrdersTable
- Identify CSS or conditional rendering issues

### Step 2: Fix Pagination Component
```jsx
// Update the pagination container in OrdersTable.tsx
<div className="border-t border-table-border py-2 px-4">
  {totalPages > 1 && onPageChange && (
    <TablePagination
      currentPage={currentPage}
      totalPages={totalPages}
      totalCount={totalCount}
      onPageChange={onPageChange}
    />
  )}
</div>
```

## Phase 2: Improve Client Column Display

### Step 1: Update OrderRow Component
- Remove client ID subtext
- Enhance client name display

```jsx
// Update in OrderRow.tsx
<div className="flex flex-col">
  <div className="text-sm font-medium text-white">{order.client_name}</div>
  {/* Remove the following line */}
  {/* <div className="text-xs text-table-header">Client #{order.client_id || 'N/A'}</div> */}
</div>
```

## Phase 3: Enhance Status Change UX

### Step 1: Create Status Change Modal Component
```jsx
// Create a new file: StatusChangeModal.tsx
import React from 'react';
import { OrderStatus } from '@/types/orders';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';

interface StatusChangeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStatus: OrderStatus;
  onStatusChange: (status: OrderStatus) => void;
}

const StatusChangeModal: React.FC<StatusChangeModalProps> = ({
  open,
  onOpenChange,
  currentStatus,
  onStatusChange,
}) => {
  const statuses: OrderStatus[] = [
    'pending',
    'in_progress',
    'paused',
    'completed',
    'delivered',
    'cancelled'
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>Change Order Status</SheetTitle>
          <SheetDescription>
            Select a new status for this order
          </SheetDescription>
        </SheetHeader>
        <div className="py-4 space-y-2">
          {statuses.map((status) => (
            <Button
              key={status}
              variant={currentStatus === status ? "default" : "outline"}
              className="w-full justify-start text-left mb-2"
              onClick={() => {
                onStatusChange(status);
                onOpenChange(false);
              }}
            >
              {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
            </Button>
          ))}
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default StatusChangeModal;
```

### Step 2: Update OrderActions Component
```jsx
// Update OrderActions.tsx
import { useState } from 'react';
import StatusChangeModal from './StatusChangeModal';

// Inside the component
const [statusModalOpen, setStatusModalOpen] = useState(false);

// Replace the status submenu with a single option
<DropdownMenuItem
  className="text-white focus:bg-table-hover focus:text-white"
  onClick={() => setStatusModalOpen(true)}
>
  <Clock className="mr-2 h-4 w-4" />
  Change Status
</DropdownMenuItem>

// Add the modal at the end of the component
{canModify && (
  <StatusChangeModal
    open={statusModalOpen}
    onOpenChange={setStatusModalOpen}
    currentStatus={order.status}
    onStatusChange={(status) => onStatusChange(order, status)}
  />
)}
```

## Phase 4: Improve Table Styling

### Step 1: Update Table Styling
```jsx
// Update in OrdersTable.tsx
<div className="border border-table-border rounded-xl overflow-hidden shadow-sm">
  <div 
    ref={tableContainerRef} 
    className="overflow-x-auto overflow-y-hidden max-h-[600px]" 
    style={{ scrollbarGutter: 'stable' }}
  >
    <table className="min-w-full divide-y divide-table-border">
      {/* Table content */}
    </table>
  </div>
</div>
```

## Phase 5: Address Technical Debt

### Step 1: Memoize Callback Functions
```jsx
// In OrdersTable.tsx
const handleRowMouseEnter = useCallback((id: string) => {
  setHoveredRowId(id);
}, []);

const handleRowMouseLeave = useCallback(() => {
  setHoveredRowId(null);
}, []);

// Use these in OrderRow props
<OrderRow
  // Other props
  onMouseEnter={() => handleRowMouseEnter(order.id)}
  onMouseLeave={handleRowMouseLeave}
/>
```

### Step 2: Optimize Sorting Logic
```jsx
// In OrdersTable.tsx
const requestSort = useCallback((key: keyof Order) => {
  setSortConfig(prevConfig => ({
    key,
    direction: 
      prevConfig.key === key && prevConfig.direction === 'ascending' 
        ? 'descending' 
        : 'ascending'
  }));
}, []);
```

### Step 3: Improve Accessibility
```jsx
// Add proper ARIA attributes to the table
<table 
  className="min-w-full divide-y divide-table-border"
  role="grid"
  aria-label="Orders table"
>
  {/* Table content */}
</table>

// Add proper ARIA attributes to sortable columns
<th 
  scope="col" 
  className="w-1/4 px-4 py-3 text-left text-xs font-medium text-table-header uppercase tracking-wider"
  aria-sort={sortConfig.key === 'client_name' ? sortConfig.direction : 'none'}
>
  {/* Column content */}
</th>
```

## Implementation Checklist

### Phase 1: Fix Pagination Display
- [ ] Investigate pagination issue
- [ ] Update pagination container styling
- [ ] Test pagination with different page counts

### Phase 2: Improve Client Column Display
- [ ] Remove client ID subtext from OrderRow
- [ ] Adjust spacing and alignment
- [ ] Test with various client name lengths

### Phase 3: Enhance Status Change UX
- [ ] Create StatusChangeModal component
- [ ] Update OrderActions to use the modal
- [ ] Test status change functionality
- [ ] Ensure proper styling and animations

### Phase 4: Improve Table Styling
- [ ] Update table container styling
- [ ] Adjust row and cell padding/spacing
- [ ] Test responsive behavior
- [ ] Ensure consistent styling across all states

### Phase 5: Address Technical Debt
- [ ] Memoize callback functions
- [ ] Optimize sorting logic
- [ ] Add proper ARIA attributes
- [ ] Test performance with large datasets

## Testing Strategy

For each phase:
1. Test in development environment
2. Verify visual appearance
3. Test functionality
4. Check responsive behavior
5. Verify accessibility

## Rollback Plan

If issues arise:
1. Revert the specific component changes
2. If multiple components are affected, revert to the previous working version
3. Document the issue for future resolution
