import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { motion } from 'framer-motion';
import { slideInRight, sheetContent } from '@/utils/animation-variants';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OrderSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  size?: 'default' | 'sm' | 'lg' | 'xl' | 'full';
  description?: string;
  showCloseButton?: boolean;
  onClose?: () => void;
}

/**
 * Base component for all order-related side sheets
 * Provides consistent styling and animations for side panel content
 */
const OrderSheet: React.FC<OrderSheetProps> = ({
  open,
  onOpenChange,
  title,
  children,
  size = 'default',
  description,
  showCloseButton = true,
  onClose
}) => {
  // Map size to width class
  const getSizeClass = () => {
    switch (size) {
      case 'sm': return 'sm:max-w-md';
      case 'lg': return 'sm:max-w-xl';
      case 'xl': return 'sm:max-w-2xl';
      case 'full': return 'sm:max-w-full';
      default: return 'sm:max-w-lg';
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={`p-0 bg-background border-border/40 text-foreground ${getSizeClass()}`}
        hideCloseButton={true}
      >
        <motion.div
          initial="initial"
          animate="animate"
          exit="exit"
          variants={slideInRight}
          className="h-full flex flex-col"
        >
          <SheetHeader className="p-6 border-b border-[hsl(var(--border))]/40 flex flex-row justify-between items-center bg-[hsl(var(--card))]">
            <div>
              <SheetTitle className="text-xl font-semibold">{title}</SheetTitle>
              {description && (
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              )}
            </div>

            {showCloseButton && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full"
                aria-label="Close panel"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </SheetHeader>

          <motion.div
            className="flex-1 overflow-auto"
            variants={sheetContent}
          >
            {children}
          </motion.div>
        </motion.div>
      </SheetContent>
    </Sheet>
  );
};

export default OrderSheet;