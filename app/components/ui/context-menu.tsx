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

  // For debugging positioning issues - only log when state actually changes
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && open && false) { // Disable logging completely
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
          <div className="search-context-menu">
            {/* Search input */}
            <div className="flex items-center border-b border-border px-3 mb-4">
              <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Search HR tools or press..."
                autoFocus
              />
              <div className="ml-2 flex items-center gap-1">
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  ⌘K
                </kbd>
              </div>
            </div>

            {/* Recent section */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Recent</h3>
              <div className="flex flex-wrap gap-2">
                {['Onboarding', 'Reviews', 'Hiring', 'Benefits', 'Learning'].map((item) => (
                  <button
                    key={item}
                    className="rounded-md bg-muted px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Categories grid */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Tools & Apps */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Tools & Apps</h3>
                  <div className="text-muted-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-right"><path d="m9 18 6-6-6-6"/></svg>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent cursor-pointer">
                    <div className="w-5 h-5 rounded-md bg-gradient-to-r from-yellow-400 to-red-500 flex-shrink-0" />
                    <span>Monday.com</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent cursor-pointer">
                    <div className="w-5 h-5 rounded-full bg-purple-500 flex-shrink-0" />
                    <span>Loom</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent cursor-pointer">
                    <div className="w-5 h-5 rounded-full bg-red-400 flex-shrink-0" />
                    <span>Asana</span>
                  </div>
                </div>
              </div>

              {/* Employees */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Employees</h3>
                  <div className="text-muted-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-right"><path d="m9 18 6-6-6-6"/></svg>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent cursor-pointer">
                    <div className="w-5 h-5 rounded-full bg-blue-400 flex-shrink-0" />
                    <span>James Brown</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent cursor-pointer">
                    <div className="w-5 h-5 rounded-full bg-green-400 flex-shrink-0" />
                    <span>Sophia Williams</span>
                    <div className="ml-auto text-muted-foreground">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-right"><path d="m9 18 6-6-6-6"/></svg>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent cursor-pointer">
                    <div className="w-5 h-5 rounded-full bg-orange-400 flex-shrink-0" />
                    <span>Laura Perez</span>
                  </div>
                </div>
              </div>

              {/* Teams */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Teams</h3>
                  <div className="text-muted-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-right"><path d="m9 18 6-6-6-6"/></svg>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent cursor-pointer">
                    <div className="w-5 h-5 rounded-full bg-red-500 flex-shrink-0" />
                    <span>Aurora Solutions</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent cursor-pointer">
                    <div className="w-5 h-5 rounded-full bg-blue-400 flex-shrink-0" />
                    <span>Pulse Medical</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent cursor-pointer">
                    <div className="w-5 h-5 rounded-full bg-purple-500 flex-shrink-0" />
                    <span>Synergy HR</span>
                  </div>
                </div>
              </div>

              {/* Locations */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Locations</h3>
                  <div className="text-muted-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-right"><path d="m9 18 6-6-6-6"/></svg>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent cursor-pointer">
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex-shrink-0" />
                    <span>United States</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent cursor-pointer">
                    <div className="w-5 h-5 rounded-full bg-yellow-500 flex-shrink-0" />
                    <span>Spain</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent cursor-pointer">
                    <div className="w-5 h-5 rounded-full bg-green-500 flex-shrink-0" />
                    <span>Italy</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-border text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-up mr-1"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-down mr-1"><path d="m19 12-7 7-7-7"/><path d="M12 5v14"/></svg>
                  <span>Navigate</span>
                </div>
                <div className="flex items-center ml-3">
                  <span className="mr-1">↵</span>
                  <span>Select</span>
                </div>
              </div>
              <div className="flex items-center">
                <span>Any problem?</span>
                <button className="ml-1 text-primary hover:underline">Contact</button>
              </div>
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="profile-menu">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-orange-600 flex items-center justify-center text-white font-medium">
                {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <div className="font-medium">{profile?.full_name || 'User'}</div>
                <div className="text-sm text-muted-foreground">{profile?.email || 'user@example.com'}</div>
              </div>
            </div>

            <div className="space-y-1">
              <button
                className="w-full flex items-center px-2 py-2 text-sm hover:bg-accent rounded-md"
                onClick={() => router.push('/dashboard/profile')}
              >
                <User className="mr-2 h-4 w-4" />
                <span>Profile Settings</span>
              </button>
              <button
                className="w-full flex items-center px-2 py-2 text-sm hover:bg-accent rounded-md"
                onClick={() => router.push('/dashboard/settings')}
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>App Settings</span>
              </button>
              <button
                className="w-full flex items-center px-2 py-2 text-sm hover:bg-accent rounded-md"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="mr-2 h-4 w-4" />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="mr-2 h-4 w-4" />
                    <span>Dark Mode</span>
                  </>
                )}
              </button>
              <LogoutButton className="w-full mt-2 justify-start" />
            </div>
          </div>
        );

      default:
        return <div>Menu content not found</div>;
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
      // For menu switching, we want to immediately show the new menu without exit animation
      setIsExiting(false);
    } else if (open) {
      // When opening, make sure we're not in exiting state
      setIsExiting(false);
    } else if (!isExiting && prevMenuTypeRef.current !== null) {
      // Only start exit animation when actually closing (not switching)
      setIsExiting(true);

      // Reset exiting state after animation completes
      const timeout = setTimeout(() => {
        setIsExiting(false);
      }, 200); // Match animation duration

      return () => clearTimeout(timeout);
    }

    // Update previous menu type - do this after all the checks
    prevMenuTypeRef.current = menuType;
  }, [open, isExiting, menuType]);

  if (!open && !isExiting) {
    // Removed console log to reduce console spam
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