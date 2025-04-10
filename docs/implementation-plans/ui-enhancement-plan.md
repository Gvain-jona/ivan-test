# UI Enhancement Implementation Plan

This document outlines the detailed implementation plan for enhancing the UI of the Orders Management page. Each task is broken down into specific steps with considerations for code organization, animations, and performance.

## Table of Contents

1. [Install Dependencies](#install-dependencies)
2. [Remove Payment Status Column](#remove-payment-status-column)
3. [Enhance Pagination Controls](#enhance-pagination-controls)
4. [Convert Modals to Side Sheets](#convert-modals-to-side-sheets)
5. [Add Animations with Framer Motion](#add-animations-with-framer-motion)
6. [Testing and Quality Assurance](#testing-and-quality-assurance)

## Install Dependencies

### Step 1: Install Framer Motion and Shadcn UI Sheet Component

```bash
npm install framer-motion
npx shadcn-ui@latest add sheet
```

### Step 2: Create Animation Utility File

Create a new utility file for reusable animation variants:

**File Path**: `app/utils/animation-variants.ts`

```typescript
export const slideInRight = {
  initial: { x: '100%', opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { type: 'spring', damping: 25, stiffness: 300 } },
  exit: { x: '100%', opacity: 0, transition: { type: 'spring', damping: 30, stiffness: 300 } }
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

export const tableRowHover = {
  initial: { backgroundColor: 'rgba(0, 0, 0, 0)' },
  hover: { backgroundColor: 'rgba(255, 255, 255, 0.03)', transition: { duration: 0.2 } }
};

export const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.05
    }
  }
};

export const tablePaginationVariant = {
  initial: { y: 10, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { type: 'spring', damping: 25 } },
  exit: { y: -10, opacity: 0, transition: { duration: 0.2 } }
};
```

## Remove Payment Status Column

### Step 1: Modify OrdersTable Component

**File Path**: `app/components/orders/OrdersTable.tsx`

1. Remove the "Payment Status" column from the table header
2. Update column count in empty state and loading skeletons
3. Ensure responsive behavior is maintained

### Step 2: Update OrderRow Component

**File Path**: `app/components/orders/OrderRow.tsx`

1. Remove the Payment Status cell from the row
2. Update expanded row column span from 9 to 8
3. Ensure alignment of other cells is maintained

## Enhance Pagination Controls

### Step 1: Create Dedicated Pagination Component

**File Path**: `app/components/ui/pagination/TablePagination.tsx`

```typescript
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { tablePaginationVariant } from '@/utils/animation-variants';

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  totalPages,
  totalCount,
  onPageChange
}) => {
  // Generate pagination range with dots
  const getPaginationRange = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    
    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }
    
    if (currentPage > delta + 1) {
      rangeWithDots.push(1);
    }
    
    if (currentPage > delta + 2) {
      rangeWithDots.push('dots1');
    }
    
    rangeWithDots.push(...range);
    
    if (currentPage < totalPages - delta - 1) {
      rangeWithDots.push('dots2');
    }
    
    if (totalPages > 1 && currentPage < totalPages - delta) {
      rangeWithDots.push(totalPages);
    }
    
    return rangeWithDots;
  };

  return (
    <motion.div 
      key={`pagination-${currentPage}`}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={tablePaginationVariant}
      className="px-4 py-3 border-t border-[#2B2B40] sm:px-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 flex justify-between sm:hidden">
          <Button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            variant="outline"
            size="sm"
            className="border-[#2B2B40] bg-transparent text-[#6D6D80] hover:bg-white/[0.02] hover:text-white disabled:opacity-50"
          >
            Previous
          </Button>
          <Button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            variant="outline"
            size="sm"
            className="ml-3 border-[#2B2B40] bg-transparent text-[#6D6D80] hover:bg-white/[0.02] hover:text-white disabled:opacity-50"
          >
            Next
          </Button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-[#6D6D80]">
              Showing <span className="font-medium text-white">{(currentPage - 1) * 10 + 1}</span> to{' '}
              <span className="font-medium text-white">
                {Math.min(currentPage * 10, totalCount)}
              </span>{' '}
              of <span className="font-medium text-white">{totalCount}</span> results
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <Button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
                className="border-[#2B2B40] bg-transparent text-[#6D6D80] hover:bg-white/[0.02] hover:text-white disabled:opacity-50 rounded-l-md"
              >
                <span className="sr-only">Previous</span>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <AnimatePresence mode="wait">
                {getPaginationRange().map((page, index) => (
                  page === 'dots1' || page === 'dots2' ? (
                    <span
                      key={`dots-${index}`}
                      className="relative inline-flex items-center px-4 py-2 border border-[#2B2B40] bg-transparent text-sm font-medium text-[#6D6D80]"
                    >
                      ...
                    </span>
                  ) : (
                    <motion.div
                      key={`page-${page}`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        onClick={() => onPageChange(Number(page))}
                        variant="outline"
                        size="sm"
                        className={cn(
                          "border-[#2B2B40] bg-transparent text-[#6D6D80] hover:bg-white/[0.02] hover:text-white",
                          currentPage === page && "bg-orange-500 text-white hover:bg-orange-600 border-orange-500"
                        )}
                      >
                        {page}
                      </Button>
                    </motion.div>
                  )
                ))}
              </AnimatePresence>
              
              <Button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
                className="border-[#2B2B40] bg-transparent text-[#6D6D80] hover:bg-white/[0.02] hover:text-white disabled:opacity-50 rounded-r-md"
              >
                <span className="sr-only">Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </nav>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TablePagination;
```

### Step 2: Update OrdersTable to Use the New Pagination Component

1. Replace the existing pagination code with the new component
2. Ensure proper props are passed to the pagination component
3. Remove duplicated code

## Convert Modals to Side Sheets

### Step 1: Create Base Sheet Component for Orders

**File Path**: `app/components/ui/sheets/OrderSheet.tsx`

```typescript
import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { motion } from 'framer-motion';
import { slideInRight } from '@/utils/animation-variants';

interface OrderSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  size?: 'default' | 'sm' | 'lg' | 'xl' | 'full';
}

const OrderSheet: React.FC<OrderSheetProps> = ({
  open,
  onOpenChange,
  title,
  children,
  size = 'default'
}) => {
  // Map size to width class
  const getSizeClass = () => {
    switch (size) {
      case 'sm': return 'sm:max-w-md';
      case 'lg': return 'sm:max-w-2xl';
      case 'xl': return 'sm:max-w-4xl';
      case 'full': return 'sm:max-w-full';
      default: return 'sm:max-w-xl';
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className={`p-0 bg-gray-950 border-gray-800 text-white ${getSizeClass()}`}
      >
        <motion.div
          initial="initial"
          animate="animate"
          exit="exit"
          variants={slideInRight}
          className="h-full flex flex-col"
        >
          <SheetHeader className="p-6 border-b border-gray-800">
            <SheetTitle className="text-xl font-semibold text-white">{title}</SheetTitle>
          </SheetHeader>
          
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </motion.div>
      </SheetContent>
    </Sheet>
  );
};

export default OrderSheet;
```

### Step 2: Convert OrderFormModal to OrderFormSheet

**File Path**: `app/components/orders/OrderFormSheet/index.tsx`

1. Create the new component based on the existing OrderFormModal
2. Replace Dialog components with the new OrderSheet
3. Update styling for side panel layout
4. Keep the same functionality for tabs and form sections

### Step 3: Convert OrderViewModal to OrderViewSheet

**File Path**: `app/components/orders/OrderViewSheet.tsx`

1. Create the new component based on the existing OrderViewModal
2. Replace Dialog components with the new OrderSheet
3. Update styling for side panel layout
4. Keep the same functionality for tabs and information display

### Step 4: Convert InvoiceModal to InvoiceSheet

**File Path**: `app/components/orders/InvoiceSheet.tsx`

1. Create the new component based on the existing InvoiceModal
2. Replace Dialog components with the new OrderSheet
3. Update styling for side panel layout
4. Keep the same functionality for invoice preview and settings

### Step 5: Update OrdersPage to Use New Sheet Components

Update OrdersPage to import and use the new Sheet components instead of the Dialog components.

## Add Animations with Framer Motion

### Step 1: Enhance OrderRow with Animation

**File Path**: `app/components/orders/OrderRow.tsx`

1. Wrap component with motion components
2. Add hover animations
3. Add transition effects for expansion

### Step 2: Add List Animations to Orders Table

**File Path**: `app/components/orders/OrdersTable.tsx`

1. Use AnimatePresence for list animations
2. Add staggered animations for table rows
3. Add loading state animations

### Step 3: Add Animation to Sheet Transitions

Ensure all sheet components use the appropriate animation variants from the utility file.

## Testing and Quality Assurance

### Step 1: Verify UI Responsiveness

1. Test on different screen sizes
2. Ensure mobile layout works correctly
3. Verify side sheets adapt to small screens

### Step 2: Performance Testing

1. Check animation performance
2. Verify no lag on lower-end devices
3. Optimize animations if needed

### Step 3: Accessibility Review

1. Ensure focus management works with new components
2. Verify keyboard navigation for all interactive elements
3. Test screen reader compatibility

## Implementation Timeline

- Day 1: Install dependencies, remove payment status column, enhance pagination
- Day 2: Create base sheet component, convert OrderFormModal to sheet
- Day 3: Convert OrderViewModal and InvoiceModal to sheets
- Day 4: Add animations with Framer Motion
- Day 5: Testing, bug fixes, and quality assurance 