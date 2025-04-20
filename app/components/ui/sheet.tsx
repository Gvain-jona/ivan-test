"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"
import { VisuallyHidden } from "./visually-hidden"

// Simple Sheet implementation without Radix UI to avoid infinite update loops
interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

// Define the Sheet component as a regular function component
function SheetComponent({ open, onOpenChange, children }: SheetProps) {
  // Use a ref to track previous open state to prevent infinite loops
  const prevOpenRef = React.useRef(open);

  // Use React's useEffect to handle body scroll locking
  React.useEffect(() => {
    // Only update if the state actually changed
    if (prevOpenRef.current !== open) {
      prevOpenRef.current = open;

      if (open) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return children;
}

// Then memoize it
const Sheet = React.memo(SheetComponent);

const sheetVariants = cva(
  "fixed z-50 gap-4 bg-[hsl(var(--background))] p-6 shadow-lg transition ease-in-out duration-300",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b",
        bottom: "inset-x-0 bottom-0 border-t",
        left: "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
        right: "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
)

interface SheetContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof sheetVariants> {
  hideCloseButton?: boolean;
}

// Define the SheetContent component as a regular forwardRef component
const SheetContentComponent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  ({ side = "right", className, children, hideCloseButton = false, ...props }, ref) => {
    // Get the Sheet context from the closest Sheet parent
    const sheetContext = React.useContext(SheetContext);

    if (!sheetContext) {
      console.error("SheetContent must be used within a Sheet component");
      return null;
    }

    const { onOpenChange } = sheetContext;

    // Handle escape key press
    React.useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          // Simply call onOpenChange with false
          onOpenChange(false);
        }
      };

      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }, [onOpenChange]);

    // Handle overlay click - use a stable callback to prevent infinite loops
    const handleOverlayClick = React.useCallback(() => {
      // Simply call onOpenChange with false
      onOpenChange(false);
    }, [onOpenChange]);

    return (
      <div className="fixed inset-0 z-50 flex">
        {/* Overlay */}
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm transition-all duration-100 ease-in-out"
          onClick={handleOverlayClick}
        />

        {/* Content */}
        <div
          ref={ref}
          className={cn(sheetVariants({ side }), className)}
          {...props}
        >
          {/* Always include a visually hidden title for accessibility */}
          <VisuallyHidden>
            <h2>Sheet</h2>
          </VisuallyHidden>

          {!hideCloseButton && (
            <button
              onClick={() => {
                console.log('Sheet close button clicked');
                onOpenChange(false);
              }}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          )}
          {children}
        </div>
      </div>
    );
  }
);

// Then memoize it
const SheetContent = React.memo(SheetContentComponent);

// Create a context to share the Sheet state with SheetContent
interface SheetContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SheetContext = React.createContext<SheetContextValue | null>(null);

// Wrap the Sheet component to provide context
function SheetWithContextComponent(props: SheetProps) {
  return (
    <SheetContext.Provider value={{ open: props.open, onOpenChange: props.onOpenChange }}>
      <Sheet {...props} />
    </SheetContext.Provider>
  );
}

const SheetWithContext = React.memo(SheetWithContextComponent);

function SheetHeaderComponent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col space-y-2 text-center sm:text-left",
        className
      )}
      {...props}
    />
  );
}

const SheetHeader = React.memo(SheetHeaderComponent);

function SheetFooterComponent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
        className
      )}
      {...props}
    />
  );
}

const SheetFooter = React.memo(SheetFooterComponent);

function SheetTitleComponent({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("text-lg font-semibold text-foreground", className)}
      {...props}
    />
  );
}

const SheetTitle = React.memo(SheetTitleComponent);

function SheetDescriptionComponent({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

const SheetDescription = React.memo(SheetDescriptionComponent);

// Export dummy components for compatibility
function SheetTriggerComponent({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function SheetCloseComponent({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

const SheetTrigger = React.memo(SheetTriggerComponent);
const SheetClose = React.memo(SheetCloseComponent);

// Export the components
export {
  SheetWithContext as Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
