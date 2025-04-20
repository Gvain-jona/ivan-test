import React, { useCallback, memo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OrderSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  size?: 'default' | 'sm' | 'lg' | 'xl' | 'xxl' | 'full';
  description?: string;
  showCloseButton?: boolean;
  onClose?: () => void;
  customHeader?: React.ReactNode;
}

/**
 * Base component for all order-related side sheets
 * Provides consistent styling and animations for side panel content
 */
const OrderSheet = memo(function OrderSheet({
  open,
  onOpenChange,
  title,
  children,
  size = 'default',
  description,
  showCloseButton = true,
  onClose,
  customHeader
}) {
  // Map size to width class
  const getSizeClass = () => {
    switch (size) {
      case 'sm': return 'sm:max-w-md';
      case 'lg': return 'sm:max-w-xl';
      case 'xl': return 'sm:max-w-2xl';
      case 'xxl': return 'sm:max-w-3xl';
      case 'full': return 'sm:max-w-full';
      default: return 'sm:max-w-lg';
    }
  };

  // Simple function to handle close button click
  const handleClose = () => {
    // Call onClose if provided
    if (onClose) {
      onClose();
    }

    // Just call onOpenChange with false
    console.log('Close button clicked');
    onOpenChange(false);
  };

  // Simple pass-through function for sheet state changes
  const handleOpenChange = useCallback((value: boolean) => {
    // Only call parent if the state is actually changing
    if (value !== open) {
      console.log(`Sheet state change requested: ${value}`);
      onOpenChange(value);
    }
  }, [onOpenChange, open]);

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className={`p-0 bg-background border-border/40 text-foreground ${getSizeClass()}`}
        hideCloseButton={true}
      >
        <div className="h-full flex flex-col">
          <SheetHeader className="p-6 border-b border-[hsl(var(--border))]/40 flex flex-row justify-between items-start bg-[hsl(var(--card))]">
            {customHeader ? (
              <div className="flex-1">
                {/* Always include a SheetTitle for accessibility, but visually hide it if using customHeader */}
                <VisuallyHidden>
                  <SheetTitle>{title || 'Order Details'}</SheetTitle>
                </VisuallyHidden>
                {customHeader}
              </div>
            ) : (
              <div>
                <SheetTitle className="text-xl font-semibold">{title}</SheetTitle>
                {description && (
                  <p className="text-sm text-muted-foreground mt-1">{description}</p>
                )}
              </div>
            )}

            {/* Always show close button for better UX */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full ml-2 flex-shrink-0"
              aria-label="Close panel"
            >
              <X className="h-5 w-5" />
            </Button>
          </SheetHeader>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
});

export default OrderSheet;