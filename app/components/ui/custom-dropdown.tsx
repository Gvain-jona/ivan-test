"use client"

import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { cn } from "@/lib/utils"

// Re-export the basic components
export const CustomDropdownMenu = DropdownMenuPrimitive.Root
export const CustomDropdownMenuTrigger = DropdownMenuPrimitive.Trigger
export const CustomDropdownMenuGroup = DropdownMenuPrimitive.Group
export const CustomDropdownMenuSeparator = DropdownMenuPrimitive.Separator
export const CustomDropdownMenuLabel = DropdownMenuPrimitive.Label

// Create a custom content component with improved animation handling
export const CustomDropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content> & {
    preventClose?: boolean;
  }
>(({ className, sideOffset = 4, preventClose = false, ...props }, ref) => {
  // Handle click to prevent propagation if preventClose is true
  const handleClick = (e: React.MouseEvent) => {
    if (preventClose) {
      e.stopPropagation();
    }
  };

  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
          // Simplified animation classes to prevent issues
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          className
        )}
        onClick={handleClick}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
});
CustomDropdownMenuContent.displayName = "CustomDropdownMenuContent";

// Create a custom item component with improved click handling
export const CustomDropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    preventClose?: boolean;
  }
>(({ className, preventClose = false, ...props }, ref) => {
  // Handle click to prevent propagation if preventClose is true
  const handleClick = (e: React.MouseEvent) => {
    if (preventClose) {
      e.stopPropagation();
    }
  };

  return (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      onClick={handleClick}
      {...props}
    />
  );
});
CustomDropdownMenuItem.displayName = "CustomDropdownMenuItem";
