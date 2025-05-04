import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BottomOverlayFormProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

/**
 * BottomOverlayForm component that slides up from the bottom of the screen
 * and overlays the content behind it
 */
const BottomOverlayForm: React.FC<BottomOverlayFormProps> = ({
  isOpen,
  onClose,
  title,
  children
}) => {
  // State to handle animation
  const [isAnimating, setIsAnimating] = useState(false);

  // Handle animation on open/close
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    } else {
      // Add a small delay before removing the component from the DOM
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 300); // Match this with the CSS transition duration
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // If not open and not animating, don't render anything
  if (!isOpen && !isAnimating) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:justify-end">
      {/* Backdrop overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-background/20 backdrop-blur-[1px] transition-opacity",
          isOpen ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      {/* Form container */}
      <div
        className={cn(
          "fixed bottom-0 sm:max-w-xl w-full sm:w-[calc(100%-2rem)] max-w-[calc(100%-2rem)] right-0 sm:right-4 bg-background border-t sm:border border-border shadow-xl ring-1 ring-border/50 sm:rounded-t-xl transition-transform duration-300 ease-in-out transform",
          isOpen ? "translate-y-0" : "translate-y-full"
        )}
        style={{ maxWidth: "32rem" }}
      >
        {/* Visual connector to ExpenseViewSheet - only visible on larger screens */}
        <div className="absolute -top-3 right-8 w-10 h-1 bg-border/60 rounded-full hidden sm:block"></div>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/40 bg-muted/10">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default BottomOverlayForm;
