'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
// No longer using DropdownMenu components
import { Bell, Search, User, Settings, Moon, Sun, ClipboardCheck } from 'lucide-react';
import { LogoutButton } from '@/components/ui/logout-button';
import { useAuth } from '@/app/context/auth-context';
import { NotificationsMenu } from '../notifications/NotificationsMenu';

// Define the props for the ContextMenu component
export interface ContextMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuType: 'notifications' | 'search' | 'profile' | null;
  position: { x: number; y: number } | null;
  activeSection: string;
  navWidth?: number; // Width of the footer navigation
}

function ContextMenu({
  open,
  onOpenChange,
  menuType,
  position,
  activeSection,
  navWidth,
}: ContextMenuProps) {
  const { theme, setTheme } = useTheme();
  const { profile } = useAuth();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  // Add click outside handler with improved event handling
  useEffect(() => {
    if (!open) return;

    // Use a ref to track if the menu was just opened to prevent immediate closing
    const justOpenedRef = { current: true };
    let clickOutsideTimeout: NodeJS.Timeout;

    const handleClickOutside = (event: MouseEvent) => {
      // Prevent handling clicks immediately after opening
      if (justOpenedRef.current) return;

      // Get the target element
      const targetElement = event.target as HTMLElement;

      // Check if the click was on a footer nav item that's not a context menu item
      const isFooterNavNonContextItem = targetElement.closest('.footer-nav button:not(.context-menu-item)');

      // Check if the click was outside the menu
      if (menuRef.current && !menuRef.current.contains(targetElement)) {
        console.log('Click outside detected');

        // If clicked on a footer nav item that's not a context menu, let the nav handle it
        // Otherwise, close the menu
        if (!isFooterNavNonContextItem) {
          // Use requestAnimationFrame to ensure we're not in the middle of a React render cycle
          requestAnimationFrame(() => {
            onOpenChange(false);
          });
        }
      }
    };

    // Add the event listener to the document
    document.addEventListener('mousedown', handleClickOutside, true); // Use capture phase

    // Also handle escape key to close the menu
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false);
      }
    };
    document.addEventListener('keydown', handleEscapeKey);

    // After a short delay, allow click outside handling
    clickOutsideTimeout = setTimeout(() => {
      // Now allow click outside handling
      justOpenedRef.current = false;
    }, 200); // Shorter delay for better responsiveness

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('keydown', handleEscapeKey);
      clearTimeout(clickOutsideTimeout);
    };
  }, [open, onOpenChange]);

  // For debugging positioning issues
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('ContextMenu state changed:', {
        open,
        activeSection,
        menuType,
        position,
        viewportWidth: window.innerWidth,
      });
    }

    // Focus the menu when it opens for better keyboard accessibility
    if (open && menuRef.current) {
      // Use requestAnimationFrame to ensure the menu is rendered
      requestAnimationFrame(() => {
        // Then use setTimeout to ensure the browser has painted the menu
        setTimeout(() => {
          if (menuRef.current) {
            const input = menuRef.current.querySelector('input');
            if (input) {
              // Focus the input and select any text for immediate typing
              (input as HTMLInputElement).focus();
              (input as HTMLInputElement).select();
            } else {
              // Focus the menu itself if no input is found
              menuRef.current.focus();
            }
          }
        }, 100);
      });
    }
  }, [open, activeSection, menuType, position]);

  // Render the appropriate menu content based on the menu type
  const renderMenuContent = () => {
    switch (menuType) {
      case 'notifications':
        return <NotificationsMenu />;

      case 'search':
        return (
          <div className="flex flex-col items-center w-full">
            <h3 className="text-lg font-semibold mb-2">Search</h3>
            <div className="h-px w-full bg-border mb-3"></div>
            <div className="mb-3 w-full max-w-[350px]">
              <input
                type="text"
                placeholder="Search..."
                className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background"
                autoFocus
                // Add explicit focus handling
                onFocus={(e) => {
                  // Select all text when focused
                  e.currentTarget.select();
                }}
                onClick={(e) => {
                  // Prevent click from propagating and closing the menu
                  e.stopPropagation();
                  // Select all text when clicked
                  e.currentTarget.select();
                }}
              />
            </div>
            <div className="max-h-[250px] overflow-y-auto custom-scrollbar w-full max-w-[350px]">
              <div className="py-2 text-sm text-muted-foreground text-center">
                Type to search
              </div>
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="flex flex-col items-center w-full">
            <h3 className="text-lg font-semibold mb-2">Profile</h3>
            <div className="h-px w-full bg-border mb-3"></div>
            <div className="space-y-2 w-full max-w-[350px]">
              <button className="flex items-center w-full px-2 py-1.5 text-sm rounded-md hover:bg-muted transition-colors">
                <User className="mr-2 h-4 w-4" />
                <span>My Profile</span>
              </button>
              <button className="flex items-center w-full px-2 py-1.5 text-sm rounded-md hover:bg-muted transition-colors">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </button>

              {/* Approvals menu item - only for admins and managers */}
              {(profile?.role === 'admin' || profile?.role === 'manager') && (
                <button
                  className="flex items-center w-full px-2 py-1.5 text-sm rounded-md hover:bg-muted transition-colors"
                  onClick={() => router.push('/dashboard/approvals')}
                >
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  <span>Approvals</span>
                </button>
              )}

              <div className="h-px w-full bg-border my-2"></div>
              <button
                className="flex items-center w-full px-2 py-1.5 text-sm rounded-md hover:bg-muted transition-colors"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? (
                  <Sun className="mr-2 h-4 w-4" />
                ) : (
                  <Moon className="mr-2 h-4 w-4" />
                )}
                <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
              <div className="h-px w-full bg-border my-2"></div>
              <LogoutButton
                variant="ghost"
                size="sm"
                className="w-full justify-start px-2 py-1.5 text-sm rounded-md hover:bg-muted text-destructive transition-colors"
                showIcon={true}
                text="Logout"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Calculate position to center the menu above the footer navigation
  const calculatePosition = () => {
    // Always center the menu in the viewport to match footer nav positioning
    const viewportWidth = window.innerWidth;

    // Get the footer nav element to match its width exactly
    const footerNavElement = document.querySelector('.footer-nav');
    // Use the actual footer nav width if available, otherwise calculate a reasonable default
    const footerNavWidth = footerNavElement
      ? footerNavElement.getBoundingClientRect().width
      : Math.min(500, Math.max(300, viewportWidth - 32));

    // Calculate the center position of the viewport
    const viewportCenter = viewportWidth / 2;

    // Calculate the left position to center the menu
    const leftPosition = viewportCenter - (footerNavWidth / 2);

    // Ensure the menu doesn't overflow the viewport
    const adjustedLeft = Math.max(16, Math.min(leftPosition, viewportWidth - footerNavWidth - 16));

    // Log position for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('Menu position:', {
        viewportCenter,
        leftPosition,
        adjustedLeft,
        viewportWidth,
        footerNavWidth,
        footerNavElementWidth: footerNavElement?.getBoundingClientRect().width
      });
    }

    return {
      left: `${adjustedLeft}px`,
      width: `${footerNavWidth}px`, // Match the width of the footer nav exactly
      transform: 'none', // No need for transform since we're calculating the exact position
    };
  };

  // Log state for debugging
  useEffect(() => {
    console.log('ContextMenu state:', { open, menuType, position, activeSection });
  }, [open, menuType, position, activeSection]);

  // Animation state
  const [isExiting, setIsExiting] = useState(false);

  // Track previous menu type to handle switching between menus
  const prevMenuTypeRef = useRef<typeof menuType>(null);

  // Improved animation handling for closing and switching menus
  useEffect(() => {
    // Track menu type changes for switching between menus
    const isMenuSwitching = menuType !== null &&
                          prevMenuTypeRef.current !== null &&
                          menuType !== prevMenuTypeRef.current;

    if (isMenuSwitching) {
      console.log('Switching menus from', prevMenuTypeRef.current, 'to', menuType);
      // For menu switching, we want to immediately show the new menu without exit animation
      setIsExiting(false);
    } else if (open) {
      // When opening, make sure we're not in exiting state
      setIsExiting(false);
    } else if (!isExiting && prevMenuTypeRef.current !== null) {
      // Only start exit animation when actually closing (not switching)
      console.log('Starting exit animation');
      setIsExiting(true);

      // Reset exiting state after animation completes
      const timeout = setTimeout(() => {
        console.log('Exit animation complete, resetting state');
        setIsExiting(false);
      }, 200); // Match animation duration

      return () => clearTimeout(timeout);
    }

    // Update previous menu type - do this after all the checks
    prevMenuTypeRef.current = menuType;
  }, [open, isExiting, menuType]);

  if (!open && !isExiting) {
    console.log('ContextMenu not showing: open is false');
    return null;
  }

  if (!menuType) {
    console.log('ContextMenu not showing: menuType is null');
    return null;
  }

  if (!position) {
    console.log('ContextMenu not showing: position is null');
    return null;
  }

  return (
    <div
      ref={menuRef}
      className={`fixed z-50 context-menu-container ${!open && isExiting ? 'exiting' : ''}`}
      style={{
        ...calculatePosition(),
        bottom: 'calc(var(--footer-height) + 24px)', // Increased gap from 16px to 24px
      }}
      // Add event handlers to prevent clicks inside the menu from closing it
      onClick={(e) => {
        // Prevent click from propagating to document
        e.stopPropagation();
      }}
      onMouseDown={(e) => {
        // Prevent mousedown from propagating to document
        e.stopPropagation();
      }}
    >
      <div
        className="bg-popover border rounded-md shadow-lg w-full max-h-[400px] h-auto overflow-y-auto p-4 backdrop-blur-md custom-scrollbar"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--border) transparent' }}
        tabIndex={-1} // Make the div focusable
        // Add event handlers to prevent propagation
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        // Add keyboard event handling for accessibility
        onKeyDown={(e) => {
          // Close on escape key
          if (e.key === 'Escape') {
            onOpenChange(false);
          }
        }}
      >
        {/* Visual indicator pointing to the active footer nav item */}
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-popover border-b border-r border-border rotate-45"></div>
        {renderMenuContent()}
      </div>
    </div>
  );
}

export default ContextMenu;