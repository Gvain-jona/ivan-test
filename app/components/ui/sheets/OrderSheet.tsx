import React, { useCallback, memo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMediaQuery } from '@/hooks/use-media-query';

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
  /**
   * Sticky action bar pinned below the scrollable body (e.g. Cancel + Save).
   * Stays put while the form scrolls and clears the safe-area inset, so the
   * primary action is always reachable — the reference form behavior.
   */
  footer?: React.ReactNode;
}

/**
 * Base component for all migrated form sheets (order / client / product).
 *
 * Platform-adaptive per docs/mobile-responsiveness/DESIGN_PHILOSOPHY.md:
 * - Mobile (< lg): a **bottom sheet** — grab handle, rounded top, capped
 *   height so the dimmed parent still shows, safe-area aware.
 * - Desktop (lg+): the **right-side panel** (unchanged), width by `size`.
 *
 * One wrapper, so every form that renders through it gets the same behavior.
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
  customHeader,
  footer
}: OrderSheetProps) {
  // lg = 1024px, matching the shell's mobile/desktop breakpoint.
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  // Desktop right-panel width by size.
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

  const handleClose = () => {
    if (onClose) onClose();
    onOpenChange(false);
  };

  const handleOpenChange = useCallback((value: boolean) => {
    // Only call parent if the state is actually changing
    if (value !== open) {
      onOpenChange(value);
    }
  }, [onOpenChange, open]);

  const side = isDesktop ? 'right' : 'bottom';
  // Bottom sheet gets its shape (rounded top, capped height); the right panel
  // gets its width. `p-0` in both — header/body own their padding.
  const shapeClass = isDesktop ? getSizeClass() : 'max-h-[85dvh] rounded-t-2xl';

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side={side}
        className={`flex flex-col gap-0 p-0 bg-background border-border/40 text-foreground ${shapeClass}`}
        hideCloseButton={true}
      >
        {/* Grab handle — mobile bottom sheet only. */}
        <div className="flex shrink-0 justify-center pt-3 pb-1 lg:hidden">
          <div className="h-1.5 w-10 rounded-full bg-muted-foreground/30" />
        </div>

        <SheetHeader className="flex shrink-0 flex-row items-start justify-between border-b border-[hsl(var(--border))]/40 bg-[hsl(var(--card))] px-6 pb-4 pt-2 lg:p-6">
          {customHeader ? (
            <div className="flex-1">
              {/* Always include a SheetTitle for accessibility, hidden when using customHeader */}
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

          {showCloseButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full ml-2 flex-shrink-0"
              aria-label="Close panel"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </SheetHeader>

        <div
          className={`min-h-0 flex-1 overflow-auto ${
            footer ? '' : 'pb-[env(safe-area-inset-bottom)] lg:pb-0'
          }`}
        >
          {children}
        </div>

        {footer && (
          <div className="shrink-0 border-t border-border bg-card px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
});

export default OrderSheet;
