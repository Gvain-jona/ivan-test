'use client';

import React, { memo, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  Home,
  Package,
  Banknote,
  ShoppingBag,
  CheckSquare,
  BarChart3,
  ArrowUp,
  Search,
  User,
  RefreshCw
} from 'lucide-react';
import { NotificationsIndicator } from '@/components/notifications/NotificationsIndicator';
import { useNotifications } from '@/context/NotificationsContext';

import { ExpandableTabs } from '@/components/ui/expandable-tabs';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { NavigationError } from '@/components/ui/navigation-error';
import {
  DashboardSkeleton,
  OrdersSkeleton,
  ExpensesSkeleton,
  MaterialPurchasesSkeleton,
  TodoSkeleton,
  AnalyticsSkeleton
} from '@/components/skeletons';
import { useNavigation } from '@/context/navigation-context';
import ContextMenu from '@/components/ui/context-menu';

// Import custom hooks
import { useContextMenu } from '@/hooks/ui/useContextMenu';
import { useScrollNavigation } from '@/hooks/ui/useScrollNavigation';
import { useTabNavigation, NavItemType, NavItem } from '@/hooks/ui/useTabNavigation';
import { useRoutePrefetching } from '@/hooks/ui/useRoutePrefetching';

// Define navigation items with consistent navigation approach
const getNavigationItems = (unreadCount: number): NavItemType[] => [
  // Home page removed temporarily
  // { title: 'Home', icon: Home, href: '/dashboard/home' },
  { title: 'Orders', icon: Package, href: '/dashboard/orders' },
  { title: 'Expenses', icon: Banknote, href: '/dashboard/expenses' },
  { title: 'Material', icon: ShoppingBag, href: '/dashboard/material-purchases' },
  { type: 'separator' },
  // No longer using useDirectLink flag, but now disabled
  { title: 'Analytics', icon: BarChart3, href: '/dashboard/analytics', disabled: true } as NavItem,
  { type: 'separator' },
  {
    title: 'Notifications',
    icon: () => <NotificationsIndicator disabled={true} />,
    href: '#',
    isContextMenu: true,
    menuType: 'notifications',
    disabled: true
  },
  {
    title: 'Search',
    icon: Search,
    href: '#',
    isContextMenu: true,
    menuType: 'search',
    disabled: true
  },
  { title: 'Profile', icon: User, href: '#', isContextMenu: true, menuType: 'profile' },
];

type FooterNavProps = {
  className?: string;
};

function FooterNavComponent({ className }: FooterNavProps) {
  const pathname = usePathname();
  const { isNavigating, navigationError, cancelNavigation } = useNavigation();
  const { unreadCount } = useNotifications();

  const footerNavRef = useRef<HTMLDivElement>(null);

  // Use custom hooks
  const {
    activeMenu,
    contextMenuOpen,
    clickPosition,
    navWidth,
    toggleMenu,
    closeMenu
  } = useContextMenu();

  // Enhanced navigation error handling
  useEffect(() => {
    if (navigationError) {
      console.error('Navigation error detected in FooterNav:', navigationError);

      // Check if the error is related to the expenses or material purchases page
      if (navigationError.message.includes('/dashboard/expenses') ||
          navigationError.message.includes('/dashboard/material-purchases')) {
        console.warn('Detected navigation error for data-heavy page - this may be a false positive due to slow data loading');

        // For data-heavy pages, we'll wait a bit longer before canceling
        // This gives the page more time to load its data
        const timeoutId = setTimeout(() => {
          // Only cancel if we still have the same error
          if (navigationError &&
              (navigationError.message.includes('/dashboard/expenses') ||
               navigationError.message.includes('/dashboard/material-purchases'))) {
            console.log('Canceling data-heavy page navigation error after delay');
            cancelNavigation();
          }
        }, 2000); // 2 second delay

        return () => clearTimeout(timeoutId);
      } else {
        // For other errors, cancel immediately
        console.log('Canceling navigation error immediately');
        cancelNavigation();
      }
    }
  }, [navigationError, cancelNavigation]);

  // Add a global click handler to close the contextual menu when clicking outside
  useEffect(() => {
    if (!contextMenuOpen) return;

    const handleGlobalClick = (e: MouseEvent) => {
      // Get the target element
      const targetElement = e.target as HTMLElement;

      // Check if the click was on a footer nav item or inside a contextual menu
      const isFooterNavItem = targetElement.closest('.footer-nav');
      const isContextMenu = targetElement.closest('.context-menu-container');

      // If the click was not on a footer nav item or inside a contextual menu, close the menu
      if (!isFooterNavItem && !isContextMenu) {
        closeMenu();
      }
    };

    // Add the event listener with a slight delay to prevent immediate closing
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleGlobalClick);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleGlobalClick);
    };
  }, [contextMenuOpen, closeMenu]);

  const {
    showScrollTop,
    isScrollingDown,
    navVisible,
    scrollToTop
  } = useScrollNavigation();

  // Get navigation items with unread count
  const navigationItems = getNavigationItems(unreadCount);

  const {
    activeTab,
    activeTabIndex,
    initialTab,
    activeContextMenuTab,
    handleTabChange
  } = useTabNavigation({
    navigationItems,
    activeMenu,
    contextMenuOpen
  });

  // Setup route prefetching
  useRoutePrefetching(navigationItems);

  // Enhanced tab change handler with context menu integration and special handling for expenses
  const handleTabChangeWithContext = (index: number | null, event?: React.MouseEvent) => {
    if (index !== null && 'href' in navigationItems[index]) {
      const item = navigationItems[index];

      // Skip if the item is disabled
      if (item.disabled) {
        console.log(`Navigation or menu ${item.title} is currently disabled`);
        return;
      }

      if (item.isContextMenu) {
        // Handle context menu click
        toggleMenu(item.menuType as 'notifications' | 'search' | 'profile', event);
      } else {
        // If we're clicking on a page navigation item, close any open context menu
        if (contextMenuOpen) {
          closeMenu();
        }

        // Special handling for expenses page to prevent navigation errors
        if (item.href === '/dashboard/expenses') {
          console.log('Navigating to expenses page with special handling');

          // If we're already on the expenses page, don't navigate again
          if (pathname.startsWith('/dashboard/expenses')) {
            console.log('Already on expenses page, skipping navigation');
            return;
          }
        }

        // Special handling for material purchases page to prevent navigation errors
        if (item.href === '/dashboard/material-purchases') {
          console.log('Navigating to material purchases page with special handling');

          // If we're already on the material purchases page, don't navigate again
          if (pathname.startsWith('/dashboard/material-purchases')) {
            console.log('Already on material purchases page, skipping navigation');
            return;
          }
        }

        // Use consistent navigation approach for all routes
        handleTabChange(index, event);
      }
    }
  };

  return (
    <>
      {/* Navigation Error Indicator */}
      <NavigationError />

      {/* We've removed the overlay skeletons in favor of page-specific loading states */}

      {/* Scroll to top button */}
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-20 right-4 z-50 h-10 w-10 rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow-lg p-0"
          aria-label="Scroll to top"
        >
          <ArrowUp size={18} />
        </Button>
      )}

      {/* Footer Navigation */}
      <div
        ref={footerNavRef}
        className={cn(
        "fixed bottom-2 left-1/2 transform -translate-x-1/2 z-40 transition-all duration-300 footer-nav",
        isScrollingDown && !navVisible ? "translate-y-24 opacity-0" : "translate-y-0 opacity-100",
        className
      )}>
        <ExpandableTabs
          tabs={navigationItems}
          activeColor="text-orange-500"
          className="border-border bg-popover backdrop-blur-md shadow-lg px-2 py-1.5"
          onChange={handleTabChangeWithContext}
          initialSelectedIndex={activeTabIndex !== -1 ? activeTabIndex : initialTab}
          activeContextMenuIndex={activeContextMenuTab || null}
        />
      </div>

      {/* Context Menu */}
      <ContextMenu
        open={contextMenuOpen}
        onOpenChange={(open) => {
          if (!open) {
            // No need to reset active tab - we want to maintain the current page's active state
            // Just close the menu
            closeMenu();
          }
        }}
        menuType={activeMenu}
        position={clickPosition}
        activeSection={pathname}
        navWidth={navWidth}
      />
    </>
  );
}

// Memoize the component to prevent unnecessary re-renders
const FooterNav = memo(FooterNavComponent);
export default FooterNav;
