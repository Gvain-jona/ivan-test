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
  User
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

// Define navigation items with direct link flags for problematic routes
const getNavigationItems = (unreadCount: number): NavItemType[] => [
  // Home page removed temporarily
  // { title: 'Home', icon: Home, href: '/dashboard/home' },
  { title: 'Orders', icon: Package, href: '/dashboard/orders' },
  { title: 'Expenses', icon: Banknote, href: '/dashboard/feature-in-development' },
  { title: 'Material', icon: ShoppingBag, href: '/dashboard/feature-in-development' },
  { type: 'separator' },
  { title: 'To-Do', icon: CheckSquare, href: '/dashboard/feature-in-development' },
  { title: 'Analytics', icon: BarChart3, href: '/dashboard/analytics', useDirectLink: true } as NavItem,
  { type: 'separator' },
  {
    title: 'Notifications',
    icon: () => <NotificationsIndicator />,
    href: '#',
    isContextMenu: true,
    menuType: 'notifications'
  },
  { title: 'Search', icon: Search, href: '#', isContextMenu: true, menuType: 'search' },
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

  // Handle navigation errors
  useEffect(() => {
    if (navigationError) {
      console.error('Navigation error detected:', navigationError);
      // Show error toast or notification here if needed

      // Cancel the navigation to reset the state
      cancelNavigation();
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

  // Handle tab change with context menu integration and direct links
  const handleTabChangeWithContext = (index: number | null, event?: React.MouseEvent) => {
    if (index !== null && 'href' in navigationItems[index]) {
      const item = navigationItems[index];

      if (item.isContextMenu) {
        // Handle context menu click
        toggleMenu(item.menuType as 'notifications' | 'search' | 'profile', event);
      } else {
        // If we're clicking on a page navigation item, close any open context menu
        if (contextMenuOpen) {
          closeMenu();
        }

        if (item.useDirectLink) {
          // Handle direct link navigation
          console.log(`Using direct link for ${item.title} (${item.href})`);
          // Set active tab for visual feedback
          handleTabChange(index, event);
        } else {
          // Handle regular navigation
          handleTabChange(index, event);
        }
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
        "fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40 transition-all duration-300 footer-nav",
        isScrollingDown && !navVisible ? "translate-y-24 opacity-0" : "translate-y-0 opacity-100",
        className
      )}>
        <ExpandableTabs
          tabs={navigationItems}
          activeColor="text-orange-500"
          className="border-border bg-popover backdrop-blur-md shadow-lg px-2 py-2"
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
