"use client"

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface CustomDropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'start' | 'end' | 'center';
  className?: string;
  contentClassName?: string;
  sideOffset?: number;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}

export function CustomDropdown({
  trigger,
  children,
  align = 'center',
  className,
  contentClassName,
  sideOffset = 5,
  isOpen: controlledIsOpen,
  onOpenChange
}: CustomDropdownProps) {
  // Use internal state if not controlled
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  // Determine if we're using controlled or uncontrolled state
  const isControlled = controlledIsOpen !== undefined;
  const isOpenState = isControlled ? controlledIsOpen : internalIsOpen;

  // Function to update open state
  const updateOpenState = (newIsOpen: boolean) => {
    if (!isControlled) {
      setInternalIsOpen(newIsOpen);
    }
    if (onOpenChange) {
      onOpenChange(newIsOpen);
    }
  };

  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if the click is outside both the trigger and the content
      const target = event.target as Node;
      const isTriggerClick = triggerRef.current && triggerRef.current.contains(target);
      const isContentClick = contentRef.current && contentRef.current.contains(target);

      if (isOpenState && !isTriggerClick && !isContentClick) {
        updateOpenState(false);
      }
    };

    if (isOpenState) {
      // Use capture phase to ensure we get the event before other handlers
      document.addEventListener('mousedown', handleClickOutside, true);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [isOpenState]);

  // Position the dropdown content based on the trigger
  const updatePosition = React.useCallback(() => {
    if (isOpenState && triggerRef.current && contentRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const contentRect = contentRef.current.getBoundingClientRect();

      let left = 0;
      if (align === 'start') {
        left = 0;
      } else if (align === 'end') {
        left = triggerRect.width - contentRect.width;
      } else {
        left = (triggerRect.width - contentRect.width) / 2;
      }

      // Calculate position relative to the viewport
      const absoluteLeft = triggerRect.left + left;
      const absoluteTop = triggerRect.bottom + sideOffset;

      // Ensure the dropdown doesn't go off-screen
      const rightEdge = absoluteLeft + contentRect.width;
      const adjustedLeft = rightEdge > window.innerWidth
        ? window.innerWidth - contentRect.width - 10
        : Math.max(10, absoluteLeft);

      // Set position fixed to ensure it's not constrained by parent containers
      contentRef.current.style.position = 'fixed';
      contentRef.current.style.left = `${adjustedLeft}px`;
      contentRef.current.style.top = `${absoluteTop}px`;
    }
  }, [isOpenState, align, sideOffset]);

  // Update position when dropdown opens or window resizes
  useEffect(() => {
    if (isOpenState) {
      // Initial position update
      updatePosition();

      // Update position again after a small delay to ensure content is fully rendered
      const timer = setTimeout(updatePosition, 50);

      // Add event listeners for window resize and scroll
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    }
  }, [isOpenState, updatePosition]);

  // Use a ref to track if we're currently toggling the dropdown
  const isTogglingRef = useRef(false);

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    // Prevent rapid toggling
    if (isTogglingRef.current) return;

    // Set toggling flag to prevent multiple triggers
    isTogglingRef.current = true;

    // Toggle dropdown state
    updateOpenState(!isOpenState);

    // Reset toggling flag after a short delay
    setTimeout(() => {
      isTogglingRef.current = false;
    }, 200);
  };

  return (
    <div
      ref={dropdownRef}
      className={cn("relative inline-block", className)}
    >
      <div
        ref={triggerRef}
        onClick={handleTriggerClick}
        className={cn(
          "cursor-pointer interactive-element transition-all duration-150",
          isOpenState ? "opacity-100" : "hover:opacity-80"
        )}
        data-dropdown-trigger="true"
      >
        {trigger}
      </div>

      {isOpenState && typeof document !== 'undefined' && createPortal(
        <div
          ref={contentRef}
          className={cn(
            "fixed z-[9999] min-w-[8rem] overflow-hidden rounded-md border bg-background p-1 shadow-lg",
            "animate-in fade-in-0 zoom-in-95 duration-150",
            contentClassName
          )}
          style={{
            animationDelay: '30ms',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4)'
          }}
          onClick={(e) => e.stopPropagation()}
          data-dropdown-content="true"
        >
          {children}
        </div>,
        document.body
      )}
    </div>
  );
}

export function CustomDropdownItem({
  children,
  className,
  onClick,
  disabled = false
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
}) {
  // Use a ref to track if we're currently processing a click
  const isProcessingClick = useRef(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    // Prevent multiple rapid clicks or if disabled
    if (disabled || isProcessingClick.current) return;

    if (onClick) {
      // Set processing flag to prevent multiple triggers
      isProcessingClick.current = true;

      // Add visual feedback with a slight delay before action
      const element = e.currentTarget as HTMLElement;
      element.classList.add('bg-gray-700/70');

      // Execute the click handler after a small delay
      setTimeout(() => {
        onClick(e);
        element.classList.remove('bg-gray-700/70');

        // Reset processing flag after a short delay to prevent rapid re-clicks
        setTimeout(() => {
          isProcessingClick.current = false;
        }, 100);
      }, 50);
    }
  };

  return (
    <div
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors interactive-element",
        "hover:bg-gray-800/50 active:bg-gray-700/70 focus:bg-gray-800/50",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onClick={handleClick}
      data-disabled={disabled || undefined}
      data-dropdown-item="true"
    >
      {children}
    </div>
  );
}

export function CustomDropdownSeparator({ className }: { className?: string }) {
  return (
    <div className={cn("-mx-1 my-1 h-px bg-muted", className)} />
  );
}
