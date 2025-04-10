'use client';

import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface FilterDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  onReset?: () => void;
  onApply?: () => void;
  side?: 'left' | 'right' | 'top' | 'bottom';
}

export function FilterDrawer({
  open,
  onOpenChange,
  title = 'Filters',
  description = 'Filter your data',
  children,
  onReset,
  onApply,
  side = 'left'
}: FilterDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={side} className="w-[350px] sm:w-[400px] overflow-y-auto custom-scrollbar">
        <SheetHeader className="mb-5">
          <div className="flex items-center justify-between">
            <SheetTitle>{title}</SheetTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        
        <div className="space-y-5 pb-6">
          {children}
        </div>
        
        {(onReset || onApply) && (
          <SheetFooter className="flex flex-row gap-2 sm:space-x-0 border-t pt-4 mt-4">
            {onReset && (
              <Button 
                variant="outline" 
                onClick={onReset}
                className="flex-1"
              >
                Reset
              </Button>
            )}
            {onApply && (
              <Button 
                onClick={() => {
                  onApply();
                  onOpenChange(false);
                }}
                className="flex-1"
              >
                Apply Filters
              </Button>
            )}
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
