import React, { memo } from 'react';
import { Drawer } from 'vaul';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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
   * Stays put while the form scrolls and clears the safe-area inset.
   */
  footer?: React.ReactNode;
}

/**
 * The one sheet primitive (see DESIGN_PHILOSOPHY.md → "Overlays & sheets").
 * Built on `vaul`, so it's a *real* sheet: drag-to-dismiss, focus trap, slide
 * animation, scroll-lock, and keyboard-aware input repositioning — no more
 * hand-rolled affordances.
 *
 * Platform-adaptive: a bottom drawer on mobile (grab handle that actually
 * drags, rounded top, capped height) and a right-side panel on desktop. Every
 * migrated form (order / client / product / field) renders through it.
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
  footer,
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

  return (
    <Drawer.Root
      open={open}
      onOpenChange={onOpenChange}
      direction={isDesktop ? 'right' : 'bottom'}
      repositionInputs
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Drawer.Content
          className={cn(
            'fixed z-50 flex flex-col bg-background text-foreground outline-none',
            isDesktop
              ? cn('inset-y-0 right-0 h-full w-full border-l border-border/40', getSizeClass())
              : 'inset-x-0 bottom-0 max-h-[92dvh] rounded-t-2xl border-t border-border/40',
          )}
        >
          {/* Grab handle — mobile only, and it drags for real now (vaul). */}
          {!isDesktop && (
            <div className="flex shrink-0 justify-center pt-3 pb-1">
              <div className="h-1.5 w-10 rounded-full bg-muted-foreground/30" />
            </div>
          )}

          <div className="flex shrink-0 flex-row items-start justify-between border-b border-border/40 bg-card px-6 py-4 lg:p-6">
            {customHeader ? (
              <div className="flex-1">
                {/* Radix (via vaul) requires a Title for accessibility. */}
                <VisuallyHidden>
                  <Drawer.Title>{title || 'Details'}</Drawer.Title>
                </VisuallyHidden>
                {customHeader}
              </div>
            ) : (
              <div>
                <Drawer.Title className="text-xl font-semibold">{title}</Drawer.Title>
                {description && (
                  <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                )}
              </div>
            )}

            {showCloseButton && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="ml-2 flex-shrink-0 rounded-full text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                aria-label="Close panel"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>

          <div
            className={cn(
              'min-h-0 flex-1 overflow-auto',
              footer ? '' : 'pb-[env(safe-area-inset-bottom)] lg:pb-0',
            )}
          >
            {children}
          </div>

          {footer && (
            <div className="shrink-0 border-t border-border bg-card px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              {footer}
            </div>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
});

export default OrderSheet;
