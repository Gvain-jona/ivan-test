# Order Form UI Improvement Plan

## Overview

This document outlines the plan to improve the UI of the order form by:
1. Removing the double close buttons in the drawer
2. Replacing the tab approach with collapsible sections for different form parts

## Current Implementation Analysis

The current order form uses:
- A tabbed interface with `Tabs` component from Radix UI
- Multiple form sections (General Info, Items, Payments, Notes) displayed in separate tabs
- Potentially redundant close buttons in the drawer/sheet component

## UI Improvement Plan

### 1. Create Accordion Component

Since there's no existing accordion component in the codebase, we'll need to create one using Radix UI primitives. We'll implement a custom accordion component that:

- Uses collapsible sections
- Allows multiple sections to be open simultaneously
- Provides visual indicators for expanded/collapsed states
- Supports smooth animations

### 2. Modify OrderFormSheet Component

- Remove redundant close buttons
- Replace the tabbed interface with the new accordion component
- Ensure all form sections are visible at once but collapsible

### 3. Update Form Section Components

- Modify the existing form section components to work with the accordion layout
- Ensure proper state management between sections
- Maintain all current functionality

## Implementation Steps

### Step 1: Create Accordion Component

Create a new component `app/components/ui/accordion.tsx` using Radix UI primitives:

```typescript
"use client"

import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

const Accordion = AccordionPrimitive.Root

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn("border-b border-border/40", className)}
    {...props}
  />
))
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:text-accent-foreground [&[data-state=open]>svg]:rotate-180",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
))
AccordionTrigger.displayName = "AccordionTrigger"

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className={cn(
      "overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
      className
    )}
    {...props}
  >
    <div className="pb-4 pt-0">{children}</div>
  </AccordionPrimitive.Content>
))
AccordionContent.displayName = "AccordionContent"

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
```

### Step 2: Update OrderFormSheet Component

Modify the `app/components/orders/OrderFormSheet.tsx` component to:
1. Remove redundant close buttons
2. Replace tabs with accordion sections

```typescript
// Updated OrderFormSheet.tsx with accordion sections
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Order } from '@/types/orders';
import { Ban, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useModalState } from '@/hooks/ui/useModalState';
import { useOrderForm } from '@/hooks/orders/useOrderForm';
import ApprovalDialog, { DeletionRequest, DeletionType } from '@/components/ui/approval-dialog';
import OrderSheet from '@/components/ui/sheets/OrderSheet';
import { motion } from 'framer-motion';
import { buttonHover } from '@/utils/animation-variants';
import { 
  Accordion, 
  AccordionItem, 
  AccordionTrigger, 
  AccordionContent 
} from '@/components/ui/accordion';

// Import sub-components
import OrderGeneralInfoForm from './OrderFormModal/OrderGeneralInfoForm';
import OrderItemsForm from './OrderFormModal/OrderItemsForm';
import OrderPaymentsForm from './OrderFormModal/OrderPaymentsForm';
import OrderNotesForm from './OrderFormModal/OrderNotesForm';

// ... rest of the component
```

### Step 3: Update Form Section Components

Modify each form section component to work with the accordion layout:

1. Update `OrderGeneralInfoForm.tsx`
2. Update `OrderItemsForm.tsx`
3. Update `OrderPaymentsForm.tsx`
4. Update `OrderNotesForm.tsx`

Each component will need to be modified to:
- Remove the `TabsContent` wrapper
- Remove the `active` prop and related conditional rendering
- Ensure proper state management between sections

### Step 4: Install Required Dependencies

Ensure the Radix UI accordion package is installed:

```bash
npm install @radix-ui/react-accordion
```

## Testing Plan

1. Test the accordion component with various content types
2. Verify that all form sections can be expanded/collapsed correctly
3. Ensure form validation works across all sections
4. Test form submission with data from multiple sections
5. Verify that the form state is maintained when switching between sections

## Future Enhancements

1. Add visual indicators for sections with validation errors
2. Implement auto-expansion of sections with errors on form submission
3. Add keyboard navigation between sections
4. Consider adding a progress indicator for form completion
